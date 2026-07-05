import "server-only";
import Parser from "rss-parser";
import { createServiceClient } from "@/lib/supabase/service";
import { GAME_FEEDS, guessCategory } from "./feeds";

// User-Agent de navegador real: albiononline.com (entre otros) bloquea con 403
// cualquier UA que se identifique como bot, aunque respete robots.txt.
const FEED_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
};
const parser = new Parser({ timeout: 10_000, headers: FEED_HEADERS });

// Algunos feeds (news.blizzard.com, minecraft.net) traen "&" sueltos sin
// escapar dentro de URLs/texto — XML válido exige "&amp;". El parser aborta
// todo el feed por eso; lo saneamos antes de parsear en vez de perderlo entero.
function escapeStrayAmpersands(xml: string): string {
  return xml.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, "&amp;");
}

interface FeedItem {
  title?: string;
  link?: string;
  contentSnippet?: string;
  isoDate?: string;
  pubDate?: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&apos;/g, "'")
    .trim();
}

function pickTag(block: string, tag: string): string | undefined {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decodeEntities(m[1]) : undefined;
}

/**
 * Parser de respaldo tolerante: varios feeds oficiales (news.blizzard.com,
 * minecraft.net, darkanddarker.com) publican XML técnicamente inválido
 * (atributos sin valor, HTML crudo sin CDATA) que hace abortar al parser
 * estricto. Este fallback extrae los <item>/<entry> por regex — solo
 * título/link/fecha/resumen, que es todo lo que game_news necesita.
 */
function lenientParse(raw: string): { items: FeedItem[] } {
  const blocks = raw.match(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi) ?? [];
  const items: FeedItem[] = blocks.map((b) => {
    // <link>url</link> (RSS) o <link href="url"/> (Atom)
    const linkText = pickTag(b, "link");
    const linkHref = b.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1];
    const rawSummary = pickTag(b, "description") ?? pickTag(b, "summary");
    return {
      title: pickTag(b, "title"),
      link: (linkText && /^https?:\/\//.test(linkText) ? linkText : undefined) ?? linkHref,
      contentSnippet: rawSummary?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      isoDate: pickTag(b, "pubDate") ?? pickTag(b, "published") ?? pickTag(b, "updated"),
    };
  });
  return { items };
}

async function fetchRaw(url: string): Promise<{ raw: string; contentType: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, { headers: FEED_HEADERS, signal: controller.signal });
    if (!res.ok) throw new Error(`Status code ${res.status}`);
    return { raw: await res.text(), contentType: res.headers.get("content-type") ?? "" };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Autodiscovery de RSS: varias URLs configuradas resultaron ser páginas HTML
 * de noticias (Blizzard, Minecraft, Dark and Darker), no feeds. El estándar
 * es que la página declare su feed real en <link rel="alternate"
 * type="application/rss+xml|atom+xml" href="...">. Se sigue ese link una vez.
 */
function discoverFeedUrl(html: string, baseUrl: string): string | undefined {
  const m = html.match(
    /<link[^>]+type=["']application\/(?:rss|atom)\+xml["'][^>]*>/i
  );
  const href = m?.[0].match(/href=["']([^"']+)["']/i)?.[1];
  if (!href) return undefined;
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return undefined;
  }
}

async function fetchAndParseFeed(url: string): Promise<{ items: FeedItem[] }> {
  let { raw, contentType } = await fetchRaw(url);

  // La URL devuelve una página HTML → buscar el feed declarado y saltar a él.
  if (contentType.includes("text/html") || /^\s*<!doctype html/i.test(raw)) {
    const feedUrl = discoverFeedUrl(raw, url);
    if (!feedUrl) {
      throw new Error("La URL devuelve una página HTML sin feed RSS/Atom declarado.");
    }
    ({ raw, contentType } = await fetchRaw(feedUrl));
  }

  try {
    return await parser.parseString(escapeStrayAmpersands(raw));
  } catch (strictErr) {
    // XML inválido para el parser estricto → intento tolerante. Si tampoco
    // encuentra items, se propaga el error enriquecido con diagnóstico.
    const lenient = lenientParse(raw);
    if (lenient.items.length > 0) return lenient;
    const msg = strictErr instanceof Error ? strictErr.message : String(strictErr);
    const head = raw.slice(0, 120).replace(/\s+/g, " ");
    throw new Error(`${msg} [content-type: ${contentType}; body: ${head}]`);
  }
}

// Las fechas del fallback vienen crudas (RFC822, ISO, etc.) — se normalizan
// a ISO; si no parsean, se usa "ahora" (mismo default que antes).
function normalizeDate(raw?: string): string {
  if (raw) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

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
      const parsed = await fetchAndParseFeed(feed.url);
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
          published_at: normalizeDate(item.isoDate ?? item.pubDate),
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
