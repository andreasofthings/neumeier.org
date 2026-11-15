# Spec Delta

## MODIFIED Requirements

### Requirement: Friendly error handling
The page SHALL translate API outcomes into bilingual guest-facing messages: 401 as re-sign-in, 403 as bilingual guidance to verify the guest's email address at the identity provider and sign in again, together with an actionable link to the identity provider's self-service re-verification flow, network failure as service unreachable, and any other failure as a generic error with a retry action.

#### Scenario: Guest rejected by the API
- **WHEN** the API responds with 403 during the guest flow
- **THEN** the guest sees bilingual guidance to verify their email address at id.pramari.de and then sign in again — not the session-expired message

#### Scenario: Self-service verification affordance
- **WHEN** the 403 verification guidance is displayed
- **THEN** the error card also offers a click-through action leading directly to the identity provider's self-service re-verification flow, derived from the configured identity provider base

#### Scenario: Service unreachable
- **WHEN** the API host is unreachable
- **THEN** the guest sees the bilingual unreachable message

#### Scenario: Retry
- **WHEN** the guest clicks retry after an error
- **THEN** the app re-evaluates its state from loading
