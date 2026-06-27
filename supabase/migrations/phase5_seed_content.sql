-- ═══════════════════════════════════════════════════════════════════════════
-- CREATORS S-HUB — FASE 5: Semillas de contenido (Growth Hack)
-- Ejecutar en: Supabase Dashboard > SQL Editor
--
-- Inserta perfiles semilla (is_claimed = false) con guías multimedia demo de
-- alta calidad para títulos críticos de la escena regional, y saldos ficticios
-- en sus billeteras listos para activar la estrategia de reclamación:
-- un creador real ve "tenés $X esperando" y reclama su perfil.
--
-- Idempotente: usa emails semilla determinísticos; re-correr no duplica.
-- ═══════════════════════════════════════════════════════════════════════════

-- crypt()/gen_salt() para el password aleatorio de los usuarios semilla
create extension if not exists pgcrypto;

do $$
declare
  v_user_id   uuid;
  v_pub_id    uuid;
  v_seed      record;
  -- Definición de los creadores semilla
  v_seeds     jsonb := '[
    {
      "email": "seed+jackfyah@creatorsshub.gg",
      "name": "Jackfyah (semilla)",
      "slug": "jackfyah",
      "game": "wild-rift",
      "wallet": 184.50,
      "pub_title": "Economía Avanzada y Macro en Wild Rift: Cómo cerrar partidas en 18 minutos",
      "pub_premium": true
    },
    {
      "email": "seed+ragnarokx-pvp@creatorsshub.gg",
      "name": "ROX Strategist (semilla)",
      "slug": "rox-strategist",
      "game": "ragnarok-x",
      "wallet": 142.00,
      "pub_title": "Ragnarok X: Next Generation — Guía definitiva de PvP y builds de farmeo zeny",
      "pub_premium": true
    },
    {
      "email": "seed+diablo-immortal@creatorsshub.gg",
      "name": "Sanctuary Codex (semilla)",
      "slug": "sanctuary-codex",
      "game": "diablo-immortal",
      "wallet": 97.25,
      "pub_title": "Diablo Immortal: Optimización de Paragon, Helliquary y rotaciones de boss",
      "pub_premium": true
    }
  ]'::jsonb;
begin
  for v_seed in select * from jsonb_array_elements(v_seeds) as s(data)
  loop
    -- 1. Reutilizar o crear el usuario semilla en auth.users
    select id into v_user_id from auth.users
      where email = (v_seed.data->>'email');

    if v_user_id is null then
      v_user_id := gen_random_uuid();
      insert into auth.users (
        id, instance_id, aud, role, email,
        encrypted_password, email_confirmed_at,
        created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data
      ) values (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated',
        (v_seed.data->>'email'),
        crypt(gen_random_uuid()::text, gen_salt('bf')),  -- password aleatorio inutilizable
        now(), now(), now(),
        '{"provider":"seed","providers":["seed"]}'::jsonb,
        jsonb_build_object('display_name', v_seed.data->>'name', 'seed', true)
      );
    end if;

    -- 2. Perfil reclamable (is_claimed = false)
    insert into public.profiles (id, email, display_name, role, is_claimed)
    values (
      v_user_id,
      (v_seed.data->>'email'),
      (v_seed.data->>'name'),
      'CREATOR',
      false
    )
    on conflict (id) do update
      set display_name = excluded.display_name,
          is_claimed   = false,
          role         = 'CREATOR';

    -- 3. Perfil de creador en el directorio
    insert into public.creator_profiles (slug, user_id, game_slug, verified)
    values (
      (v_seed.data->>'slug'),
      v_user_id,
      (v_seed.data->>'game'),
      false
    )
    on conflict (slug) do update
      set user_id   = excluded.user_id,
          game_slug = excluded.game_slug;

    -- 4. Guía demo premium publicada
    select id into v_pub_id from public.user_publications
      where user_id = v_user_id and title = (v_seed.data->>'pub_title');

    if v_pub_id is null then
      insert into public.user_publications (
        user_id, game_slug, title, content_markdown,
        status, type, attachments_urls, is_premium, views_count, published_at
      ) values (
        v_user_id,
        (v_seed.data->>'game'),
        (v_seed.data->>'pub_title'),
        E'# ' || (v_seed.data->>'pub_title') || E'\n\n' ||
          E'> Guía demo de muestra — contenido semilla de Creators S-HUB.\n\n' ||
          E'## Introducción\n\nEsta academia cubre los fundamentos competitivos del título, ' ||
          E'desde la economía temprana hasta las rotaciones de objetivo en late game.\n\n' ||
          E'## 1. Economía y tempo\n\n- Control de oleadas y timing de recall.\n' ||
          E'- Prioridad de objetivos neutrales.\n- Gestión de recursos por rol.\n\n' ||
          E'## 2. Macro y visión\n\nMapa de control de visión por fase de partida y ' ||
          E'cómo convertir ventajas en cierres rápidos.\n\n' ||
          E'## 3. Builds y rotaciones\n\nBuilds optimizadas por parche y árboles de decisión.\n\n' ||
          E'_Reclamá este perfil para editar y monetizar este contenido._',
        'PUBLISHED',
        'GUIDE',
        array[]::text[],
        (v_seed.data->>'pub_premium')::boolean,
        floor(random() * 4000 + 500)::int,
        now()
      );
    end if;

    -- 5. Billetera con saldo ficticio (gancho de reclamación) + traza
    insert into public.author_wallets (user_id, available_balance, updated_at)
    values (v_user_id, (v_seed.data->>'wallet')::numeric, now())
    on conflict (user_id) do update
      set available_balance = (v_seed.data->>'wallet')::numeric,
          updated_at        = now();

    insert into public.wallet_transactions (user_id, amount, type, description, stripe_ref)
    select v_user_id, (v_seed.data->>'wallet')::numeric, 'EARNING',
           'Saldo semilla acumulado — reclamá tu perfil para retirarlo', 'seed_balance'
    where not exists (
      select 1 from public.wallet_transactions
      where user_id = v_user_id and stripe_ref = 'seed_balance'
    );

  end loop;
end $$;

-- Verificación rápida
select p.display_name, p.is_claimed, cp.slug, cp.game_slug, w.available_balance
from public.profiles p
join public.creator_profiles cp on cp.user_id = p.id
left join public.author_wallets w on w.user_id = p.id
where p.is_claimed = false
order by w.available_balance desc nulls last;
