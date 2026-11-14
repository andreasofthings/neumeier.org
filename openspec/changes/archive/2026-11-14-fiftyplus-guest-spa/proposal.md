# Proposal

## Why

Andreas' 50th birthday party (29 May 2027) needs guest registration. The page lives at `/fiftyplus/` on this static Hugo site (GitHub Pages); guests RSVP through it. An untracked draft exists (`content/fiftyplus/`, `static/fiftyplus/`) but was built with an admin view and an unfinished integration: no config data file, no config injection, and the backend is a separate project that has not started. This change replaces the draft with a cleanly scoped guest frontend and freezes the frontend side.

## What Changes

- Replace the existing draft SPA (untracked `content/fiftyplus/index.html`, `static/fiftyplus/app.js`, `static/fiftyplus/style.css`) with a single self-contained page at `content/fiftyplus/index.html`: mark-up, stylesheet, script, and configuration all inline; the draft's separate files are dropped, not preserved. **BREAKING** for the draft's admin path: the new page has no admin view. The host-facing admin (guest list, import, export, remind, delete) moves to the separate Django backend project and is not part of this repo.
- Provide a generic static `event.ics` download (no authentication, since a browser navigation cannot send a Bearer header); personalized calendar delivery stays in the invitation email produced by the API.
- Handle rejected guests clearly: a 403 in the guest flow shows a bilingual "not on the guest list" message rather than a session-expired error.
- Freeze the API contract the SPA depends on (endpoints, token claims, error shape) as requirements for the separate Django project; the backend itself is out of scope for this repo.
- Document the authentik (id.pramari.de) provider configuration this flow depends on (public client + PKCE, RS256 signing, email verification), so it can be set up independently.

## Capabilities

### New Capabilities

- `fiftyplus-guest-registration`: the guest-facing registration page at `/fiftyplus/` — self-contained vanilla-JS SPA with authentik OIDC login, RSVP form (attending, spouse, kids, message), DE/EN i18n, success/edit states, and friendly error handling.
- `fiftyplus-api-contract`: the REST contract and identity requirements the guest SPA depends on from the external `fiftyplus-api` (Django) service — endpoint shapes, authentik-issued Bearer tokens with verified email, allowlist behavior, invitation mail semantics.

### Modified Capabilities

<!-- None: the project has no existing specs. -->

## Impact

- Code: `content/fiftyplus/index.html` (rewritten as one self-contained page — config, CSS, JS inline) and a new static `event.ics` asset. No data file, no layout override, no separate JS/CSS assets: the untracked draft `static/fiftyplus/` files are deleted and `extend_head.html` stays untouched.
- External: the separate `fiftyplus-api` Django project implements `fiftyplus-api-contract`; authentik at id.pramari.de must be configured (application slug `fiftyplus`, public client, redirect URI, RS256 signing key, email verification) per the checklist in `design.md`.
- No backend code, no admin UI, and no mail delivery live in this repo. GitHub Pages deployment (`.github/workflows/hugo.yml`) is unaffected structurally.
