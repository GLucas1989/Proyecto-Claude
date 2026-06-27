-- ═══════════════════════════════════════════════════════════════════════════
-- CREATORS S-HUB — FASE 8: Niveles de creador + sistema de calificación
-- Ejecutar en: Supabase Dashboard > SQL Editor
--
-- Reconcilia el modelo de monetización existente (can_monetize / is_official_creator
-- / monetization_source) con la nomenclatura canónica solicitada y agrega el
-- sistema de ratings real (reemplaza el StarRating simulado).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. profiles: niveles canónicos ───────────────────────────────────────────
alter table public.profiles
  add column if not exists creator_tier text not null default 'user'
    check (creator_tier in ('user', 'verified', 'official'));

alter table public.profiles
  add column if not exists subscription_status text not null default 'free'
    check (subscription_status in ('free', 'pro_5', 'official_20'));

alter table public.profiles
  add column if not exists is_authorized_to_monetize boolean not null default false;

-- Backfill desde los campos existentes (compatibilidad con lo ya construido)
update public.profiles set
  creator_tier = case when is_official_creator then 'official'
                      when is_claimed = false then 'user'
                      else creator_tier end,
  subscription_status = case
    when monetization_source = 'fee_official' then 'official_20'
    when monetization_source = 'fee_standard' then 'pro_5'
    else subscription_status end,
  is_authorized_to_monetize = coalesce(can_monetize, false)
where true;

-- ── 2. user_publications: agregados de rating ────────────────────────────────
alter table public.user_publications
  add column if not exists average_rating numeric(3,2) not null default 0;

alter table public.user_publications
  add column if not exists ratings_count integer not null default 0;

-- ── 3. Tabla ratings (1-5 + comentario) ──────────────────────────────────────
create table if not exists public.ratings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  publication_id  uuid not null references public.user_publications(id) on delete cascade,
  score           integer not null check (score between 1 and 5),
  comment         text,
  verified_buyer  boolean not null default false,  -- futuro: peso mayor si compró/descargó
  created_at      timestamptz not null default now(),
  unique (user_id, publication_id)
);

create index if not exists ratings_publication on public.ratings(publication_id);

alter table public.ratings enable row level security;

drop policy if exists "ratings: public read"   on public.ratings;
drop policy if exists "ratings: own insert"     on public.ratings;
drop policy if exists "ratings: own update"     on public.ratings;
drop policy if exists "ratings: own delete"     on public.ratings;

-- Lectura pública (para mostrar reseñas y promedios)
create policy "ratings: public read"
  on public.ratings for select using (true);

-- Solo usuarios autenticados califican, una vez por publicación, como sí mismos.
-- No pueden calificar su propia guía.
create policy "ratings: own insert"
  on public.ratings for insert
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.user_publications p
      where p.id = publication_id and p.user_id = auth.uid()
    )
  );

create policy "ratings: own update"
  on public.ratings for update using (auth.uid() = user_id);

create policy "ratings: own delete"
  on public.ratings for delete using (auth.uid() = user_id);

-- ── 4. RPC: recalcular el promedio de una publicación ────────────────────────
-- SECURITY DEFINER: actualiza los agregados en user_publications de forma atómica.
create or replace function public.update_publication_rating(p_publication_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_avg numeric(3,2);
  v_cnt integer;
begin
  select coalesce(round(avg(score), 2), 0), count(*)
    into v_avg, v_cnt
  from public.ratings
  where publication_id = p_publication_id;

  update public.user_publications
    set average_rating = v_avg,
        ratings_count  = v_cnt
  where id = p_publication_id;
end;
$$;

grant execute on function public.update_publication_rating(uuid) to authenticated;
