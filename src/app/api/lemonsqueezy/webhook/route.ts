import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { setupLemonSqueezy, LS_WEBHOOK_SECRET } from "@/lib/lemonsqueezy/client";
import { computeUGCSplit, computeUGCSplit6040 } from "@/lib/stripe/splits";

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

    // ── Compra única: despacho por custom_data.type ───────────────────────
    case "order_created": {
      const totalCents = typeof attrs.total === "number" ? attrs.total : 0;
      const type = (custom_data.type ?? "").toLowerCase();

      switch (type) {
        // Suscripción a creador (registro contable 60/40)
        case "creator_sub": {
          const userId    = custom_data.user_id;
          const creatorId = custom_data.creator_id;
          if (!userId || !creatorId) break;

          await supabase.from("payment_events").insert({
            stripe_event_id:      `ls_${event.data.id}`,
            event_type:           event_name,
            amount_cents:         totalCents,
            creator_payout_cents: Math.floor(totalCents * 0.6),
            platform_fee_cents:   totalCents - Math.floor(totalCents * 0.6),
            payload:              event as unknown as Record<string, unknown>,
          });
          break;
        }

        // Promoción de contenido UGC (split 50/50)
        case "ugc_promotion": {
          const publicationId = custom_data.publication_id;
          const authorId      = custom_data.author_id;
          if (!publicationId || !authorId) break;

          const { authorAmountCents } = computeUGCSplit(totalCents);
          await supabase
            .from("promoted_content")
            .update({ payment_status: "PAID" })
            .eq("publication_id", publicationId)
            .eq("payment_status", "PENDING");

          await supabase.rpc("credit_author_wallet", {
            p_user_id:      authorId,
            p_amount_cents: authorAmountCents,
            p_description:  `UGC promotion purchase — publication ${publicationId}`,
            p_stripe_ref:   `ls_${event.data.id}`,
          });
          break;
        }

        // Compra de guía individual UGC — split 60/40, soporta Pay What You Want
        case "ugc_purchase": {
          const publicationId = custom_data.publication_id;
          const authorId      = custom_data.author_id;
          if (!publicationId || !authorId) break;

          // PWYW: el total real abonado en checkout es la fuente de verdad
          const { authorAmountCents } = computeUGCSplit6040(totalCents);

          await supabase.rpc("credit_author_wallet", {
            p_user_id:      authorId,
            p_amount_cents: authorAmountCents,
            p_description:  `UGC guide purchase (60/40 PWYW) — publication ${publicationId}`,
            p_stripe_ref:   `ls_${event.data.id}`,
          });

          await supabase.from("payment_events").insert({
            stripe_event_id:      `ls_${event.data.id}`,
            event_type:           "ugc_purchase",
            amount_cents:         totalCents,
            creator_payout_cents: authorAmountCents,
            platform_fee_cents:   totalCents - authorAmountCents,
            payload:              event as unknown as Record<string, unknown>,
          });
          break;
        }

        // Compra de paquete de S-Credits — acreditar tokens (mitiga fees fijos)
        case "s_credit_bulk": {
          const userId = custom_data.user_id;
          const tokenAmount = Number(custom_data.token_amount ?? "0");
          if (!userId || tokenAmount <= 0) break;

          await supabase.rpc("credit_user_credits", {
            p_user_id: userId,
            p_amount:  tokenAmount,
            p_ref:     `ls_${event.data.id}`,
          });
          break;
        }

        // All-Access Pass — suscripción global
        case "all_access_pass": {
          const userId = custom_data.user_id;
          if (!userId) break;

          const expires = new Date();
          expires.setDate(expires.getDate() + 30);

          await supabase.from("user_subscriptions").insert({
            user_id:        userId,
            academy_id:     null,
            is_global_pass: true,
            status:         "active",
            expires_at:     expires.toISOString(),
          });
          break;
        }

        default:
          break;
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
