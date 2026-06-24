import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { promotionId?: string; amountCents?: number };
    const { promotionId, amountCents } = body;

    if (!promotionId || !amountCents || amountCents < 100) {
      return NextResponse.json({ error: "Parámetros inválidos." }, { status: 400 });
    }

    const supabase = await createClient();

    // Verificar que la promoción existe y está PENDING
    const { data: promo } = await supabase
      .from("promoted_content")
      .select("id, publication_id, game_slug, price_cents")
      .eq("id", promotionId)
      .eq("payment_status", "PENDING")
      .single();

    if (!promo) {
      return NextResponse.json({ error: "Promoción no encontrada o ya procesada." }, { status: 404 });
    }

    // Crear PaymentIntent — 100% plataforma (sin transfer_data)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: promo.price_cents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: "ugc_promotion",
        promotion_id: promotionId,
        publication_id: promo.publication_id,
        game_slug: promo.game_slug,
      },
      description: `UGC Promotion — 7 días destacado en ${promo.game_slug}`,
    });

    // Guardar stripe_payment_intent_id
    await supabase
      .from("promoted_content")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("id", promotionId);

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
