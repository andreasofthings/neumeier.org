# Proposal

## Why

The 403 error message ("verify your email at id.pramari.de and sign in again") currently
promises an action the identity provider offers no UI for: the only verification mechanism
is the confirmation link inside the enrollment mail — which expires and is easily lost,
and guests arriving via the printed flyer URL will hit exactly that situation regularly.
A small self-service re-verification flow on the instance closes that trap and makes the
message's promise literally executable.

## What Changes

- **authentik (guideline documentation; executed manually in the admin UI)**: a new
  `email-verification` flow — designation *Stage Configuration*, no session required,
  reachable at `https://id.pramari.de/if/flow/email-verification/` — that reuses the
  Step-2 objects rather than duplicating them: an identification stage for the guest's
  email (the instance's `default-recovery-identification` stage), the existing
  `fiftyplus-verify-email` stage (fresh Account-Confirmation mail to the guest's own
  stored address), and a User Login stage carrying the existing
  `fiftyplus-record-verified-email` policy. Documented as §2.5 in
  `docs/authentik-setup.md`.
- **Guest page**: in the `errNotVerified` error state, the actions row gains a bilingual
  call-to-action button ("Jetzt E-Mail verifizieren" / "Verify email now") linking to the
  flow URL, derived from the configured identity provider base.
- **Spec**: the "Friendly error handling" requirement's 403 semantics gain the actionable
  affordance alongside the guidance text.

## Capabilities

### New Capabilities

<!-- None: this change modifies an existing capability. -->

### Modified Capabilities

- `fiftyplus-guest-registration`: "Friendly error handling" — the 403 state must offer a
  click-through to the identity provider's self-service re-verification flow, not merely
  prose guidance. (Adds one scenario to the existing requirement.)

## Impact

- Docs: `docs/authentik-setup.md` — new §2.5 (self-service re-verification flow) plus a
  verified-facts line.
- Page: `content/fiftyplus/index.html` — `VERIFY_URL` derivation from the auth base, one
  button in the error actions row, two i18n strings.
- Specs: `openspec/specs/fiftyplus-guest-registration/spec.md` via the delta.
- External: building the flow is authentik-admin work for the site owner (guideline §2.5
  is the manual); the flow depends on the Step-2.1/2.2 objects existing.
- **Sync-order note**: this delta's block carries the verification-guidance semantics of
  change `fiftyplus-open-registration` (still active). That change should be archived /
  synced first; if this change synced first and `fiftyplus-open-registration` second, the
  second merge would overwrite the link wording.
