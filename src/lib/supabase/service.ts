import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase con SERVICE ROLE — bypassa RLS.
 *
 * Uso EXCLUSIVO en webhooks/route handlers de confianza (Lemon Squeezy, Didit)
 * donde no hay sesión de usuario (auth.uid() = null) pero el servidor necesita
 * escribir en tablas protegidas por RLS `using (auth.uid() = id)` — por ejemplo
 * `profiles`. Sin esto, esos updates fallan silenciosamente y el estado nunca
 * se persiste (bug real detectado: el webhook de Lemon Squeezy actualiza
 * `profiles` con el cliente anon-key y esas escrituras son bloqueadas por RLS).
 *
 * NUNCA importar este archivo desde código que corre en el browser ni
 * exponer SUPABASE_SERVICE_ROLE_KEY fuera del servidor.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "createServiceClient: faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
