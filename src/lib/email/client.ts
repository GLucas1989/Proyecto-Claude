/**
 * Transactional email client (provider-agnostic, env-driven).
 *
 * Soporta dos proveedores según variables de entorno disponibles:
 *   1. Resend         → RESEND_API_KEY            (recomendado, transaccional puro)
 *   2. MailerLite      → MAILERLITE_API_KEY        (fallback; usa transactional email)
 *
 * Si no hay ninguna key, degrada de forma segura: loguea y devuelve { sent: false }
 * sin lanzar excepción (evita romper flujos críticos como aprobar una guía).
 *
 * Remitente configurable vía EMAIL_FROM (default no-reply@creatorsshub.gg).
 */

const EMAIL_FROM = process.env.EMAIL_FROM ?? "Creators S-HUB <no-reply@creatorsshub.gg>";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  /** Texto plano opcional (fallback para clientes sin HTML) */
  text?: string;
}

export interface SendEmailResult {
  sent: boolean;
  provider?: "resend" | "mailerlite";
  error?: string;
}

export async function sendTransactionalEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  const { to, subject, html, text } = params;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { sent: false, error: "invalid recipient" };
  }

  const resendKey = process.env.RESEND_API_KEY;
  const mailerliteKey = process.env.MAILERLITE_API_KEY;

  // ── Resend (preferido) ──────────────────────────────────────────────────
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: [to],
          subject,
          html,
          text: text ?? stripHtml(html),
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { sent: false, provider: "resend", error: `resend ${res.status}: ${body.slice(0, 120)}` };
      }
      return { sent: true, provider: "resend" };
    } catch (err) {
      return { sent: false, provider: "resend", error: err instanceof Error ? err.message : "resend error" };
    }
  }

  // ── MailerLite transactional fallback ───────────────────────────────────
  if (mailerliteKey) {
    try {
      const res = await fetch("https://connect.mailerlite.com/api/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mailerliteKey}`,
        },
        body: JSON.stringify({
          to: [{ email: to }],
          from: { email: parseFromAddress(EMAIL_FROM), name: "Creators S-HUB" },
          subject,
          html,
          text: text ?? stripHtml(html),
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { sent: false, provider: "mailerlite", error: `mailerlite ${res.status}: ${body.slice(0, 120)}` };
      }
      return { sent: true, provider: "mailerlite" };
    } catch (err) {
      return { sent: false, provider: "mailerlite", error: err instanceof Error ? err.message : "mailerlite error" };
    }
  }

  // ── Sin proveedor configurado: degradar sin romper ──────────────────────
  console.warn(`[email] No provider configured — skipped email to ${to} ("${subject}")`);
  return { sent: false, error: "no email provider configured" };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function parseFromAddress(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from;
}
