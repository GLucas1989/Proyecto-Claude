/**
 * fetch-youtube.ts
 *
 * Actualiza, de forma automática, los datos reales de cada creador en todos
 * los juegos: channelId, avatar y los últimos N videos.
 *
 * Cómo resuelve cada canal:
 *   Toma el @handle desde `channelUrl` (p.ej. https://youtube.com/@Rhykker → "Rhykker")
 *   y lo resuelve con la YouTube Data API v3 (endpoint channels?forHandle).
 *   Así NO hace falta cargar a mano los channelId reales: basta el handle.
 *
 * Estrategias (en orden de prioridad):
 *   1. YouTube Data API v3  → requiere YOUTUBE_API_KEY. Resuelve handle, avatar y videos.
 *   2. RSS feed público     → sin API key, pero REQUIERE un channelId real (UC...).
 *                             No puede resolver handles ni avatares.
 *
 * Uso local:
 *   YOUTUBE_API_KEY=xxx npm run fetch-videos
 *   npm run fetch-videos                         ← RSS fallback (necesita channelId reales)
 *
 * Flags:
 *   --game=mtg-arena       procesa solo ese juego
 *   --dry-run              imprime cambios sin escribir al disco
 *   --max=10               número máximo de videos por creador (default: 10)
 *   --no-avatar            no actualiza el avatar aunque haya API key
 */

import fs from "fs";
import path from "path";

// ── Config ────────────────────────────────────────────────────────────

const DATA_ROOT = path.join(process.cwd(), "src", "data");
const API_KEY = process.env.YOUTUBE_API_KEY ?? "";

const args = process.argv.slice(2);
const getFlag = (name: string) => {
  const match = args.find((a) => a.startsWith(`--${name}=`));
  return match ? match.split("=")[1] : undefined;
};
const hasFlag = (name: string) => args.includes(`--${name}`);

const MAX_VIDEOS = parseInt(getFlag("max") ?? "10", 10);
const TARGET_GAME = getFlag("game");
const DRY_RUN = hasFlag("dry-run");
const SKIP_AVATAR = hasFlag("no-avatar");

// ── Types ────────────────────────────────────────────────────────────

interface VideoPayload {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  publishedAt: string;
}

interface CreatorRecord {
  id: string;
  name: string;
  channelId: string;
  channelUrl?: string;
  avatar?: string;
  latestVideos: VideoPayload[];
  [key: string]: unknown;
}

interface ResolvedChannel {
  channelId: string;
  avatar: string;
  uploadsPlaylistId: string;
}

interface FetchResult {
  creatorId: string;
  status: "updated" | "skipped" | "error" | "unchanged";
  videoCount?: number;
  error?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────

/** Extrae el @handle desde una channelUrl tipo https://youtube.com/@Handle */
function handleFromUrl(channelUrl?: string): string | undefined {
  if (!channelUrl) return undefined;
  const m = channelUrl.match(/@([A-Za-z0-9._-]+)/);
  return m ? m[1] : undefined;
}

/** Un channelId real de YouTube es "UC" + 22 chars. Los placeholders no lo cumplen. */
function isRealChannelId(id?: string): boolean {
  return !!id && /^UC[A-Za-z0-9_-]{22}$/.test(id);
}

// ── YouTube Data API v3 ────────────────────────────────────────────

/** Resuelve handle (o channelId real) → channelId + avatar + uploads playlist. */
async function resolveChannel(creator: CreatorRecord): Promise<ResolvedChannel> {
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("part", "snippet,contentDetails");

  const handle = handleFromUrl(creator.channelUrl);
  if (handle) {
    url.searchParams.set("forHandle", handle);
  } else if (isRealChannelId(creator.channelId)) {
    url.searchParams.set("id", creator.channelId);
  } else {
    throw new Error(`sin @handle en channelUrl ni channelId real`);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`channels ${res.status}: ${body.slice(0, 160)}`);
  }

  const data = (await res.json()) as {
    items?: Array<{
      id: string;
      snippet: { thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } } };
      contentDetails: { relatedPlaylists: { uploads: string } };
    }>;
  };

  const item = data.items?.[0];
  if (!item) throw new Error(`canal no encontrado (handle=${handle ?? creator.channelId})`);

  return {
    channelId: item.id,
    avatar:
      item.snippet.thumbnails.high?.url ??
      item.snippet.thumbnails.medium?.url ??
      item.snippet.thumbnails.default?.url ??
      creator.avatar ??
      "",
    uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads,
  };
}

/** Trae los últimos N videos desde la playlist de uploads (1 unidad de quota). */
async function fetchVideosFromPlaylist(uploadsPlaylistId: string): Promise<VideoPayload[]> {
  const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("part", "snippet,contentDetails");
  url.searchParams.set("playlistId", uploadsPlaylistId);
  url.searchParams.set("maxResults", String(MAX_VIDEOS));

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`playlistItems ${res.status}: ${body.slice(0, 160)}`);
  }

  const data = (await res.json()) as {
    items: Array<{
      contentDetails: { videoId: string; videoPublishedAt?: string };
      snippet: {
        title: string;
        publishedAt: string;
        thumbnails: { maxres?: { url: string }; high?: { url: string }; medium?: { url: string } };
      };
    }>;
  };

  return data.items.map((item) => {
    const videoId = item.contentDetails.videoId;
    const published = item.contentDetails.videoPublishedAt ?? item.snippet.publishedAt;
    return {
      id: `vid-${videoId}`,
      title: item.snippet.title,
      thumbnail:
        item.snippet.thumbnails.maxres?.url ??
        item.snippet.thumbnails.high?.url ??
        item.snippet.thumbnails.medium?.url ??
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      publishedAt: published.split("T")[0],
    };
  });
}

// ── RSS Feed fallback ────────────────────────────────────────────

async function fetchFromRSS(channelId: string): Promise<VideoPayload[]> {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const res = await fetch(feedUrl, {
    headers: { "User-Agent": "CreatorHub/1.0 (+https://github.com/glucas1989/proyecto-claude)" },
  });

  if (!res.ok) throw new Error(`RSS ${res.status} for channel ${channelId}`);

  const xml = await res.text();
  const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) ?? [];

  return entries.slice(0, MAX_VIDEOS).map((entry) => {
    const videoId = (entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/) ?? [])[1] ?? "";
    const rawTitle = (entry.match(/<title>(.*?)<\/title>/) ?? [])[1] ?? "";
    const published = (entry.match(/<published>(.*?)<\/published>/) ?? [])[1] ?? "";
    const thumbnail =
      (entry.match(/<media:thumbnail url="(.*?)"/) ?? [])[1] ??
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    const title = rawTitle
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();

    return {
      id: `vid-${videoId}`,
      title,
      thumbnail,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      publishedAt: published.split("T")[0],
    };
  });
}

// ── Per-creator logic ────────────────────────────────────────────

interface CreatorUpdate {
  creator: CreatorRecord;
  result: FetchResult;
}

async function updateCreator(creator: CreatorRecord): Promise<CreatorUpdate> {
  try {
    let videos: VideoPayload[];
    let next: CreatorRecord = { ...creator };

    if (API_KEY) {
      // Modo API: resuelve handle → channelId + avatar + videos
      const channel = await resolveChannel(creator);
      videos = await fetchVideosFromPlaylist(channel.uploadsPlaylistId);
      next.channelId = channel.channelId;
      if (!SKIP_AVATAR && channel.avatar) next.avatar = channel.avatar;
    } else {
      // Modo RSS: necesita channelId real
      if (!isRealChannelId(creator.channelId)) {
        return {
          creator,
          result: {
            creatorId: creator.id,
            status: "skipped",
            error: "channelId placeholder (corré con YOUTUBE_API_KEY para resolver el @handle)",
          },
        };
      }
      videos = await fetchFromRSS(creator.channelId);
    }

    const existingIds = creator.latestVideos.map((v) => v.id).join(",");
    const newIds = videos.map((v) => v.id).join(",");
    const avatarChanged = next.avatar !== creator.avatar;
    const channelChanged = next.channelId !== creator.channelId;

    if (existingIds === newIds && !avatarChanged && !channelChanged) {
      return { creator, result: { creatorId: creator.id, status: "unchanged", videoCount: videos.length } };
    }

    next.latestVideos = videos;
    return { creator: next, result: { creatorId: creator.id, status: "updated", videoCount: videos.length } };
  } catch (err) {
    return { creator, result: { creatorId: creator.id, status: "error", error: (err as Error).message } };
  }
}

// ── Per-game processing ──────────────────────────────────────────

async function processGame(gameSlug: string): Promise<void> {
  const filePath = path.join(DATA_ROOT, gameSlug, "creators.json");
  if (!fs.existsSync(filePath)) return;

  const creators: CreatorRecord[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  console.log(`\n🎮  ${gameSlug}  (${creators.length} creators)`);

  const updates: CreatorUpdate[] = [];
  for (const creator of creators) {
    updates.push(await updateCreator(creator));
  }

  for (const { result } of updates) {
    const icon =
      result.status === "updated"
        ? "✅"
        : result.status === "unchanged"
        ? "─ "
        : result.status === "skipped"
        ? "⏭ "
        : "❌";
    const detail =
      result.status === "updated"
        ? `${result.videoCount} videos`
        : result.status === "error" || result.status === "skipped"
        ? result.error ?? result.status
        : result.status;
    console.log(`   ${icon}  ${result.creatorId.padEnd(24)} ${detail}`);
  }

  const updatedCount = updates.filter((r) => r.result.status === "updated").length;
  if (!DRY_RUN) {
    if (updatedCount > 0) {
      fs.writeFileSync(filePath, JSON.stringify(updates.map((u) => u.creator), null, 2) + "\n", "utf-8");
      console.log(`   → Wrote ${updatedCount} updates to ${gameSlug}/creators.json`);
    }
  } else {
    console.log(`   → DRY RUN: ${updatedCount} cambios detectados, no se escribió nada`);
  }
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  CreatorHub — YouTube sync");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  API key   : ${API_KEY ? "✅ present (resuelve handle + avatar + videos)" : "⚠️  missing → RSS (necesita channelId reales)"}`);
  console.log(`  Max videos: ${MAX_VIDEOS}`);
  console.log(`  Avatar    : ${API_KEY && !SKIP_AVATAR ? "se actualiza" : "no"}`);
  console.log(`  Dry run   : ${DRY_RUN ? "yes" : "no"}`);
  console.log(`  Target    : ${TARGET_GAME ?? "all games"}`);

  const gameDirs = fs
    .readdirSync(DATA_ROOT)
    .filter((f) => fs.statSync(path.join(DATA_ROOT, f)).isDirectory())
    .filter((f) => !TARGET_GAME || f === TARGET_GAME);

  if (gameDirs.length === 0) {
    console.error(`\n❌  No game directories found${TARGET_GAME ? ` matching "${TARGET_GAME}"` : ""}`);
    process.exit(1);
  }

  for (const gameSlug of gameDirs) {
    await processGame(gameSlug);
  }

  console.log("\n✔  Done\n");
}

main().catch((err) => {
  console.error("\n💥  Fatal:", err.message);
  process.exit(1);
});
