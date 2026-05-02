# ClinicPulse Phase 1 Founder Demo Runbook

## Purpose

This runbook supports a seven-minute founder walkthrough of the ClinicPulse Phase 1 demo. The goal is to show, without a backend, that ClinicPulse can collect clinic status reports, update district visibility, route the public around unavailable clinics, and preserve trust through freshness and audit history.

## Pre-Demo Reset

1. Open the app in a fresh browser profile or clear site data for the local demo origin.
2. Confirm `/demo` loads the seeded Tshwane North district state.
3. Confirm `/field` shows no unsynced offline reports from an earlier walkthrough.
4. Confirm `/book-demo` can submit a local demo lead and `/book-demo/thanks` renders after submission.
5. Keep these tabs ready: `/demo`, `/field`, `/finder`, `/admin`, and `/book-demo`.

## Seven-Minute Flow

### 1. District Visibility (`/demo`)

Open with the district console. Point out the seeded clinic network, status counts, facility list, map view, report stream, alerts, and audit trail. Explain that the founder demo starts from a shared operational picture, not a static dashboard.

### 2. Operational Incident (`/demo` trigger stockout)

Trigger the stockout scenario. Show the affected clinic changing status, the summary counts updating, a new alert/report appearing, and the audit trail recording the change. The key message: one operational report changes the district view immediately.

### 3. Field Report (`/field`)

Open the field reporting flow. Submit a short report while online, or switch offline mode on, queue a report, then sync it. Show that local queued reports can survive the walkthrough and then update the demo state once synced.

### 4. Public Routing (`/finder`)

Open the public finder and select the affected or unavailable clinic. Show that ClinicPulse does not only display a problem; it suggests alternatives using service compatibility, freshness, and distance. Call out seeded/mock labeling where visible.

### 5. Facility Trust Record (`/clinics/[clinicId]`)

Open the affected clinic detail route. Show the current status, latest report, source, freshness, audit events, and routing context. The key message: trust comes from explaining when the status changed, who or what reported it, and how fresh it is.

### 6. Infrastructure Proof (`/admin`)

Open the admin route. Show demo leads, export preview, API preview, and roadmap modules as proof of the future integration shape. Describe these as Phase 1 previews of the contract that a Go backend and PostgreSQL database will later support.

### 7. Conversion (`/book-demo`)

Close on the booking form. Position it as the next step for a pilot, NGO, district, or partner conversation. Submit the form only if useful for the audience; it is stored locally for the demo.

## Failure Recovery

- If the app shows stale scenario state, clear site data for the local origin and reload `/demo`.
- If an offline field report from a previous demo appears, clear site data or sync the queue before restarting.
- If `/finder` does not show the expected reroute, return to `/demo`, trigger the stockout scenario again, then reopen `/finder`.
- If `/book-demo/thanks` does not appear after submission, return to `/book-demo`, check the required fields, and resubmit.
- If a route fails during a live walkthrough, switch to `/demo` and continue the story from the seeded district console.

## Demo Honesty Statement

Phase 1 is frontend-only. All app data is seeded or stored locally in the browser before the Go backend and PostgreSQL persistence layer exist. The API preview, export preview, offline queue, demo leads, and clinic reports show the intended product and integration contract; they are not production backend integrations.
