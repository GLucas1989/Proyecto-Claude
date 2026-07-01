import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyDiditWebhookSignature, isDiditApproved, isDiditDeclined } from "@/lib/didit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DiditWebhookPayload {
  event_id?: string;
  webhook_type?: string;
  session_id?: string;
  status?: string;
  vendor_data?: string; // nuestro profiles.id
  decision?: unknown;
}

// Familias de evento que de verdad usamos hoy (solo KYC de sesión). El resto
// (user.*, business.*, activity.created, transaction.*) se reconoce y se
// ack-ea con 200 pero no dispara ninguna escritura — no tenemos KYB/AML/
// transacciones habilitadas todavía.
const HANDLED_WEBHOOK_TYPES = new Set(["status.updated", "data.updated"]);

/**
 * Webhook de Didit: recibe eventos de verificación (status.updated es el que
 * nos importa hoy). Idempotente por event_id (tabla didit_webhook_events) y,
 * además, por is_verified ya en true. Solo actúa si el session_id coincide
 * con el que nosotros generamos (evita que un webhook viejo/ajeno pise el
 * estado de otro usuario).
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-signature-v2");
  const timestampHeader = request.headers.get("x-timestamp");

  const validSignature = verifyDiditWebhookSignature({
    signature: signatureHeader,
    timestamp: timestampHeader,
    rawBody,
  });
  if (!validSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: DiditWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  const { event_id: eventId, webhook_type: webhookType, session_id: sessionId, status, vendor_data: vendorData } = payload;

  try {
    const supabase = createServiceClient();

    // Idempotencia por event_id: cada entrega (incluidos los 2 reintentos de
    // Didit ante 5xx/404) trae un event_id único.
    if (eventId) {
      const { error: insertErr } = await supabase
        .from("didit_webhook_events")
        .insert({ event_id: eventId });
      if (insertErr) {
        // Violación de unique constraint → ya procesado, no repetir efectos.
        return NextResponse.json({ received: true, duplicate: true });
      }
    }

    // Solo procesamos eventos de status de sesión KYC; el resto se ack-ea.
    if (!webhookType || !HANDLED_WEBHOOK_TYPES.has(webhookType)) {
      return NextResponse.json({ received: true, ignored: "unhandled webhook_type" });
    }
    if (!sessionId || !status) {
      return NextResponse.json({ error: "Missing session_id/status" }, { status: 400 });
    }

    // Resolver el usuario: vendor_data es la fuente primaria; si no vino,
    // buscamos por la sesión que nosotros guardamos al crearla.
    const userId = vendorData;
    let query = supabase.from("profiles").select("id, is_verified, kyc_session_id");
    query = userId ? query.eq("id", userId) : query.eq("kyc_session_id", sessionId);
    const { data: profile } = await query.maybeSingle();

    if (!profile) {
      // No podemos correlacionar el evento con ningún usuario — no es un error
      // de nuestro lado, pero tampoco hay nada que actualizar.
      return NextResponse.json({ received: true, matched: false });
    }

    // Anti-replay/duplicado: si la sesión no coincide con la última emitida
    // para este perfil, ignoramos (podría ser un webhook de una sesión vieja).
    if (profile.kyc_session_id && profile.kyc_session_id !== sessionId) {
      return NextResponse.json({ received: true, ignored: "stale session" });
    }

    // Idempotencia: ya procesado, no reescribir.
    if (profile.is_verified === true) {
      return NextResponse.json({ received: true, alreadyVerified: true });
    }

    if (isDiditApproved(status)) {
      await supabase
        .from("profiles")
        .update({ is_verified: true, kyc_status: status })
        .eq("id", profile.id);
    } else if (isDiditDeclined(status)) {
      await supabase
        .from("profiles")
        .update({ is_verified: false, kyc_status: status })
        .eq("id", profile.id);
    } else {
      // Estado intermedio (In Review, In Progress, Resubmitted, Abandoned,
      // Expired, KYC Expired, etc.) — solo registrar.
      await supabase.from("profiles").update({ kyc_status: status }).eq("id", profile.id);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[didit-webhook] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
