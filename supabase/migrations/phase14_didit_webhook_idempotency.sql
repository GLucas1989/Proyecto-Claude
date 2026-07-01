-- ═══════════════════════════════════════════════════════════════════════════
-- CREATORS S-HUB — FASE 14: Idempotencia de webhooks de Didit por event_id
-- Ejecutar en: Supabase Dashboard > SQL Editor
--
--   Didit reintenta entregas (hasta 2 veces) ante 5xx/404. Cada entrega trae
--   un event_id único — esta tabla guarda los ya procesados para no repetir
--   efectos (p.ej. reabrir un review) ante reintentos legítimos.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.didit_webhook_events (
  event_id   text primary key,
  received_at timestamptz not null default now()
);

alter table public.didit_webhook_events enable row level security;

create policy "didit_webhook_events: no client access"
  on public.didit_webhook_events for all
  using (false)
  with check (false);
