# Anonymous Garden — Codex Project Handoff

**Status:** Product discovery / pre-implementation  
**Purpose:** Non-commercial, privacy-first, anonymous peer encouragement website  
**Audience:** Adults 18+  
**Languages:** Myanmar (Burmese) and English  
**Working title:** Anonymous Garden (NOT final branding)

> **Instruction to Codex:** Read this entire handoff first. Do not assume an existing repository, approved stack, final name, or completed implementation. Inspect the actual project workspace before making changes. First propose a concise implementation plan, surface critical decisions, and build in small verifiable phases. Do not silently invent product requirements.

## 1. Vision

Create a peaceful, visually beautiful interactive 3D flower garden where strangers can anonymously share personal stories and leave supportive public messages. The product is **not** a social network, private messaging app, dating app, counseling service, or suicide prevention service. There is **no monetization**. Its core principle is: **Nobody should be left unheard.**

Every flower represents an anonymous story. Visitors enter without registration and choose one of two paths:

1. **Share a story** (plant a flower).
2. **Offer encouragement** (explore the garden and leave a kind public response).

People who have received **zero approved encouragement messages** should be prioritized for exposure.

## 2. Confirmed Product Decisions

- Adults-only (18+) with a simple age self-attestation screen; no DOB, ID, passport, selfie, phone, or email collection. Self-attestation is **not** verified proof of age; check relevant laws before launch.
- No account, sign-in, Google OAuth, user profiles, follower system, likes, popularity rankings, private messages, or direct chat.
- No advertising, analytics trackers, or country/IP-based story ranking.
- Two interface/content languages: Myanmar and English. Myanmar mode primarily shows Myanmar-language stories; English mode shows English-language stories globally. Do not use geographic targeting. Allow visitors to switch languages.
- Visitors choose their own flower when submitting a story; flower choice is expressive, **not** a mandatory trauma category or diagnostic label.
- Story author can revisit their flower and read approved encouragement messages without an account.
- Comments are public encouragement attached to a story, **not** a threaded conversation. Author replies are **not yet decided**; do not implement them without approval.
- Screen harmful comments **before** public publication; rejected submissions show an immediate, respectful on-screen explanation and opportunity to revise.
- Stories also require safety/privacy screening before public publication.
- Sensitive disclosures (abuse, trauma, grief, mental health difficulties) must not be automatically banned just for mentioning sensitive words.

## 3. Five Flowers and Meaning

Use five selectable, visually distinct 3D flowers. These meanings are *project symbolism*, not universal or scientifically fixed meanings of floriography:

| Flower | Symbolism | Suggested appearance |
|---|---|---|
| Lily | Healing, renewal | Soft white / ivory |
| Daisy | Innocence, new beginnings | White petals, warm yellow center |
| Forget-Me-Not | Remembrance, being heard | Delicate blue |
| Lavender | Calm, devotion | Soft lavender / purple |
| Camellia | Affection, admiration | Muted blush pink |

**Suggested signature flower:** Forget-Me-Not. Users may pick any flower regardless of story subject. Avoid presenting flower selection as a mental health diagnosis.

## 4. Main User Journeys

### 4.1 First visit
1. Minimal, accessible adults-only notice and content sensitivity notice.
2. Confirm 18+ (self-attestation; do not collect age or DOB).
3. Select Myanmar or English. Language selection may be stored locally if necessary, but disclose this accurately.
4. Choose **Share a Story** or **Leave Encouragement**.

### 4.2 Share a story
1. Write a story with clear expectations: public anonymous posting, safety rules, and no emergency response promise.
2. Choose a flower from the five types.
3. Run server-side safety checks BEFORE publishing. Explain potentially identifying details and allow editing.
4. On success, generate a public story/flower identifier plus a **separate high-entropy private management secret/link**. Never use a short guessable secret or expose the management secret in public links.
5. Explain that anyone with the private link may manage the story, that loss of the link may mean loss of management access, and that the author should save it securely.
6. Author can revisit the flower, read approved encouragement, and delete the story through the management capability.
7. Do not promise automatic recovery without accounts.

### 4.3 Leave encouragement
1. Render a performant 3D garden with accessible 2D/list fallback.
2. Selecting a flower opens an eligible story, with priority to stories with **zero approved encouragement** in the visitor's selected language.
3. Among equally eligible zero-response stories, choose fairly/randomly; avoid permanently starving other stories.
4. If none have zero responses, select stories with fewer approved responses using fair rotation.
5. Read story with optional sensitive-content warning, write encouragement, and submit.
6. Check the comment on the server before publication. Approve safe messages; reject clearly harmful messages with a gentle warning; hold uncertain messages for review.
7. Never show an unapproved comment as published.
8. Avoid claiming a visitor has 'never seen' a story unless there is a legitimate privacy-preserving way to establish this. Without identity/tracking, **perfect per-person deduplication is impossible**. A short-lived, optional local seen-story set may reduce repeats but must be disclosed, minimize retention, and not be treated as an identity.

## 5. Story Selection — Suggested Algorithm

Hard filter: approved and public stories in selected content language; exclude deleted, blocked, and pending stories.

Sort/select by:
1. `approved_encouragement_count == 0` first.
2. Fair random selection/rotation within that group.
3. When no zero-response stories remain, favor lower counts while avoiding starvation.

Do not use country, nationality, geolocation, gender, age, or popularity. Prevent race conditions when calculating counts. Do not game this with likes or engagement metrics. The number of responses is used internally for fair exposure, not a public popularity scoreboard.

## 6. Safety and Moderation — Launch Blocker

This website may receive disclosures of sexual violence, abuse, self-harm, or suicidal thoughts. **Do not launch a fully open anonymous posting system without reliable moderation, reporting, incident procedures, and a person responsible for review.** AI and keyword matching can make mistakes.

### 6.1 Both stories and comments
- Validate length, encoding, links, spam patterns, and abuse attempts on the server.
- Detect obvious personal identifiers (phone numbers, email addresses, exact addresses, social handles); allow safe editing/redaction before publication. Detection is imperfect, especially for Myanmar names and free-form addresses.
- Distinguish first-person disclosures and supportive quotations from threats, encouragement of violence/self-harm, harassment, doxxing, and instructions for harm.
- Three outcomes: **approve**, **reject with explanation**, **hold for human review**. Do not publish held material.
- Keywords and regex are only preliminary checks; do not use single-keyword auto-rejection for sensitive disclosures.
- AI moderation is optional only if an adequate alternative review process exists; budget, false positives/negatives, Myanmar language quality, and provider data handling must be assessed.
- Add public report functionality and moderator takedown tools, with abuse-resistant workflows.
- Rate-limit submissions and prevent bot flooding with privacy-minimizing safeguards. No account-based banning is possible; avoid claiming permanent user bans without persistent identity.
- Do not send raw stories to third-party AI vendors without clear disclosure and an assessed data-processing policy.

### 6.2 Crisis-related content
- The site is **not** an emergency response service, therapy, or suicide prevention hotline.
- When text suggests imminent danger, show compassionate immediate guidance to contact local emergency services, a trusted person, or a relevant crisis service. Do not fabricate a country-specific hotline; let the visitor choose a location voluntarily if resource lookup is implemented.
- Do not suggest that anonymous community replies will arrive in time to keep someone safe.
- Preserve the author's draft locally in the form while showing guidance; do not simply erase a plea for help.
- Hold or restrict high-risk public content pending review; avoid sharing detailed methods or instructions for self-harm.
- A reviewer cannot reliably contact an anonymous poster. Document this limitation and do not promise intervention.
- Prepare clear moderation escalation guidelines with expert review before public launch.

### 6.3 Example rejected-comment notice
**EN:** “Let's keep this garden kind. Your message hasn't been published. Please review your wording and try again.”

**MY:** “ဒီနေရာလေးကို လူတိုင်း လုံခြုံစွာ ရင်ဖွင့်နိုင်တဲ့ ပန်းခင်းလေးအဖြစ် ထိန်းသိမ်းချင်ပါတယ်။ မင်းရဲ့စာကို လက်ရှိပုံစံအတိုင်း မတင်နိုင်သေးပါဘူး။ စကားလုံးလေးတွေ ပြန်စစ်ပြီး ထပ်ရေးပေးပါနော်။”

Make messages accessible and specific enough to help legitimate users without revealing easily exploitable filter details.

## 7. Privacy and Security Requirements

**Promise:** “No account required. No personal information requested.” **Do not promise:** “We collect absolutely no data.” The product must store submitted stories and encouragement; hosting, security, and moderation systems may process metadata.

- No mandatory real name, DOB, email, phone, social login, or precise location.
- No country detection or IP-based ranking.
- Document infrastructure logs, retention periods, moderation records, AI processor disclosures, cookies/local storage, backups, deletion limitations, and any unavoidable security metadata.
- Store only the minimum content and metadata required. Use strong random management secrets; store hashes of secrets where practical; never put secret tokens in analytics, referer leaks, or public metadata.
- Server-side authorization for edit/delete/management routes; do not rely on client-only checks.
- Protect against XSS, CSRF where relevant, SQL injection, enumeration, brute-force, spam, and denial-of-service.
- Plan a safe deletion process for stories and associated encouragement; specify backup retention transparently.
- Consider accessibility, trauma-informed language, mobile usability, slow networks, and low-end phones.
- Avoid logging raw sensitive story bodies and secrets by default.

## 8. UX / Art Direction

- Quiet, immersive, cinematic **3D flower garden** with soft ambient light and subtle motion; not a loud game or social feed.
- Different flower shapes and colors; no popularity-driven brightness or 'unloved' wilting metaphors.
- Premium, minimalist, emotionally warm interface; restrained typography and subtle animations.
- Fast loading, reduced-motion support, keyboard navigation, screen-reader accessible story list, readable contrast, and a 2D fallback.
- Strong Burmese Unicode rendering, Myanmar font QA, and separate English/Myanmar content strings.
- The 3D experience is a presentation layer, **not** the only way to access stories.
- Suggested landing line: “Some stories are never spoken. But every story deserves to be heard.”

## 9. Proposed Architecture — Not Yet Approved

Do not assume the final stack. After inspecting the workspace, propose a simple, low-maintenance solution. A reasonable candidate is Next.js + TypeScript + Tailwind, React Three Fiber / Three.js for optional 3D, and PostgreSQL or a managed database for stories/comments/moderation. Backend checks and permissions must remain server-side. Consider hosting costs and content-safety operational costs even though the product is non-commercial.

Suggested entities:
- `stories`: id, language, flower_type, body, status, created_at, updated_at, deleted_at, management_secret_hash, content_warning_flags.
- `encouragements`: id, story_id, body, status, created_at.
- `moderation_events`: id, target_type, target_id, action, reason_code, created_at, minimal reviewer metadata.
- `reports`: id, target_type, target_id, reason_code, status, created_at.

Schema is illustrative, not final. Avoid storing user identity or precise location. Add indexes for approved-story selection and counts. Protect private management actions with capability tokens.

## 10. MVP Scope and Phases

**Phase 0 — Decisions and threat model:** Confirm unresolved product decisions, data handling, moderation capacity, legal/age-access requirements, and deployment environment. Document operational responsibility. No public launch yet.

**Phase 1 — UX prototype:** Landing, 18+ notice, language selection, share form, flower picker, garden visualization, story view, encouragement form, revisit/private management experience. Use fake seed data; no public submissions.

**Phase 2 — Secure backend:** Story storage, public/private capability links, deletion, server-side moderation states, fair selection, rate limiting, reporting, and moderator workflow.

**Phase 3 — Safety QA:** Adversarial comment tests, Myanmar/English moderation cases, PII leakage, crisis guidance, accessibility, slow/mobile performance, privacy audit, and independent review of safety copy.

**Phase 4 — Limited pilot:** Invite a small number of consenting adults; monitor moderation workload and false positives. Launch publicly only after safety controls and operational support are demonstrably adequate.

## 11. Acceptance Criteria

- A visitor can browse, submit a story, and leave encouragement without registering.
- Language selection controls content language; no geographic ranking or tracking.
- Every approved story is represented by a selectable flower or accessible equivalent.
- Zero-approved-response stories receive selection priority.
- A story author can return using a private capability link and read approved encouragement.
- Public story URLs cannot grant management access.
- Rejected/held comments never become publicly visible; rejected authors see a clear notice.
- Unsafe stories and PII are screened before public display; moderation does not indiscriminately block trauma disclosures.
- Authors can delete their story via the private management capability.
- Accessibility, responsive layout, reduced motion, Burmese Unicode, and 2D fallback work.
- No account, social login, mandatory personal profile, analytics trackers, or country-based ranking.
- Crisis messaging does not promise emergency monitoring or guaranteed support.

## 12. Explicitly Unresolved — Ask Before Implementing

1. Final brand name, domain, and visual identity.
2. Can story authors reply to encouragement? **Default: no threaded replies.**
3. Can authors edit a posted story, or only delete it? What are moderation rules for edits?
4. Will users be able to opt out of receiving encouragement or select 'just listen'? Not confirmed.
5. Content length limits, public retention/deletion schedule, and whether stories expire.
6. Who performs human moderation, on what schedule, and what happens while no moderator is available?
7. Final moderation vendor/model, privacy implications, and costs.
8. Final technical stack, hosting, and domain.
9. Whether English/Myanmar cross-language translations are allowed. **Default: no automatic translation.**
10. Applicable jurisdictions, age restrictions, and legal/privacy review before launch.

## 13. Immediate Codex Assignment

1. Inspect current directory/repository and report findings.
2. Summarize this handoff in a short project brief and identify any contradictions or high-risk assumptions.
3. Propose a phased architecture, privacy/threat model, and UX screen map; distinguish approved requirements from proposals.
4. **Do not implement or deploy a public anonymous submission service until safety and moderation prerequisites are addressed.**
5. Once approved, start with a high-quality responsive **mock-data prototype**, with tests and clear run instructions.

**North star:** A beautiful, quiet place for human kindness — no popularity contests, no identity requirement, no one intentionally left unheard.
