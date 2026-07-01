import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import Spotify from "next-auth/providers/spotify";
import { SPOTIFY_SCOPES } from "./spotify.config";

/**
 * Instancia de Auth.js dedicada exclusivamente al módulo "Gaming Mode".
 * No reemplaza ni interactúa con la autenticación principal de la app
 * (Supabase, cookies de sesión propias) — vive en su propio namespace
 * de cookies (authjs.*) y solo gestiona el token OAuth de Spotify.
 */

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
    });

    const refreshed = await res.json();
    if (!res.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: { params: { scope: SPOTIFY_SCOPES.join(" ") } },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: (account.expires_at ?? 0) * 1000,
        };
      }

      if (Date.now() < ((token.accessTokenExpires as number) ?? 0)) return token;

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Cast puntual: dentro de este callback el tipo de `session` es una
      // intersección compuesta por next-auth (user/AdapterSession/Session)
      // donde la augmentación de módulo de Session no siempre se resuelve
      // bien contra ese tipo anónimo — se castea acá, no afecta los usos
      // de `Session` en el resto del módulo (esos sí ven accessToken/error).
      const extended = session as typeof session & { accessToken?: string; error?: string };
      extended.accessToken = token.accessToken as string | undefined;
      extended.error = token.error as string | undefined;
      return extended;
    },
  },
});
