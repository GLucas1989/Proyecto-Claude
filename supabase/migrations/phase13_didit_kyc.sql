-- ═══════════════════════════════════════════════════════════════════════════
-- CREATORS S-HUB — FASE 13: Integración real de KYC con Didit.me
-- Ejecutar en: Supabase Dashboard > SQL Editor
--
--   • kyc_session_id  → correlaciona la sesión de verificación creada en Didit
--                       con el webhook que confirma el resultado.
--   • kyc_status      → último estado recibido de Didit (Approved/Declined/etc).
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists kyc_session_id text;

alter table public.profiles
  add column if not exists kyc_status text;

create index if not exists profiles_kyc_session on public.profiles(kyc_session_id);
