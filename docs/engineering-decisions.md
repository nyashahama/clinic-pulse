# Engineering Decisions

## 1. Build A Real Full-Stack Demo

Decision: use a Next.js frontend, Go API, and Postgres database instead of a static prototype.

Reasoning: ClinicPulse is meant to demonstrate operational credibility. A real API, schema, auth layer, migrations, and tests make the demo inspectable by technical evaluators.

Tradeoff: the local setup is heavier than a static demo, but the Makefile keeps the path repeatable.

## 2. Use Same-Origin Browser API Proxying

Decision: browser calls use `/api/clinicpulse/*`, rewritten by Next.js to the Go API.

Reasoning: the frontend avoids cross-origin browser configuration during local demos while server-side calls can still target `CLINICPULSE_API_BASE_URL` directly.

Tradeoff: deployment needs the proxy base URL configured correctly.

## 3. Keep Demo Fallback Explicit

Decision: allow seeded frontend fallback only when configured or in non-production demo contexts.

Reasoning: demos should stay usable if a backend call fails locally, but staging and production should expose API failures.

Tradeoff: fallback logic must be treated as demo resilience, not production correctness.

## 4. Model Roles In The Backend

Decision: use session auth and role middleware for reporter, district manager, org admin, and system admin access.

Reasoning: the demo needs to show different operational surfaces without relying only on frontend hiding.

Tradeoff: local setup needs seeded users and a login flow.

## 5. Store Audit And Review History Append-Only

Decision: audit events and report reviews are immutable after insertion.

Reasoning: operational systems need credible history for changes, escalations, and decisions.

Tradeoff: corrections must be represented as new events instead of edits.

## 6. Track Offline Sync Attempts

Decision: persist sync attempt outcomes, including duplicate, conflict, validation, forbidden, and server error results.

Reasoning: field reporting in low-connectivity settings needs observable sync behavior.

Tradeoff: sync creates extra metadata, but that metadata makes support and audit workflows clearer.

## 7. Document Human-Readable API First

Decision: add a route reference before introducing generated OpenAPI.

Reasoning: the immediate need is portfolio and evaluator clarity. The router is still compact enough for a curated reference.

Tradeoff: generated clients and schema validation remain future work.

## 8. Gate Release Tagging On Verification

Decision: document `v0.1.0-alpha` now, but create the tag only after verification and user approval.

Reasoning: a release tag should mean the repo is ready to hand to reviewers.

Tradeoff: the visible release marker waits until screenshots, demo/video decisions, and tests are in acceptable shape.
