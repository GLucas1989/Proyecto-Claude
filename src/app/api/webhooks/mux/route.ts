import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getMuxClient } from "@/lib/mux/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook de Mux: video.asset.ready / video.asset.errored. Actualiza
 * content_assets vía service role (mismo patrón que Lemon Squeezy/Didit —
 * un webhook no tiene sesión de usuario, así que auth.uid() = null bajo RLS).
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const mux = getMuxClient();

  let event: Awaited<ReturnType<typeof mux.webhooks.unwrap>>;
  try {
    event = await mux.webhooks.unwrap(rawBody, request.headers, process.env.MUX_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (event.type !== "video.asset.ready" && event.type !== "video.asset.errored") {
    return NextResponse.json({ received: true, ignored: "unhandled event type" });
  }

  const uploadId = event.data.upload_id;
  if (!uploadId) {
    return NextResponse.json({ received: true, ignored: "no upload_id" });
  }

  try {
    const supabase = createServiceClient();

    if (event.type === "video.asset.ready") {
      const playbackId = event.data.playback_ids?.[0]?.id ?? null;
      const thumbnailUrl = playbackId
        ? `https://image.mux.com/${playbackId}/thumbnail.jpg?time=1`
        : null;

      await supabase
        .from("content_assets")
        .update({
          video_id: event.data.id ?? null,
          playback_id: playbackId,
          duration_seconds: event.data.duration ?? null,
          thumbnail_url: thumbnailUrl,
          status: "ready",
        })
        .eq("mux_upload_id", uploadId);
    } else {
      await supabase
        .from("content_assets")
        .update({ status: "errored" })
        .eq("mux_upload_id", uploadId);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[mux-webhook] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
