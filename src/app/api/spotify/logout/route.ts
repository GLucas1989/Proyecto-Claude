import { NextResponse } from "next/server";
import { clearSpotifyTokens } from "@/lib/spotify/tokens";

export const runtime = "nodejs";

export async function POST() {
  await clearSpotifyTokens();
  return NextResponse.json({ ok: true });
}
