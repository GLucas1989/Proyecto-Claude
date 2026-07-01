import "server-only";

/**
 * Configuración del módulo "Gaming Mode" (Spotify) — sidecar aislado del
 * resto de la app. Nada acá toca profiles/monetización/Supabase.
 *
 * Scopes:
 *  - streaming: reservado para una futura integración del Web Playback SDK
 *    (hoy el widget controla el dispositivo activo del usuario vía Web API,
 *    no reproduce audio embebido en el navegador).
 *  - user-read-playback-state / user-modify-playback-state: leer y
 *    controlar (play/pause/next) la reproducción activa.
 *  - playlist-read-private: listar las playlists del usuario para el selector.
 */
export const SPOTIFY_SCOPES = [
  "streaming",
  "user-read-playback-state",
  "user-modify-playback-state",
  "playlist-read-private",
] as const;

export const SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
export const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
export const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

export const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? "";
export const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? "";

export function getSpotifyRedirectUri(): string {
  return `${process.env.NEXT_PUBLIC_SITE_URL}/api/spotify/callback`;
}

export function isSpotifyConfigured(): boolean {
  return Boolean(SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET);
}

export function getSpotifyBasicAuthHeader(): string {
  return `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`;
}
