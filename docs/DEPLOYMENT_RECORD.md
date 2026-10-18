# Pilot deployment record — 2026-10-18

- Garden: https://anonymous-garden.vercel.app/
- Owner panel: https://anonymous-garden.vercel.app/admin
- Public source: https://github.com/tainsinmoe04/anonymous-garden
- Functional deployment source: commit `87a8971` (documentation-only updates may follow).
- Hosting: existing Vercel Hobby scope; no paid upgrade performed.
- Database: dedicated Neon `free_v3` resource `anonymous-garden-db`, Singapore (`sin1`); visitor Auth and Realtime disabled. No local stories/sessions were copied.
- Server runtime: Node.js 24, Next.js 16.4.2; function region configured `sin1`. Build region is separate.
- Secrets: production-only private environment variables; bot/chat/cron values marked Secret. Ignored local setup files and database were excluded from GitHub.
- Owner credential: generated privately into `.garden-data/hosted-admin-login.txt`; never printed in chat, logs or public source. Save it securely; the local-development credential is a separate credential.

## Verification

- 24 unit/security/store tests, including a PostgreSQL-engine (PGlite) journey.
- 45 isolated local HTTP assertions, with production database and notification credentials explicitly cleared.
- Build/type checks and secret-pattern/release checks passed.
- GitHub Actions passed for the functional deployment commit: https://github.com/tainsinmoe04/anonymous-garden/actions/runs/39098820602
- 31 live HTTPS assertions: hosted state, unauthorized Admin isolation, moderator login, Secure/HttpOnly cookies, age attestation, clean story publication, private capability separation, held-story isolation, PII revision, encouragement review/counts, version-conflict rejection after edits, reports and cross-origin rejection.
- Separate hosted database confirmation recorded one successful generic Telegram delivery; no story content was included. The outbox did not instantly drain every newly added test item because the five-minute cooldown is intentional.
- Authenticated maintenance returned 200; unauthenticated maintenance returned 401.
- The agent's identified fictional fixtures were deleted; hosted story count was zero immediately after cleanup. No existing user content was removed.
- Desktop and 390×844 emulated mobile inspected, with no horizontal overflow; Myanmar/English switch, age gate and share form verified. Browser app errors were absent; the Three.js/R3F clock deprecation warning remains.
- Owner moderation UI confirmed connected notifications and an empty review queue. Submissions were opened after verification; `/api/garden/state` confirmed `accepting: true`.

## Operating limits

Keywords can miss harmful text and identifying details; unflagged new text auto-publishes by the owner's chosen policy. Edits always require review. The owner should pause submissions whenever unavailable. There is no promise of immediate review or emergency response.

The free hosted configuration uses immediate request-triggered delivery and a daily authenticated maintenance retry. It does not provide the local process's minute-by-minute idle retry. Free provider quotas apply; no paid plan was purchased. Device notification receipt and independent specialist/security/accessibility review are not certified by these checks. Provider backup/log retention must be considered when handling real disclosures.
