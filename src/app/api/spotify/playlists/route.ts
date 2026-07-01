import { NextResponse } from "next/server";
import { spotifyFetch } from "@/lib/spotify/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SpotifyPlaylistItem {
  id: string;
  name: string;
  uri: string;
}

export async function GET() {
  const res = await spotifyFetch("/me/playlists?limit=20");

  if (res.status === 401) {
    return NextResponse.json({ connected: false, playlists: [] });
  }
  if (!res.ok) {
    return NextResponse.json({ connected: true, playlists: [] });
  }

  const data = (await res.json()) as { items: SpotifyPlaylistItem[] };
  const playlists = (data.items ?? []).map((p) => ({ id: p.id, name: p.name, uri: p.uri }));

  return NextResponse.json({ connected: true, playlists });
}
