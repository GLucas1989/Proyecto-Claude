/**
 * Plantillas HTML transaccionales — estética cyberpunk terminal de S-HUB.
 * Paleta: fondo #0B0F19, acento cian #00F0FF, magenta #F43F5E.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://creatorsshub.gg";

function shell(inner: string): string {
  return `
  <div style="background:#0B0F19;padding:32px 16px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#0d1220;border:1px solid rgba(0,240,255,0.15);border-radius:16px;overflow:hidden;">
      <div style="padding:20px 28px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <span style="font-size:18px;font-weight:900;color:#fff;letter-spacing:-0.5px;">CREATORS <span style="color:#00F0FF;">S-HUB</span></span>
      </div>
      <div style="padding:28px;">
        ${inner}
      </div>
      <div style="padding:18px 28px;border-top:1px solid rgba(255,255,255,0.06);">
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3);font-family:monospace;">
          &gt;_ Creators S-HUB · La plataforma de los creadores gamer
        </p>
      </div>
    </div>
  </div>`;
}

function ctaButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;padding:12px 28px;background:linear-gradient(90deg,rgba(0,240,255,0.18),rgba(244,63,94,0.12));border:1px solid rgba(0,240,255,0.45);border-radius:10px;color:#9becff;font-weight:700;font-size:14px;text-decoration:none;">${label}</a>`;
}

export function ugcApprovedEmail(params: {
  authorName: string;
  publicationTitle: string;
  publicationId: string;
}): { subject: string; html: string } {
  const url = `${SITE_URL}/ugc/${params.publicationId}`;
  const subject = `✅ Tu guía "${params.publicationTitle}" fue aprobada`;
  const html = shell(`
    <p style="margin:0 0 6px;font-size:11px;color:#00F0FF;font-family:monospace;text-transform:uppercase;letter-spacing:2px;">// publicación aprobada</p>
    <h1 style="margin:0 0 16px;font-size:22px;color:#fff;font-weight:900;">¡Felicitaciones, ${escapeHtml(params.authorName)}! 🎉</h1>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.7);">
      Tu guía <strong style="color:#fff;">"${escapeHtml(params.publicationTitle)}"</strong> pasó la moderación y ya está
      <strong style="color:#00F0FF;">publicada</strong> en Creators S-HUB.
    </p>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.7);">
      Ahora es momento de difundirla. Compartí tu link en Discord, Twitter/X y tu comunidad para empezar a generar vistas y ganancias.
    </p>
    <p style="margin:0 0 8px;">${ctaButton(url, "Ver mi guía publicada →")}</p>
    <p style="margin:18px 0 0;font-size:12px;color:rgba(255,255,255,0.35);font-family:monospace;">${url}</p>
  `);
  return { subject, html };
}

export function ugcRejectedEmail(params: {
  authorName: string;
  publicationTitle: string;
  reason: string;
  publicationId: string;
}): { subject: string; html: string } {
  const url = `${SITE_URL}/ugc/${params.publicationId}/edit`;
  const subject = `Tu guía "${params.publicationTitle}" necesita ajustes`;
  const html = shell(`
    <p style="margin:0 0 6px;font-size:11px;color:#F43F5E;font-family:monospace;text-transform:uppercase;letter-spacing:2px;">// requiere revisión</p>
    <h1 style="margin:0 0 16px;font-size:22px;color:#fff;font-weight:900;">Hola, ${escapeHtml(params.authorName)}</h1>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.7);">
      Revisamos tu guía <strong style="color:#fff;">"${escapeHtml(params.publicationTitle)}"</strong> y necesita algunos ajustes antes de publicarse.
    </p>
    <div style="margin:0 0 20px;padding:14px 16px;background:rgba(244,63,94,0.08);border:1px solid rgba(244,63,94,0.25);border-radius:10px;">
      <p style="margin:0;font-size:13px;line-height:1.5;color:rgba(255,255,255,0.8);">
        <strong style="color:#F43F5E;">Motivo:</strong> ${escapeHtml(params.reason)}
      </p>
    </div>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.7);">
      No te desanimes — corregí lo señalado y volvé a enviarla. Estamos para ayudarte a que tu contenido brille.
    </p>
    <p style="margin:0 0 8px;">${ctaButton(url, "Editar y reenviar →")}</p>
  `);
  return { subject, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
