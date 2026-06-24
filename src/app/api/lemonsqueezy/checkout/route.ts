import { NextResponse } from "next/server";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { createClient } from "@/lib/supabase/server";
import { setupLemonSqueezy, LS_STORE_ID, LS_VARIANTS } from "@/lib/lemonsqueezy/client";

export const runtime = "nodejs";

setupLemonSqueezy();

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as {
    type: "game_sub" | "creator_sub" | "ugc_promotion";
    gameSlug?: string;
    creatorId?: string;
    publicationId?: string;
    authorId?: string;
  };

  let variantId: string;

  if (body.type === "game_sub") {
    if (!body.gameSlug) return NextResponse.json({ error: "gameSlug required" }, { status: 400 });
    variantId = LS_VARIANTS.GAME_SUB[body.gameSlug];
    if (!variantId) return NextResponse.json({ error: "Unknown game slug" }, { status: 400 });
  } else if (body.type === "creator_sub") {
    variantId = LS_VARIANTS.CREATOR_SUB;
  } else if (body.type === "ugc_promotion") {
    variantId = LS_VARIANTS.UGC_PROMOTION;
  } else {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

  const { data, error } = await createCheckout(LS_STORE_ID, variantId, {
    checkoutOptions: {
      embed: false,
      media: true,
      logo: true,
    },
    checkoutData: {
      email: user.email,
      custom: {
        user_id:        user.id,
        type:           body.type,
        game_slug:      body.gameSlug      ?? "",
        creator_id:     body.creatorId     ?? "",
        publication_id: body.publicationId ?? "",
        author_id:      body.authorId      ?? "",
      },
    },
    productOptions: {
      redirectUrl:      `${origin}/dashboard?checkout=success`,
      receiptLinkUrl: `${origin}/dashboard`,
      receiptThankYouNote: "¡Gracias por tu compra! Tu acceso ya está activo." as string,
    },
  });

  if (error || !data) {
    console.error("Lemon Squeezy checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }

  return NextResponse.json({ url: data.data.attributes.url });
}
