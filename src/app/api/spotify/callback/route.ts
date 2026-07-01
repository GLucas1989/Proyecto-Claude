import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SPOTIFY_TOKEN_URL,
  getSpotifyRedirectUri,
  getSpotifyBasicAuthHeader,
} from "@/lib/spotify/spotify.config";
import { setSpotifyTokens } from "@/lib/spotify/tokens";

export const runtime = "nodejs";

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const store = await cookies();
  const expectedState = store.get("sp_oauth_state")?.value;
  store.delete("sp_oauth_state");

  if (oauthError || !code || !state || state !== expectedState) {
    return NextResponse.redirect(`${origin}/?spotify_error=1`);
  }

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: getSpotifyBasicAuthHeader(),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getSpotifyRedirectUri(),
    }),
  });

  if (!res.ok) {
    return NextResponse.redirect(`${origin}/?spotify_error=1`);
  }

  const data = (await res.json()) as TokenResponse;
  await setSpotifyTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  });

  return NextResponse.redirect(`${origin}/?spotify_connected=1`);
}
