# Vercel deployment

The source supports persistent PostgreSQL on Vercel and SQLite only for local development. The public GitHub repository contains code and fictional samples, never the local database, `.env.local`, Telegram credentials or moderator login files.

## Current status

- Local SQLite journeys and a PostgreSQL-engine (PGlite) suite pass.
- Hosted origins require one explicitly configured HTTPS origin, with same-origin mutation checks.
- No automatic SQLite fallback is permitted on Vercel.
- The production schema starts with submissions paused. An authenticated owner can open submissions after live verification.
- Vercel login, free database provisioning, production environment setup and remote end-to-end verification must finish before claiming a working deployment.

## Account and project

Authenticate the Vercel CLI in the owner's account. Link only the intended `anonymous-garden` project under the owner's existing scope. Use a free Neon PostgreSQL integration; do not purchase a plan or enter a paid billing agreement. Read the selected resource's current free limits and region before provisioning. Do not replace existing projects.

Never copy a full `.env` file into chat, GitHub issues or build logs. Production credentials belong only in Vercel's production environment and a Git-ignored local environment file used for initialization. Preview deployments must not inherit production database/Telegram credentials.

## Production configuration

Required private/server configuration:

- `DATABASE_URL`: pooled PostgreSQL connection URL; certificate verification stays enabled.
- `GARDEN_ORIGIN`: exact production HTTPS origin, without a path or trailing slash.
- `GARDEN_DEPLOYMENT_MODE=hosted`.
- `GARDEN_NOTIFICATION_WORKER=0`: persistent-process timers are not used on Vercel.
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`: reuse the owner's existing private bot destination.
- `CRON_SECRET`: at least 32 random characters, generated without printing.
- `NEXT_PUBLIC_GARDEN_HOSTED=1`: non-secret build flag selecting accurate hosted privacy text.

Use Node.js 24, the existing npm lockfile and Next.js framework settings. `.vercel/` is Git-ignored. A local project link is required before database initialization.

```powershell
npm run db:initialize -- --env-file .garden-data/initialize.env
```

Initialization creates the PostgreSQL schema and a new moderator credential only if one does not exist. The credential is saved to `.garden-data/hosted-admin-login.txt` without printing. Existing moderator passwords and database content are preserved. It does not copy local stories or visitor sessions into the cloud.

## Notifications and maintenance

New held content attempts delivery through Next.js `after`. A PostgreSQL lease prevents concurrent duplicate send attempts. The five-minute cooldown and retry queue remain.

`/api/maintenance` requires `Authorization: Bearer <CRON_SECRET>` and runs cleanup plus notification retry. `vercel.json` contains a daily maintenance schedule compatible with a low-frequency free deployment; confirm current Vercel plan limits before deployment. Idle failed notification delivery is not guaranteed to retry within minutes on Vercel. Admin retry and subsequent activity also trigger attempts. No emergency monitoring or response deadline is promised.

## Verification before opening submissions

Run `npm run release:check`, `npm test`, `npm run typecheck`, `npm run build` and `npm run test:integration`. GitHub Actions repeats these without production secrets.

Then verify remotely with fictional data: age gate, management-link secrecy, unflagged approval, held-content isolation, owner review, version conflicts after edits, reports, private deletion, secure cookies, origin rejection and generic Telegram delivery. Verify the garden at desktop and mobile sizes. Remove only the agent's identified fictional fixtures. Check actual provider backup/log retention and region, owner review coverage and the site's privacy text before handling real disclosures.

A successful build or GitHub push alone is not proof that the hosted database or moderation workflow works.
