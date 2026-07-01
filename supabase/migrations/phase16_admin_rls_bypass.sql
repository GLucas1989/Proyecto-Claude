-- ═══════════════════════════════════════════════════════════════════════════
-- CREATORS S-HUB — FASE 16: Bypass de RLS para ADMIN en profiles/
-- creator_profiles/claim_requests
-- Ejecutar en: Supabase Dashboard > SQL Editor
--
-- BUG CRÍTICO ENCONTRADO EN AUDITORÍA DEL PANEL DE MODERACIÓN:
--   Las políticas actuales de estas 3 tablas son todas "auth.uid() = <owner>",
--   sin excepción para ADMIN. Como el panel de moderación actúa con la sesión
--   del propio admin (no un service role), toda escritura donde el admin
--   modifica la fila de OTRO usuario queda bloqueada en silencio por RLS
--   (0 filas afectadas, sin error) — el código nunca se entera de que no pasó
--   nada. Efecto real hoy en producción:
--     • "Marcar confianza" en Creadores de Confianza → is_trusted_creator
--       nunca cambia.
--     • Aprobar reclamo de perfil → claim_requests.status NUNCA se actualiza
--       (el reclamo reaparece tras recargar), y aunque se marcara, el
--       vínculo a creator_profiles y el is_official_creator del usuario
--       tampoco se escriben.
--     • Aprobar solicitud de monetización → monetization_requests.status SÍ
--       se actualiza (esa tabla ya tenía bypass admin), pero
--       profiles.can_monetize del usuario NUNCA se activa.
--   La UI no lo detecta porque Supabase no devuelve error en un UPDATE cuyo
--   WHERE (filtrado también por RLS) no matchea ninguna fila — simplemente
--   no actualiza nada y el código interpreta "sin error" como éxito.
--
-- FIX: agregar una política adicional "admin all" en cada tabla (se suman
-- con OR a las políticas existentes de dueño — no se pierde ningún acceso
-- previo). Se usa una función SECURITY DEFINER para evitar el problema de
-- recursión de una política de `profiles` que necesita leer `profiles`.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'
  );
$$;

drop policy if exists "profiles: admin all" on public.profiles;
create policy "profiles: admin all"
  on public.profiles for all
  using (public.is_admin());

drop policy if exists "creator_profiles: admin all" on public.creator_profiles;
create policy "creator_profiles: admin all"
  on public.creator_profiles for all
  using (public.is_admin());

drop policy if exists "claim_requests: admin all" on public.claim_requests;
create policy "claim_requests: admin all"
  on public.claim_requests for all
  using (public.is_admin());
