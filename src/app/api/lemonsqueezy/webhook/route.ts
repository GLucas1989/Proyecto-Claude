import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { setupLemonSqueezy, LS_WEBHOOK_SECRET } from "@/lib/lemonsqueezy/client";
import { computeUGCSplit } from "@/lib/stripe/splits";

export const runtime = "nodejs";

setupLemonSqueezy();

function verifySignature(rawBody: string, signature: string): boolean {
  if (!LS_WEBHOOK_SECRET || !signature) return false;
  const hmac = createHmac("sha256", LS_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  try {
    return timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const rawBody  = await request.text();
  const signature = request.headers.get("x-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as {
    meta: {
      event_name: string;
      custom_data?: Record<string, string>;
    };
    data: {
      id: string;
      attributes: Record<string, unknown>;
    };
  };

  const supabase = await createClient();
  const { event_name, custom_data = {} } = event.meta;
  const attrs = event.data.attributes;

  switch (event_name) {

    // ── Game subscription activated / renewed ─────────────────────────────
    case "subscription_created":
    case "subscription_payment_success": {
      if (custom_data.type !== "game_sub") break;
      const userId   = custom_data.user_id;
      const gameSlug = custom_data.game_slug;
      if (!userId || !gameSlug) break;

      const renewsAt = attrs.renews_at as string | null;
      const periodEnd = renewsAt ? new Date(renewsAt) : (() => {
        const d = new Date(); d.setMonth(d.getMonth() + 1); return d;
      })();

      await supabase.from("game_subscriptions").upsert(
        {
          user_id:               userId,
          game_slug:             gameSlug,
          status:                "active",
          stripe_subscription_id: event.data.id,
          current_period_end:    periodEnd.toISOString(),
        },
        { onConflict: "user_id,game_slug" }
      );

      await supabase.from("game_payment_events").insert({
        stripe_event_id: `ls_${event.data.id}_${event_name}`,
        event_type:      event_name,
        amount_cents:    typeof attrs.total === "number" ? attrs.total : 0,
        payload:         event as unknown as Record<string, unknown>,
      });
      break;
    }

    // ── Game subscription canceled ────────────────────────────────────────
    case "subscription_cancelled":
    case "subscription_expired": {
      if (custom_data.type !== "game_sub") break;
      const userId   = custom_data.user_id;
      const gameSlug = custom_data.game_slug;
      if (!userId || !gameSlug) break;

      await supabase
        .from("game_subscriptions")
        .update({ status: "canceled" })
        .eq("user_id", userId)
        .eq("game_slug", gameSlug);
      break;
    }

    // ── Creator subscription paid ─────────────────────────────────────────
    case "order_created": {
      if (custom_data.type !== "creator_sub") break;
      const userId    = custom_data.user_id;
      const creatorId = custom_data.creator_id;
      if (!userId || !creatorId) break;

      const amountCents = typeof attrs.total === "number" ? attrs.total : 0;

      await supabase.from("payment_events").insert({
        stripe_event_id:      `ls_${event.data.id}`,
        event_type:           event_name,
        amount_cents:         amountCents,
        creator_payout_cents: Math.floor(amountCents * 0.6),
        platform_fee_cents:   amountCents - Math.floor(amountCents * 0.6),
        payload:              event as unknown as Record<string, unknown>,
      });
      break;
    }

    // ── UGC promotion purchased ───────────────────────────────────────────
    case "order_created": {
      if (custom_data.type !== "ugc_promotion") break;
      const publicationId = custom_data.publication_id;
      const authorId      = custom_data.author_id;
      if (!publicationId || !authorId) break;

      const totalCents = typeof attrs.total === "number" ? attrs.total : 0;
      const { authorAmountCents } = computeUGCSplit(totalCents);

      // Activate promotion
      await supabase
        .from("promoted_content")
        .update({ payment_status: "PAID" })
        .eq("publication_id", publicationId)
        .eq("payment_status", "PENDING");

      // Credit author wallet 50%
      await supabase.rpc("credit_author_wallet", {
        p_user_id:     authorId,
        p_amount_cents: authorAmountCents,
        p_description: `UGC promotion purchase — publication ${publicationId}`,
        p_stripe_ref:  `ls_${event.data.id}`,
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
