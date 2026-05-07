# Screenshots And Capture Guide

The repository includes captured core workflow screenshots in `public/showcase/screenshots/`.

## Capture Setup

- Desktop viewport: `1440x1100`
- Mobile viewport: `390x844`
- Browser: Chromium through Playwright or Chrome
- Demo state: isolated e2e database reset with `make db-reset-e2e`
- Asset directory: `public/showcase/screenshots/`

## Core Workflow Shots

| Asset | Route | Viewport | State setup | What it proves |
| --- | --- | --- | --- | --- |
| [`landing-desktop.png`](../public/showcase/screenshots/landing-desktop.png) | `/` | Desktop | Logged out | ClinicPulse positioning and booking entry are clear |
| [`booking-flow-desktop.png`](../public/showcase/screenshots/booking-flow-desktop.png) | `/book-demo` | Desktop | Logged out | Lead capture path is credible and focused |
| [`booking-thanks-desktop.png`](../public/showcase/screenshots/booking-thanks-desktop.png) | `/book-demo/thanks` | Desktop | After booking flow | Handoff routes to demo/admin/finder are visible |
| [`district-console-desktop.png`](../public/showcase/screenshots/district-console-desktop.png) | `/demo` | Desktop | Logged in as org admin | Status summary, map, alerts, and scenario controls are visible |
| [`clinic-evidence-desktop.png`](../public/showcase/screenshots/clinic-evidence-desktop.png) | `/demo/clinics/clinic-mamelodi-east` | Desktop | Logged in as org admin | Clinic profile, service availability, reports, and audit context are visible |
| [`finder-mobile.png`](../public/showcase/screenshots/finder-mobile.png) | `/finder` | Mobile | Logged out | Public availability search works on mobile |
| [`field-report-mobile.png`](../public/showcase/screenshots/field-report-mobile.png) | `/field` | Mobile | Logged in as org admin | Offline-friendly report flow is usable on mobile |
| [`admin-readiness-desktop.png`](../public/showcase/screenshots/admin-readiness-desktop.png) | `/admin` | Desktop | Logged in as org admin | Lead pipeline, API preview, partner readiness, and pilot readiness are visible |

## Playwright Capture Path

Reset the isolated e2e database, then run the dedicated capture suite:

```bash
make db-up-e2e
make db-reset-e2e
E2E_DATABASE_URL='postgres://clinicpulse:clinicpulse@localhost:55432/clinicpulse_e2e?sslmode=disable' \
  CLINICPULSE_E2E_API_PORT=18080 \
  CLINICPULSE_E2E_WEB_PORT=13000 \
  npm run capture:showcase
```

The capture suite records the screenshots above and writes `public/showcase/videos/clinicpulse-demo-walkthrough.webm`.
