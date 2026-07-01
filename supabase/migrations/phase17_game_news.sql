-- ═══════════════════════════════════════════════════════════════════════════
-- CREATORS S-HUB — FASE 17: Feed de noticias por juego (game_news)
-- Ejecutar en: Supabase Dashboard > SQL Editor
--
-- Nota: esta migración solo crea el almacenamiento + permisos. La ingesta
-- automática (traer noticias reales desde alguna fuente externa) NO está
-- incluida — no se especificó una fuente/API para eso. Hoy la carga de
-- noticias es manual (INSERT por SQL o, si más adelante se pide, un panel
-- admin). Ver aclaración completa en el mensaje de esta tarea.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.game_news (
  id            uuid primary key default gen_random_uuid(),
  game_slug     text not null,
  category      text not null check (category in ('main_events', 'regional_grinding', 'patch_notes')),
  title         text not null,
  summary       text,
  url           text,
  published_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists game_news_game_idx on public.game_news(game_slug, published_at desc);
create index if not exists game_news_category_idx on public.game_news(category);

alter table public.game_news enable row level security;

create policy "game_news: public read"
  on public.game_news for select
  using (true);

-- Reutiliza la función is_admin() creada en phase16_admin_rls_bypass.sql
create policy "game_news: admin write"
  on public.game_news for insert
  with check (public.is_admin());

create policy "game_news: admin update"
  on public.game_news for update
  using (public.is_admin());

create policy "game_news: admin delete"
  on public.game_news for delete
  using (public.is_admin());
