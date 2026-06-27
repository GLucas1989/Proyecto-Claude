-- ═══════════════════════════════════════════════════════════════════════════
-- CREATORS S-HUB — FASE 6: Creadores de confianza (auto-publicación)
-- Ejecutar en: Supabase Dashboard > SQL Editor
--
-- Agrega un flag por perfil que permite al ADMIN designar creadores de confianza,
-- cuyas publicaciones se publican automáticamente sin pasar por moderación.
-- ═══════════════════════════════════════════════════════════════════════════

-- Columna: creador de confianza (auto-aprobación)
alter table public.profiles
  add column if not exists is_trusted_creator boolean not null default false;

-- (Opcional) índice para listar rápido los creadores de confianza en el panel admin
create index if not exists profiles_trusted on public.profiles(is_trusted_creator)
  where is_trusted_creator = true;
