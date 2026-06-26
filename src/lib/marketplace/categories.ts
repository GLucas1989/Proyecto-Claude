/**
 * Taxonomía expandida del marketplace de Creators S-HUB.
 *
 * Cubre no solo videojuegos competitivos sino el ecosistema completo de la
 * cultura gamer/eSports: TCG, juegos de mesa/rol, cosmaking y los roles clave
 * del backstage profesional (análisis, edición, fotografía, nutrición, psicología).
 *
 * Estos valores se usan para clasificar publicaciones UGC y filtrar el marketplace.
 */

export type MarketplaceDomain =
  | "competitive_games"   // Videojuegos competitivos masivos
  | "tcg"                 // Trading Card Games (Pokémon, Yu-Gi-Oh, Magic)
  | "tabletop_rpg"        // Juegos de rol/mesa (D&D, Warhammer)
  | "cosmaking"           // Cosplay & prop making
  | "esports_backstage";  // Roles profesionales del backstage

export type EsportsRole =
  | "tactical_analysis"   // Análisis táctico
  | "video_editing"       // Edición de video gamer
  | "photography"         // Fotografía
  | "sports_nutrition"    // Nutrición deportiva
  | "sports_psychology";  // Psicología deportiva

export interface MarketplaceCategory {
  id: MarketplaceDomain;
  label: string;
  description: string;
  emoji: string;
  /** Sub-roles aplicables (solo para esports_backstage) */
  roles?: { id: EsportsRole; label: string; emoji: string }[];
}

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  {
    id: "competitive_games",
    label: "Videojuegos competitivos",
    description: "Guías, builds, tier lists y macro para los títulos más jugados de la escena.",
    emoji: "🎮",
  },
  {
    id: "tcg",
    label: "TCG · Juegos de cartas",
    description: "Pokémon TCG, Yu-Gi-Oh!, Magic y más: mazos, metagame y técnica competitiva.",
    emoji: "🃏",
  },
  {
    id: "tabletop_rpg",
    label: "Rol & Mesa",
    description: "D&D, Warhammer y wargames: campañas, lore, pintura de miniaturas y estrategia.",
    emoji: "🎲",
  },
  {
    id: "cosmaking",
    label: "Cosmaking",
    description: "Cosplay y prop making: patrones, materiales, EVA foam, worbla y acabados pro.",
    emoji: "🧵",
  },
  {
    id: "esports_backstage",
    label: "Backstage eSports",
    description: "El equipo detrás del jugador: análisis, producción, salud y rendimiento.",
    emoji: "🎬",
    roles: [
      { id: "tactical_analysis", label: "Análisis táctico",     emoji: "📊" },
      { id: "video_editing",     label: "Edición de video",     emoji: "🎞️" },
      { id: "photography",       label: "Fotografía",           emoji: "📷" },
      { id: "sports_nutrition",  label: "Nutrición deportiva",  emoji: "🥗" },
      { id: "sports_psychology", label: "Psicología deportiva", emoji: "🧠" },
    ],
  },
];

export const MARKETPLACE_DOMAIN_IDS: MarketplaceDomain[] =
  MARKETPLACE_CATEGORIES.map((c) => c.id);

export const ESPORTS_ROLE_IDS: EsportsRole[] = [
  "tactical_analysis",
  "video_editing",
  "photography",
  "sports_nutrition",
  "sports_psychology",
];

/** Valida que un string sea un dominio de marketplace soportado. */
export function isValidMarketplaceDomain(value: string): value is MarketplaceDomain {
  return MARKETPLACE_DOMAIN_IDS.includes(value as MarketplaceDomain);
}

/** Valida que un string sea un rol de backstage soportado. */
export function isValidEsportsRole(value: string): value is EsportsRole {
  return ESPORTS_ROLE_IDS.includes(value as EsportsRole);
}

/** Devuelve la categoría completa por id, o undefined. */
export function getMarketplaceCategory(
  id: string
): MarketplaceCategory | undefined {
  return MARKETPLACE_CATEGORIES.find((c) => c.id === id);
}
