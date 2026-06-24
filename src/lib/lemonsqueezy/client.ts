import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

export function setupLemonSqueezy() {
  lemonSqueezySetup({
    apiKey: process.env.LEMONSQUEEZY_API_KEY ?? "",
    onError(error) {
      console.error("Lemon Squeezy error:", error);
    },
  });
}

export const LS_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID ?? "";

/**
 * Variant IDs configured in the Lemon Squeezy dashboard.
 * Each product/variant maps to a specific purchase type.
 */
export const LS_VARIANTS = {
  // Game academy subscriptions — one variant per game (monthly)
  GAME_SUB: {
    "mtg-arena":           process.env.LS_VARIANT_GAME_MTG_ARENA           ?? "",
    "wild-rift":           process.env.LS_VARIANT_GAME_WILD_RIFT           ?? "",
    "league-of-legends":   process.env.LS_VARIANT_GAME_LOL                 ?? "",
    "diablo-iv":           process.env.LS_VARIANT_GAME_DIABLO_IV           ?? "",
    "diablo-immortal":     process.env.LS_VARIANT_GAME_DIABLO_IMMORTAL     ?? "",
    "raid-shadow-legends": process.env.LS_VARIANT_GAME_RAID                ?? "",
    "albion-online":       process.env.LS_VARIANT_GAME_ALBION              ?? "",
    "dark-and-darker":     process.env.LS_VARIANT_GAME_DARK_AND_DARKER     ?? "",
    "beyond-all-reason":   process.env.LS_VARIANT_GAME_BEYOND_ALL_REASON   ?? "",
    "multigenero":         process.env.LS_VARIANT_GAME_MULTIGENERO         ?? "",
  } as Record<string, string>,

  // Creator subscriptions — variant ID per creator plan
  CREATOR_SUB: process.env.LS_VARIANT_CREATOR_SUB ?? "",

  // UGC promotion — one-time payment, 7 days
  UGC_PROMOTION: process.env.LS_VARIANT_UGC_PROMOTION ?? "",
} as const;

export const LS_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? "";
