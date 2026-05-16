# Phase 2 Security And Auth Hardening Spec

Date: 2026-05-14
Status: Planned

## Goal

Phase 2 removes production-facing demo authentication assumptions and hardens ClinicPulse request, session, and account-management behavior enough for a controlled staging or pilot tenant.

The approved scope is a focused hardening pass over the existing auth model, plus the minimal admin lifecycle needed to run a pilot:

- Keep the four active roles: `reporter`, `district_manager`, `org_admin`, and `system_admin`.
- Keep local seeded users for local development and E2E only.
- Add production-safe controls around login, sessions, cookie-authenticated mutations, admin account management, and browser security headers.
- Defer email invites, password-reset email delivery, SSO, MFA, and legal/compliance launch work to later phases.

## Current Evidence

Phase 1 is merged into `main` and the app now has production-shaped runtime and deployment controls:

- Frontend deployment validation in `lib/runtime/frontend-env.ts` and `next.config.ts`.
- Backend deploy-environment validation in `services/api/internal/config/config.go`.
- Docker API runtime and migration command under `services/api`.
- Migration ledger table documented in `docs/database-schema.md`.
- Provider-neutral Vercel plus Docker API deployment runbook in `docs/deployment.md`.
- Blocking CI for frontend, backend, E2E, security scans, API smoke, and API container smoke.

The current security gaps for a pilot are:

- Login still displays local demo users and the shared demo password in the UI.
- Public registration remains visible even though the server action states account creation is not enabled.
- Cookie-authenticated mutation routes do not have explicit CSRF or origin protection.
- Login attempts and sensitive mutations do not have an application-level rate limiter.
- Admin account management has read surfaces but not pilot-safe create, disable, enable, or membership change mutations.
- Session revocation exists for logout, but there is no admin session-revocation flow or session-rotation policy beyond new login token creation.
- Security headers and CSP are not defined as a deployable contract.
- Auth audit evidence covers successful login and several admin surfaces, but not all new lifecycle and blocked-security events this phase will introduce.

## Product Decision

Recommended approach:

Harden the existing session-cookie auth model and add minimal admin-driven account lifecycle operations.

Approaches considered:

- Security-only hardening: fastest, but leaves the pilot dependent on SQL/manual user changes.
- Full account lifecycle with invites and password reset email: more complete, but adds email infrastructure, token delivery, and support workflows before the pilot requires them.
- Existing-auth hardening plus minimal admin lifecycle: selected because it closes the highest-risk production assumptions without expanding the product into a full identity platform.

## Scope

Phase 2 covers:

- Hiding demo credentials and demo-only login hints outside local/demo-marked environments.
- Disabling public self-serve registration in staging/production unless a future phase explicitly enables it.
- Admin-only user provisioning for pilot tenants.
- Admin-only user disable, enable, role assignment, and district or organisation scope changes.
- Login throttling by email and client address.
- General API mutation rate limiting for sensitive authenticated routes.
- CSRF and origin protection for cookie-authenticated mutation routes.
- Secure session-cookie policy, session rotation on login, logout revocation, admin revocation, and session expiry cleanup assumptions.
- Security headers and a conservative CSP that works with the current Next.js app and Vercel deployment.
- Audit events for account lifecycle changes, security denials, and session revocations.
- Documentation and CI gates for the new security posture.

Phase 2 does not cover:

- Email invite delivery.
- Password reset email delivery.
- Self-serve account creation.
- MFA, passkeys, SSO, or external identity providers.
- Legal, privacy, data-processing, or pilot signoff content.
- Real source-of-truth clinic data ingestion.
- Observability platforms, tracing, alerting, or incident response.
- Broad UI redesign beyond the auth/admin surfaces needed for this phase.

## Security Model

### Deploy Environments

The app already distinguishes `local`, `staging`, and `production`.

Phase 2 tightens that split:

- `local` may show local demo credentials and run seeded auth users.
- `staging` and `production` must not show seeded demo credentials or shared passwords.
- `staging` and `production` must require explicit opt-in before any demo-only fallback or self-serve account creation behavior is exposed.
- E2E may continue using seeded users against isolated databases.

### Authentication

The API remains the source of truth for auth. It keeps bcrypt password verification, hashed session tokens, Postgres-backed sessions, and role memberships.

Phase 2 adds:

- Login throttle decisions before expensive password verification when possible.
- Generic error responses that do not reveal whether an email exists, a user is disabled, a password is wrong, or a throttle is active.
- Session token rotation on every successful login.
- Audit records for successful login, blocked login, and admin session revocation.

### Authorization

Existing route-role boundaries remain:

- `reporter`: field reporting.
- `district_manager`: district operations and report review.
- `org_admin`: organisation administration and partner readiness.
- `system_admin`: platform administration.

Phase 2 adds stricter mutation boundaries:

- Only `org_admin` and `system_admin` can manage users in their allowed scope.
- Only `system_admin` can create, disable, enable, or change `system_admin` memberships.
- `org_admin` cannot grant access outside their organisation.
- District scope changes must stay inside the user's organisation.

### Cookie-Authenticated Mutations

Any unsafe HTTP method that relies on the session cookie must pass CSRF/origin checks.

Unsafe methods are `POST`, `PUT`, `PATCH`, and `DELETE`.

Allowed request patterns:

- Same-origin browser form or fetch requests with a trusted `Origin` or `Referer`.
- Explicit CSRF token flow when an origin header is absent or cannot be trusted.
- Non-cookie partner API requests authenticated by API key are handled by the partner middleware and are not part of the browser CSRF flow.

## Functional Requirements

### Demo Credential Exposure

- The login page must hide the local demo credential panel in staging and production.
- The README may document local seeded users, but production-facing copy must describe them as local-only.
- E2E helpers may continue to use the seeded users.
- Showcase capture may continue using the seeded org admin in local E2E mode.

### Registration And Provisioning

- Public `/register` must remain disabled in staging and production.
- The register page should explain that accounts are provisioned by an administrator, without listing demo credentials.
- Admin UI must support creating a user with email, display name, role, organisation, and optional district scope.
- Admin UI must support disabling and re-enabling users.
- Admin UI must support changing role memberships within the acting admin's allowed scope.
- Password setup may use an admin-generated temporary password in this phase.
- Temporary passwords must be returned once in the admin response and never stored in plaintext.
- The API must store only password hashes.

### Login Throttling

- Failed login attempts must be throttled by normalized email and client address.
- The throttle must protect expensive password verification and credential stuffing without blocking all users behind one NAT too aggressively.
- Throttle responses must use generic auth error copy.
- Local tests must use deterministic clocks or in-memory stores to prove throttle behavior.
- The throttle must be safe to replace with Redis or provider storage later, but Phase 2 may use an in-process limiter if the tradeoff is documented.

### API Mutation Rate Limiting

- Sensitive authenticated mutation routes must have a rate limit.
- Scope includes report submission, offline sync, report review, admin user lifecycle mutations, partner API key mutations, webhook mutations, export generation, and status reconciliation.
- Rate-limit responses must use `429` with a generic `rate_limited` code.
- Read endpoints should not be rate-limited in Phase 2 unless they are part of auth probing or admin abuse.

### CSRF And Origin Protection

- Cookie-authenticated unsafe requests must reject untrusted cross-origin requests.
- The trusted origin list must be environment driven and reject empty production configuration.
- Local development must allow localhost origins used by Next.js and Playwright.
- Same-origin server actions and Next.js proxy calls must continue working.
- Rejections must not leak configured origins or internal hostnames.

### Session Hardening

- Session cookies must remain `HttpOnly`.
- Staging and production session cookies must be `Secure`.
- Session cookies should use `SameSite=Lax` unless a tested flow requires stricter behavior.
- Logout must revoke the current session and clear the cookie.
- Admins must be able to revoke a user's active sessions after disabling a user or changing high-privilege access.
- Session expiry and cleanup expectations must be documented even if cleanup remains manual or migration-backed in this phase.

### Security Headers And CSP

- The app must set security headers for browser responses.
- Required headers:
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `X-Frame-Options` or equivalent CSP frame protection
  - `Content-Security-Policy`
- CSP must permit the current app assets and known remote image sources while blocking arbitrary script origins.
- CSP must be tested enough to catch accidental removal or impossible production policy.

### Audit Evidence

- Admin user creation, disable, enable, membership change, and session revocation must write audit events.
- Login throttling and CSRF denial should be observable without storing passwords or session tokens.
- Audit metadata must not include plaintext passwords, session tokens, CSRF tokens, or password hashes.
- Admin audit surfaces should expose enough context for a reviewer to see who changed access and when.

### Documentation And CI

- `docs/api.md` must document new admin lifecycle endpoints and relevant security responses.
- `docs/architecture.md` must describe the hardened auth/session model.
- `docs/database-schema.md` must document new tables or columns.
- `docs/deployment.md` must list new required security environment variables.
- `docs/release.md` must add the Phase 2 security gate.
- CI must keep Phase 0 and Phase 1 gates blocking.
- New tests must be included in `make verify`, `make test-e2e`, or a documented security verification target.

## Acceptance Criteria

Phase 2 is complete only when these commands pass from a clean checkout:

```bash
npm ci
make verify
make test-e2e
make verify-security
make test-api-container
git status --short
```

Expected final state:

- Demo credentials are hidden in staging and production UI.
- Staging and production account creation is admin-driven, not public self-serve.
- Admins can create, disable, enable, and change scoped role memberships for pilot users.
- Admins can revoke sessions for a managed user.
- Login attempts are throttled.
- Sensitive API mutations are rate-limited.
- Cookie-authenticated unsafe requests reject untrusted origins or missing CSRF proof.
- Session cookies are secure in staging and production.
- Security headers and CSP are active and tested.
- Audit evidence records account lifecycle and security-relevant decisions without leaking secrets.
- Deployment docs list all required security configuration.

## Risks

- In-process rate limiting resets on deploy and does not coordinate across multiple API instances. That is acceptable for Phase 2 only if documented, because the first staging/pilot deployment is expected to be a small number of API instances.
- CSP can break Next.js assets or remote images if made too strict too early. The implementation should start with a conservative working policy and tests that protect the intended directives.
- Admin-generated temporary passwords are weaker than invite/password-reset flows. The implementation must make them one-time display values and keep email-based lifecycle flows out of scope until they are intentionally designed.
- CSRF protection can break server actions or same-origin proxy calls if it only checks browser headers. The implementation must test the actual login, logout, report submission, admin, and partner-readiness flows.
- Adding account mutations touches sensitive shared auth paths. The implementation must be test-first and keep audit behavior explicit.

## Implementation Plan

The detailed implementation plan will be written after this spec is reviewed and approved.
