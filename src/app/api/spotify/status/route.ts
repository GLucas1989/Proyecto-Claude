import { NextResponse } from "next/server";
import { spotifyFetch } from "@/lib/spotify/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SpotifyArtist {
  name: string;
}
interface SpotifyPlayerState {
  is_playing: boolean;
  item?: {
    name: string;
    artists: SpotifyArtist[];
    album: { images: { url: string }[] };
  } | null;
}

export async function GET() {
  const res = await spotifyFetch("/me/player");

  if (res.status === 401) {
    return NextResponse.json({ connected: false, playing: null });
  }
  if (res.status === 204) {
    // Conectado pero sin reproducción activa en ningún dispositivo
    return NextResponse.json({ connected: true, playing: null });
  }
  if (!res.ok) {
    return NextResponse.json({ connected: true, playing: null });
  }

  const data = (await res.json()) as SpotifyPlayerState;
  return NextResponse.json({
    connected: true,
    playing: data.item
      ? {
          isPlaying: data.is_playing,
          trackName: data.item.name,
          artistName: data.item.artists.map((a) => a.name).join(", "),
          albumImage: data.item.album.images[data.item.album.images.length - 1]?.url ?? null,
        }
      : null,
  });
}
