import "server-only";
import Mux from "@mux/mux-node";

/**
 * Cliente de Mux (video hosting) — módulo aislado del resto de la app.
 * Requiere MUX_TOKEN_ID / MUX_TOKEN_SECRET (API) y, para reproducir contenido
 * exclusivo (signed playback), MUX_SIGNING_KEY_ID / MUX_SIGNING_KEY_PRIVATE.
 */
let muxClient: Mux | null = null;

export function getMuxClient(): Mux {
  if (!muxClient) {
    muxClient = new Mux({
      tokenId: process.env.MUX_TOKEN_ID,
      tokenSecret: process.env.MUX_TOKEN_SECRET,
      jwtSigningKey: process.env.MUX_SIGNING_KEY_ID,
      jwtPrivateKey: process.env.MUX_SIGNING_KEY_PRIVATE,
    });
  }
  return muxClient;
}

export function isMuxConfigured(): boolean {
  return Boolean(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);
}

export function isMuxSigningConfigured(): boolean {
  return Boolean(process.env.MUX_SIGNING_KEY_ID && process.env.MUX_SIGNING_KEY_PRIVATE);
}
