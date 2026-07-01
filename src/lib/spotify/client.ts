import "server-only";
import {
  SPOTIFY_TOKEN_URL,
  SPOTIFY_API_BASE,
  getSpotifyBasicAuthHeader,
} from "./spotify.config";
import { getSpotifyTokens, setSpotifyTokens, clearSpotifyTokens } from "./tokens";

interface RefreshResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

async function refreshAccessToken(refreshToken: string): Promise<RefreshResponse | null> {
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: getSpotifyBasicAuthHeader(),
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!res.ok) return null;
  return res.json() as Promise<RefreshResponse>;
}

/** Devuelve un access_token válido, refrescándolo si venció. null si no hay sesión de Spotify. */
export async function getValidAccessToken(): Promise<string | null> {
  const { accessToken, refreshToken, expiresAt } = await getSpotifyTokens();

  // 10s de margen para evitar carreras con la expiración real
  if (accessToken && Date.now() < expiresAt - 10_000) return accessToken;
  if (!refreshToken) return null;

  const refreshed = await refreshAccessToken(refreshToken);
  if (!refreshed) {
    await clearSpotifyTokens();
    return null;
  }

  await setSpotifyTokens({
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token,
    expiresIn: refreshed.expires_in,
  });
  return refreshed.access_token;
}

/** fetch autenticado contra la Web API de Spotify. 401 sintético si no hay sesión. */
export async function spotifyFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getValidAccessToken();
  if (!token) return new Response(null, { status: 401 });

  return fetch(`${SPOTIFY_API_BASE}${path}`, {
    ...init,
    headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` },
  });
}
