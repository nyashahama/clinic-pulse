# Phase 0 Release Gate Stabilization Spec

Date: 2026-05-12
Status: Planned

## Goal

Phase 0 makes ClinicPulse release-gate clean and repeatable before the project adds deployment, security, or pilot workflows.

The current project is a credible alpha with a working product loop, but production readiness cannot advance while the release gate depends on reruns, vulnerable dependencies, or an unaligned Go toolchain.

## Current Evidence

The readiness review found:

- `make verify` passes after local dependencies are restored with `npm ci`.
- `npm run lint`, frontend tests, Go tests, Go vet, and `npm run build` pass.
- Full `make test-e2e` failed once with 92 passed, 10 skipped, and 2 failed tests. Rerunning the failed specs passed, which indicates flake or isolation risk.
- `npm audit --audit-level=moderate` fails with 6 vulnerabilities: 4 moderate and 2 high.
- The vulnerable frontend tree includes direct `next@16.2.4` advisories and transitive CLI-only `shadcn` dependencies through `@modelcontextprotocol/sdk`.
- `cd services/api && govulncheck ./...` fails because reachable Go standard library vulnerabilities are fixed in later Go 1.25 patch releases.
- `services/api/go.mod` targets `go 1.25.0`, while the observed local toolchain was `go1.22.2`.
- Playwright surfaced hydration/smooth-scroll/LCP warnings on landing-page motion and image paths.

## Product Decision

Phase 0 is a stabilization phase, not a feature phase.

Recommended approach:

Fix the gates that determine whether current work is safe to release. Do not expand product scope, add new user journeys, or redesign production architecture in this phase.

Approaches considered:

- Minimal documentation only: rejected because it would leave vulnerable dependencies and flaky E2E unresolved.
- Security scans only: rejected because a production readiness plan cannot advance with non-deterministic browser regression results.
- Full release-gate stabilization: selected because it creates a clean base for deployment and security hardening.

## Scope

Phase 0 covers:

- Frontend dependency cleanup until `npm audit --audit-level=moderate` passes.
- Removal or upgrade of CLI-only dependencies that pull vulnerable transitive packages into the project install.
- Next.js patch upgrade and matching `eslint-config-next` upgrade.
- Go toolchain alignment to a patched Go 1.25 release.
- `govulncheck` as a blocking backend security gate.
- Stabilization of the full Playwright E2E suite.
- Fixes for known hydration, smooth-scroll, and image priority warnings that affect release confidence.
- CI updates so the same gates run on pull requests and pushes.
- Release documentation updates so contributors know the required commands.

Phase 0 does not cover:

- Production deployment manifests.
- Runtime secret management.
- Rate limiting, CSRF protection, or full auth hardening.
- Real production data ingestion.
- Legal/compliance review.
- Observability stack implementation.
- New product modules or role expansion.

## Functional Requirements

### Dependency Security

- `npm audit --audit-level=moderate` must exit 0.
- Direct production dependencies must not include packages used only for local code generation.
- If the shadcn CLI is needed later, it should be invoked with an explicit `npx shadcn@<version>` command rather than installed as a runtime dependency.
- Next.js and `eslint-config-next` versions must remain aligned.

### Go Security

- The API module must target a patched Go version that clears currently reachable standard library vulnerabilities.
- GitHub Actions must install the same Go version through `actions/setup-go`.
- `govulncheck ./...` must run in CI and fail the build on reachable vulnerabilities.

### E2E Stability

- `make test-e2e` must pass as a full suite without relying on rerunning failed specs.
- Auth/navigation helpers must wait for stable route and page markers, not only transient click completion.
- Tests that mutate shared seeded data must either clean up deterministically or use unique test data.
- Playwright diagnostics should remain available on first retry.

### Landing Runtime Warnings

- Landing motion components must not create server/client hydration mismatches.
- Global smooth-scroll behavior must use the Next-supported document marker.
- Above-the-fold images that trigger LCP warnings must either be prioritized or moved below the initial viewport.
- Any warning deliberately left in place must be documented with the reason it is safe.

### CI And Release Docs

- CI must block on frontend tests, lint, build, Go tests, Go vet, Playwright E2E, npm audit, and govulncheck.
- `docs/release.md` must list the complete release-gate command set.
- The production readiness roadmap must remain the source of truth for the next phase.

## Acceptance Criteria

Phase 0 is complete only when these commands pass from a clean checkout:

```bash
npm ci
make verify
make test-e2e
npm audit --audit-level=moderate
cd services/api && govulncheck ./...
git status --short
```

Expected final state:

- `git status --short` shows only intentional source, lockfile, workflow, and documentation changes before commit.
- CI has blocking jobs for the same checks.
- `docs/release.md` and `docs/production-readiness-execution-plan.md` agree on required gates.
- Phase 1 can begin without carrying Phase 0 security or flake debt.

## Risks

- Next.js patch updates may expose framework behavior changes in App Router or image optimization.
- Removing the direct `shadcn` dependency may affect future CLI usage, but the current source tree does not import it.
- Go 1.25 patch alignment requires local and CI environments to use the intended toolchain.
- E2E flake may hide a real app-level navigation/auth race rather than a test-only issue.

## Implementation Plan

Detailed plan: `docs/phase-0-release-gate-stabilization-implementation-plan.md`
