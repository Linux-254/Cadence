# Cadence

Developer accountability, role-adaptive workbench, and structured learning workspace.

## Scripts

- `npm run dev` — Start Express + Vite dev server on port 3000
- `npm run seed` — Idempotently upsert seeded tools and learning paths
- `npm run lint` — TypeScript check (`tsc --noEmit`)
- `npm run build` — Build frontend bundle to `dist/`

## Heartbeat & Lapse Detection Architecture

- Web heartbeat cadence: `30s` (`HEARTBEAT_WEB_S = 30` in `server/config.ts`)
- Extension heartbeat cadence: `60s` (`HEARTBEAT_EXT_S = 60` in `server/config.ts`)
- Default lapse grace period: `5m` (`LAPSE_GRACE_MIN = 5`, user-configurable `3–30m`)
- Vercel Hobby daily cron: `vercel.json` triggers `/api/cron/lapse-check` once daily (`0 0 * * *` at midnight UTC), which complies strictly with Vercel Hobby plan limits (maximum 1 execution per day). Stale active sessions older than the user's lapse grace threshold are finalized lazily in real time on every session and dashboard read, so state and durations remain accurate without waiting for cron executions.

## Environment Variables

- `MONGODB_URI` — Required in production Vercel deployments. Local development falls back cleanly to SQLite preview mode if omitted.
- `JWT_ACCESS_SECRET` — Secret used to sign access JWTs.
- `GEMINI_API_KEY` — Enables document summary cards and stack discovery.
- `CRON_SECRET` — Optional bearer secret for `/api/cron/lapse-check`.
