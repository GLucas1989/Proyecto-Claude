import { NextResponse } from "next/server";
import { recomputeAllReputation } from "@/services/rankingService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Job diario: recalcula la reputación de todos los creadores.
 * Protegido por CRON_SECRET (Authorization: Bearer <secret>).
 * Configurar en Vercel Cron → GET /api/cron/recompute-reputation (ej: diario 03:17).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const processed = await recomputeAllReputation();
  return NextResponse.json({ ok: true, processed });
}
