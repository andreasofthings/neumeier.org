# fiftyplus-api-contract Specification

## Purpose

Freezes the REST contract and identity requirements that the `fiftyplus` guest SPA depends on from the external registration API (separate Django project), so both sides can be built independently against the same interface.

## Requirements

### Requirement: Bearer token identity
The API SHALL authenticate guests by the Bearer access token issued by the authentik application slug `fiftyplus` at id.pramari.de, validate it against that provider's published JWKS (asymmetrically signed, RS256), and identify the guest by the token's email claim, compared case-insensitively.

#### Scenario: Valid token
- **WHEN** a request carries a currently valid access token issued by the `fiftyplus` provider
- **THEN** the request is processed as the identity behind that token's email claim

#### Scenario: Missing or invalid token
- **WHEN** a request has no Bearer token or one that fails validation
- **THEN** the API responds 401 with a JSON error

### Requirement: Verified email enforced
The API SHALL reject any token whose `email_verified` claim is false, because the guest list is keyed by email addresses.

#### Scenario: Unverified email
- **WHEN** an authenticated token carries `email_verified: false`
- **THEN** the API responds 403 with a JSON error and no registration data

### Requirement: Invitee allowlist
The API SHALL check the authenticated email against an imported invitee list and reject emails not on it.

#### Scenario: Not on the guest list
- **WHEN** an authenticated guest's email is not on the invitee list
- **THEN** the API responds 403 with a distinguishing JSON error code

#### Scenario: On the guest list
- **WHEN** the authenticated email is on the invitee list
- **THEN** registration endpoints accept the request

### Requirement: Read current registration
The API SHALL expose `GET /api/me`, returning 200 with `registration: null` for an allowed, not-yet-registered identity, and never 404 for a missing registration.

#### Scenario: Not yet registered
- **WHEN** an allowed identity with no registration requests /api/me
- **THEN** the API responds 200 with `registration: null`

#### Scenario: Existing registration
- **WHEN** an allowed identity with a registration requests /api/me
- **THEN** the API responds 200 with the registration: first_name, last_name, attending (yes|no), lang, message, created_at, updated_at, mail_sent_at, and companions, each with kind (spouse|child), name, and nullable email

### Requirement: Create or update registration
The API SHALL expose `PUT /api/registration` that upserts exactly one registration per authenticated email from the submitted body (attending, first_name, last_name, lang, message, companions with kind), and SHALL persist declines (attending "no") as valid registrations.

#### Scenario: First registration
- **WHEN** an allowed identity submits a new registration
- **THEN** the registration is stored for that identity and the API responds 200

#### Scenario: Resubmission
- **WHEN** the same identity submits again
- **THEN** the existing record is updated, not duplicated

#### Scenario: Declining
- **WHEN** a registration is submitted with attending "no"
- **THEN** the decline is stored and remains visible in the registration data

### Requirement: Resend invitation
The API SHALL expose `POST /api/resend` that re-sends the invitation email to the authenticated identity and records the send time in the registration's mail_sent_at.

#### Scenario: Resend by the guest
- **WHEN** the guest requests a resend
- **THEN** the invitation email is sent again and mail_sent_at is updated

### Requirement: Invitation mail delivery
The API SHALL send an invitation email containing an .ics calendar attachment when a guest first registers with attending "yes", localized by the registration's stored language, and SHALL send a copy to a spouse companion email when one was provided. Mail_sent_at SHALL be recorded after delivery.

#### Scenario: Registration with spouse email
- **WHEN** a guest registers with attending "yes" and a spouse entry with an email address
- **THEN** the invitation mail goes to the guest with a copy to the spouse

#### Scenario: Decline
- **WHEN** a guest registers with attending "no"
- **THEN** no invitation mail is required

### Requirement: Error shape
The API SHALL return errors as JSON `{error: <code>, detail: <string>, optional}` with 401 for invalid or missing tokens, and 403 for rejected identities (unverified email or invitee allowlist).

#### Scenario: Error response readable by the SPA
- **WHEN** any endpoint fails
- **THEN** the response body is JSON containing an error code, with HTTP status distinguishing session (401) from rejection (403)

### Requirement: Browser CORS
The API SHALL allow cross-origin browser requests from `https://www.neumeier.org` and the GitHub Pages preview origin for the guest endpoints.

#### Scenario: Preflight from the site
- **WHEN** the SPA at www.neumeier.org sends an authorized cross-origin request or its preflight
- **THEN** the API permits the origin, methods, and Authorization header used by the SPA
