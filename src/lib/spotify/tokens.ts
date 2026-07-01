import "server-only";
import { cookies } from "next/headers";

/**
 * Tokens de Spotify guardados en cookies httpOnly propias del módulo — no
 * se tocan las cookies de sesión de Supabase ni ninguna tabla de la app.
 */
const ACCESS_COOKIE = "sp_at";
const REFRESH_COOKIE = "sp_rt";
const EXPIRES_COOKIE = "sp_exp";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
};

export async function setSpotifyTokens(params: {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}) {
  const store = await cookies();
  const expiresAt = Date.now() + params.expiresIn * 1000;

  store.set(ACCESS_COOKIE, params.accessToken, { ...COOKIE_OPTS, maxAge: params.expiresIn });
  store.set(EXPIRES_COOKIE, String(expiresAt), { ...COOKIE_OPTS, maxAge: params.expiresIn });
  if (params.refreshToken) {
    store.set(REFRESH_COOKIE, params.refreshToken, { ...COOKIE_OPTS, maxAge: 60 * 60 * 24 * 30 });
  }
}

export async function getSpotifyTokens() {
  const store = await cookies();
  return {
    accessToken: store.get(ACCESS_COOKIE)?.value ?? null,
    refreshToken: store.get(REFRESH_COOKIE)?.value ?? null,
    expiresAt: Number(store.get(EXPIRES_COOKIE)?.value ?? 0),
  };
}

export async function clearSpotifyTokens() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
  store.delete(EXPIRES_COOKIE);
}
