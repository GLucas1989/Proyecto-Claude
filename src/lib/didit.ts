import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Cliente de Didit.me (KYC) — Free KYC workflow.
 *
 * Fuente del contrato de API (docs.didit.me bloquea scraping directo, se
 * reconstruyó desde la documentación indexada y el repo oficial de demo
 * github.com/didit-protocol/didit-full-demo):
 *   - POST {base}/{version}/session/  con header x-api-key
 *   - Body: { workflow_id, vendor_data, callback }
 *   - Respuesta: { session_id, url } (nombre del campo de URL puede variar
 *     según versión de API — se lee de forma defensiva)
 *
 * ⚠️ La documentación pública mostró tanto "/v2/session/" (docs oficiales)
 * como "/v3/session/" (README del repo de demo oficial). Se deja la versión
 * configurable vía DIDIT_API_VERSION para no romper si el proveedor difiere
 * de lo documentado — probar y ajustar la env var si la creación de sesión
 * devuelve 404.
 */

const DIDIT_API_BASE = process.env.DIDIT_API_BASE ?? "https://verification.didit.me";
const DIDIT_API_VERSION = process.env.DIDIT_API_VERSION ?? "v2";
const DIDIT_API_KEY = process.env.DIDIT_API_KEY ?? "";
const DIDIT_WORKFLOW_ID = process.env.DIDIT_WORKFLOW_ID ?? ""; // Free KYC workflow
const DIDIT_WEBHOOK_SECRET = process.env.DIDIT_WEBHOOK_SECRET ?? "";

export interface DiditSession {
  sessionId: string;
  verificationUrl: string;
}

/**
 * Crea una sesión de verificación KYC para un usuario.
 * `vendorData` correlaciona la sesión con nuestro user_id (se lo devuelve el webhook).
 */
export async function createVerificationSession(
  vendorData: string,
  callbackUrl: string
): Promise<DiditSession | { error: string }> {
  if (!DIDIT_API_KEY || !DIDIT_WORKFLOW_ID) {
    return { error: "Didit no está configurado (faltan DIDIT_API_KEY / DIDIT_WORKFLOW_ID)." };
  }

  try {
    const res = await fetch(`${DIDIT_API_BASE}/${DIDIT_API_VERSION}/session/`, {
      method: "POST",
      headers: {
        "x-api-key": DIDIT_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workflow_id: DIDIT_WORKFLOW_ID,
        vendor_data: vendorData,
        callback: callbackUrl,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { error: `Didit respondió ${res.status}: ${body.slice(0, 200)}` };
    }

    const json = await res.json() as Record<string, unknown>;
    const sessionId = (json.session_id ?? json.id) as string | undefined;
    // El nombre del campo de URL varía entre versiones de la API observadas
    // en la documentación (url / verification_url / session_url).
    const verificationUrl = (json.url ?? json.verification_url ?? json.session_url) as string | undefined;

    if (!sessionId || !verificationUrl) {
      return { error: "Respuesta de Didit sin session_id/url — revisar DIDIT_API_VERSION." };
    }

    return { sessionId, verificationUrl };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error de red contactando a Didit." };
  }
}

/**
 * Verifica la firma del webhook de Didit.
 * Método "Simple Signature" (el recomendado por Didit): HMAC-SHA256 sobre
 * `${session_id}|${status}|${created_at}` — inmune a reserialización de JSON
 * por middlewares, a diferencia de firmar el body crudo.
 */
export function verifyDiditWebhookSignature(params: {
  signature: string | null;
  sessionId: string;
  status: string;
  createdAt: string | number;
}): boolean {
  const { signature, sessionId, status, createdAt } = params;
  if (!signature || !DIDIT_WEBHOOK_SECRET) return false;

  const payload = `${sessionId}|${status}|${createdAt}`;
  const expected = createHmac("sha256", DIDIT_WEBHOOK_SECRET).update(payload).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false; // longitudes distintas u otro error → firma inválida
  }
}

/** Estados que Didit reporta como aprobación exitosa (verificado defensivamente). */
export function isDiditApproved(status: string): boolean {
  return ["approved", "Approved", "passed", "success", "completed"].includes(status);
}

/** Estados que representan rechazo definitivo. */
export function isDiditDeclined(status: string): boolean {
  return ["declined", "Declined", "rejected", "failed"].includes(status);
}
