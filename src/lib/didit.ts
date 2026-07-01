import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Cliente de Didit.me (KYC) — confirmado contra la doc oficial (v3):
 *   - POST https://verification.didit.me/v3/session/  con header x-api-key
 *   - Body: { workflow_id, vendor_data, callback }
 *   - Respuesta: { session_id, session_token, url, status, workflow_id, vendor_data }
 *   - workflow_id NO es secreto ni env var — es config por sesión.
 */

const DIDIT_API_BASE = "https://verification.didit.me";
const DIDIT_API_KEY = process.env.DIDIT_API_KEY ?? "";
const DIDIT_WEBHOOK_SECRET = process.env.DIDIT_WEBHOOK_SECRET ?? "";

// Workflow "Free KYC" — id de configuración, no secreto (confirmado en consola).
const DIDIT_WORKFLOW_ID = "934590b3-3496-4e60-b31d-e359bfd6dbdd";

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
  if (!DIDIT_API_KEY) {
    return { error: "Didit no está configurado (falta DIDIT_API_KEY)." };
  }

  try {
    const res = await fetch(`${DIDIT_API_BASE}/v3/session/`, {
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

    const json = await res.json() as { session_id?: string; url?: string };
    if (!json.session_id || !json.url) {
      return { error: "Respuesta de Didit sin session_id/url." };
    }

    return { sessionId: json.session_id, verificationUrl: json.url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error de red contactando a Didit." };
  }
}

// Whole-number floats (1.0 -> 1) recursivamente, igual que la canonicalización del servidor de Didit.
function shortenFloats(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(shortenFloats);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, shortenFloats(x)])
    );
  }
  if (typeof v === "number" && !Number.isInteger(v) && v % 1 === 0) return Math.trunc(v);
  return v;
}

// Orden lexicográfico recursivo de claves (se preserva el orden de arrays).
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    return Object.keys(v as object)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortKeys((v as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return v;
}

/**
 * Verifica la firma X-Signature-V2 del webhook de Didit: HMAC-SHA256 sobre el
 * JSON canonicalizado (shortenFloats -> sortKeys -> JSON.stringify), más
 * chequeo de frescura de X-Timestamp (máx 300s) para evitar replay.
 */
export function verifyDiditWebhookSignature(params: {
  signature: string | null;
  timestamp: string | null;
  rawBody: string;
}): boolean {
  const { signature, timestamp, rawBody } = params;
  if (!signature || !DIDIT_WEBHOOK_SECRET) return false;

  const ts = Number(timestamp);
  if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) return false;

  let canonical: string;
  try {
    canonical = JSON.stringify(sortKeys(shortenFloats(JSON.parse(rawBody))));
  } catch {
    return false;
  }

  const expected = createHmac("sha256", DIDIT_WEBHOOK_SECRET).update(canonical, "utf8").digest("hex");

  try {
    return signature.length === expected.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/** Estados de Didit v3 (literales exactos, case-sensitive). */
export function isDiditApproved(status: string): boolean {
  return status === "Approved";
}

export function isDiditDeclined(status: string): boolean {
  return status === "Declined";
}
