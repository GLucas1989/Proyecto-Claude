import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import {
  SPOTIFY_AUTHORIZE_URL,
  SPOTIFY_SCOPES,
  SPOTIFY_CLIENT_ID,
  getSpotifyRedirectUri,
  isSpotifyConfigured,
} from "@/lib/spotify/spotify.config";

export const runtime = "nodejs";

export async function GET() {
  if (!isSpotifyConfigured()) {
    return NextResponse.json(
      { error: "Spotify no está configurado (faltan SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET)." },
      { status: 503 }
    );
  }

  const state = randomBytes(16).toString("hex");
  const store = await cookies();
  store.set("sp_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const url = new URL(SPOTIFY_AUTHORIZE_URL);
  url.searchParams.set("client_id", SPOTIFY_CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", getSpotifyRedirectUri());
  url.searchParams.set("scope", SPOTIFY_SCOPES.join(" "));
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
