-- ═══════════════════════════════════════════════════════════════════════════
-- CREATORS S-HUB — FASE 7: Reglas de monetización y publicación
-- Ejecutar en: Supabase Dashboard > SQL Editor
--
-- Modelo:
--   • Contenido GRATUITO  → se publica sin revisión (auto-publish), con calificación pública.
--   • Contenido MONETIZABLE → siempre pasa por revisión Y requiere habilitar monetización:
--       - Usuario normal:      tarifa mensual USD 5  (monetization_source = 'fee_standard')
--       - Creador oficial:     autorización admin (gratis) o tarifa mensual USD 20 ('fee_official')
--
-- can_monetize es el "candado" efectivo: sin él, no se puede ENVIAR contenido premium.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Candado de monetización en el perfil
alter table public.profiles
  add column if not exists can_monetize boolean not null default false;

-- Cómo se otorgó: 'admin' | 'fee_standard' | 'fee_official' | null
alter table public.profiles
  add column if not exists monetization_source text;

-- 2. ¿Es creador oficial? (canal listado / perfil reclamado y verificado)
--    Se marca al verificar el claim; el admin también puede setearlo.
alter table public.profiles
  add column if not exists is_official_creator boolean not null default false;

-- 3. Solicitudes de autorización de monetización (para creadores oficiales)
do $$ begin
  create type public.monetization_req_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

create table if not exists public.monetization_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  note        text,
  status      public.monetization_req_status not null default 'pending',
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  unique (user_id, status)
);

create index if not exists monetization_requests_status
  on public.monetization_requests(status, created_at);

alter table public.monetization_requests enable row level security;

drop policy if exists "monet_req: own read"   on public.monetization_requests;
drop policy if exists "monet_req: own insert" on public.monetization_requests;
drop policy if exists "monet_req: admin all"  on public.monetization_requests;

-- El usuario ve y crea sus propias solicitudes
create policy "monet_req: own read"
  on public.monetization_requests for select
  using (auth.uid() = user_id);

create policy "monet_req: own insert"
  on public.monetization_requests for insert
  with check (auth.uid() = user_id);

-- El ADMIN gestiona todas
create policy "monet_req: admin all"
  on public.monetization_requests for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
  );
