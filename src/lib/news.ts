import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { NewsCategory, NewsItem } from "@/lib/newsTypes";

export type { NewsCategory, NewsItem } from "@/lib/newsTypes";
export { NEWS_CATEGORY_CONFIG } from "@/lib/newsTypes";

/**
 * Noticias de un juego, más recientes primero. `category` es opcional
 * (sin filtro = todas). Tolerante a errores: si la tabla no existe todavía
 * (migración no corrida) devuelve [] en vez de romper la página.
 */
export async function getGameNews(
  gameSlug: string,
  options?: { category?: NewsCategory; limit?: number }
): Promise<NewsItem[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("game_news")
      .select("id, game_slug, category, title, summary, url, published_at")
      .eq("game_slug", gameSlug)
      .order("published_at", { ascending: false });

    if (options?.category) query = query.eq("category", options.category);
    if (options?.limit) query = query.limit(options.limit);

    const { data } = await query;
    return (data ?? []) as NewsItem[];
  } catch {
    return [];
  }
}
