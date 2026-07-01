/**
 * Alias del webhook canónico de Lemon Squeezy.
 *
 * La lógica de procesamiento vive en `src/app/api/lemonsqueezy/webhook/route.ts`
 * (verificación HMAC + dispatcher por evento). Este archivo solo re-exporta el
 * mismo handler bajo el path `/api/webhooks/lemon-squeezy` para que el equipo
 * pueda registrar cualquiera de las dos URLs en el dashboard de Lemon Squeezy.
 *
 * Deliberadamente NO se duplica la lógica: dos endpoints procesando el mismo
 * evento de pago con código distinto es exactamente el tipo de bug que genera
 * pagos duplicados o inconsistentes.
 */
export { POST } from "@/app/api/lemonsqueezy/webhook/route";

// Next.js exige que la config de route segment sea estática por archivo
// (no se puede re-exportar) — se repite el mismo valor que el handler canónico.
export const runtime = "nodejs";
