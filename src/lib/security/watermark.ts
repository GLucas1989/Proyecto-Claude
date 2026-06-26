/**
 * Anti-piratería base: marca de agua dinámica con el email cifrado del comprador.
 *
 * Inyectamos de forma sutil un identificador trazable en las vistas premium
 * (PDFs, guías) para desincentivar filtraciones en Discord/Reddit: si un
 * documento se filtra, el watermark permite rastrear la cuenta de origen.
 *
 * El email se ofusca con un cifrado ligero reversible (XOR + base64) usando
 * WATERMARK_SECRET. NO es criptografía fuerte — es trazabilidad disuasiva:
 * el objetivo es que el marcador no sea legible a simple vista pero sí
 * desencriptable por nosotros para identificar la fuente de una filtración.
 */

const SECRET = process.env.WATERMARK_SECRET ?? "s-hub-default-watermark-key";

function xorCipher(input: string, key: string): string {
  let out = "";
  for (let i = 0; i < input.length; i++) {
    out += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return out;
}

/** Codifica el email del comprador en un token de watermark ofuscado. */
export function encodeWatermark(email: string): string {
  const stamped = `${email}|${Date.now()}`;
  const ciphered = xorCipher(stamped, SECRET);
  // base64 url-safe
  const b64 = Buffer.from(ciphered, "binary").toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return b64;
}

/** Decodifica un token de watermark a { email, issuedAt }. Para auditoría interna. */
export function decodeWatermark(token: string): { email: string; issuedAt: number } | null {
  try {
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const ciphered = Buffer.from(b64, "base64").toString("binary");
    const stamped = xorCipher(ciphered, SECRET);
    const [email, ts] = stamped.split("|");
    if (!email) return null;
    return { email, issuedAt: Number(ts) || 0 };
  } catch {
    return null;
  }
}

/**
 * Genera el texto visible de la marca de agua para overlay en la UI.
 * Muestra el email parcialmente enmascarado (privacidad) + el token corto.
 * Ej: "ju••@gmail.com · a8F2k" repetido en mosaico sobre el contenido.
 */
export function buildWatermarkLabel(email: string): string {
  const [user, domain] = email.split("@");
  const masked = user.length <= 2
    ? `${user}••`
    : `${user.slice(0, 2)}${"•".repeat(Math.max(2, user.length - 2))}`;
  const token = encodeWatermark(email).slice(0, 6);
  return `${masked}@${domain ?? ""} · ${token}`;
}
