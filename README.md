# Anonymous Garden

A nonprofit, privacy-first anonymous emotional-support garden for adults 18+, with Myanmar and English interfaces. Visitors can share public anonymous stories and offer encouragement without an account. This is not an emergency response or counseling service.

The immersive garden uses detailed botanical textures on moving WebGL meshes, glass controls, ambient light motes and a gentle petal celebration after approved encouragement. A list view and reduced-motion behavior are available. The flowers are layered 2.5D cutouts, not fully sculpted botanical models.

## Implementation status

- Persistent SQLite for local development; PostgreSQL adapter and schema for Vercel.
- Server-side Myanmar/English rules: unflagged new text auto-publishes as requested, flagged content waits privately for the owner. Keywords cannot guarantee safety.
- Protected owner moderation, reports, takedown, submission pause/resume and additional review terms.
- Strong separate private management capabilities, edit/re-review, version checks and cascading deletion.
- Zero-approved-response priority with fair, language-scoped story rotation.
- One-hour HttpOnly sessions, same-origin mutations, bounded input, persistent rate limits, no raw IP storage or visitor accounts.
- Generic Telegram notifications containing only an admin link; persistent outbox, retry and cross-process delivery lease.
- Hosted HTTPS origin enforcement, no SQLite fallback on Vercel, authenticated maintenance route and deployment configuration.
- Unit/security/store tests, PostgreSQL-engine tests, 45 isolated HTTP integration checks and GitHub Actions verification.

Pilot deployment is live at https://anonymous-garden.vercel.app with production PostgreSQL, owner moderation and Telegram notifications. Remote verification completed on 2026-10-18. See docs/DEPLOYMENT_RECORD.md for the exact checks and operational limits.

## Local run

Requires Node.js 24 and npm.

```powershell
npm ci
npm run admin:setup
npm run build
npm run start -- -p 3001
```

Garden: http://127.0.0.1:3001/  
Owner panel: http://127.0.0.1:3001/admin

The owner credential is saved privately in `.garden-data/moderator-login.txt`; it is not printed. Save it securely and remove the temporary file. `npm run admin:setup -- --rotate` intentionally replaces it and revokes moderator sessions. Do not run that command just to restart the app.

`npm run dev` runs at http://127.0.0.1:3000. Use one local server per database and stop dev before building into the same `.next` folder. Use fictional content while testing.

## Telegram

```powershell
npm run telegram:setup
```

Hidden local token entry verifies the bot and offers only private chats before saving to ignored `.env.local`. Setup does not send a message. See [မြန်မာလို ချိတ်နည်း](docs/TELEGRAM_SETUP_MY.md). Never paste bot tokens into chat or GitHub.

A persistent local Node server with `GARDEN_NOTIFICATION_WORKER=1` checks the outbox each minute, retaining the five-minute cooldown/retry policy. `npm run notifications:send` and Admin retry are also available. Vercel disables this process timer and uses request-triggered delivery plus authenticated daily maintenance. Failed idle delivery on the free hosted setup is not guaranteed to retry within minutes.

## Verify

```powershell
npm run release:check
npm test
npm run typecheck
npm run build
npm run test:integration
```

The HTTP suite uses a disposable fictional SQLite database on port 3002 and explicitly clears production database/Telegram configuration. It checks auth, CSRF, moderation isolation, custom review terms, edits, reports, pause/resume, deletion and restart persistence. PostgreSQL SQL behavior is separately exercised with PGlite; real hosted connectivity and the main anonymous-management/moderation journey were also verified separately.

## Deploy to Vercel

Read [deployment steps and current blockers](docs/DEPLOYMENT.md). Use a persistent PostgreSQL database; the local SQLite file must never be uploaded as application storage. New hosted schemas start with submissions paused, and no local stories are copied to the cloud.

Production credentials belong only in Vercel environment settings and ignored local setup files. Preview deployments must not receive production database or Telegram credentials. The repository has no default moderator password.

## Privacy and operations

Read [safety and operations](docs/SAFETY_AND_OPERATIONS.md). Sensitive disclosures are held for human review rather than automatically rejected for a keyword. First-person disclosures, indirect abuse, identifying details and Myanmar spelling variants still need qualified review.

Stories persist until an author or owner deletes them. Deletion removes active associated records, but public copies/provider backups may remain. Hosted infrastructure can process request/security metadata under its own policies. No analytics, advertising, geolocation ranking, private chat, likes, user profiles or automatic translation are implemented. No story content is sent to Gemini or another AI provider.

Before handling real disclosures, establish owner review coverage and incident procedures, confirm provider regions/log/backups and privacy disclosures, and complete native-language, accessibility and security review. Self-attestation does not verify age.

## Source map

- `src/components/GardenApp.tsx`: visitor/author journeys.
- `src/components/GardenScene.tsx`, `PetalFall.tsx`: garden visuals.
- `src/components/ModeratorPanel.tsx`, `KeywordSettings.tsx`: owner review.
- `src/server/moderation.ts`: versioned rule screening.
- `src/server/database.ts`, `schema.ts`, `store.ts`: storage and workflows.
- `src/server/security.ts`: capability, session, origin and quota checks.
- `src/server/notifications.ts`: generic notification delivery.
- `src/app/api/garden/[...path]/route.ts`: application API.
- `src/app/api/maintenance/route.ts`: authenticated maintenance.
- `src/lib/service-copy.ts`, `hosted-copy.ts`: accurate bilingual disclosures.
- `docs/ANONYMOUS_GARDEN_CODEX_HANDOFF.md`: original brief; later owner decisions are recorded in operations/art direction docs.
