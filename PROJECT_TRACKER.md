# 🎮 Creators S-HUB — Tablero de Proyecto

> Documento maestro de seguimiento. Copiá/importá este archivo en Notion
> (Notion soporta Markdown nativo: headings, checkboxes y tablas se convierten solos).
> Última actualización: 2026-06-27

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

## 🔲 Pendientes (próximas iteraciones)

- [ ] Botón "Comprar esta guía" (venta individual one-time) en página de publicación
- [ ] Lemon Squeezy: crear productos/variantes y conectar `custom_data.type`
- [ ] Auto-rechazo por filtros (palabras prohibidas / archivos sospechosos) antes de la cola
- [ ] Subir contenido real del CEO a la academia (PDFs/PPTs listos)
- [ ] Página de pricing / planes de suscripción
- [ ] Sistema de propinas en stream (UI para enviar S-Credits)

---

## 🔗 Referencias

- Repo: `GLucas1989/Proyecto-Claude` (branch `main`)
- Producción: https://proyecto-claude-phi.vercel.app
- Migraciones SQL: `supabase/migrations/`
