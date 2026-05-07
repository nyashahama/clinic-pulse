# Portfolio Case Study

## Summary

ClinicPulse is a full-stack clinic operations demo built to show how district teams can maintain live facility status, route patients around disruptions, collect field reports offline, and expose operational data through partner-ready APIs.

## Problem

Clinic availability often changes faster than public directories and district spreadsheets. When staffing, stock, power, or queue pressure changes, patients and coordinators need a reliable way to understand what is open, what is degraded, and where alternatives exist.

## Target Users

- District operations managers tracking clinic readiness.
- Field reporters and clinic coordinators submitting status updates.
- Public users searching for available clinic services.
- Organisation admins preparing partner integrations and exports.
- Technical evaluators reviewing implementation quality.

## Product Scope

ClinicPulse covers:

- Public landing and booking flow.
- Authenticated district console.
- Clinic detail and audit context.
- Public clinic finder.
- Offline-friendly field reporting.
- Admin lead pipeline and partner readiness.
- Go API, Postgres schema, local seed data, and automated tests.

## Core Workflows

1. A district manager logs in and opens `/demo`.
2. The console shows status counts, alerts, clinic map, and recent reports.
3. A disruption scenario changes operational status and highlights routing decisions.
4. Clinic detail pages expose service, report, and audit evidence.
5. A reporter submits or syncs an offline field report.
6. A public user searches `/finder` for available services.
7. An admin checks API preview, exports, webhooks, and partner readiness in `/admin`.

## Architecture

ClinicPulse uses:

- Next.js app router for the frontend and server actions.
- Go chi for API routing and middleware.
- Postgres for operational data, auth, audit events, sync metadata, partner keys, webhooks, exports, and integration checks.
- Same-origin API proxying to keep browser calls simple in local demos.
- Seeded local auth users and demo data for repeatable walkthroughs.

## Engineering Decisions

The implementation favors:

- A real backend instead of static-only demo data.
- Explicit role boundaries for reporter, district manager, org admin, and system admin.
- Immutable audit/review records for operational credibility.
- Offline sync attempt tracking instead of silent retry behavior.
- Human-readable docs before generated API tooling.
- Verification through frontend tests, backend tests, lint, build, and Playwright smoke coverage.

## Proof Assets

Repository evidence:

- `README.md` for local run and demo credentials.
- `docs/architecture.md` for system design.
- `docs/api.md` for API routes.
- `docs/database-schema.md` for persistence model.
- `docs/engineering-decisions.md` for tradeoffs.
- `public/showcase/screenshots/` for workflow screenshots.
- `public/showcase/videos/clinicpulse-demo-walkthrough.webm` for the short demo walkthrough.
- `.github/workflows/ci.yml` for CI baseline.

The case study can be reviewed directly from this repository with local setup, screenshots, video, and CI coverage.

## Publication Next Steps

- Deploy a clean public demo with seeded demo credentials.
- Publish this case study on the portfolio site with the repository screenshots and walkthrough.
- Convert the walkthrough to MP4 if the portfolio host requires it.
- Create `v0.1.0-alpha` after final verification.
