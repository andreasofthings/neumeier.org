# Handoff: fiftyplus-api (Django) — implement + deploy the guest RSVP contract

You are implementing the server side of a birthday-guest RSVP system. The frontend
(user-facing, already deployed and working) is a static vanilla-JS SPA at
https://www.neumeier.org/fiftyplus/. It talks to YOUR API at https://pramari.de/fiftyplus/api/*.
The page is done and committed — do not touch the neumeier.org repo or the authentik
instance; both are working as verified on 15 Nov 2026. All remaining work is in this
Django project.

*(Handoff prepared 15 Nov 2026 during frontend bring-up; wire evidence for every item
below is in the conversation and re-probeable at any time. Frozen contract source of
truth: neumeier.org repo, `openspec/specs/fiftyplus-api-contract/spec.md`.)*

## What exists and is verified (do not break)

- Identity provider: authentik at https://id.pramari.de, application slug `fiftyplus`.
  - Discover: GET https://id.pramari.de/application/o/fiftyplus/.well-known/openid-configuration
    (issuer: https://id.pramari.de/application/o/fiftyplus/, signing: RS256 only,
    scopes: openid profile email, PKCE S256).
  - JWKS: https://id.pramari.de/application/o/fiftyplus/jwks/
  - IMPORTANT endpoint topology: authorize/token/userinfo are GLOBAL
    (https://id.pramari.de/application/o/authorize/, /token/, /userinfo/ — no slug
    in those paths!). Only discovery, jwks and end-session are per-slug.
  - The provider's Client ID is the generated `rbhf5YYZtk7V7OQWVSVJwvEST8aPPuI30mphMF0J`
    (baked into the page config). Client type: Public. Do not change it.
- CORS on this API is verified working for OPTIONS on /fiftyplus/api/me
  (ACAO: https://www.neumeier.org, allow-headers includes authorization).
  Keep it; also allow the preview origin https://andreasofthings.github.io.
- Page config for reference: api_base = https://pramari.de/fiftyplus, so the SPA calls
  https://pramari.de/fiftyplus/api/…

## Current blocker (wire evidence 15 Nov 2026)

GET /fiftyplus/api/me, /api/registration, /api/resend all return Django's HTML
"Page not found" 404. The URL routes are simply not wired (or mounted at a different
prefix). CORS works. Fix the routing, then implement the contract below.

## Token authentication (how to identify the guest)

1. Read Authorization: Bearer <jwt>.
2. Validate it as a JWT with the provider's JWKS (RS256), requiring
   iss = https://id.pramari.de/application/o/fiftyplus/ and aud = the Client ID above.
   Practical: PyJWT's PyJWKClient (or authlib) against the JWKS URL, with caching.
   No client secret, no introspection needed — offline validation via JWKS.
3. Identity = the token's `email` claim, normalized lowercase.
4. MUST reject tokens with `email_verified: false` (guests self-register; this is the
   anti-spoofing gate). Respond 403 with error code below.
5. Token lifetimes are short (no refresh tokens by design). Frequent 401s are normal,
   the SPA handles them by re-prompting sign-in.

## Endpoints (exact contract)

All under https://pramari.de/fiftyplus/api/, JSON only (application/json), errors as
{"error": <code>, "detail": <string, optional>}. Django's HTML 404 pages and
DRF-style {"detail": ...}-only bodies do NOT satisfy the contract — wrap exceptions
or use JsonResponse so every error response has an `error` key.

### GET /api/me
- 401 {error, detail?} — no/invalid token.
- 403 {error: "email_unverified", detail?} — rejected identity: the verified email is the only admission gate; there is no invitee check.
- 200 {"registration": null} — identity is allowed but not yet registered.
  NEVER 404 for a missing registration.
- 200 {"registration": {...}} — existing registration:
  {"first_name", "last_name", "attending": "yes"|"no", "lang": "de"|"en",
   "message": str|null, "created_at", "updated_at", "mail_sent_at": iso|null,
   "companions": [{"kind": "spouse"|"child", "name": str, "email": str|null}, ...]}

### PUT /api/registration
- Body from the SPA (replace companions wholesale each time; upsert per email):
  {"attending": "yes"|"no", "first_name", "last_name", "lang", "message": str|null,
   "companions": [{"kind": "spouse"|"child", "name", "email": str|null}]}
- Upsert exactly ONE record per email (case-insensitive). Resubmissions update,
  never duplicate. Declines ("no") are valid rows and must persist.
- 401/403 same as GET. 200 on success (body can be {"ok": true}).

### POST /api/resend
- Re-sends the invitation email (see Mail) to the authenticated identity and
  updates mail_sent_at. 401/403 same as above; 200 on success.

## Mail

- On first successful registration with attending "yes": send the invitation email
  with an .ics attachment, localized by the stored lang (de/en). If a spouse
  companion has an email, send them a copy too (calendar entry on its way).
- Record mail_sent_at only after actual delivery. No mail for declines.
- Template event data: Fifty+ (Andreas turns 50), 2027-05-29 16:00–22:00 local,
  venue TBD, registration page https://www.neumeier.org/fiftyplus/.
  SMTP credentials: ask the site owner (they have working mail infra).

## Data model (minimum)

- Registration: email (unique, the identity key), first_name, last_name, attending,
  lang, message (nullable), mail_sent_at (nullable), created_at, updated_at.
- Companion: registration FK, kind ("spouse"|"child"), name, email (nullable).
- Invitee (OPTIONAL, informational only): name, email (unique). Feeds an admin cross-check report ("imported invitees who have not registered"); never used as a registration gate.
- Auth is stateless JWT; do NOT use SessionAuthentication (it pulls CSRF into the
  browser flow) — a custom DRF/PyJWT authentication class keeps POST/PUT CSRF-free.

## Host-facing admin (your scope, no cross-system contract)

Registration overview/review with decline-delete (the host's lever), CSV export, "resend reminder" — implement freely
(Django admin is fine); an optional invitee-import feeds only an informational cross-check report ("imported invitees who have
not registered"). The SPA expects nothing here.

## Acceptance tests (definition of done — run these)

1. curl -i https://pramari.de/fiftyplus/api/me
   → 401, application/json, body has "error".
2. OPTIONS preflight (keep passing):
   curl -i -X OPTIONS https://pramari.de/fiftyplus/api/me \
     -H "Origin: https://www.neumeier.org" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: authorization"
   → 200 with ACAO, allow-headers authorization, methods GET/PUT/POST.
3. With a real token (log in via the SPA and copy the sessionStorage fp_token, or
   run a scripted OIDC login): GET /api/me → 200 {"registration": null} first time;
   PUT /api/registration → 200; GET /api/me → 200 with the registration echoed;
   PUT again → still one record, updated.
4. A token with `email_verified: false` → 403 {"error": "email_unverified", ...}. A verified guest whose email was never imported registers normally — registration is open to all verified identities.

## Behavior the user will see in the browser per status (your quality bar)

- 200+null → registration form; 200 with data → prefilled form ("save changes")
- 403 → bilingual "verify your email, then sign in again" (correct UX, not a bug)
- 401 → re-sign-in prompt; anything HTML/DRF-shaped → generic "something went wrong"
  (that last state is what we are eliminating now).
