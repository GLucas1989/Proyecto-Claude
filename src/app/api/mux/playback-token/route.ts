import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMuxClient, isMuxSigningConfigured } from "@/lib/mux/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Firma un token de reproducción de Mux para contenido exclusivo
 * (playback_policy = "signed"). Requiere sesión activa — es el único gate
 * real: sin login, no hay forma de obtener un token válido para reproducir.
 */
export async function GET(request: Request) {
  const assetId = new URL(request.url).searchParams.get("assetId");
  if (!assetId) {
    return NextResponse.json({ error: "Falta assetId" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { data: asset } = await supabase
    .from("content_assets")
    .select("playback_id, is_exclusive, status")
    .eq("id", assetId)
    .maybeSingle();

  if (!asset || asset.status !== "ready" || !asset.playback_id) {
    return NextResponse.json({ error: "Video no disponible" }, { status: 404 });
  }

  // Contenido no exclusivo (public policy): no necesita token firmado.
  if (!asset.is_exclusive) {
    return NextResponse.json({ token: null, playbackId: asset.playback_id });
  }

  if (!isMuxSigningConfigured()) {
    return NextResponse.json(
      { error: "Falta configurar MUX_SIGNING_KEY_ID/MUX_SIGNING_KEY_PRIVATE." },
      { status: 503 }
    );
  }

  try {
    const mux = getMuxClient();
    const token = await mux.jwt.signPlaybackId(asset.playback_id, {
      type: "video",
      expiration: "2h",
    });
    return NextResponse.json({ token, playbackId: asset.playback_id });
  } catch {
    return NextResponse.json({ error: "No se pudo firmar el token de reproducción." }, { status: 500 });
  }
}
