/**
 * Validación de hashtags promocionales — compartida entre formularios de
 * cliente y server actions (defensa en profundidad: la UI ya impide sacar
 * el hashtag, pero cualquier llamada directa a la action también se valida).
 */
export const REQUIRED_PROMO_HASHTAG = "#CreatorsSHUB";

export interface HashtagValidationResult {
  ok: boolean;
  error?: string;
}

export function validateHashtags(tags: string[]): HashtagValidationResult {
  const hasRequired = tags.some(
    (t) => t.trim().toLowerCase() === REQUIRED_PROMO_HASHTAG.toLowerCase()
  );
  if (!hasRequired) {
    return {
      ok: false,
      error: `Incluí el hashtag ${REQUIRED_PROMO_HASHTAG} para asegurar la promoción de la plataforma.`,
    };
  }
  return { ok: true };
}
