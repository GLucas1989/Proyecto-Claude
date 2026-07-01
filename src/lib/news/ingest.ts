import "server-only";
import Parser from "rss-parser";
import { createServiceClient } from "@/lib/supabase/service";
import { GAME_FEEDS, guessCategory } from "./feeds";

const parser = new Parser({
  timeout: 10_000,
  headers: { "User-Agent": "CreatorsSHUB-NewsBot/1.0 (+https://creatorsshub.gg)" },
});

export interface FeedSyncResult {
  gameSlug: string;
  url: string;
  ok: boolean;
  inserted: number;
  error?: string;
}

/**
 * Sincroniza todos los feeds RSS configurados (GAME_FEEDS) contra game_news.
 * Corre sin sesión de usuario (cron) → necesita service role, igual que los
 * webhooks: bajo RLS, un INSERT sin auth.uid() no pasa la policy
 * "game_news: admin write" (is_admin() requiere una sesión real).
 *
 * Cada feed se procesa de forma aislada: si uno falla (404, bloqueo de bot,
 * XML inválido, etc.) no tira abajo la sincronización de los demás — se
 * reporta en el resultado para poder diagnosticar cuál URL falló.
 */
export async function syncAllGameFeeds(): Promise<FeedSyncResult[]> {
  const supabase = createServiceClient();
  const results: FeedSyncResult[] = [];

  for (const feed of GAME_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const items = (parsed.items ?? []).slice(0, 15);

      let inserted = 0;
      for (const item of items) {
        const title = item.title?.trim();
        const url = item.link?.trim();
        if (!title || !url) continue;

        const { error } = await supabase.from("game_news").insert({
          game_slug: feed.gameSlug,
          category: guessCategory(title),
          title,
          summary: item.contentSnippet?.slice(0, 300) ?? null,
          url,
          published_at: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
        });

        // Duplicado por url (unique index) → esperado en cada corrida, no es un error real.
        if (!error) inserted += 1;
        else if (!error.message.includes("duplicate")) {
          throw error;
        }
      }

      results.push({ gameSlug: feed.gameSlug, url: feed.url, ok: true, inserted });
    } catch (err) {
      results.push({
        gameSlug: feed.gameSlug,
        url: feed.url,
        ok: false,
        inserted: 0,
        error: err instanceof Error ? err.message : "Error desconocido",
      });
    }
  }

  return results;
}
