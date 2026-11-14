# Tasks

## 1. Single-file page

- [x] 1.1 Write `content/fiftyplus/index.html` as one self-contained page per design Decisions 1–2: front matter, `#fp-app` mount point, bilingual noscript notice, loading indicator, an inline `<style>` with self-contained CSS (own variables, no PaperMod coupling, dark/light friendly), and the start of an inline `<script>` holding the configuration object (`api_base: "REPLACE-ME"`, authentik base/slug/client_id, event texts DE+EN). Verify: the file contains mount point, `<style>`, `<script>`, and noscript notice, and avoids literal `{{` sequences and `</` inside JS strings.
- [x] 1.2 Complete the inline script as the guest-only SPA per design Decisions 3–4: loading/login/form/done/error states, OIDC PKCE with the design Decision-6 parameters, DE/EN i18n dictionary, form with spouse/kids/message, submit and resend flows, `errNotInvited` keys in both languages, and the not-configured path for `REPLACE-ME`. Verify: extract the inline JS to a temp file, `node --check` passes, `grep -n errNotInvited content/fiftyplus/index.html` shows both languages, and `grep -in admin content/fiftyplus/index.html` finds nothing.
- [x] 1.3 Delete the obsolete draft files `static/fiftyplus/app.js` and `static/fiftyplus/style.css` (never committed — plain removal). Verify: both gone and nothing references them (`grep -rn "app.js\|style.css" content/fiftyplus/` is empty).

## 2. Calendar download

- [x] 2.1 Author `static/fiftyplus/event.ics` as a plain VEVENT for 2027-05-29 with the time/venue from the embedded event configuration (noon UTC start if final time unknown). Verify: file exists and contains `DTSTART` for 2027-05-29 and a `VEVENT` block.
- [x] 2.2 Include the calendar download button in the page script, linking to `/fiftyplus/event.ics`. Verify: `grep -n "event.ics" content/fiftyplus/index.html` finds the link.

## 3. Build and smoke test

- [x] 3.1 Build the site (`hugo --minify`) and confirm the rendered page keeps everything: `#fp-app`, the embedded configuration with `REPLACE-ME`, and the noscript notice. Verify: build exits clean; extract the inline script from `public/fiftyplus/index.html` post-minification and confirm `node --check` still passes on it.
- [x] 3.2 Serve `public/` locally and open `/fiftyplus/`: confirm the page does not crash, shows the DE default language, the DE/EN toggle switches all strings, and — with `api_base: REPLACE-ME` — shows the bilingual "service not configured" state instead of attempting API calls. Verify manually in a browser with the checklist above.
- [x] 3.3 Confirm the site is admin-free: no `/fiftyplus/admin/` output, no links to it, and no leftover draft assets. Verify: `grep -rn "admin" public/fiftyplus` is empty and `static/fiftyplus/` contains only `event.ics`.

## Workflow follow-up

- Commit the rewritten `content/fiftyplus/index.html` and the new `static/fiftyplus/event.ics` together; the replaced draft files were never committed, so nothing needs migrating in git history.
- Build compatibility with Hugo ≥ 0.167 (done during verification, outside the frontend scope): `config.yml` now keeps a `security.allowContent` entry in Hugo's deny-list syntax re-allowing raw-HTML content pages (`/calendar`, `/fiftyplus`), and the duplicate `disableHLJS` front-matter keys in `content/imprint.md`, `content/links.md`, `content/posts/template.md` were deduplicated (behavior unchanged). Builds verified clean with Hugo 0.146.0 (CI-pinned) and 0.167.0. Only remaining local warnings are 0.158+ deprecation notices (`languageCode`, `.Language.*`) — harmless until the next Hugo bump.
- Configure authentik at id.pramari.de per design.md Decision 6 (external setup; can run before or after deployment).
- After the Django project implements `fiftyplus-api-contract`, set the real `api_base` in the page's embedded configuration and redeploy; verify the CORS preflight and a full sign-in flow end to end.
