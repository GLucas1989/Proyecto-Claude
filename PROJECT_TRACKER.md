# 🎮 Creators S-HUB — Tablero de Proyecto

> Documento maestro de seguimiento. Copiá/importá este archivo en Notion
> (Notion soporta Markdown nativo: headings, checkboxes y tablas se convierten solos).
> Última actualización: 2026-06-27

---

## ⚠️ PENDIENTE DE REVISIÓN DEL CEO

- [ ] **Auto-aprobación de contenido premium (verified/official)** — `submitForReview`
  ahora publica el contenido monetizable de creadores verified/official **sin pasar
  por la cola de moderación**. Esto contradice la regla previa ("todo lo monetizable
  se revisa"). **Decisión a tomar:** ¿dejarlo así (menos fricción, menos control),
  auto-aprobar solo `official` y revisar `verified`, o volver a revisión para ambos?
  Archivo: `src/app/actions/ugc.ts`.

- [ ] **Configurar Vercel Cron para el ranking de creadores** — falta:
  1. Agregar env var `CRON_SECRET` (elegir un string secreto)
  2. Vercel → Settings → Cron Jobs → path `/api/cron/recompute-reputation`,
     schedule sugerido `17 3 * * *` (diario 3:17 AM)
  3. Alternativa: pedirle a Claude que genere `vercel.json` con el cron ya
     configurado (más simple, evita configurarlo a mano en el dashboard)
  Archivo: `src/app/api/cron/recompute-reputation/route.ts`.

- [x] **KYC real (Didit.me)** — `startKycVerification` ahora crea una sesión real
  en Didit (`POST /v3/session/`, workflow "Free KYC" con id
  `934590b3-3496-4e60-b31d-e359bfd6dbdd`, hardcodeado en `src/lib/didit.ts` porque
  no es secreto) y redirige al usuario al flujo hospedado. El resultado llega
  por webhook (`/api/webhooks/didit`, firma `X-Signature-V2` HMAC verificada
  con canonicalización JSON + chequeo de frescura de `X-Timestamp`) y actualiza
  `profiles.is_verified` automáticamente. **Pendiente para activarlo:**
  1. Correr la migración `supabase/migrations/phase13_didit_kyc.sql`.
  2. Cargar en Vercel: `DIDIT_API_KEY`, `DIDIT_WEBHOOK_SECRET`
     (y `SUPABASE_SERVICE_ROLE_KEY`, ver ítem de abajo).
  3. Registrar en el panel de Didit el webhook URL: `/api/webhooks/didit`.
  Archivos: `src/lib/didit.ts`, `src/app/api/webhooks/didit/route.ts`, `src/app/actions/payments.ts`.

- [x] **Bug de RLS en webhooks (crítico, detectado y corregido)** — los webhooks
  de Lemon Squeezy y Didit escriben en `profiles`/`user_subscriptions` usando
  ahora un cliente **service role** (`src/lib/supabase/service.ts`). Antes usaban
  el cliente anon (con sesión de cookies), que bajo RLS tiene `auth.uid() = null`
  en un webhook — las políticas `profiles: own row` y
  `user_subscriptions: no client write` bloqueaban esas escrituras **en silencio**.
  Esto significa que el All-Access Pass y las actualizaciones de `can_monetize`/
  `is_official_creator` vía webhook probablemente nunca funcionaron hasta ahora.
  **Acción requerida:** confirmar que `SUPABASE_SERVICE_ROLE_KEY` esté cargada
  en Vercel (Project Settings > API > service_role — nunca commitear este valor).
- [ ] **Panel admin de retiros** — no se construyó una UI para que el admin vea
  y procese `withdrawal_requests` (marcar como `paid`/`rejected`). Hoy solo se
  puede gestionar por SQL directo. Evaluar si conviene agregarla al panel de
  moderación existente.

---

## 📊 Estado general

| Área | Estado | Notas |
|------|--------|-------|
| Frontend (Next.js 16 + Tailwind v4) | 🟢 Operativo | Deploy en Vercel |
| Base de datos (Supabase/PostgreSQL) | 🟡 Migraciones parciales | Faltan correr Fase 5 y storage en prod |
| Pagos (Lemon Squeezy) | 🟡 Código listo | Faltan productos + env vars |
| Auth (Google/Twitch/Discord) | 🟡 En config | Ajustar Site URL en Supabase |
| Email transaccional | 🟡 Código listo | Falta RESEND_API_KEY |

---

## ✅ Tareas realizadas

### Infraestructura y catálogo
- [x] Migración de pagos de Stripe → Lemon Squeezy (Argentina)
- [x] Login con Discord agregado (junto a Google/YouTube y Twitch)
- [x] Categoría **Valorant** con 7 creadores reales (datos verificados vía YouTube API)
- [x] Categoría **Sim Racing** con 6 creadores reales
- [x] Banners de marca para Valorant (rojo #FF4655) y Sim Racing (bandera a cuadros)
- [x] Corrección de datos: Ibai movido a multigénero, Bren VALORANT agregado

### Fase 1 — Base de datos (modelo de negocio)
- [x] Tabla `user_follows` (seguir juegos/autores) con RLS
- [x] Tabla `user_credits` (S-Credits) — escrituras bloqueadas al cliente
- [x] Tabla `user_subscriptions` (academia individual + All-Access Pass)
- [x] Columna `profiles.is_claimed` (perfiles reclamables)
- [x] RPC `process_stream_tip` (split 80/20, atómico, SECURITY DEFINER)
- [x] RPC `credit_user_credits` (compra de paquetes de tokens)

### Fase 2 — Backend, paywalls y webhooks
- [x] Cliente de email provider-agnóstico (Resend/MailerLite)
- [x] Brecha-09: emails automáticos al aprobar/rechazar guías UGC
- [x] Webhook Lemon Squeezy ampliado: UGC_PURCHASE (60/40 PWYW), S_CREDIT_BULK, ALL_ACCESS_PASS
- [x] Brecha-07: paywall de academia con All-Access Pass + suscripción individual

### Fase 3 — Contenido y multimedia
- [x] Taxonomía marketplace: TCG, rol/mesa, cosmaking, backstage eSports
- [x] Capa media agnóstica (YouTube Unlisted → preparada para Cloudflare/Vimeo)
- [x] Soporte de carga de audio-guías (MP3/M4A/WAV/OGG)
- [x] Anti-piratería: marca de agua dinámica con email cifrado del comprador

### Fase 4 — Frontend
- [x] Home feed personalizado según seguimientos del usuario
- [x] Brecha-08: Dashboard con toggle Modo Alumno / Modo Creador
- [x] Widget OBS `/overlays/alerts/[creatorId]` (realtime + polling)

### Fase 5 — Semillas
- [x] Script de perfiles semilla reclamables (Wild Rift, Ragnarok X, Diablo Immortal)

### UX/UI y administración
- [x] Pulido de Dashboard: glassmorphism, empty states, CTAs con glow
- [x] Subida end-to-end de PDF/PPT/audio + bucket de storage
- [x] VideoLinkInput cableado al formulario de carga
- [x] Panel de moderación (cola de revisión approve/reject)
- [x] Sistema de **creadores de confianza** (auto-publicación sin moderar)
- [x] Botón **Seguir** implementado en UI: tarjetas de creador (landing + categoría), hero de juego y página de creador
- [x] Reproductor de **videos** (YouTube Unlisted) embebido en la página de publicación
- [x] **URL de overlay OBS** visible y copiable en el dashboard del creador
- [x] **Niveles de creador** (creator_tier/subscription_status/is_authorized_to_monetize) + backfill
- [x] **Sistema de calificación real**: tabla `ratings`, RPC `update_publication_rating`, StarRating funcional con reseñas en `/ugc/[id]`
- [x] Tarjeta **"Activá monetización"** en el dashboard (Pro $5 / Oficial $20 / solicitar autorización)
- [x] **Verificación de propiedad de canal** (Challenge-Response): código SHUB-XXXXXX en la descripción de YouTube, verificación automática (API + scraping), rate-limit, guardas anti race-condition → reclama perfil + marca oficial

---

## 🟡 En progreso / requiere acción manual (mobile)

- [ ] Correr en Supabase SQL Editor: `phase2b_storage_attachments.sql`
- [ ] Correr en Supabase SQL Editor: `phase6_trusted_creators.sql` (columna is_trusted_creator)
- [ ] Correr en Supabase SQL Editor: `phase5_seed_content.sql` (opcional, growth hack)
- [ ] Confirmar rol ADMIN con `SELECT role FROM profiles WHERE email = 'gigenalucas@gmail.com'`
- [ ] Supabase → Auth → URL Configuration: Site URL = `https://proyecto-claude-phi.vercel.app`
- [ ] Vercel env: `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `WATERMARK_SECRET`
- [ ] Supabase → Database → Replication: activar `wallet_transactions` (para widget OBS)

---

## 🔲 Pendientes — UI bloqueada por configurar Lemon Squeezy

> Estas funcionalidades tienen el **backend/webhook listo** pero la UI de compra
> generaría botones sin destino hasta crear los productos/variantes en Lemon Squeezy.

- [ ] Botón "Comprar esta guía" (venta individual 60/40 PWYW) — webhook `ugc_purchase` listo
- [ ] Botón comprar **All-Access Pass** — webhook `all_access_pass` listo
- [ ] Comprar **paquete de S-Credits** — webhook `s_credit_bulk` listo
- [ ] UI para **enviar propina** en stream (RPC `process_stream_tip` lista)
- [ ] Lemon Squeezy: crear productos/variantes y conectar `custom_data.type`
- [ ] Página de pricing / planes de suscripción

## 🔲 Pendientes — independientes de pagos

- [x] Taxonomía de marketplace (TCG/cosmaking/etc.) surfaceada en el formulario UGC
- [x] Auto-rechazo por filtros (palabras prohibidas / acortadores / spam) antes de la cola
- [ ] Watermark anti-piratería activo en vista inline de PDF premium (hoy solo descarga)
- [ ] Subir contenido real del CEO a la academia (PDFs/PPTs listos)

---

## 🔗 Referencias

- Repo: `GLucas1989/Proyecto-Claude` (branch `main`)
- Producción: https://proyecto-claude-phi.vercel.app
- Migraciones SQL: `supabase/migrations/`
