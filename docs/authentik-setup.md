# Authentik setup guideline: OIDC for `/fiftyplus`

Runbook for configuring id.pramari.de (authentik) so the guest registration page at
`https://www.neumeier.org/fiftyplus/` can sign guests in. Base knowledge: authentik docs
(2026.8); UI wording may differ slightly with your instance's version.

Status of this document: pre-execution guideline. It is "done" when every probe in
Step 4 passes. Update it with corrections as you execute, so it reflects reality.

## Verified facts (2026-11-15)

- Instance reachable, no proxy/bot-protection challenge seen in front of authentik.
- No application `fiftyplus` exists yet (`/.well-known/openid-configuration` → 404).
- SMTP working (`ak test_email` passed on 14 Nov).
- Google federation source already configured on the instance.

## Key invariants

| Invariant | Why |
|---|---|
| Provider **Client ID must be `fiftyplus`** | The page embeds `client_id: "fiftyplus"` (`content/fiftyplus/index.html`). Alternative: keep the auto-generated Client ID and change the page config, then redeploy. One of the two must match. |
| Redirect URI is exactly `origin + "/fiftyplus/"` — trailing slash | The SPA builds the redirect URI itself; an exact mismatch → authentik rejects the redirect. |
| Flow-level changes live on the shared `default-enrollment` | authentik resolves flows at **Brand** level; applications cannot assign an enrollment flow (docs 2026.8, verified in UI). Containment comes from the provider-scoped `email` scope mapping, not from the flow: other applications keep their own mappings; new signups instance-wide only gain one verification mail plus the recorded attribute. |

## Values to use

- Application name: `Fifty+`
- Slug: `fiftyplus`
- Provider type: OAuth2/OIDC, client type **Public**
- Redirect URIs (exact, one per line):
  - `https://www.neumeier.org/fiftyplus/`
  - `https://andreasofthings.github.io/neumeier.org/fiftyplus/` (Pages preview)
- Scopes requested by the SPA: `openid profile email`
- Signing key: any certificate-key pair (e.g. the default *authentik Self-signed
  Certificate*). Required, so tokens are RS256 and the Django API can validate them
  against JWKS. Without a key, tokens fall back to HS256 keyed to a client secret,
  which a public client must not hold.

## Step 1 — Application + provider

1. Admin interface → **Applications → Applications → Create**.
2. Name `Fifty+`, slug `fiftyplus`, **Choose a provider: OAuth2/OIDC**.
3. Authorization flow: the default *implicit consent* provider authorization flow
   (guests should not see a consent screen for a birthday RSVP page).
4. Configure provider:
   - **Client type: Public**
   - **Client ID: `fiftyplus`** (overwrite the generated value)
   - Redirect URIs: both exact values above; **RegEx list stays off**.
   - **Signing Key: select the certificate-key pair.**
   - Scopes: the defaults (openid, email, profile) are fine for now — the email
     mapping is swapped in Step 3.
5. Create. Nothing else is needed at application level — authentik resolves flows
   at Brand level, so enrollment is configured in Step 2 on the shared flow.

## Step 2 — Email verification plumbing (shared default enrollment flow)

authentik selects the enrollment flow at Brand level — there is no per-application
assignment. So this step binds the verification stages to the instance's existing
**`default-enrollment`** flow: every new signup on the instance will additionally
receive exactly one Account Confirmation mail and get `email_verified_address`
recorded when it is clicked. Nothing else changes for other applications; the
fiftyplus-specific gate (rejecting `email_verified: false`) stays in the provider's
scope mapping in Step 3.

### 2.1 Email stage

Flows & Stages → Stages → Create:
- Type **Email**; name `fiftyplus-verify-email`.
- Enable **Use global connection settings** (SMTP is already working).
- Template: **Account Confirmation**.
- **Disable** *Activate pending user on success* — `default-enrollment` creates
  active users via its User Write stage; gate-keeping happens via the
  `email_verified` claim (Step 3) instead.

### 2.2 Policy that records the verified address

Customization → Policies → Create, type **Expression**; name
`fiftyplus-record-verified-email`; expression (per authentik docs, "Verify email
addresses", option 2):

```python
user = request.context.get("pending_user")
token = request.context.get("is_restored")
if user and user.pk and user.email and token and token.user_id == user.pk:
    user.attributes["email_verified_address"] = user.email
    user.save(update_fields=["attributes"])

return True
```

### 2.3 Bind onto `default-enrollment`

Flows & Stages → Flows → open **`default-enrollment`** (the flow guests already
hit when self-registering) → *Stage Bindings*. Do **not** restructure its existing
stages; make exactly two additions:

1. Bind the email stage `fiftyplus-verify-email` **after** the flow's User Write
   stage (so the account exists and the saved address is the one confirmed).
2. Expand the flow's final **User Login** stage binding and attach the policy
   `fiftyplus-record-verified-email`. Keep *Evaluate when stage is run* enabled,
   *Evaluate when flow is planned* disabled.

Only touch the enrollment flow — the authentication flow stays untouched.

### 2.4 Variant: fully custom enrollment flow

If `default-enrollment` must stay untouched for operational reasons, set the
**Brand**'s default enrollment flow to a dedicated `fiftyplus-enrollment` flow
instead (*System → Brands → default brand → Default flow settings → Enrollment
flow*). Same instance-wide effect (every signup then uses the new flow) — only
worth it if you want the whole signup UI rebuilt; otherwise keep Step 2.3.

## Step 3 — `email_verified` scope mapping

Customization → Property Mappings → Create, type **Scope Mapping**:
- Name `fiftyplus-email-verified`, **Scope name: `email`**;
- Expression:

```python
email = request.user.email
verified_address = request.user.attributes.get("email_verified_address")
return {
    "email": email,
    "email_verified": bool(email and verified_address == email),
}
```

Then open the `fiftyplus` provider → Scopes: **replace** the default email mapping
with `fiftyplus-email-verified` (never assign both email mappings to one provider).
Keep the openid and profile mappings.

Do **not** use the shortcut that returns `email_verified: True` unconditionally —
guests self-register, so nothing else verifies their addresses.

## Endpoint topology (authentik, verified against the live discovery document)

| Group | Shape |
|---|---|
| Per-slug endpoints | `/application/o/<slug>/.well-known/openid-configuration`, `/application/o/<slug>/jwks/`, `/application/o/<slug>/end-session/` |
| Global endpoints | `/application/o/authorize/`, `/application/o/token/`, `/application/o/userinfo/`, `/application/o/introspect/`, `/application/o/revoke/`, `/application/o/device/` |

`authorization_endpoint`, `token_endpoint`, and `userinfo_endpoint` in the discovery
document always carry **no slug**. Client software must use the advertised global
URLs there; a slug-prefixed `/application/o/<slug>/authorize/` returns 404.

## Step 4 — Verification probes

Run after configuration; each probe maps to a step above.

1. **Discovery** — `https://id.pramari.de/application/o/fiftyplus/.well-known/openid-configuration`
   → 200; check `issuer` ends with `/fiftyplus/`, `scopes_supported` includes
   profile and email, and `id_token_signing_alg_values_supported` is `RS256`.
   (404 ⇒ Step 1 slug/typo.)
2. **JWKS** — `https://id.pramari.de/application/o/fiftyplus/jwks/` → 200 with RSA
   keys (`kty: RSA`) ⇒ RS256 signing key took (Step 1).
3. **Authorize** — use the `authorization_endpoint` **from the discovery document**
   (global shape: `https://id.pramari.de/application/o/authorize/`), with
   `client_id=fiftyplus`, `redirect_uri=https://www.neumeier.org/fiftyplus/`,
   `scope=openid profile email` → expect 302 into the login flow. If authentik
   answers **400 "Client ID Error: the client identifier is missing or invalid"**
   ⇒ the provider's Client ID is not `fiftyplus` (edit the provider). After that,
   redirect errors ⇒ URI mismatch, check trailing slash. A slug-prefixed authorize
   path gives 404 and is simply the wrong shape.
4. **CORS** — preflight the (global) token endpoint from the site origin:
   `curl -i -X OPTIONS -H "Origin: https://www.neumeier.org" -H "Access-Control-Request-Method: POST" https://id.pramari.de/application/o/token/`
   → CORS headers for `https://www.neumeier.org`. (Blocked ⇒ proxy/WAF interfering;
   authentik emits CORS per registered redirect URI.)
5. **End-to-end from the page** — open `/fiftyplus/` in a browser (Pages preview
   URL also works before deployment):
   - "Sign in with email or Google": create a test guest account via **Google**
     once, and via **email + password** once.
   - Guest lands on the API stage (form or, until the Django API allowlists their
     email, the bilingual "not on the guest list" message — that proves sign-in,
     token exchange and userinfo all work).
   - Test guest's mail: Account Confirmation mail arrives (SMTP check), and clicking
     the link, then **signing out and in again**, makes the next attempt present a
     claim with `email_verified: true` (fresh token on each login).

Note: a changed/changed-back email address clears the recorded verification per
mapping; verification has to run again after email changes.

## Guest-facing notes (for copy to friends)

- You need a small account at id.pramari.de (Google works in one click).
- If you are told you are "not on the guest list" right after signing up while the
  organizer has not opened the list yet, that is expected until the list is loaded.

## Troubleshooting quick table

| Symptom | Likely cause → fix |
|---|---|
| Discovery 404 | Provider/application slug not `fiftyplus`, or app not created. |
| `invalid_client` / 400 "Client ID Error" | Provider Client ID differs from `fiftyplus` — edit the provider's Client ID (or bake the generated ID into the page config and redeploy). |
| Authorize path 404 | Slug inserted into `/application/o/authorize/` — authorize/token/userinfo are global; see Endpoint topology. |
| `invalid_redirect_uri` | Redirect URI not exact (trailing slash missing / http vs https). |
| No CORS headers on token endpoint | Proxy in front of authentik interfering, or the Pages origin not among redirect URIs. |
| API reports unverified email although link was clicked | Policy not bound to the User Login stage binding, or token is old → sign out and in again; check `email_verified_address` attribute on the user. |
| Verification mail never arrives | SMTP global settings, or the email stage bound before User Write. |
| Google button missing | Google source not selected in the identification stage's Sources. |
