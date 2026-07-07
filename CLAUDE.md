# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Creators S-HUB** (creatorsshub.com) — a multi-game directory of gaming content creators, with a monetization layer (creator subscriptions, UGC promotion, tiered game access) built on top. Next.js 16 (App Router) + TypeScript strict + Tailwind v4 + Supabase.

`PROJECT_TRACKER.md` is the living status doc — check it for what's actually live vs. pending activation (missing env vars, unrun migrations) before assuming a feature works end-to-end in production. `ROADMAP_EVOLUTION.md` is a point-in-time architecture snapshot (2026-06-24) predating the Stripe→Lemon Squeezy migration and the Netlify cron move below — treat it as historical context, not current architecture.

## Commands

```bash
npm install
npm run dev            # Next.js dev server
npm run build           # production build
npm run lint            # eslint (flat config, extends eslint-config-next)
npm run fetch-videos    # scripts/fetch-youtube.ts — pulls latest videos/avatars per creator from YouTube Data API
npm run fetch-videos -- --game=<slug> --dry-run   # scope to one game / preview without writing
```

There is no test runner configured in this repo — do not assume `npm test` works. `.github/workflows/ci.yml` (lint + build on every push to `main`/`claude/**` and PRs into `main`) is the closest thing to a merge gate; treat a red `npm run lint` or `npm run build` as blocking in the same way a test failure would be elsewhere.

The Supabase MCP server (`.mcp.json`, project ref `hyivoggsnukybgjboxpb`) is wired into this session for direct DB introspection/queries against the live project — prefer it over guessing schema from migration files when you need current table state.

Supabase migrations are plain SQL files under `supabase/migrations/phaseN_*.sql`, applied manually via the Supabase Dashboard SQL Editor (there is no migration CLI wired up). When adding schema changes, add a new `phaseN_*.sql` file following the existing numbering — do not edit past phase files.

## Architecture

### Two parallel data sources — know which one a feature uses

1. **Static per-game JSON** (`src/data/<game-slug>/creators.json`, `src/data/games.json`) — the original creator directory content (bios, socials, cached YouTube video lists). Read via `src/lib/data.ts` (`getGames`, `getCreators`, `getCreator`, static params for SSG). `games.json` entries carry `active`/`comingSoon` flags and a `category` used by the Home grid. This data is **not** in Supabase and is updated by the `Sync YouTube` GitHub Action (see below), not by app code.
2. **Supabase (Postgres + RLS)** — everything account-shaped: `profiles`, `creator_profiles`, `claim_requests`, monetization/subscriptions/wallets, UGC publications, `content_assets` (Mux video), `game_news`, KYC/verification state, admin moderation. Server code uses one of three clients in `src/lib/supabase/`:
   - `client.ts` — browser client (anon key)
   - `server.ts` — server component/route client (anon key, cookie-bound session)
   - `service.ts` — **service role**, bypasses RLS entirely. Use only in trusted webhook/cron handlers with no user session (Lemon Squeezy, Didit, Mux webhooks) — never import into client-rendered code.

### RLS gotcha that has bitten this project before

Row-level policies here are commonly `using (auth.uid() = owner_column)`. Admin-panel code (`src/app/dashboard/admin`, `src/app/actions/admin.ts`) runs under the *admin's own* session, not a service role — so an admin action that updates *another* user's row silently affects 0 rows under owner-only RLS (Supabase returns no error; the UI reports success anyway). The fix pattern, already applied to `profiles`/`creator_profiles`/`claim_requests`/`monetization_requests` (see `phase16_admin_rls_bypass.sql`), is a `SECURITY DEFINER` `public.is_admin()` function plus an additional `for all using (public.is_admin())` policy **added with OR** alongside the owner policy. When adding new admin-writable tables, apply the same pattern rather than loosening the owner policy or switching to the service-role client.

Webhook idempotency follows a similar recurring pattern: webhook handlers (Didit, Lemon Squeezy, Mux) that can be retried by the provider dedupe via a dedicated `*_events`/unique-constraint table (e.g. `didit_webhook_events`, the `wallet_transactions.stripe_ref` unique partial index) rather than relying on the caller not to retry.

### Route structure (`src/app`)

- `[gameSlug]/[creatorId]` — public creator pages (SSG from the static JSON data source above).
- `academies`, `vault` — cross-game aggregated views built from Supabase UGC data (`getAllPublishedPublications` etc. in `src/lib/marketplace`).
- `dashboard`, `dashboard/admin`, `dashboard/admin/moderation` — authenticated areas; access is gated in `src/middleware.ts` (see below), admin-only checks happen inside the route/action itself via `is_admin()`.
- `ugc/*` — creator-authored guides/builds/tier lists (publish/edit flow).
- `auth/{login,callback}` — Supabase auth pages; `login` is the redirect target `src/middleware.ts` sends unauthenticated users to.
- `overlays/alerts/[creatorId]` — public, unauthenticated OBS browser-source overlay (transparent background, hides nav/footer) that renders `StreamTipAlert` for a creator's tip notifications; the shareable URL is surfaced to creators via `OBSOverlayCard` in the dashboard.
- `api/webhooks/{didit,lemon-squeezy,mux}` — inbound provider webhooks, service-role client, signature verification, idempotency table/constraint.
- `api/{lemonsqueezy,stripe,mux,spotify,twitch,auth,newsletter}` — outbound integration routes (checkout sessions, playback tokens, OAuth, live status).
- `api/cron/{recompute-reputation,sync-news}` — hit over plain HTTP by an external scheduler rather than invoked in-process (see Deploy below); both accept the shared secret either as an `Authorization: Bearer` header or a `?secret=` query param (the latter added so they can be triggered manually from a browser).
- `actions/*` — Next.js server actions per domain (admin, monetization, payments, ratings, ugc, verification, video, follows, subscriptions) — this is where most business logic and RLS-sensitive writes live, rather than in route handlers.

`src/middleware.ts` only protects `/dashboard/*`, `/ugc/new`, and `/ugc/:id/edit` (redirects to `/auth/login?redirectTo=...`), and is a no-op if Supabase env vars are absent (so preview builds without env vars don't hard-fail). Everything else is open by default — don't assume middleware covers admin/role checks; those live in the action/route itself.

### Third-party integrations, one lib dir each

`src/lib/{lemonsqueezy,mux,spotify,stripe,didit.ts,news,email}` each wrap one external service. Stripe exists alongside Lemon Squeezy (LS is the active payments provider — `.env.example`'s `LS_VARIANT_GAME_*`/`LS_VARIANT_FEE_*` variant IDs confirm it's fully wired; Stripe's routes/lib remain from a prior migration, check before assuming Stripe is live). Spotify ("Gaming Mode") uses next-auth (Auth.js v5) purely for the Spotify OAuth login + Web Playback SDK — it is unrelated to the Supabase auth session used everywhere else in the app. `src/lib/email` wraps two providers for two different jobs: Resend (`RESEND_API_KEY`) for transactional email, MailerLite (`MAILERLITE_API_KEY`) for the newsletter subscriber list via `api/newsletter`.

A handful of smaller single-file lib dirs cover cross-cutting concerns rather than external services: `src/lib/moderation/filters.ts` (regex-based auto-reject for spam/scam UGC submissions before they reach the admin queue), `src/lib/validation/hashtags.ts` (enforces the required `#CreatorsSHUB` promo hashtag, shared between client forms and server actions), `src/lib/security/watermark.ts` (reversible XOR+base64 obfuscation of a buyer's email into premium PDFs/guides — deterrent traceability, not real cryptography), and `src/lib/media/types.ts` (a provider-agnostic `MediaAsset` type so today's YouTube-Unlisted embeds can move to Cloudflare Stream/Vimeo OTT later without touching UI code).

### Content ingestion is external, not app code

Two feeds refresh `src/data/**` and `game_news` respectively, both outside normal request handling:
- **YouTube sync**: `.github/workflows/sync-youtube.yml` runs `npm run fetch-videos` on a schedule (Mondays) and on every push to `main`/the active dev branch (paths-ignored on `src/data/**` to avoid a commit loop), then commits directly to that branch as `github-actions[bot]` with `[skip ci]`. Expect to see these auto-commits interleaved in `git log` on both `main` and feature branches.
- **Game news RSS**: `/api/cron/sync-news` (triggered every 3h by a Netlify Scheduled Function, not Vercel — see Deploy below) upserts into `game_news` keyed by URL (`phase18_game_news_url_unique.sql`), read via `src/lib/news.ts` and rendered by `NewsSection`/`LiveHubWidget`.

### Deploy

Production hosting is Vercel, connected to GitHub (`GLucas1989/Proyecto-Claude`), production branch `main`. Development happens on a `claude/*` branch and is merged to `main` only on explicit request to ship to production — do not push directly to `main` otherwise. There is no `.vercel/project.json` in the repo, so the Vercel CLI can't deploy from this sandbox — deploys go through git push or a Vercel Deploy Hook.

**Cron no longer runs on Vercel in practice.** `vercel.json` still declares the two cron schedules, but as of the `feat: migrar cron jobs de vercel.json a Netlify Scheduled Functions` commit it is dead config — Vercel's plan can't do sub-daily schedules, so both jobs were moved to Netlify Scheduled Functions (`netlify/functions/{recompute-reputation,sync-news}.mts`, same two schedules), which run on Netlify's infra purely to make an outbound HTTP call to the live site's `/api/cron/*` routes with `Authorization: Bearer ${CRON_SECRET}`. There's no `netlify.toml` and no Netlify build/hosting config in this repo — Netlify is a scheduler sidecar here, not a second hosting target; don't assume the app itself deploys to or serves from Netlify. `.netlify-trigger` / `.vercel-trigger` are empty timestamp files at repo root used to force a redeploy on each platform respectively (touch + commit + push) — not app config, safe to ignore unless you're deliberately forcing a rebuild.

## Installed skills — when to reach for them

`.claude/skills/` has project-local skills (from `alirezarezvani/claude-skills`, security-audited before install with `skill-security-auditor` — reuse it on any future third-party skill before installing). They activate on relevant requests, but proactively invoke them yourself in these situations:

- **Any new/changed Supabase table or RLS policy** → `database-schema-designer` first (schema/ERD/RLS design), then `migration-architect` for the actual `phaseN_*.sql` file (it also generates the rollback — none of the existing phase files have one, so add it going forward).
- **Adding or touching `.env.example` / any secret-bearing integration** → `env-secrets-manager` to check for drift/leaks before committing.
- **Touching `.github/workflows/*` or diagnosing a broken deploy** → `ci-cd-pipeline-builder`. Note its scope: it only generates/audits CI files (lint/test/build in GitHub Actions or GitLab CI). It has no reach into Vercel's own project-level Git integration — a stuck/broken Vercel↔GitHub build link (this has happened before) is not fixable through any repo file; that requires reconnecting or recreating the Vercel project in its dashboard.
- **Before merging any nontrivial PR/diff** → `pr-review-expert` (blast radius, security, missing env vars) and, if API routes changed, `api-design-reviewer` + `api-test-suite-builder` (no test runner exists yet in this repo — this is the closest thing to route test coverage).
- **After a production incident** (e.g. the Vercel deploy pipeline going stale like it did once) → `runbook-generator` to turn the resolution into a reusable runbook instead of re-diagnosing from scratch next time.
- **Dependency bumps / `package.json` changes** → `dependency-auditor`.
- **Writing PROJECT_TRACKER.md release notes or a CHANGELOG** → `changelog-generator` (conventional-commit aware; this repo's commit history is already conventional-commit-ish).
- **Performance complaints on the Home grid, SSG creator pages, or bundle size** → `performance-profiler`.
- **Reviewing the health of the codebase overall / large refactor planning** → `tech-debt-tracker` and `codebase-onboarding` (the latter is also useful for generating onboarding docs given how much of this repo's history is AI-assisted and undocumented outside `PROJECT_TRACKER.md`).
- **SLOs/alerts/dashboards once traffic is real** → `observability-designer`.
- **Home/landing page or any new marketing page** → `landing-page-generator` (Next.js/TSX + Tailwind output, matches the existing stack) and, for content discoverability (this is a content directory site), `aeo` for SEO + LLM-citation optimization.
- **Wallet/payout/subscription metrics** (Lemon Squeezy monetization, `wallet_transactions`, `withdrawal_requests`) → `saas-metrics-coach` for MRR/churn/quick-ratio analysis.
- **Visual/brand assets** (logos, banners, social images, slide decks) or general UI polish → `design`/`ui-ux-pro-max`/`frontend-design`/`ui-styling` and the more specific `banner-design`/`brand`/`design-system`/`frontend-slides`/`slides` as the task warrants. These are a separate, more general-purpose skill pack from the domain-specific ones above — reach for them on any request that's primarily visual rather than architectural.
