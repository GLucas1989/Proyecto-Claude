-- ═══════════════════════════════════════════════════════════════════════════
-- CREATORS S-HUB — FASE 10: Verificación de propiedad de canal (Challenge-Response)
-- Ejecutar en: Supabase Dashboard > SQL Editor
--
-- El usuario genera un código único (SHUB-XXXXXX), lo pega en la descripción/"About"
-- de su canal de YouTube, y el sistema verifica leyendo la página del canal.
-- ═══════════════════════════════════════════════════════════════════════════

do $$ begin
  create type public.verification_status as enum ('pending', 'verified', 'expired');
exception when duplicate_object then null;
end $$;

create table if not exists public.profile_verifications (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid not null references public.profiles(id) on delete cascade,
  creator_slug       text not null,
  game_slug          text,
  channel_url        text,
  verification_code  text not null unique,
  status             public.verification_status not null default 'pending',
  attempts           integer not null default 0,
  expires_at         timestamptz not null,
  created_at         timestamptz not null default now(),
  verified_at        timestamptz,
  unique (profile_id, creator_slug)
);

create index if not exists profile_verifications_code on public.profile_verifications(verification_code);

alter table public.profile_verifications enable row level security;

drop policy if exists "verif: own read"   on public.profile_verifications;
drop policy if exists "verif: own write"   on public.profile_verifications;
drop policy if exists "verif: own update"  on public.profile_verifications;

-- El usuario solo ve y gestiona sus propias solicitudes de verificación
create policy "verif: own read"
  on public.profile_verifications for select
  using (auth.uid() = profile_id);

create policy "verif: own write"
  on public.profile_verifications for insert
  with check (auth.uid() = profile_id);

create policy "verif: own update"
  on public.profile_verifications for update
  using (auth.uid() = profile_id);
