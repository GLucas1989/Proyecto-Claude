/**
 * Capa de abstracción multimedia de S-HUB.
 *
 * Define un MediaAsset agnóstico del proveedor para que el frontend no acople
 * su lógica a YouTube. Hoy embebemos reproductores Unlisted de YouTube, pero la
 * infraestructura ya está tipada para escalar de forma nativa a Cloudflare Stream
 * o Vimeo OTT (con tokens firmados) en fases posteriores sin tocar la UI.
 */

export type MediaProvider = "youtube_unlisted" | "cloudflare_stream" | "vimeo_ott";

export type MediaKind = "video" | "audio" | "pdf" | "ppt" | "link";

export interface MediaAsset {
  id: string;
  kind: MediaKind;
  provider: MediaProvider;
  /** Identificador en el proveedor (videoId de YT, uid de CF Stream, etc.) */
  providerRef: string;
  title: string;
  /**
   * Token de reproducción firmado (Cloudflare/Vimeo). Para YouTube Unlisted
   * queda null: el control de acceso lo da la condición "unlisted" + el paywall.
   */
  signedToken?: string | null;
  durationSec?: number | null;
  thumbnailUrl?: string | null;
}

/** Extrae el videoId de cualquier URL/forma de YouTube. */
export function parseYouTubeId(input: string): string | null {
  if (!input) return null;
  // Ya es un id de 11 chars
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = input.match(re);
    if (m) return m[1];
  }
  return null;
}

/**
 * Resuelve la URL de embed para un MediaAsset de video según su proveedor.
 * Centraliza aquí la lógica para que migrar de proveedor sea transparente.
 */
export function resolveVideoEmbedUrl(asset: MediaAsset): string | null {
  switch (asset.provider) {
    case "youtube_unlisted":
      return `https://www.youtube-nocookie.com/embed/${asset.providerRef}?rel=0&modestbranding=1`;
    case "cloudflare_stream":
      // Cloudflare Stream con token firmado (cuando se active el provider)
      return asset.signedToken
        ? `https://iframe.videodelivery.net/${asset.signedToken}`
        : `https://iframe.videodelivery.net/${asset.providerRef}`;
    case "vimeo_ott":
      return asset.signedToken
        ? `https://player.vimeo.com/video/${asset.providerRef}?h=${asset.signedToken}`
        : `https://player.vimeo.com/video/${asset.providerRef}`;
    default:
      return null;
  }
}

/** Construye un MediaAsset de video YouTube Unlisted a partir de una URL/id. */
export function youTubeUnlistedAsset(
  urlOrId: string,
  title: string
): MediaAsset | null {
  const videoId = parseYouTubeId(urlOrId);
  if (!videoId) return null;
  return {
    id: `yt_${videoId}`,
    kind: "video",
    provider: "youtube_unlisted",
    providerRef: videoId,
    title,
    signedToken: null,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}
