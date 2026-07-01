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
  { gameSlug: "league-of-legends", url: "https://www.riotgames.com/en/news/feed" },
  { gameSlug: "wild-rift", url: "https://wildrift.leagueoflegends.com/es-es/news/rss.xml" },
  { gameSlug: "diablo-iv", url: "https://news.blizzard.com/en-us/diablo4/feed" },
  { gameSlug: "diablo-immortal", url: "https://news.blizzard.com/en-us/diablo-immortal/feed" },
  { gameSlug: "beyond-all-reason", url: "https://www.beyondallreason.info/news/rss.xml" },
  { gameSlug: "dark-and-darker", url: "https://darkanddarker.com/news/rss.xml" },
  { gameSlug: "albion-online", url: "https://albiononline.com/en/news/rss" },
  { gameSlug: "raid-shadow-legends", url: "https://plarium.com/en/blog/raid-shadow-legends/feed" },
  { gameSlug: "mtg-arena", url: "https://magic.wizards.com/en/news/rss" },
  { gameSlug: "valorant", url: "https://playvalorant.com/en-us/news/feed" },
];

/** Palabras que indican "Patch Notes" en el título — el resto cae en "Main Events". */
const PATCH_KEYWORDS = [
  "patch", "update", "hotfix", "balance", "parche", "actualización", "actualizacion",
];

export function guessCategory(title: string): "main_events" | "patch_notes" {
  const t = title.toLowerCase();
  return PATCH_KEYWORDS.some((k) => t.includes(k)) ? "patch_notes" : "main_events";
}
