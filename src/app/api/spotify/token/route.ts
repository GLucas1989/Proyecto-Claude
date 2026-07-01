import { NextResponse } from "next/server";
import { auth } from "@/lib/spotify/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Token endpoint consumido por el Web Playback SDK (getOAuthToken) desde el
 * cliente. El SDK necesita el access_token en el navegador para autenticar
 * su propia conexión WebSocket con Spotify — es una restricción del SDK
 * oficial, no una decisión nuestra. El refresh automático (jwt callback en
 * auth.ts) garantiza que siempre se devuelva un token vigente.
 */
export async function GET() {
  const session = await auth();

  if (!session?.accessToken || session.error) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  return NextResponse.json({ accessToken: session.accessToken });
}
