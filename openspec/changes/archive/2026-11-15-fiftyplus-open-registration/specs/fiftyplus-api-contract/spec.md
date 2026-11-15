# Spec Delta

## MODIFIED Requirements

### Requirement: Error shape
The API SHALL return errors as JSON `{error: <code>, detail: <string>, optional}` with 401 for invalid or missing tokens, and 403 for the only rejected-identity reason: an unverified email claim.

#### Scenario: Error response readable by the SPA
- **WHEN** any endpoint fails
- **THEN** the response body is JSON containing an error code, with HTTP status distinguishing session (401) from rejection (403)

## ADDED Requirements

### Requirement: Registration open to verified identities
The API SHALL accept registration requests from any authenticated identity whose `email_verified` claim is true, without consulting any invitee list. Host-side review and decline of registrations is performed in the Django admin application, not at the registration gate.

#### Scenario: Unlisted verified guest registers
- **WHEN** an authenticated guest with `email_verified: true` reads or submits a registration and their email was never imported into any invitee list
- **THEN** the registration endpoints process the request like any other guest's

## REMOVED Requirements

### Requirement: Invitee allowlist
**Reason**: The guest list cannot serve as admission control: guest email addresses are unknown upfront, and the page URL is distributed on printed flyers, reaching guests nobody ever emailed. The trust anchor shifts to an authentik account with a verified email address; the host reviews and declines registrations in the Django admin instead.
**Migration**: The Django API stops rejecting registration requests based on an imported invitee list; the invitee import becomes an informational cross-check in the admin (e.g. "imported invitees who have not registered"). The "On the guest list" behavior is superseded by the ADDED requirement "Registration open to verified identities"; the SPA-facing 403 semantics reduce to the unverified-email case, mirrored in this change's `fiftyplus-guest-registration` delta.
