/**
 * Punto de entrada canónico del SDK de Lemon Squeezy.
 *
 * La configuración real (API key, store id, variant ids, webhook secret) vive
 * en `src/lib/lemonsqueezy/client.ts` — este archivo la re-exporta bajo el
 * path esperado por el resto del sistema de pagos para tener una única fuente
 * de verdad (evita divergencia entre dos configuraciones del SDK).
 *
 * Reglas de seguridad:
 *   - Ninguna clave se hardcodea: todo sale de variables de entorno.
 *   - LEMONSQUEEZY_API_KEY y LEMONSQUEEZY_WEBHOOK_SECRET nunca se exponen al cliente
 *     (solo se usan en Server Actions / Route Handlers).
 */
export {
  setupLemonSqueezy,
  LS_STORE_ID,
  LS_VARIANTS,
  LS_WEBHOOK_SECRET,
} from "@/lib/lemonsqueezy/client";
