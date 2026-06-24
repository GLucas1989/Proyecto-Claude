-- ═══════════════════════════════════════════════════════
-- CREATORS S-HUB — Schema completo
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- TIPOS ENUM
-- ─────────────────────────────────────────
create type user_role             as enum ('USER', 'CREATOR', 'ADMIN');
create type claim_status          as enum ('pending', 'approved', 'rejected');
create type subscription_status   as enum ('active', 'canceled', 'past_due', 'trialing', 'incomplete');
create type platform_content_type as enum ('pdf', 'ppt', 'audio', 'video');
create type game_subscription_status as enum ('active', 'canceled', 'past_due', 'trialing');
create type ad_placement          as enum (
  'home_between_games',
  'game_page_top',
  'creator_page_sidebar',
  'global_banner'
);

-- ─────────────────────────────────────────
-- MÓDULO 1: Perfiles y roles
-- ─────────────────────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text unique not null,
  display_name text,
  avatar_url   text,
  role         user_role not null default 'USER',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.creator_profiles (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  user_id             uuid references public.profiles(id) on delete set null,
  game_slug           text not null,
  channel_id_youtube  text,
  channel_id_twitch   text,
  verified            boolean not null default false,
  verified_at         timestamptz,
  verified_method     text,
  stripe_account_id   text,
  revenue_split       numeric(4,2) not null default 0.40,
  created_at          timestamptz not null default now()
);

create table public.claim_requests (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  creator_slug      text not null,
  game_slug         text not null,
  status            claim_status not null default 'pending',
  verification_code text,
  oauth_token       text,
  admin_notes       text,
  created_at        timestamptz not null default now(),
  resolved_at       timestamptz
);

-- ─────────────────────────────────────────
-- MÓDULO 2: Suscripciones a creadores
-- ─────────────────────────────────────────
create table public.subscription_plans (
  id              uuid primary key default gen_random_uuid(),
  creator_id      uuid not null references public.creator_profiles(id) on delete cascade,
  name            text not null,
  price_cents     int not null,
  currency        text not null default 'usd',
  stripe_price_id text unique,
  features        jsonb not null default '[]',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table public.subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  subscriber_id         uuid not null references public.profiles(id) on delete cascade,
  creator_id            uuid not null references public.creator_profiles(id) on delete cascade,
  plan_id               uuid not null references public.subscription_plans(id),
  stripe_subscription_id text unique,
  status                subscription_status not null default 'incomplete',
  platform_fee_pct      numeric(4,2) not null,
  is_collab_content     boolean not null default false,
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  canceled_at           timestamptz,
  created_at            timestamptz not null default now(),
  unique(subscriber_id, creator_id)
);

create table public.payment_events (
  id                   uuid primary key default gen_random_uuid(),
  subscription_id      uuid references public.subscriptions(id),
  stripe_event_id      text unique not null,
  event_type           text not null,
  amount_cents         int,
  creator_payout_cents int,
  platform_fee_cents   int,
  payload              jsonb,
  created_at           timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- MÓDULO 5: Suscripciones por juego (plataforma)
-- ─────────────────────────────────────────

-- Configuración de precios por juego (gestionado por ADMIN)
create table public.game_subscription_plans (
  id              uuid primary key default gen_random_uuid(),
  game_slug       text unique not null,
  price_cents     int not null default 499,     -- USD 4.99 / mes
  currency        text not null default 'usd',
  stripe_price_id text unique,                  -- precio en Stripe (100% plataforma)
  features        jsonb not null default '[]',  -- lista de beneficios mostrados en UI
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- Suscripciones activas de usuarios a juegos
create table public.game_subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references public.profiles(id) on delete cascade,
  game_slug              text not null,
  status                 game_subscription_status not null default 'trialing',
  stripe_subscription_id text unique,
  stripe_customer_id     text,
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  canceled_at            timestamptz,
  created_at             timestamptz not null default now(),
  unique(user_id, game_slug)
);

-- Contenido exclusivo por juego (alojado en Supabase Storage)
create table public.platform_content (
  id                uuid primary key default gen_random_uuid(),
  game_slug         text not null,
  type              platform_content_type not null,
  title             text not null,
  description       text,
  file_url          text not null,              -- signed URL o path en Storage
  thumbnail_url     text,
  duration_seconds  int,                        -- para audio/video
  file_size_bytes   bigint,
  sort_order        int not null default 0,
  is_published      boolean not null default false,
  created_at        timestamptz not null default now()
);

-- Historial de pagos de game subscriptions (100% plataforma)
create table public.game_payment_events (
  id                   uuid primary key default gen_random_uuid(),
  game_subscription_id uuid references public.game_subscriptions(id),
  stripe_event_id      text unique not null,
  event_type           text not null,
  amount_cents         int,
  payload              jsonb,
  created_at           timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- MÓDULO 4: Ads nativos
-- ─────────────────────────────────────────
create table public.native_ads (
  id         uuid primary key default gen_random_uuid(),
  brand_name text not null,
  logo_url   text,
  headline   text not null,
  body_text  text,
  cta_label  text not null default 'Ver más',
  cta_url    text not null,
  placement  ad_placement not null,
  game_slug  text,
  is_active  boolean not null default true,
  starts_at  timestamptz,
  ends_at    timestamptz,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
alter table public.profiles              enable row level security;
alter table public.creator_profiles      enable row level security;
alter table public.claim_requests        enable row level security;
alter table public.subscriptions         enable row level security;
alter table public.game_subscriptions    enable row level security;
alter table public.platform_content      enable row level security;
alter table public.game_subscription_plans enable row level security;
alter table public.native_ads            enable row level security;

-- profiles: cada usuario lee/edita solo el suyo
create policy "profiles: own row"
  on public.profiles for all
  using (auth.uid() = id);

-- creator_profiles: lectura pública, edición solo del dueño
create policy "creator_profiles: public read"
  on public.creator_profiles for select
  using (true);

create policy "creator_profiles: owner update"
  on public.creator_profiles for update
  using (auth.uid() = user_id);

-- claim_requests: solo el solicitante ve las suyas
create policy "claim_requests: own rows"
  on public.claim_requests for all
  using (auth.uid() = user_id);

-- subscriptions: suscriptor ve las suyas
create policy "subscriptions: own rows"
  on public.subscriptions for select
  using (auth.uid() = subscriber_id);

-- game_subscriptions: usuario ve las suyas
create policy "game_subscriptions: own rows"
  on public.game_subscriptions for all
  using (auth.uid() = user_id);

-- platform_content: solo visible para suscriptores activos del juego
create policy "platform_content: subscribers only"
  on public.platform_content for select
  using (
    is_published = true
    and exists (
      select 1 from public.game_subscriptions gs
      where gs.user_id = auth.uid()
        and gs.game_slug = platform_content.game_slug
        and gs.status = 'active'
    )
  );

-- game_subscription_plans: lectura pública (para mostrar precio en UI)
create policy "game_subscription_plans: public read"
  on public.game_subscription_plans for select
  using (is_active = true);

-- native_ads: lectura pública
create policy "native_ads: public read"
  on public.native_ads for select
  using (is_active = true);

-- ─────────────────────────────────────────
-- DATOS INICIALES: planes por juego
-- ─────────────────────────────────────────
insert into public.game_subscription_plans (game_slug, price_cents, features) values
  ('mtg-arena',           499, '["Master guides PDF", "Mazo meta actualizado", "Video análisis semanal", "Audioguía de formatos"]'),
  ('wild-rift',           499, '["Tier list mensual PDF", "Guías por rol", "Video sesiones ranked", "Análisis de parches"]'),
  ('league-of-legends',   499, '["Tier list mensual PDF", "Guías por rol", "Video sesiones ranked", "Análisis de parches"]'),
  ('diablo-iv',           499, '["Build guides PDF", "Season roadmap PPT", "Video speedrun guides", "Audioguía de historia"]'),
  ('diablo-immortal',     499, '["Build guides PDF", "PvP strategy PPT", "Video tier list", "Audioguía de eventos"]'),
  ('raid-shadow-legends', 499, '["Champion tier list PDF", "Team building PPT", "Video dungeon guides", "Audioguía de facciones"]'),
  ('albion-online',       499, '["Economy guide PDF", "Build meta PPT", "Video territory wars", "Audioguía de crafting"]'),
  ('dark-and-darker',     499, '["Class guides PDF", "Dungeon maps PPT", "Video extract strategies", "Audioguía de items"]'),
  ('beyond-all-reason',   499, '["Economy build orders PDF", "Map control PPT", "Video replays pro", "Audioguía de unidades"]'),
  ('multigenero',         799, '["Acceso a TODOS los juegos", "Contenido multiplataforma", "Videos exclusivos", "Biblioteca completa"]');
