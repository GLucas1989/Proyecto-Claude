import { NextResponse } from "next/server";
import { syncAllGameFeeds } from "@/lib/news/ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Job periódico: sincroniza los feeds RSS oficiales de cada juego contra
 * game_news. Protegido por CRON_SECRET (Authorization: Bearer <secret>).
 * Configurado en vercel.json → GET /api/cron/sync-news.
 *
 * La respuesta incluye el detalle por feed (ok/error) para poder diagnosticar
 * rápido si algún sitio bloquea el bot o cambió la URL del RSS.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await syncAllGameFeeds();
  const totalInserted = results.reduce((a, r) => a + r.inserted, 0);
  const failed = results.filter((r) => !r.ok);

  return NextResponse.json({ ok: true, totalInserted, failedFeeds: failed.length, results });
}
