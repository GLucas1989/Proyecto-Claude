/**
 * Fuentes RSS oficiales por juego (confirmadas por el CEO). Los juegos sin
 * feed dedicado (multigenero, sim-racing) simplemente no traen noticias
 * automáticas — el feed queda vacío hasta que se cargue algo manual.
 */
export interface GameFeedSource {
  gameSlug: string;
  url: string;
}

export const GAME_FEEDS: GameFeedSource[] = [
  // League of Legends, Wild Rift y Valorant: Riot no publica RSS oficial.
  // Se usa antosik-lol-rss (github.com/Antosik/lol-rss) — generador de
  // terceros, no afiliado a Riot, hospedado en el AWS S3 personal de su
  // autor. Verificado responde 200 al día de hoy; si algún día desaparece,
  // estos 3 feeds simplemente empiezan a fallar como cualquier otro roto.
  { gameSlug: "league-of-legends", url: "https://antosik-lol-rss.s3.eu-central-1.amazonaws.com/v4/lol/euw/news.es-ES.xml" },
  { gameSlug: "wild-rift", url: "https://antosik-lol-rss.s3.eu-central-1.amazonaws.com/v4/wildrift/es-ES/news.xml" },
  { gameSlug: "valorant", url: "https://antosik-lol-rss.s3.eu-central-1.amazonaws.com/v4/valorant/es-ES/news.xml" },
  { gameSlug: "diablo-iv", url: "https://news.blizzard.com/en-us/feed/diablo-4" },
  { gameSlug: "diablo-immortal", url: "https://news.blizzard.com/en-us/feed/diablo-immortal" },
  { gameSlug: "beyond-all-reason", url: "https://www.beyondallreason.info/news/rss.xml" },
  { gameSlug: "dark-and-darker", url: "https://darkanddarker.com/news/rss.xml" },
  { gameSlug: "albion-online", url: "https://albiononline.com/en/news/rss" },
  { gameSlug: "raid-shadow-legends", url: "https://plarium.com/en/blog/raid-shadow-legends/feed" },
  { gameSlug: "mtg-arena", url: "https://magic.wizards.com/en/news/rss" },
  { gameSlug: "world-of-warcraft", url: "https://news.blizzard.com/en-us/feed/world-of-warcraft" },
  { gameSlug: "minecraft", url: "https://www.minecraft.net/en-us/articles.rss" },
  { gameSlug: "path-of-exile-2", url: "https://www.pathofexile.com/news/rss" },
  // Sin feed oficial confiable: clash-royale (Supercell no publica RSS público)
  // y ragnarok-x-next-generation (juego más nuevo/regional, sin RSS conocido).
];

/** Palabras que indican "Patch Notes" en el título — el resto cae en "Main Events". */
const PATCH_KEYWORDS = [
  "patch", "update", "hotfix", "balance", "parche", "actualización", "actualizacion",
];

export function guessCategory(title: string): "main_events" | "patch_notes" {
  const t = title.toLowerCase();
  return PATCH_KEYWORDS.some((k) => t.includes(k)) ? "patch_notes" : "main_events";
}
