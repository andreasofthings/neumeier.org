# Proposal

## Why

The invitee allowlist contradicted what the registration page is actually for: guest
email addresses are unknown upfront, and the page URL (`https://www.neumeier.org/fiftyplus/`)
is being printed on flyers so it reaches people nobody ever emailed. The trust anchor is
therefore not "the list knows you" but "an authentik account with a verified email" —
and the host's lever is post-hoc: review registrations, gauge attendance and companion
counts, decline/delete unwanted entries in the Django admin.

## What Changes

- **Contract**: the invitee allowlist is removed as an admission gate. Registration is
  open to every authenticated identity with `email_verified: true`; the imported invitee
  list survives only as an informational admin cross-check (e.g. "imported invitees who
  have not registered"). The remaining 403 case is solely `email_unverified`.
- **Guest page**: the bilingual 403 message changes from guest-list rejection to
  verification guidance — verify the email at id.pramari.de, then sign in again. The
  just-introduced `{email}` detail stays (it tells guests *which* address is checked).
- **Handoff doc**: `docs/fiftyplus-api-handoff.md` is corrected (no allowlist gate;
  403 = `email_unverified` only; admin keeps the review/decline lever and the
  informational import).
- Host-side admin (review, decline/delete, companion gauge) lives entirely in the
  Django project and is unchanged conceptually by this delta.

Breaks the previously drafted API behavior (403 for non-invitees) before any guest has
used it; nothing is deployed against the old semantics yet.

## Capabilities

### New Capabilities

<!-- None: this change modifies existing capabilities. -->

### Modified Capabilities

- `fiftyplus-api-contract`: the "Invitee allowlist" requirement is removed (verification
  becomes the only admission gate, stated as a new explicit requirement); the "Error
  shape" requirement no longer names the allowlist as a 403 source.
- `fiftyplus-guest-registration`: the "Friendly error handling" requirement's 403 meaning
  changes from guest-list rejection to email-verification guidance.

## Impact

- Specs: `openspec/specs/fiftyplus-api-contract/spec.md` and
  `openspec/specs/fiftyplus-guest-registration/spec.md` (via the deltas in this change).
- Page: `content/fiftyplus/index.html` — two i18n strings (DE/EN) plus the internal
  key name (`errNotInvited` → `errNotVerified`) and its 403 mapping.
- Docs: `docs/fiftyplus-api-handoff.md` (gate semantics + acceptance tests).
- Unaffected: authentik configuration, `api_base`, Hugo build, event.ics, Django
  project's admin lever (which this change's contract keeps as the only review tool).
