-- ═══════════════════════════════════════════════════════════════════════════
-- CREATORS S-HUB — FASE 18: Dedupe de noticias por URL (ingesta automática RSS)
-- Ejecutar en: Supabase Dashboard > SQL Editor
--
-- El cron de sincronización de RSS (/api/cron/sync-news) hace upsert por url
-- para no insertar la misma noticia dos veces en cada corrida.
-- ═══════════════════════════════════════════════════════════════════════════

create unique index if not exists game_news_url_unique
  on public.game_news(url)
  where url is not null;
