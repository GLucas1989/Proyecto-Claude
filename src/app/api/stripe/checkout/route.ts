import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout Session for a creator subscription.
 * Body: { creatorSlug: string; planId: string }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json() as { creatorSlug?: string; planId?: string };
    const { creatorSlug, planId } = body;

    if (!creatorSlug || !planId) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    // Fetch plan + creator
    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("*, creator_profiles(id, slug, stripe_account_id, game_slug)")
      .eq("id", planId)
      .single();

    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    const creator = plan.creator_profiles as {
      id: string;
      slug: string;
      stripe_account_id: string | null;
      game_slug: string;
    } | null;

    if (!creator?.stripe_account_id) {
      return NextResponse.json(
        { error: "El creador aún no tiene cuenta de pagos configurada" },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    // Creator sub: funds go to creator via Connect, platform keeps application_fee
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      subscription_data: {
        // Split is enforced at invoice level via webhook (see /api/stripe/webhook)
        // We store metadata here for the webhook to reconstruct
        metadata: {
          user_id: user.id,
          creator_id: creator.id,
          plan_id: planId,
          creator_stripe_account: creator.stripe_account_id,
        },
        transfer_data: {
          destination: creator.stripe_account_id,
        },
        application_fee_percent: 40, // default 40%; webhook overrides to 30% for collab
      },
      success_url: `${siteUrl}/${creator.game_slug}/${creator.slug}?subscribed=true`,
      cancel_url: `${siteUrl}/${creator.game_slug}/${creator.slug}`,
      metadata: {
        user_id: user.id,
        creator_slug: creatorSlug,
        plan_id: planId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
