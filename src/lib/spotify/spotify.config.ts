/**
 * Configuración del módulo "Gaming Mode" (Spotify) — auth vía next-auth
 * (ver src/lib/spotify/auth.ts). Este archivo solo centraliza constantes
 * compartidas entre el config de next-auth y el resto del módulo.
 */
export const SPOTIFY_SCOPES = [
  "streaming",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
] as const;
