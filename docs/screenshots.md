# Screenshots Checklist

Final screenshot assets are pending capture. Use this checklist to capture consistent core workflow screenshots after the local or deployed demo is running.

## Capture Setup

- Desktop viewport: `1440x1100`
- Mobile viewport: `390x844`
- Browser: Chromium through Playwright or Chrome
- Demo state: fresh database with `make db-bootstrap`, then login as `org-admin@clinicpulse.local`
- Asset directory when ready: `public/showcase/screenshots/`

## Core Workflow Shots

| Filename | Route | Viewport | State setup | What it should prove |
| --- | --- | --- | --- | --- |
| `landing-desktop.png` | `/` | Desktop | Logged out | ClinicPulse positioning and booking entry are clear |
| `booking-flow-desktop.png` | `/book-demo` | Desktop | Logged out | Lead capture path is credible and focused |
| `booking-thanks-desktop.png` | `/book-demo/thanks` | Desktop | After booking flow | Handoff routes to demo/admin/finder are visible |
| `district-console-desktop.png` | `/demo` | Desktop | Logged in as org admin | Status summary, map, alerts, and scenario controls are visible |
| `clinic-evidence-desktop.png` | `/demo/clinics/clinic-mamelodi-east` | Desktop | Logged in as org admin | Clinic profile, service availability, reports, and audit context are visible |
| `finder-mobile.png` | `/finder` | Mobile | Logged out | Public availability search works on mobile |
| `field-report-mobile.png` | `/field` | Mobile | Logged in as reporter | Offline-friendly report flow is usable on mobile |
| `admin-readiness-desktop.png` | `/admin` | Desktop | Logged in as org admin | Lead pipeline, API preview, partner readiness, and pilot readiness are visible |

## Playwright Capture Path

After the app is running, add a temporary local capture script or use Playwright UI mode:

```bash
npm run test:e2e:ui
```

Before committing screenshots, confirm they show real ClinicPulse surfaces, avoid private local data, and match the routes above.
