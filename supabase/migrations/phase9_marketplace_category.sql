-- ═══════════════════════════════════════════════════════════════════════════
-- CREATORS S-HUB — FASE 9: Categoría de marketplace en publicaciones
-- Ejecutar en: Supabase Dashboard > SQL Editor
--
-- Permite clasificar cada publicación dentro de la taxonomía expandida del
-- marketplace (videojuegos competitivos, TCG, rol/mesa, cosmaking, backstage
-- eSports) y, para el backstage, el rol específico.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.user_publications
  add column if not exists marketplace_domain text;

alter table public.user_publications
  add column if not exists esports_role text;

create index if not exists user_publications_domain
  on public.user_publications(marketplace_domain);
