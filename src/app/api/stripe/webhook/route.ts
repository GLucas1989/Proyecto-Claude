import { NextResponse } from "next/server";
import { stripe, PLATFORM_WEBHOOK_SECRET } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { computeCreatorSplit } from "@/lib/stripe/splits";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, PLATFORM_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const supabase = await createClient();

  switch (event.type) {
    // ── Creator subscription paid ───────────────────────────────────────────
    case "invoice.paid": {
      // Stripe API 2025: subscription id lives at invoice.parent.subscription_details.subscription
      // We cast to unknown to access it regardless of SDK version
      const invoice = event.data.object as unknown as Record<string, unknown>;
      const parent = invoice.parent as Record<string, unknown> | null | undefined;
      const subDetails = parent?.subscription_details as Record<string, unknown> | null | undefined;
      const subId = (subDetails?.subscription ?? invoice.subscription) as string | null | undefined;

      if (!subId) break;

      const stripeSubRaw = await stripe.subscriptions.retrieve(subId);
      // Cast to Record to safely access fields that moved in Stripe API 2025
      const stripeSub = stripeSubRaw as unknown as Record<string, unknown>;
      const meta = (stripeSub.metadata ?? {}) as Record<string, string>;
      const userId = meta.user_id;
      const creatorId = meta.creator_id;
      const planId = meta.plan_id;
      const creatorStripeAccount = meta.creator_stripe_account;

      if (!userId || !creatorId) break;

      // current_period_start/end may live on the subscription or on items[0] in API 2025
      const periodStart = (stripeSub.current_period_start as number | undefined)
        ?? ((stripeSub.items as { data?: Array<Record<string, unknown>> } | undefined)?.data?.[0]?.current_period_start as number | undefined)
        ?? Math.floor(Date.now() / 1000);
      const periodEnd = (stripeSub.current_period_end as number | undefined)
        ?? ((stripeSub.items as { data?: Array<Record<string, unknown>> } | undefined)?.data?.[0]?.current_period_end as number | undefined)
        ?? Math.floor(Date.now() / 1000) + 2592000;

      // Upsert subscription record
      await supabase.from("subscriptions").upsert(
        {
          subscriber_id: userId,
          creator_id: creatorId,
          plan_id: planId,
          stripe_subscription_id: subId,
          status: "active",
          platform_fee_pct: 0.40, // default; collab override below
          is_collab_content: false,
          current_period_start: new Date(periodStart * 1000).toISOString(),
          current_period_end: new Date(periodEnd * 1000).toISOString(),
        },
        { onConflict: "subscriber_id,creator_id" }
      );

      // Log payment event with split amounts
      const amountCents = (invoice.amount_paid as number | null) ?? 0;
      const isCollab = meta.is_collab === "true";
      const split = computeCreatorSplit(amountCents, isCollab);

      await supabase.from("payment_events").insert({
        stripe_event_id: event.id,
        event_type: event.type,
        amount_cents: amountCents,
        creator_payout_cents: split.creatorAmountCents,
        platform_fee_cents: split.platformAmountCents,
        payload: invoice,
      });

      // If collab: override application_fee to 30% via invoice item update
      // (Stripe doesn't support per-invoice fee override on subscriptions directly;
      //  in production use a separate PaymentIntent for collab invoices)
      if (isCollab && creatorStripeAccount) {
        const collabSplit = computeCreatorSplit(amountCents, true);
        await supabase
          .from("subscriptions")
          .update({ platform_fee_pct: collabSplit.platformPct, is_collab_content: true })
          .eq("stripe_subscription_id", subId);
      }

      break;
    }

    // ── Creator subscription canceled / past_due ────────────────────────────
    case "customer.subscription.deleted":
    case "customer.subscription.updated": {
      const sub = event.data.object as unknown as Record<string, unknown>;
      const status = (sub.status as string) as "active" | "canceled" | "past_due" | "trialing" | "incomplete";
      const canceledAt = sub.canceled_at as number | null | undefined;
      const subPeriodEnd = (sub.current_period_end as number | undefined)
        ?? ((sub.items as { data?: Array<Record<string, unknown>> } | undefined)?.data?.[0]?.current_period_end as number | undefined)
        ?? Math.floor(Date.now() / 1000);

      await supabase
        .from("subscriptions")
        .update({
          status,
          canceled_at: canceledAt ? new Date(canceledAt * 1000).toISOString() : null,
          current_period_end: new Date(subPeriodEnd * 1000).toISOString(),
        })
        .eq("stripe_subscription_id", sub.id as string);

      break;
    }

    // ── Game subscription paid (100% platform) ─────────────────────────────
    case "invoice.paid": {
      // Handled above; game sub invoices don't have creator metadata → no split
      break;
    }

    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata ?? {};

      // Game subscription checkout
      if (meta.game_slug && meta.user_id) {
        const stripeSubId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        await supabase.from("game_subscriptions").upsert(
          {
            user_id: meta.user_id,
            game_slug: meta.game_slug,
            status: "active",
            stripe_subscription_id: stripeSubId ?? null,
            stripe_customer_id: typeof session.customer === "string"
              ? session.customer
              : null,
            current_period_end: periodEnd.toISOString(),
          },
          { onConflict: "user_id,game_slug" }
        );

        // Log — no split, full amount stays in platform account
        await supabase.from("game_payment_events").insert({
          stripe_event_id: event.id,
          event_type: event.type,
          amount_cents: session.amount_total ?? 0,
          payload: event.data.object as unknown as Record<string, unknown>,
        });
      }

      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
