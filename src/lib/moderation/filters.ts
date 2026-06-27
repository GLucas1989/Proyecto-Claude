/**
 * Filtros de auto-moderación. Revisa título + contenido + adjuntos antes de que
 * una publicación llegue a la cola del admin, para frenar spam/abuso evidente.
 *
 * Devuelve un motivo de rechazo si algo dispara, o null si pasa el filtro.
 */

// Palabras/expresiones prohibidas (spam, estafas, contenido no permitido).
// Lista base — ampliable. Se evalúa sin distinguir mayúsculas.
const BANNED_PATTERNS: RegExp[] = [
  /\bfree\s*v[-\s]?bucks?\b/i,
  /\bregal[oa]?s?\s+gratis\b/i,
  /\bhack\s+(de\s+)?(monedas|gems|gemas|dinero)\b/i,
  /\bgenerador\s+de\s+(monedas|gemas|v-?bucks)\b/i,
  /\b(viagra|cialis|casino online|apuestas garantizadas)\b/i,
  /\bclic?k\s+aqu[ií]\s+para\s+ganar\b/i,
  /\bcompr[aá]\s+seguidores\b/i,
  /\b(porn|xxx|onlyfans\s+leak)\b/i,
];

// Dominios de enlaces no permitidos en el cuerpo (acortadores usados para spam, etc.)
const BANNED_LINK_HOSTS = [
  "bit.ly", "tinyurl.com", "cutt.ly", "adf.ly", "shorte.st", "bc.vc",
];

export interface ModerationResult {
  blocked: boolean;
  reason?: string;
}

export function autoModerate(input: {
  title: string;
  content: string;
  attachments?: string[];
}): ModerationResult {
  const haystack = `${input.title}\n${input.content}`;

  // 1. Palabras prohibidas
  for (const re of BANNED_PATTERNS) {
    if (re.test(haystack)) {
      return { blocked: true, reason: "El contenido contiene términos no permitidos (spam o abuso)." };
    }
  }

  // 2. Enlaces a dominios bloqueados (en cuerpo y adjuntos)
  const urls = [
    ...(haystack.match(/https?:\/\/[^\s)]+/gi) ?? []),
    ...(input.attachments ?? []),
  ];
  for (const u of urls) {
    try {
      const host = new URL(u).hostname.replace(/^www\./, "");
      if (BANNED_LINK_HOSTS.includes(host)) {
        return { blocked: true, reason: `No se permiten enlaces de ${host} (acortadores asociados a spam).` };
      }
    } catch {
      // url malformada — ignorar
    }
  }

  // 3. Exceso de enlaces (heurística anti-spam)
  const linkCount = (haystack.match(/https?:\/\//gi) ?? []).length;
  if (linkCount > 15) {
    return { blocked: true, reason: "Demasiados enlaces en el contenido (posible spam)." };
  }

  // 4. Título de baja calidad evidente
  if (input.title.trim().length < 4) {
    return { blocked: true, reason: "El título es demasiado corto." };
  }

  return { blocked: false };
}
