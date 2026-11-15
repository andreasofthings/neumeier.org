# Tasks

## 1. Guideline doc

- [x] 1.1 In `docs/authentik-setup.md`, add §2.5 "Self-service re-verification flow": flow `email-verification` (designation Stage Configuration, Authentication requirement None, reachable at `/if/flow/email-verification/`), bindings reusing existing objects — `default-recovery-identification` (email-only identification, no sources), `fiftyplus-verify-email` (existing Account-Confirmation stage), then a User Login stage with the existing `fiftyplus-record-verified-email` policy bound at the binding level (Evaluate when stage is run), plus the optional Redirect stage back to `https://www.neumeier.org/fiftyplus/`. Cross-reference Step 2.1/2.2 objects explicitly (reuse, not duplication); note the abuse bound (guests can only trigger mail to their own stored address) and that unknown emails simply fail identification. Verify: section exists, references only Step-2 objects, no contradiction with the §2.3 default-flow guidance.

## 2. Guest SPA

- [x] 2.1 In `content/fiftyplus/index.html`, derive `VERIFY_URL = BASE + "/if/flow/email-verification/"` next to the other endpoint constants (comment: self-service re-verification flow). In `errorView()`, for the `errNotVerified` case only, append a `fp-btn fp-btn-small` to the error actions row: DE `Jetzt E-Mail verifizieren` / EN `Verify email now`, linked to `VERIFY_URL` (same DOM-building pattern, `el("a", ...)`; no HTML strings). Verify: extracted inline JS passes `node --check`; both strings present; other error messages unaffected; `hugo --minify` exits 0.

## 3. Verification

- [x] 3.1 Build the site (`hugo --minify`), extract the inline script from `public/fiftyplus/index.html`, confirm `node --check` passes and the `VERIFY_URL` derivation appears in the built output. Site-owner executes §2.5 in the authentik admin and confirms `https://id.pramari.de/if/flow/email-verification/` loads logged-out and shows the email identification prompt. Full browser round-trip (button → flow → mail → link → verified sign-in) is queued behind the Django API bring-up, like the pending check in `fiftyplus-open-registration`.

Pending owner action: build the `email-verification` flow per guideline §2.5 in the authentik admin UI, then confirm the flow URL loads logged-out (see task 3.1). Pending browser round-trip: behind the Django API bring-up.

## Workflow follow-up

- Commit and push so the deployed `/fiftyplus/` page gains the verification button.
- **Archive/order caution**: `fiftyplus-open-registration` should be archived (specs synced) before this change; its merge carries the verification-guidance wording this delta builds on (see proposal sync-order note).
- Executing §2.5 in the authentik admin is the site owner's task — schedule it before the next guest-facing test round.
