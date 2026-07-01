-- ═══════════════════════════════════════════════════════════════════════════
-- CREATORS S-HUB — FASE 11: Ranking / reputación de creadores
-- Ejecutar en: Supabase Dashboard > SQL Editor
--
-- La "tabla de creadores" real es public.creator_profiles. Agregamos reputación
-- calculada a partir de señales reales:
--   reputation_points = round(total_views*0.1 + followers*0.5 + community_votes*2)
--     • total_views      = suma de views_count de las publicaciones del creador
--     • followers        = seguidores en user_follows (type='author', target = slug)
--     • community_votes  = upvotes netos de sus publicaciones
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.creator_profiles
  add column if not exists reputation_points integer not null default 0;

alter table public.creator_profiles
  add column if not exists rank_tier text not null default 'Bronce';

-- Índice para leaderboards eficientes (orden desc, filtrado por juego)
create index if not exists creator_profiles_reputation
  on public.creator_profiles(game_slug, reputation_points desc);

-- Deriva el tier a partir de los puntos
create or replace function public.creator_rank_tier(p_points integer)
returns text
language sql
immutable
as $$
  select case
    when p_points >= 20000 then 'Diamante'
    when p_points >=  8000 then 'Platino'
    when p_points >=  2000 then 'Oro'
    when p_points >=   500 then 'Plata'
    else 'Bronce'
  end;
$$;

-- ── RPC: recalcular la reputación de UN creador ──────────────────────────────
create or replace function public.recompute_creator_reputation(p_creator_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug     text;
  v_user_id  uuid;
  v_views    bigint := 0;
  v_followers bigint := 0;
  v_votes    bigint := 0;
  v_points   integer;
begin
  select slug, user_id into v_slug, v_user_id
  from public.creator_profiles where id = p_creator_id;
  if v_slug is null then return 0; end if;

  -- total_views + community_votes (solo si el perfil está vinculado a un usuario)
  if v_user_id is not null then
    select coalesce(sum(views_count), 0) into v_views
    from public.user_publications where user_id = v_user_id;

    select coalesce(sum(case when pv.vote_type = 'UPVOTE' then 1 else -1 end), 0) into v_votes
    from public.publication_votes pv
    join public.user_publications up on up.id = pv.publication_id
    where up.user_id = v_user_id;
  end if;

  -- followers (funciona para cualquier creador: el follow usa el slug/id)
  select count(*) into v_followers
  from public.user_follows
  where type = 'author' and target_id = v_slug;

  v_points := greatest(0, round(v_views * 0.1 + v_followers * 0.5 + v_votes * 2)::int);

  update public.creator_profiles
    set reputation_points = v_points,
        rank_tier = public.creator_rank_tier(v_points)
  where id = p_creator_id;

  return v_points;
end;
$$;

-- ── RPC: recalcular TODOS (para el job diario) ───────────────────────────────
create or replace function public.recompute_all_creator_reputation()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  n integer := 0;
begin
  for r in select id from public.creator_profiles loop
    perform public.recompute_creator_reputation(r.id);
    n := n + 1;
  end loop;
  return n;
end;
$$;

grant execute on function public.recompute_creator_reputation(uuid) to authenticated;
grant execute on function public.recompute_all_creator_reputation() to authenticated;
