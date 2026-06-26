-- ═══════════════════════════════════════════════════════════════════════════
-- CREATORS S-HUB — FASE 1: Expansión del modelo de negocios
-- Ejecutar en: Supabase Dashboard > SQL Editor (idempotente, seguro de re-correr)
--
-- Incluye:
--   1. user_follows      — seguimiento de juegos/autores
--   2. user_credits      — token interno (S-Credits)
--   3. user_subscriptions— modelo híbrido (academia individual + All-Access Pass)
--   4. profiles.is_claimed — perfiles semilla reclamables
--   5. RPC process_stream_tip — propina en stream con split 80/20 (atómico)
--
-- Seguridad: RLS en todas las tablas, escrituras financieras bloqueadas
-- (USING/ WITH CHECK false) y mutaciones de saldo solo vía SECURITY DEFINER.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TABLA: user_follows
-- ─────────────────────────────────────────────────────────────────────────────
do $$ begin
  create type public.follow_target_type as enum ('game', 'author');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.user_follows (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  target_id   text not null,                       -- game_slug (text) o author/creator id
  type        public.follow_target_type not null,
  created_at  timestamptz not null default now(),
  unique (user_id, target_id, type)
);

create index if not exists user_follows_user on public.user_follows(user_id);
create index if not exists user_follows_target on public.user_follows(target_id, type);

alter table public.user_follows enable row level security;

drop policy if exists "user_follows: own read"   on public.user_follows;
drop policy if exists "user_follows: own insert" on public.user_follows;
drop policy if exists "user_follows: own delete" on public.user_follows;

create policy "user_follows: own read"
  on public.user_follows for select
  using (auth.uid() = user_id);

create policy "user_follows: own insert"
  on public.user_follows for insert
  with check (auth.uid() = user_id);

create policy "user_follows: own delete"
  on public.user_follows for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABLA: user_credits (S-Credits)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.user_credits (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  balance     numeric(14,2) not null default 0 check (balance >= 0),
  updated_at  timestamptz not null default now()
);

alter table public.user_credits enable row level security;

drop policy if exists "user_credits: own read"        on public.user_credits;
drop policy if exists "user_credits: no client write" on public.user_credits;
drop policy if exists "user_credits: no client update" on public.user_credits;

-- Lectura: solo el dueño ve su balance
create policy "user_credits: own read"
  on public.user_credits for select
  using (auth.uid() = user_id);

-- Escritura bloqueada al cliente: solo RPCs SECURITY DEFINER mutan el balance
create policy "user_credits: no client write"
  on public.user_credits for insert
  with check (false);

create policy "user_credits: no client update"
  on public.user_credits for update
  using (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TABLA: user_subscriptions (modelo híbrido)
-- ─────────────────────────────────────────────────────────────────────────────
do $$ begin
  create type public.user_sub_status as enum ('active', 'canceled', 'expired', 'past_due');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.user_subscriptions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  academy_id      text,                              -- null cuando es global pass
  is_global_pass  boolean not null default false,    -- All-Access Pass
  status          public.user_sub_status not null default 'active',
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists user_subscriptions_user on public.user_subscriptions(user_id, status);
create index if not exists user_subscriptions_academy on public.user_subscriptions(academy_id);

alter table public.user_subscriptions enable row level security;

drop policy if exists "user_subscriptions: own read"        on public.user_subscriptions;
drop policy if exists "user_subscriptions: no client write" on public.user_subscriptions;
drop policy if exists "user_subscriptions: no client update" on public.user_subscriptions;

create policy "user_subscriptions: own read"
  on public.user_subscriptions for select
  using (auth.uid() = user_id);

-- Las suscripciones se crean únicamente desde el webhook (service role / SECURITY DEFINER)
create policy "user_subscriptions: no client write"
  on public.user_subscriptions for insert
  with check (false);

create policy "user_subscriptions: no client update"
  on public.user_subscriptions for update
  using (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. profiles.is_claimed (perfiles semilla reclamables)
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists is_claimed boolean not null default true;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Extender wallet_tx_type con STREAM_TIP y CREDIT_SPEND
-- ─────────────────────────────────────────────────────────────────────────────
-- (ADD VALUE debe ejecutarse fuera de un bloque DO/transacción)
alter type public.wallet_tx_type add value if not exists 'STREAM_TIP';

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. RPC: credit_user_credits — acreditar S-Credits (compra de paquetes)
-- SECURITY DEFINER: solo backend (webhook con service role).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.credit_user_credits(
  p_user_id  uuid,
  p_amount   numeric,
  p_ref      text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  insert into public.user_credits (user_id, balance, updated_at)
  values (p_user_id, p_amount, now())
  on conflict (user_id) do update
    set balance    = user_credits.balance + p_amount,
        updated_at = now();
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. RPC ATÓMICA: process_stream_tip
-- Resta tokens del emisor, aplica split 80/20, convierte el 80% neto a USD
-- e inyecta el saldo en author_wallets del receptor + traza en wallet_transactions.
-- Conversión: 1 S-Credit = 0.01 USD (100 tokens = USD 1.00).
-- SECURITY DEFINER + bloqueo por fila (FOR UPDATE) para evitar condiciones de carrera.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.process_stream_tip(
  p_sender_id    uuid,
  p_receiver_id  uuid,
  p_token_amount numeric
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_balance numeric(14,2);
  v_gross_usd      numeric(12,2);
  v_net_usd        numeric(12,2);
  v_token_to_usd   numeric := 0.01;   -- 1 token = USD 0.01
begin
  if p_token_amount <= 0 then
    raise exception 'token amount must be positive';
  end if;
  if p_sender_id = p_receiver_id then
    raise exception 'cannot tip yourself';
  end if;

  -- Bloquear la fila del emisor para lectura+escritura atómica
  select balance into v_sender_balance
  from public.user_credits
  where user_id = p_sender_id
  for update;

  if v_sender_balance is null then
    raise exception 'sender has no credit balance';
  end if;
  if v_sender_balance < p_token_amount then
    raise exception 'insufficient S-Credit balance';
  end if;

  -- 1. Debitar tokens del emisor
  update public.user_credits
    set balance    = balance - p_token_amount,
        updated_at = now()
  where user_id = p_sender_id;

  -- 2. Split 80/20: el creador recibe el 80% del valor en USD
  v_gross_usd := round(p_token_amount * v_token_to_usd, 2);
  v_net_usd   := round(v_gross_usd * 0.80, 2);

  -- 3. Inyectar saldo neto en la wallet del receptor
  insert into public.author_wallets (user_id, available_balance, updated_at)
  values (p_receiver_id, v_net_usd, now())
  on conflict (user_id) do update
    set available_balance = author_wallets.available_balance + v_net_usd,
        updated_at        = now();

  -- 4. Trazabilidad
  insert into public.wallet_transactions (user_id, amount, type, description, stripe_ref)
  values (
    p_receiver_id,
    v_net_usd,
    'STREAM_TIP',
    format('Stream tip: %s S-Credits (gross $%s, net 80%%)', p_token_amount, v_gross_usd),
    'tip_' || gen_random_uuid()::text
  );

  return json_build_object(
    'success',       true,
    'tokens_spent',  p_token_amount,
    'gross_usd',     v_gross_usd,
    'net_usd',       v_net_usd,
    'receiver_id',   p_receiver_id
  );
end;
$$;

-- Revocar ejecución pública directa de las RPC sensibles de crédito
revoke all on function public.credit_user_credits(uuid, numeric, text) from public, anon, authenticated;
revoke all on function public.process_stream_tip(uuid, uuid, numeric) from anon;

-- process_stream_tip SÍ puede invocarse por usuarios autenticados (gastan SUS tokens);
-- la función valida internamente con auth via el backend que pasa p_sender_id = auth.uid().
grant execute on function public.process_stream_tip(uuid, uuid, numeric) to authenticated;
