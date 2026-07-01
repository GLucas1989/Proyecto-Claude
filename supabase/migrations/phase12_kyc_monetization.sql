-- ═══════════════════════════════════════════════════════════════════════════
-- CREATORS S-HUB — FASE 12: KYC, gate de monetización e idempotencia de pagos
-- Ejecutar en: Supabase Dashboard > SQL Editor
--
--   • is_verified          → identidad verificada (KYC), independiente de
--                            creator_tier (que verifica PROPIEDAD del canal).
--   • monetization_enabled → candado real de "puede recibir pagos". Un
--                            trigger BLOQUEA activarlo si is_verified = false.
--   • Idempotencia         → índice único parcial en wallet_transactions.stripe_ref
--                            evita duplicar créditos si Lemon Squeezy reintenta
--                            el webhook (at-least-once delivery).
--   • withdrawal_requests  → solicitudes de retiro (Lemon Squeezy es Merchant
--                            of Record: el payout a cada creador lo procesa el
--                            equipo/admin, no una API de "withdraw" per-creator).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. KYC + candado de monetización ─────────────────────────────────────────
alter table public.profiles
  add column if not exists is_verified boolean not null default false;

alter table public.profiles
  add column if not exists monetization_enabled boolean not null default false;

-- Marca de tiempo de la solicitud de KYC (placeholder hasta integrar un
-- proveedor real como Stripe Identity/Persona/Sumsub). Null = nunca solicitado.
alter table public.profiles
  add column if not exists kyc_requested_at timestamptz;

-- Trigger de blindaje: nadie puede quedar con monetization_enabled=true
-- si is_verified=false, sin importar qué código intente el update.
create or replace function public.enforce_monetization_requires_kyc()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.monetization_enabled = true and NEW.is_verified = false then
    raise exception 'monetization_enabled requires is_verified = true (KYC pendiente)';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_enforce_monetization_kyc on public.profiles;
create trigger trg_enforce_monetization_kyc
  before insert or update of monetization_enabled, is_verified
  on public.profiles
  for each row
  execute function public.enforce_monetization_requires_kyc();

-- ── 2. Idempotencia de wallet_transactions (evita pagos duplicados) ──────────
-- Índice único parcial: solo aplica cuando hay stripe_ref (créditos automáticos
-- de webhooks); los ajustes manuales sin ref (stripe_ref null) no colisionan.
create unique index if not exists wallet_transactions_stripe_ref_uniq
  on public.wallet_transactions(stripe_ref)
  where stripe_ref is not null;

-- credit_author_wallet ahora es idempotente: si el stripe_ref ya fue procesado,
-- no vuelve a acreditar (ON CONFLICT DO NOTHING) y devuelve false.
-- (el tipo de retorno cambia de void a boolean → hay que DROP antes de recrear)
drop function if exists public.credit_author_wallet(uuid, integer, text, text);

create or replace function public.credit_author_wallet(
  p_user_id      uuid,
  p_amount_cents integer,
  p_description  text,
  p_stripe_ref   text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amount_dollars numeric(12,2) := p_amount_cents::numeric / 100.0;
  v_inserted       boolean;
begin
  -- Registrar la transacción PRIMERO: si stripe_ref ya existe, no hacemos nada más.
  insert into public.wallet_transactions (user_id, amount, type, description, stripe_ref)
  values (p_user_id, v_amount_dollars, 'EARNING', p_description, p_stripe_ref)
  on conflict (stripe_ref) where stripe_ref is not null do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    -- Ya se había procesado este evento (reintento del webhook) → no duplicar.
    return false;
  end if;

  insert into public.author_wallets (user_id, available_balance, updated_at)
  values (p_user_id, v_amount_dollars, now())
  on conflict (user_id) do update
    set available_balance = author_wallets.available_balance + v_amount_dollars,
        updated_at        = now();

  return true;
end;
$$;

-- ── 3. Solicitudes de retiro ──────────────────────────────────────────────────
do $$ begin
  create type public.withdrawal_status as enum ('pending', 'processing', 'paid', 'rejected');
exception when duplicate_object then null;
end $$;

create table if not exists public.withdrawal_requests (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  amount_cents   integer not null check (amount_cents > 0),
  status         public.withdrawal_status not null default 'pending',
  payout_method  text,               -- ej: "paypal:user@mail.com", "bank:CBU..."
  admin_notes    text,
  created_at     timestamptz not null default now(),
  resolved_at    timestamptz
);

create index if not exists withdrawal_requests_status on public.withdrawal_requests(status, created_at);

alter table public.withdrawal_requests enable row level security;

drop policy if exists "withdrawals: own read"   on public.withdrawal_requests;
drop policy if exists "withdrawals: own insert" on public.withdrawal_requests;
drop policy if exists "withdrawals: admin all"  on public.withdrawal_requests;

create policy "withdrawals: own read"
  on public.withdrawal_requests for select
  using (auth.uid() = user_id);

create policy "withdrawals: own insert"
  on public.withdrawal_requests for insert
  with check (auth.uid() = user_id);

create policy "withdrawals: admin all"
  on public.withdrawal_requests for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'));

-- ── 4. RPC: solicitar retiro (descuenta el disponible, atómico) ──────────────
create or replace function public.request_withdrawal(
  p_user_id      uuid,
  p_amount_cents integer,
  p_payout_method text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance   numeric(12,2);
  v_amount    numeric(12,2) := p_amount_cents::numeric / 100.0;
  v_verified  boolean;
  v_enabled   boolean;
  v_req_id    uuid;
begin
  select is_verified, monetization_enabled into v_verified, v_enabled
  from public.profiles where id = p_user_id;

  if not coalesce(v_verified, false) or not coalesce(v_enabled, false) then
    raise exception 'monetización no habilitada o KYC pendiente';
  end if;

  select available_balance into v_balance
  from public.author_wallets where user_id = p_user_id
  for update;

  if v_balance is null or v_balance < v_amount then
    raise exception 'saldo insuficiente';
  end if;

  update public.author_wallets
    set available_balance = available_balance - v_amount,
        updated_at = now()
  where user_id = p_user_id;

  insert into public.withdrawal_requests (user_id, amount_cents, payout_method, status)
  values (p_user_id, p_amount_cents, p_payout_method, 'pending')
  returning id into v_req_id;

  insert into public.wallet_transactions (user_id, amount, type, description)
  values (p_user_id, -v_amount, 'WITHDRAWAL', 'Solicitud de retiro #' || v_req_id::text);

  return v_req_id;
end;
$$;

grant execute on function public.request_withdrawal(uuid, integer, text) to authenticated;
