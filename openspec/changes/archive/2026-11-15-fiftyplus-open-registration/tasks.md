# Tasks

## 1. Page copy (guest SPA)

- [x] 1.1 In `content/fiftyplus/index.html`, replace both `errNotInvited` strings with the bilingual verification guidance (keep the `{email}` detail): DE: `Deine E-Mail-Adresse ({email}) ist noch nicht verifiziert. Bitte verifiziere sie bei id.pramari.de und melde dich danach hier erneut an.` / EN: `Your email address ({email}) is not verified yet. Please verify it at id.pramari.de and then sign in again.` Verify: extracted inline JS passes `node --check`; both strings present; `hugo --minify` exits 0.
- [x] 1.2 Rename the internal key `errNotInvited` to `errNotVerified` (both i18n dictionaries plus the `api()` 403 mapping), so naming matches the new semantics. Verify: `grep -c errNotInvited` returns 0 and `node --check` passes.

## 2. Handoff doc

- [x] 2.1 Update `docs/fiftyplus-api-handoff.md`: drop the allowlist-as-gate from "Token authentication" and "Data model" (the Invitee table becomes an optional informational cross-check), state that the only 403 is `{"error": "email_unverified"}`, and rewrite acceptance test 4 (a non-invited *verified* email registers normally; an `email_verified: false` token gets 403 `email_unverified`). Verify: `grep -in "not_invited\|guest list" docs/fiftyplus-api-handoff.md` shows no gate phrasing.

## 3. Verification

- [x] 3.1 Build the site (`hugo --minify`), extract the inline script from `public/fiftyplus/index.html` and confirm `node --check` passes; confirm `errNotVerified` appears in the built output. Browser-level check of the 403 state needs an unverified test account and is queued behind the Django API bring-up — note that in the change when marking done.

Pending browser check: the 403 guidance copy (task 1.1) shows its real face only when an unverified account hits the deployed API — verify during E2E bring-up, before real guests arrive.

## Workflow follow-up

- Commit and push so the deployed `/fiftyplus/` page picks up the new 403 wording.
- The Django side sees this change only through `docs/fiftyplus-api-handoff.md`; re-paste or point the other agent at the updated version once applied.
