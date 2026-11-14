# Design

## Context

An untracked draft exists in this repo: `content/fiftyplus/index.html`, `static/fiftyplus/app.js` (~985 lines, guest + admin views), `static/fiftyplus/style.css`. Per the review decision, the implementation MAY ignore it entirely: it is a disposable reference and will be replaced at the same paths. It still informs the plan — it already exercises the intended API contract (endpoint shapes, OIDC parameters, i18n strings), so the fresh build does not start from zero. What does not exist: any configuration file or injection — under the single-file decision the page embeds its configuration. The site is Hugo/PaperMod built by GitHub Pages; anything server-side belongs to the separate Django project (see proposal). Authentik at id.pramari.de is the identity provider; docs current as of authentik 2026.8.

## Goals / Non-Goals

**Goals:**
- One static page, robust against PaperMod theme updates (self-contained styles; no partial overrides needed).
- One file owns the whole page (config, style, script), so event texts, styles, and the API endpoint change in one place with no build plumbing.
- A contract that lets the Django API be built and deployed independently, even after this change ships.

**Non-Goals:**
- No backend implementation (Django), no admin UI, no mail delivery in this repo.
- No authentik admin-UI click-by-click tutorial beyond the setup checklist below; the instance is operated by the site owner.
- No framework/toolchain: vanilla JS only, matching the existing draft.

## Decisions

### 1. Single self-contained page (config, CSS, JS inline)
Everything lives in `content/fiftyplus/index.html`: Hugo treats HTML content files as templates, so the inline `<style>` and `<script>` pass through verbatim into the rendered page, inside the normal PaperMod single layout (site chrome stays). Rationale: for a one-off event page, one file is the smallest moving-parts set — no data file, no partial override, no asset load order — and the page stays trivially portable to any static host. Alternatives considered: a Hugo data file + `extend_head.html` injection (the earlier plan; rejected as unnecessary wiring after review) and separate `static/fiftyplus/app.js`/`style.css` (the draft's shape; rejected: two more files to keep in sync for a single page). If the file ever becomes unwieldy, splitting the script and styles back out is a mechanical refactor that changes no behavior — the spec pins none of this. Two authoring constraints, verified in tasks: no literal `{{`/`}}` sequences in the inline code (Hugo template syntax) and no `</script>` inside JS strings.

### 2. Configuration shape and the `REPLACE-ME` placeholder
The configuration is a plain JS object at the top of the page's inline script:
```js
const FIFTYPLUS = {
  api_base: "REPLACE-ME", // Django API URL; REPLACE-ME keeps the "not configured" path
  auth: { base: "https://id.pramari.de", slug: "fiftyplus", client_id: "fiftyplus" },
  event: { date: "2027-05-29", start: "16:00", end: "22:00",
           title_de, title_en, intro_de, intro_en, location, location_en, contact_email },
};
```
`REPLACE-ME` stays load-bearing: the route logic treats it as "service not yet configured" and shows the friendly error, so the page can ship before the API host exists.

### 3. Fresh guest-only SPA in the page's inline script
The SPA script is written fresh — inline in the page — implementing the `fiftyplus-guest-registration` spec: states loading / login / form / done / error, OIDC PKCE with the exact parameters from Decision 6, a DE/EN i18n dictionary, the form (attending, first/last name, spouse, kids rows, message), submit/resend flows, and the 403 mapping from Decision 4. Rationale: the draft's admin half is dead weight, the draft was never verified against a browser or an API, and a clean rewrite is cheaper to reason about than a careful trim. Kept deliberately as *concepts*, not code: the i18n dictionary pattern, the OIDC parameter set (per-app issuer paths, scopes, sessionStorage keys), and the page shell (`#fp-app` mount point + bilingual noscript notice). `data-fp-mode` disappears — there is only one mode.

### 4. 403 means "not on the guest list"
The API maps rejected identities (unverified email, invitee-allowlist miss) to 403. The SPA maps 403 in the guest flow to new `errNotInvited` i18n keys (DE/EN) rather than a session-expired message. Alternatives: silently show a generic error (loses the useful signal); treat 403 as login failure (wrong; the token is valid, the invitee list is the gate).

### 5. Generic static `event.ics` instead of an authenticated `.ics` endpoint
A browser `location.href` download cannot send a Bearer header; fixing that would need signed download links or an API cookie session — both extra machinery for calendar data the SPA already renders publicly. Instead: hand-authored `static/fiftyplus/event.ics` matching `data/fiftyplus.yml` (DTSTART noon UTC 2027-05-29 unless final time/location are known). The personalized `.ics` remains an email attachment owned by the API. Alternative (Hugo output template generating the file from the data file): nicer single-source-of-truth, more machinery for a one-off file — rejected for now, revisit if the event details change.

### 6. Authentik provider setup (external, checklist)
This flow only works once id.pramari.de has (docs: 2026.8):
1. **Applications → Applications → New Application**: name `Fifty+`, slug `fiftyplus`, provider OAuth2/OIDC.
2. **Client type: Public** (SPA; PKCE, no secret). Redirect URIs exact: `https://www.neumeier.org/fiftyplus/` **and** `https://andreasofthings.github.io/neumeier.org/fiftyplus/` for preview testing. Trailing slash matters — `app.js` builds exactly `origin + "/fiftyplus/"`.
3. Scopes `openid profile email` (default mappings). `offline_access`/refresh tokens intentionally skipped: a short session with re-login is acceptable for a form page; avoids storing refresh tokens in `sessionStorage`.
4. **Signing Key: select a certificate-key pair** → tokens become RS256; the Django API validates against `https://id.pramari.de/application/o/fiftyplus/jwks/`. Without this, tokens are HS256-keyed to the client secret, which a public client must not hold.
5. **Email verification** (anti-spoofing; the guest list is keyed by email, and since authentik 2025.10 `email_verified` defaults to false): enrollment flow with an email stage (template "Account Confirmation") after user write; expression policy on the login stage recording `email_verified_address`; custom `email` scope mapping returning `email_verified: (email == verified_address)`, assigned to this provider in place of the default `email` mapping. The API rejects `email_verified: false` (contract).
6. **Enrollment flow open for guests** with sources enabled (shows the Google button; add Google as an OAuth source first if the instance has none) and a user write stage creating active users. Application access stays "all users" — the invitee allowlist lives in the API.
7. **SMTP configured** so verification mails send; **no interactive bot-protection challenges** in front of the token endpoint (authentik docs explicitly warn WAFs break token exchange); CORS on the OAuth2 endpoints to be verified by preflight once the API host exists.

### 7. Contract freeze for the Django backend
The `fiftyplus-api-contract` spec delta is the handoff document: endpoints (`/api/me`, `/api/registration`, `/api/resend`), identity + `email_verified` enforcement, invitee allowlist (403 with distinguishing code → the SPA's `errNotInvited`), invitation mail semantics, `{error, detail}` error shape, CORS origins. The backend maps allowlist hits to a stable error code so the SPA's 403 message stays truthful.

## Risks / Trade-offs

- [CORS/proxy behavior on id.pramari.de unverified until deployed] → preflight curl test against token/userinfo with the Pages origin; a proxy rule if WAF interferes.
- [Fresh rewrite discards the draft's code entirely] → the draft contains nothing verified (untracked, never run against an API or browser); the rewrite is guided by the contract spec and checked with `node --check` plus the browser smoke test in tasks.
- [Guest friction: account creation at id.pramari.de before RSVP] → Google sign-in as the common path; intro text explains why sign-in exists (real guest list, no fake RSVPs).
- [Token expiry mid-form] → 401 path clears session and returns to sign-in; form state loss is minor for a short form.
- [Hand-authored event.ics can drift from the embedded event configuration] → one-off file; tasks fill both from the same final values; Hugo-generated .ics output is the fallback if details change late.
- [Email-claim identity: an authentik account changing email creates a second identity] → acceptable; the API keys upserts on email, and the old registration stays tied to the old address (host can reconcile).
- [Open authentik instance + open application] → abuse bounded by the invitee allowlist in the API; unverified-email enforcement blocks RSVP-as-someone-else.

## Migration Plan

1. Ship this change with `api_base: REPLACE-ME`: page is live, shows the friendly not-configured state, no crash.
2. Configure authentik per Decision 6 (can happen in parallel).
3. Django project implements `fiftyplus-api-contract`; then flip `api_base` in the page's embedded configuration and redeploy — a one-line edit in `content/fiftyplus/index.html`.
4. Rollback is trivial at each step: reverting the page commit restores the previous site; nothing else in the build depends on the page.

## Open Questions

- Final `start`/`end` times and venue text for 29 May 2027 (content for `data/fiftyplus.yml` + `event.ics`, owner decision; does not affect interface decisions).
- The production URL of the Django API (needed only in step 3 above).
