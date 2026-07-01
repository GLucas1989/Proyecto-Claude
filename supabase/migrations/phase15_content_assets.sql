-- ═══════════════════════════════════════════════════════════════════════════
-- CREATORS S-HUB — FASE 15: Video privado/exclusivo (Mux) — content_assets
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.content_assets (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  game_slug         text,
  title             text not null,
  description       text,
  -- Identificadores de Mux: mux_upload_id correlaciona el "direct upload" con
  -- el webhook que confirma que el video terminó de procesarse; video_id y
  -- playback_id se completan recién en ese momento (status -> 'ready').
  mux_upload_id     text unique,
  video_id          text,
  playback_id       text,
  is_exclusive      boolean not null default false,
  tags              text[] not null default '{}',
  status            text not null default 'processing' check (status in ('processing', 'ready', 'errored')),
  thumbnail_url     text,
  duration_seconds  numeric,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists content_assets_user_idx on public.content_assets(user_id);
create index if not exists content_assets_game_idx on public.content_assets(game_slug);
create index if not exists content_assets_status_idx on public.content_assets(status);

alter table public.content_assets enable row level security;

-- Lectura pública de contenido listo (el gate de "solo miembros" para
-- is_exclusive se aplica en la app, no acá — el playback_id firmado ya
-- requiere sesión para poder pedirse, ver /api/mux/playback-token).
create policy "content_assets: read ready"
  on public.content_assets for select
  using (status = 'ready' or auth.uid() = user_id);

-- Solo el dueño puede crear su propia fila (el resto de los campos de Mux
-- los completa el webhook vía service role, no el cliente).
create policy "content_assets: owner insert"
  on public.content_assets for insert
  with check (auth.uid() = user_id);

-- Nada de updates/deletes desde el cliente — el webhook de Mux (service role)
-- es el único que transiciona status/video_id/playback_id.
create policy "content_assets: no client update"
  on public.content_assets for update
  using (false);

create policy "content_assets: no client delete"
  on public.content_assets for delete
  using (false);
