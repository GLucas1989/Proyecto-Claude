# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Creators S-HUB** (creatorsshub.com) — a multi-game directory of gaming content creators, with a monetization layer (creator subscriptions, UGC promotion, tiered game access) built on top. Next.js 16 (App Router) + TypeScript strict + Tailwind v4 + Supabase.

## Commands

```bash
npm install
npm run dev            # Next.js dev server
npm run build           # production build
npm run lint            # eslint (flat config, extends eslint-config-next)
npm run fetch-videos    # scripts/fetch-youtube.ts — pulls latest videos/avatars per creator from YouTube Data API
npm run fetch-videos -- --game=<slug> --dry-run   # scope to one game / preview without writing
```

There is no test runner configured in this repo — do not assume `npm test` works.

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
- `api/webhooks/{didit,lemon-squeezy,mux}` — inbound provider webhooks, service-role client, signature verification, idempotency table/constraint.
- `api/{lemonsqueezy,stripe,mux,spotify,twitch,auth,newsletter}` — outbound integration routes (checkout sessions, playback tokens, OAuth, live status).
- `api/cron/{recompute-reputation,sync-news}` — invoked by Vercel Cron (`vercel.json`), not user-facing.
- `actions/*` — Next.js server actions per domain (admin, monetization, payments, ratings, ugc, verification, video, follows, subscriptions) — this is where most business logic and RLS-sensitive writes live, rather than in route handlers.

`src/middleware.ts` only protects `/dashboard/*`, `/ugc/new`, and `/ugc/:id/edit` (redirects to `/auth/login?redirectTo=...`), and is a no-op if Supabase env vars are absent (so preview builds without env vars don't hard-fail). Everything else is open by default — don't assume middleware covers admin/role checks; those live in the action/route itself.

### Third-party integrations, one lib dir each

`src/lib/{lemonsqueezy,mux,spotify,stripe,didit.ts,news,email}` each wrap one external service. Stripe exists alongside Lemon Squeezy (LS is the active payments provider per `.env.example`; check which is actually wired before assuming Stripe is live). Spotify ("Gaming Mode") uses next-auth (Auth.js v5) purely for the Spotify OAuth login + Web Playback SDK — it is unrelated to the Supabase auth session used everywhere else in the app.

### Content ingestion is external, not app code

Two feeds refresh `src/data/**` and `game_news` respectively, both outside normal request handling:
- **YouTube sync**: `.github/workflows/sync-youtube.yml` runs `npm run fetch-videos` on a schedule (Mondays) and on every push to `main`/the active dev branch (paths-ignored on `src/data/**` to avoid a commit loop), then commits directly to that branch as `github-actions[bot]` with `[skip ci]`. Expect to see these auto-commits interleaved in `git log` on both `main` and feature branches.
- **Game news RSS**: `/api/cron/sync-news` (Vercel Cron, every 3h) upserts into `game_news` keyed by URL (`phase18_game_news_url_unique.sql`), read via `src/lib/news.ts` and rendered by `NewsSection`/`LiveHubWidget`.

### Deploy

Production is Vercel, connected to GitHub (`GLucas1989/Proyecto-Claude`), production branch `main`. Development happens on a `claude/*` branch and is merged to `main` only on explicit request to ship to production — do not push directly to `main` otherwise. `vercel.json` defines the two cron schedules; there is no `.vercel/project.json` in the repo, so the Vercel CLI can't deploy from this sandbox — deploys go through git push or a Vercel Deploy Hook.
