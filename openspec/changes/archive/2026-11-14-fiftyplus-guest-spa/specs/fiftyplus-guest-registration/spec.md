# Spec Delta

## Purpose

Lets guests of Andreas' 50th birthday party register for the event at `/fiftyplus/` through a self-contained, static, client-side SPA: sign in, RSVP, and invite companions, with no server-side logic in this repo.

## ADDED Requirements

### Requirement: Static guest registration page
The site SHALL serve the guest registration app at `/fiftyplus/` as a static Hugo build output, without any server-side processing in this repo.

#### Scenario: Page loads from the static build
- **WHEN** the Hugo site is built and a guest opens `/fiftyplus/`
- **THEN** the registration app renders entirely from static assets

#### Scenario: JavaScript disabled
- **WHEN** a guest opens `/fiftyplus/` with JavaScript disabled
- **THEN** the page shows a bilingual (DE/EN) notice that JavaScript is required for registration

### Requirement: Sign-in via authentik OIDC
The page SHALL authenticate guests through the configured authentik instance using the OIDC authorization-code flow with PKCE, a public client (no client secret), scopes `openid profile email`, and a redirect URI of exactly the page origin plus `/fiftyplus/`.

#### Scenario: First visit
- **WHEN** a visitor without a valid session opens the page
- **THEN** a sign-in card is shown and no registration form is exposed before sign-in

#### Scenario: Sign-in redirect
- **WHEN** the guest clicks the sign-in button
- **THEN** the browser is redirected to the configured authorize endpoint with a PKCE code challenge and a state value

#### Scenario: Successful sign-in round trip
- **WHEN** authentik redirects back with a code and state and both match the stored state
- **THEN** the app exchanges the code for an access token, fetches userinfo claims (sub, email, name), and shows the registration form

#### Scenario: Failed or cancelled sign-in
- **WHEN** the sign-in flow fails, is cancelled, or returns a state mismatch
- **THEN** a bilingual error is shown with the option to retry sign-in

#### Scenario: Stored session reuse
- **WHEN** the guest reopens the page within the stored token's validity
- **THEN** the app resumes from the registration form without another login

#### Scenario: Expired session
- **WHEN** an API request responds with 401, or the stored token ages past its expiry
- **THEN** the stored session is cleared and the sign-in view is shown

### Requirement: RSVP form
The page SHALL provide a registration form with attending (yes/no), first name, last name, one spouse entry (name, optional email), kid entries (addable and removable), and an optional message, and SHALL submit it with the guest's interface language.

#### Scenario: Fresh registration
- **WHEN** the signed-in guest has no existing registration
- **THEN** an empty form is shown, with the first name guessed from the OIDC name claim

#### Scenario: Companion rows
- **WHEN** the guest adds or removes kid rows
- **THEN** the rows update, always at least one kid row and never more than 12

#### Scenario: Submitting the form
- **WHEN** the guest submits the form
- **THEN** the data is sent to the registration API and the button is disabled while saving

### Requirement: Prefill and edit from stored registration
The page SHALL prefill the form from the guest's existing registration returned by the API and allow the guest to edit and resubmit at any time.

#### Scenario: Existing registration
- **WHEN** the signed-in guest already has a registration
- **THEN** the form is prefilled with names, attending choice, companions, and message, labeled as "save changes", showing the last-updated timestamp

#### Scenario: Editing after success
- **WHEN** the guest chooses to edit from the success view
- **THEN** the prefilled form is shown again and resubmitting updates the same registration

### Requirement: Success state
The page SHALL show a success state after a saved registration, with distinct messages for attending yes and no, an echo of companions, invitation-mail status, and a resend action.

#### Scenario: Successful save
- **WHEN** the registration is saved
- **THEN** the thank-you view reflects the attending choice and lists the registered companions

#### Scenario: Invitation mail status
- **WHEN** the stored registration has a sent-mail timestamp
- **THEN** the view states the invitation (with calendar entry) is on its way to the guest, including spouse copies

#### Scenario: Resending the invitation
- **WHEN** the guest clicks resend
- **THEN** the resend request is sent with the button disabled while in flight, and the mail status refreshes

### Requirement: Generic calendar download
The page SHALL provide a calendar download button that links to a generic static `event.ics` asset served by this site, requiring no authentication.

#### Scenario: Downloading the calendar file
- **WHEN** the guest clicks the calendar download
- **THEN** the static event.ics is offered as a download, regardless of sign-in state

### Requirement: Embedded configuration and not-configured handling
The page SHALL carry its configuration (API base, event texts, identity-provider parameters) embedded within the page itself, and SHALL show a bilingual "service is being configured" error instead of crashing when the API base is unset or a placeholder.

#### Scenario: Configuration available on load
- **WHEN** the page is loaded
- **THEN** the registration app reads event texts, API base, and identity parameters from the configuration embedded in the page

#### Scenario: API base unset
- **WHEN** `api_base` is missing or a placeholder in the config
- **THEN** the page shows the bilingual not-configured error message without attempting API calls

### Requirement: Friendly error handling
The page SHALL translate API outcomes into bilingual guest-facing messages: 401 as re-sign-in, 403 as "not on the guest list", network failure as service unreachable, and any other failure as a generic error with a retry action.

#### Scenario: Guest rejected by the API
- **WHEN** the API responds with 403 during the guest flow
- **THEN** the guest sees the bilingual "not on the guest list" message, not the session-expired message

#### Scenario: Service unreachable
- **WHEN** the API host is unreachable
- **THEN** the guest sees the bilingual unreachable message

#### Scenario: Retry
- **WHEN** the guest clicks retry after an error
- **THEN** the app re-evaluates its state from loading

### Requirement: Bilingual interface
The page SHALL offer German and English with German as fallback for other locales, a DE/EN toggle switching every visible string immediately, `?lang=` override, language persisted across visits, and locale-formatted dates.

#### Scenario: Language toggle
- **WHEN** the guest clicks the language toggle
- **THEN** every displayed string switches to the other language, persisted for the next visit

#### Scenario: Query parameter override
- **WHEN** the page is opened with `?lang=en` or `?lang=de`
- **THEN** that language is applied and persisted
