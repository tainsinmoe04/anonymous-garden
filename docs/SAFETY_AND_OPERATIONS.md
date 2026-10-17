# Local safety and operations guide

The currently running installation is a local development service. Hosted PostgreSQL support is implemented, but production provisioning and live verification remain outstanding; public deployment is not yet confirmed. Visitor text now persists; use fictional text for testing. The illustrated garden still uses layered 2.5D flower meshes, not fully sculpted botanical models.

## Owner decisions implemented

- One owner reviews flagged content through `/admin`.
- Unflagged new stories and encouragement are automatically approved by the server's rules, as requested. This is not a semantic assessment or a guarantee of safety.
- Flagged text waits privately for the owner. Trauma and first-person disclosures are not rejected merely for mentioning sensitive subjects.
- Posted story edits require another human review, even if unflagged. The story and its encouragement are hidden while its changed context is reviewed.
- No threaded replies, accounts for visitors, Google sign-in for visitors, translation, likes, profiles, private chat, advertising, geolocation, or analytics were added.
- Notifications contain a generic review notice and the admin URL only. No raw story, comment, reporter information, or private management capability goes to email or Drive. Gemini is not connected.

## Moderation policy

Rules are versioned in `src/server/moderation.ts`. Categories include harm, threats, abuse/trauma, harassment/slurs, sexual/exploitation concerns, sensitive health content, possible location details, risky advice, solicitation, and suspicious formatting. They include English and Myanmar terms. Myanmar phone digits and Unicode compatibility forms are normalized for screening. Some common spaced-out English abuse patterns are flagged. Invalid Unicode/control characters, obvious phone/email/contact handles, links and spam patterns request revision before storage. Drafts remain in the form.

The owner can add up to 100 literal words/phrases through the protected admin panel. They trigger review, not automatic rejection. These changes apply to new submissions and edits; they do not retroactively scan already-public text. There is no exhaustive “all bad words” list. Indirect language, alternate spellings, Burmese names/free-form addresses, novel abuse and context can evade these rules. Ordinary disclosures can also be unnecessarily held. Public launch requires adversarial testing and qualified Myanmar/English review; additional semantic moderation may be needed.

For each review, read the entire text. Distinguish disclosure/quotation from directed harm. Do not approve identifying details, threats, targeted harassment, exploitation, dangerous instructions, or promises of diagnosis/emergency intervention. The UI requires an explicit review acknowledgement before approval. A rejected story stays private so its author can revise it. Removal deletes the active content. Story versions prevent stale approvals after edits.

Encouragement review includes the parent story. An encouragement cannot be approved while its parent is awaiting review, and a stale parent version requires refreshing before approval. This prevents approving a reply against an earlier context after an author edits the story.

For high-risk disclosures, show compassionate immediate guidance, keep the draft, and hold the material. Do not publish detailed methods. Do not promise that you can identify, contact or rescue an anonymous visitor. The site is not an emergency service. Expert review of escalation procedures remains a launch dependency.

## Owner coverage

Use “Pause submissions” when unavailable. This stops new stories, encouragement and edits; approved reading and reports remain available. No review deadline is promised. The owner has not yet specified a coverage schedule or a backup reviewer. Do not rely on email as an emergency monitoring system.

## Data and privacy

- SQLite file: `.garden-data/garden.sqlite`, ignored by Git. It is local, single-server development storage. Use an encrypted disk and restrict OS/file access before handling real disclosures. This setup is not a serverless/Vercel database. A PostgreSQL adapter and hosted schema are now implemented; actual managed database provisioning and remote verification remain outstanding.
- Stories store language, flower, text, moderation state, timestamps, version, policy flags and a hash of a 256-bit management secret. Public responses never include that hash or secret.
- Encouragement is public only when both it and its parent story are approved. Counts are derived inside database transactions; pending/rejected comments do not affect zero-response priority.
- No raw IP, country, location, visitor name or email is stored. One-hour random visitor cookies support self-attestation and limits. Their hashes are stored separately from content, not as story author identities. They are not perfect bot prevention and do not enable permanent user bans.
- Separate one-hour HttpOnly, SameSite=Strict cookies authorize management and moderator sessions. Secure cookies are used on HTTPS; the current localhost preview is HTTP. Reopening a private link exchanges its fragment secret through a POST, then removes it from the address bar. Global referrer policy is `no-referrer`.
- Report reasons are fixed categories rather than free-text personal data. Reports do not automatically remove content; the owner reviews them.
- Rate buckets have short expiry (at most an hour). Moderator login has a global eight-attempt/15-minute limit. Visitor submissions/reports have a shared session quota, with global burst/hourly caps. Clearing cookies can evade a session quota; global caps provide additional backpressure. Public internet DoS protection is not implemented by these controls alone.
- Content has no automatic expiry in this local version: it remains until its author or the owner deletes it. A production retention schedule must still be agreed.
- Author deletion removes the active story, encouragement, associated reports and current management sessions; it clears related content moderation rows. Moderator takedown can retain a minimal content-free audit event. Deletion uses SQLite secure deletion and WAL checkpointing as best efforts, not a promise of forensic erasure.
- Minimal audit records older than 30 days and sent notification metadata older than seven days are removed on subsequent API requests. Expired sessions/rate buckets are also cleaned on requests. No independent cleanup scheduler or backup process has been provisioned. Offline files, copied public text, OS snapshots and independently created backups can remain.
- Hosting request logs, storage region, backup deletion, production encryption and operational incident handling must be reviewed for the selected deployment. Application handlers do not log story bodies, management secrets or credentials.

## Email setup

The owner's requested recipient and non-secret Gmail SMTP fields are configured in the ignored `.env.local`. **No SMTP password has been configured, and no real email has been sent.** The protected admin panel shows queued notifications and configuration status.

To connect an approved SMTP account, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, and `MODERATOR_NOTIFICATION_EMAIL` locally. Do not paste credentials into chat or put them in Git. A regular Google account password should not be used for this SMTP setup. Google recommends OAuth-based sign-in where available; for an eligible account using an app password, Google's current instructions require two-step verification and describe account restrictions: [Google's app-password guidance](https://support.google.com/accounts/answer/185833). Account-security changes and credential creation must be completed by the owner.

Restart the local server after environment changes. `npm run notifications:send` retries the persisted outbox. Requests that create review work also try delivery after responding, and the admin panel offers retry. Delivery is grouped, rate-limited to at most one successful notification per five minutes in this single-process setup, and failed attempts remain queued with a five-minute retry delay. With GARDEN_NOTIFICATION_WORKER=1, the persistent local Node server checks the outbox every minute, while the existing five-minute retry/cooldown policy still applies. Requests and the explicit retry command also attempt delivery. The worker stops when the server stops; it is not a production/serverless scheduler. A database lease prevents concurrent worker, route and CLI delivery attempts. The active queue remains authoritative.

Local email links point to localhost and work only on this computer. Mobile/remote access requires a properly hosted, reviewed installation. Successful SMTP delivery and inbox receipt remain unverified until the owner supplies credentials and authorizes a real delivery check.

## Before public access

Agree on jurisdiction/age-access and privacy review, review coverage and backup, retention/backups, deployment/database and budget, native Burmese copy/moderation evaluation, crisis escalation review and independent accessibility/security testing. Review the local-only request guard rather than removing it to bypass these prerequisites. Load-test fair selection and abuse controls on the chosen infrastructure. Verify the selected notification channel without exposing sensitive text.

## Telegram notifications (optional, free Bot API)
Create a bot with Telegram's official @BotFather and start a private chat with the bot. Store TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env.local only; never paste the token in chat or commit it. Restart the server after changing configuration. Telegram takes precedence over SMTP when both variables are set. Notifications contain only a generic review notice and the admin URL, with previews disabled; no story text, author secret or visitor identifiers. The existing five-minute batching and retry outbox apply. On Vercel, the local interval is disabled; request-triggered delivery and authenticated daily maintenance replace it. This uses normal free Bot API messages, without paid broadcasts. The owner has now configured Telegram locally. On 2026-10-17, getMe and private getChat checks passed and Telegram accepted one generic connection-test message; device receipt was not independently confirmed. A localhost admin URL opens only on the computer running the app; remote reviewing needs a secured hosted deployment.
Official setup: https://core.telegram.org/bots/tutorial and https://core.telegram.org/bots/api#sendmessage
