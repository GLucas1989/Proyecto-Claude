# ROADMAP EVOLUTION — CREATORS S-HUB
## De Directorio Estático a Academia Educativa y Plataforma UGC

> **Generado:** 2026-06-24  
> **Auditor:** Arquitecto de Software Senior (análisis automatizado del repositorio)  
> **Branch analizado:** `main` · commit `1a36a8c`

---

## DIAGNÓSTICO TÉCNICO

### Stack Detectado

| Capa | Tecnología | Versión | Notas |
|------|-----------|---------|-------|
| Framework | Next.js (App Router) | 16.2.9 | SSG + Server Components + Server Actions |
| Lenguaje | TypeScript | 5.x strict | Sin `any` explícito en código nuevo |
| Estilos | Tailwind CSS v4 | 4.x | Sin config centralizada (`tailwind.config`); tokens inline |
| Autenticación | Supabase Auth | `@supabase/ssr 0.12.0` | SSR client con cookies; middleware de protección |
| Base de datos | Supabase PostgreSQL | `supabase-js 2.108.2` | RLS habilitado en todas las tablas |
| Pagos | Stripe | v22.2.3 | API version `2026-05-27.dahlia`; Stripe Connect activo |
| UI Primitivos | Radix UI + lucide-react | 1.21.0 | Sin Shadcn CLI; componentes manuales en `src/components/ui/` |
| Storage | Supabase Storage | — | Bucket `attachments` para adjuntos UGC |

### Cómo está construido el sitio hoy

El proyecto nació como un **directorio estático de creadores** (`generateStaticParams` + JSON local en `src/data/[game]/creators.json`) y ha evolucionado progresivamente hacia una plataforma educativa. La arquitectura actual tiene **6 capas de negocio ya implementadas**:

```
CREATORS S-HUB (estado actual)
│
├── Capa 1: Directorio público (SSG)
│   ├── /[gameSlug]             → grid de creadores filtrable
│   └── /[gameSlug]/[creatorId] → perfil del creador con videos
│
├── Capa 2: Autenticación y Roles (Supabase Auth)
│   ├── /auth/login             → magic link + OAuth
│   ├── /auth/callback          → intercambio de código OAuth
│   └── /dashboard              → panel personal del usuario
│
├── Capa 3: Monetización de Creadores (Stripe Connect)
│   ├── /api/stripe/checkout    → sesión de pago por suscripción
│   └── /api/stripe/webhook     → gestión de eventos de Stripe
│       Splits implementados: 60/40 (estándar) · 70/30 (collab)
│
├── Capa 4: Academia por Juego (Game Subscriptions)
│   ├── LearningCenter          → contenido educativo de la plataforma
│   ├── SubscribeGameButton     → checkout de suscripción por juego
│   └── game_payment_events     → 100% plataforma, sin transfer_data
│       Precio: $4.99/mes individual · $7.99/mes multigenero
│
├── Capa 5: Herramientas UGC (User-Generated Content)
│   ├── /ugc/new                → workspace de creación
│   ├── /ugc/[id]/edit          → edición de borradores
│   ├── /dashboard/admin/moderation → cola de moderación ADMIN
│   └── GamePublicationsFeed    → feed integrado en cada página de juego
│       Estados: DRAFT → PENDING_REVIEW → PUBLISHED / ARCHIVED
│
└── Capa 6: Publicidad Nativa
    └── NativeAdSlot            → 4 variantes de placement
```

### Estado de la Base de Datos

El schema en `supabase/schema.sql` es **completo y productivo**, con 15 ENUMs, 14 tablas, 3 funciones PL/pgSQL, 2 triggers y 15 políticas RLS. Todas las entidades de negocio tienen sus tipos TypeScript en `src/types/database.ts`.

---

## ANÁLISIS DE BRECHAS (GAP ANALYSIS)

### ✅ Ya implementado

| Característica | Archivos clave |
|---------------|----------------|
| Roles USER / CREATOR / ADMIN | `supabase/schema.sql` · `src/types/database.ts` |
| Auth + sesión SSR | `src/lib/supabase/` · `src/middleware.ts` |
| Claim Profile (verificación de creadores) | `src/components/auth/ClaimProfileButton.tsx` |
| Splits Stripe 60/40 y 70/30 | `src/lib/stripe/splits.ts` · `src/app/api/stripe/checkout/route.ts` |
| Split UGC 50/50 | `src/app/actions/ugc.ts` → `is_premium` flag |
| Game Subscriptions 100% plataforma | `src/app/actions/gameSubscription.ts` |
| Editor Markdown cyberpunk | `src/components/ugc/MarkdownEditor.tsx` + `MarkdownPreview.tsx` |
| Templates de publicación (3 tipos) | `src/components/ugc/TemplateSelector.tsx` |
| Upload de adjuntos (PDF/PPTX) | `src/components/ugc/AttachmentUploader.tsx` |
| Gamificación: votos + reputación | Trigger `handle_vote_reputation` · tabla `user_reputation` |
| Moderación ADMIN | `src/app/dashboard/admin/moderation/page.tsx` |
| Paywall content guard | `src/components/premium/PremiumContentGuard.tsx` |
| Feed de publicaciones por juego | `src/components/ugc/GamePublicationsFeed.tsx` |
| Promoción de guías (PaymentIntent) | `src/app/api/stripe/ugc-promote/route.ts` |
| Native ads (4 variantes) | `src/components/ads/NativeAdSlot.tsx` |

---

### 🔴 Brechas Críticas (Seguridad / Producción)

#### BRECHA-01: XSS en el renderizador Markdown
**Archivo:** `src/components/ugc/MarkdownPreview.tsx`  
**Problema:** La función `mdToHtml()` convierte texto de usuario a HTML mediante regex y lo inserta con `dangerouslySetInnerHTML`. No existe sanitización de etiquetas `<script>`, `onerror=`, `javascript:`, etc. Un usuario malicioso puede inyectar JavaScript arbitrario.  
**Impacto:** Crítico en producción. Afecta a todos los lectores de publicaciones.  
**Solución requerida:** Instalar `react-markdown` + `rehype-sanitize` y reemplazar el renderer custom.

```bash
npm install react-markdown rehype-sanitize remark-gfm
```

```tsx
// src/components/ugc/MarkdownPreview.tsx — reemplazo seguro
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

export function MarkdownPreview({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{ /* estilos cyberpunk aquí */ }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

---

#### BRECHA-02: Página de lectura de guía UGC inexistente
**Ruta esperada:** `/ugc/[publicationId]`  
**Problema:** Las `PublicationCard` apuntan a `href="/publications/{id}"` (ruta incorrecta) y la carpeta `src/app/ugc/[publicationId]/` solo contiene el sub-directorio `edit/`. No existe `src/app/ugc/[publicationId]/page.tsx`.  
**Impacto:** Alto. Los usuarios no pueden leer las guías publicadas; los votos no tienen contexto.  
**Solución:** Crear la página de lectura de guía con:
- Renderizado Markdown completo (post-fix BRECHA-01)
- Botones de voto UPVOTE/DOWNVOTE
- Adjuntos descargables (PDF/PPTX)
- Perfil del autor con badge de reputación
- Botón "Promover esta guía" (si el autor es el owner)
- Paywall si `is_premium = true` y el lector no está suscrito

---

#### BRECHA-03: Link roto en PublicationCard
**Archivo:** `src/components/ugc/PublicationCard.tsx` línea ~85  
**Problema:** `href="/publications/${publication.id}"` — prefijo `/publications/` no existe en el App Router.  
**Corrección:** Cambiar a `href="/ugc/${publication.id}"`.

---

### 🟡 Brechas Funcionales (Features incompletos)

#### BRECHA-04: Flag de Socio Fundador (Founding Partner) — no implementado
**Problema:** No existe ninguna entidad en el schema ni en los tipos TypeScript que represente la figura de "Socio Fundador" (cuenta Ancla con reparto del 50% de ganancias netas globales).  
**Solución propuesta en schema:**

```sql
-- Nueva tabla para socios fundadores
create table public.founding_partners (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references public.profiles(id) on delete cascade,
  revenue_share   numeric(4,3) not null default 0.50, -- 50% por defecto
  activated_at    timestamptz not null default now(),
  expires_at      timestamptz,                        -- null = vitalicio
  notes           text,
  created_by      uuid references public.profiles(id) -- solo ADMIN puede crear
);

-- Columna en profiles para acceso rápido sin JOIN
alter table public.profiles
  add column if not exists is_founding_partner boolean not null default false;
```

**Lógica de negocio a implementar:**
- En cada liquidación mensual (Stripe → `payment_events`), calcular el porcentaje de `ganancias_netas_plataforma` × `revenue_share` y acreditarlo al socio
- Panel ADMIN para activar/desactivar socios fundadores
- Badge visual en perfil público del socio

---

#### BRECHA-05: Webhook Stripe no procesa el split 50/50 de guías premium UGC
**Archivo:** `src/app/api/stripe/webhook/route.ts`  
**Problema:** El webhook actual maneja `invoice.paid` para suscripciones de creador (60/40) y `checkout.session.completed` para juegos (100%), pero **no existe ningún handler que, cuando alguien compra acceso a una guía premium UGC, calcule el split 50/50 y lo registre en `payment_events`**.  
**Solución:** Agregar metadata `type: "ugc_subscription"` al crear la suscripción premium UGC, y en el webhook detectarla para aplicar `computeCreatorSplit(amount, false)` con `creatorPct = 0.50`.

---

#### BRECHA-06: Sistema de pagos a autores UGC — no implementado
**Problema:** `splits.ts` calcula los porcentajes, pero no existe mecanismo para transferir fondos al autor de una guía premium (necesita Stripe Connect igual que los creadores, o un wallet interno de saldo).  
**Opciones:**
1. **Stripe Connect** — replicar el flujo de `creator_profiles.stripe_account_id` para autores UGC (más complejo, requiere onboarding Stripe)
2. **Wallet interno** — acumular balance en una tabla `user_wallet` y permitir retiro manual vía Stripe Payout (más simple, recomendado para MVP)

---

#### BRECHA-07: Paywall de Academia por juego — solo bloquea contenido, no la página completa
**Archivo:** `src/components/game/learning-center/LearningCenter.tsx`  
**Situación actual:** El LearningCenter muestra un bloque borroso con CTA si el usuario no está suscrito. La página del juego carga igualmente.  
**Objetivo de negocio:** Transformar `/[gameSlug]` para que el creador de contenido pueda configurar si **todo el directorio de su juego** requiere suscripción o solo la academia.  
**Solución propuesta:**
- Agregar campo `requires_subscription boolean default false` a la tabla `game_subscription_plans`
- En `[gameSlug]/page.tsx`, si `requires_subscription = true` y el usuario no está suscrito, renderizar un `<GamePaywall />` en lugar del `<CreatorGrid />`

---

#### BRECHA-08: Dashboard de usuario — sin sección de mis publicaciones
**Archivo:** `src/app/dashboard/page.tsx`  
**Problema:** El dashboard solo muestra el perfil reclamado y la cuenta. No existe acceso a las publicaciones UGC del usuario (borradores, en revisión, publicadas), su reputación, ni el historial de suscripciones.

---

#### BRECHA-09: Sistema de notificaciones — no implementado
**Problema:** No existe mecanismo para notificar al autor cuando su guía es aprobada/rechazada, ni al moderador cuando llega una nueva publicación a revisión.  
**Solución mínima:** Email transaccional via MailerLite (ya tiene `MAILERLITE_API_KEY` en `.env.example`) disparado desde los Server Actions de aprobación/rechazo.

---

### 🟢 Mejoras de Calidad (No bloquean producción)

| Ref | Descripción | Archivo afectado |
|-----|-------------|------------------|
| MEJORA-01 | Añadir `increment_publication_views` RPC en Supabase | `supabase/schema.sql` |
| MEJORA-02 | El README describe el estado inicial; actualizarlo | `README.md` |
| MEJORA-03 | Crear `CLAUDE.md` con instrucciones del proyecto para sesiones futuras | `/CLAUDE.md` |
| MEJORA-04 | `[gameSlug]/page.tsx` carga todas las publicaciones sin paginación | `src/app/[gameSlug]/page.tsx` |
| MEJORA-05 | `PublicationCard` muestra "Comunidad" como author; necesita JOIN con `profiles` | `src/app/[gameSlug]/page.tsx` |
| MEJORA-06 | Agregar `og:image` dinámico para publicaciones UGC | `src/app/ugc/[id]/page.tsx` |

---

## ARCHIVOS A MODIFICAR

| Archivo | Cambio requerido | Prioridad |
|---------|-----------------|-----------|
| `src/components/ugc/MarkdownPreview.tsx` | Reemplazar renderer custom por `react-markdown + rehype-sanitize` | 🔴 Crítica |
| `src/components/ugc/PublicationCard.tsx` | Corregir `href="/publications/"` → `href="/ugc/"` | 🔴 Crítica |
| `src/app/api/stripe/webhook/route.ts` | Agregar handler para split 50/50 en suscripciones UGC premium | 🟡 Alta |
| `supabase/schema.sql` | Agregar tabla `founding_partners` + columna `is_founding_partner` en `profiles` | 🟡 Alta |
| `src/types/database.ts` | Agregar tipos `FoundingPartner` + actualizar `profiles` interface | 🟡 Alta |
| `src/app/dashboard/page.tsx` | Agregar sección "Mis Publicaciones" + reputación del usuario | 🟡 Alta |
| `src/app/[gameSlug]/page.tsx` | JOIN con `profiles` para mostrar nombre del autor en `feedItems` | 🟢 Media |
| `supabase/schema.sql` | Agregar función RPC `increment_publication_views` | 🟢 Media |
| `src/components/game/learning-center/LearningCenter.tsx` | Soporte para `requires_subscription` a nivel de página | 🟢 Media |
| `README.md` | Actualizar descripción del proyecto con stack completo | 🟢 Baja |

---

## ARCHIVOS NUEVOS A CREAR

| Ruta | Descripción | Prioridad |
|------|-------------|-----------|
| `src/app/ugc/[publicationId]/page.tsx` | Página de lectura de guía (render MD, votos, adjuntos, paywall premium) | 🔴 Crítica |
| `src/components/ugc/PublicationReader.tsx` | Componente de lectura completa con autor, reputación, acciones | 🔴 Crítica |
| `src/components/ugc/VoteButtons.tsx` | Botones de voto UPVOTE/DOWNVOTE con estado optimista extraídos de `PublicationCard` | 🟡 Alta |
| `src/components/ugc/ReputationBadge.tsx` | Badge de rango del usuario (Novato, Teorizador, etc.) con tooltip | 🟡 Alta |
| `src/components/ugc/PromoteGuideButton.tsx` | Botón de promoción con modal de pago ($9.99 / 7 días) | 🟡 Alta |
| `src/app/dashboard/publications/page.tsx` | Sección de mis publicaciones: borradores, en revisión, publicadas | 🟡 Alta |
| `src/components/dashboard/PublicationsList.tsx` | Lista de publicaciones con estado, acciones editar/eliminar | 🟡 Alta |
| `src/components/dashboard/ReputationCard.tsx` | Card de reputación: puntos, rank, guías publicadas, barra de progreso | 🟡 Alta |
| `src/app/actions/foundingPartner.ts` | Server Actions para gestión de socios fundadores (ADMIN) | 🟡 Alta |
| `src/components/admin/FoundingPartnerManager.tsx` | Panel ADMIN para activar/desactivar socios fundadores | 🟡 Alta |
| `src/lib/stripe/wallet.ts` | Lógica de wallet interno para balance de autores UGC | 🟡 Alta |
| `src/components/game/GamePaywall.tsx` | Paywall de página completa cuando `requires_subscription = true` | 🟢 Media |
| `src/components/ugc/PublicationFilters.tsx` | Filtros del feed: tipo (GUIDE/BUILD/TIER_LIST), orden (recientes/top) | 🟢 Media |
| `src/app/ugc/page.tsx` | Índice global de todas las publicaciones publicadas | 🟢 Media |
| `CLAUDE.md` | Documentación del proyecto para sesiones de Claude Code | 🟢 Baja |

---

## COMANDOS NECESARIOS

### Instalaciones recomendadas (por prioridad)

```bash
# ── CRÍTICO: Seguridad Markdown (XSS) ────────────────────────────────────────
npm install react-markdown rehype-sanitize remark-gfm
# react-markdown    → renderer React seguro con soporte de componentes
# rehype-sanitize   → whitelist de HTML permitido (elimina <script>, onerror=, etc.)
# remark-gfm        → GitHub Flavored Markdown (tablas, strikethrough, task lists)

# ── OPCIONAL: Mejoras de calidad ──────────────────────────────────────────────
npm install react-syntax-highlighter
# @types/react-syntax-highlighter
# Para bloques de código con syntax highlighting en guías técnicas

npm install date-fns
# Formateo de fechas consistente (timestamps de publicaciones, expiración de promociones)

npm install @stripe/react-stripe-js
# Ya está @stripe/stripe-js; este paquete agrega <Elements> para el formulario
# de pago del botón "Promover guía" sin redirect a Stripe Checkout

# ── OPCIONALES: Editor avanzado ───────────────────────────────────────────────
# Evaluar si el editor textarea actual es suficiente o migrar a:
npm install @uiw/react-md-editor
# Editor Markdown WYSIWYG con preview integrado, accesibilidad y shortcuts
# Alternativa: @mdxeditor/editor (más pesado, más features)
```

### Sin instalación, solo configuración

```bash
# Agregar bucket de Storage en Supabase Dashboard
# Bucket name: "attachments"
# Políticas: autenticados pueden subir, público puede leer

# Agregar función RPC en Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.increment_publication_views(pub_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.user_publications
  SET views_count = views_count + 1
  WHERE id = pub_id AND status = 'PUBLISHED';
END;
$$;
```

---

## PLAN DE EJECUCIÓN SUGERIDO

```
SPRINT 1 — Estabilización y Seguridad (1-2 días)
├── Fix BRECHA-03: Corregir link roto en PublicationCard
├── Fix BRECHA-01: Instalar react-markdown + rehype-sanitize y reemplazar renderer
└── Fix BRECHA-02: Crear src/app/ugc/[publicationId]/page.tsx + PublicationReader

SPRINT 2 — Completar UGC (2-3 días)
├── BRECHA-08: Dashboard con sección "Mis Publicaciones" + ReputationCard
├── VoteButtons extraído + ReputationBadge
└── PromoteGuideButton con modal de pago (@stripe/react-stripe-js)

SPRINT 3 — Socios Fundadores (1-2 días)
├── BRECHA-04: Schema founding_partners + tipos TypeScript
├── Server Actions + panel ADMIN
└── Badge visual en perfiles

SPRINT 4 — Monetización UGC completa (2-3 días)
├── BRECHA-05: Webhook split 50/50 para guías premium
├── BRECHA-06: Wallet interno (tabla user_wallet + Server Actions de retiro)
└── Liquidación mensual automática

SPRINT 5 — Paywall avanzado y notificaciones (1-2 días)
├── BRECHA-07: GamePaywall para páginas con requires_subscription
├── BRECHA-09: Email transaccional MailerLite al aprobar/rechazar guías
└── Mejoras menores (MEJORA-01 a MEJORA-06)
```

---

## RESUMEN EJECUTIVO

El proyecto está en un **estado de implementación avanzado**. La transición de "directorio estático" a "academia educativa y plataforma UGC" está aproximadamente al **75% de completitud** funcional:

- **✅ Infraestructura base (100%):** Auth, roles, base de datos, Stripe Connect, game subs
- **✅ UGC Pipeline (90%):** Editor, templates, moderación, gamificación, feed por juego
- **🟡 Monetización UGC (40%):** El split 50/50 está calculado pero no procesado en el webhook; el wallet de autores no existe
- **🔴 Seguridad Markdown (0%):** XSS activo en producción si se despliega hoy
- **❌ Socios Fundadores (0%):** Sin schema, sin UI, sin lógica de liquidación
- **❌ Lector de guías (0%):** La ruta `/ugc/[id]` no existe; las publicaciones no son legibles

La prioridad número uno antes de cualquier despliegue a producción es la **BRECHA-01 (XSS)** y la **BRECHA-02/03 (lector de guías inexistente con links rotos)**.
