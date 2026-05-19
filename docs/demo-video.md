# Operations Walkthrough Script

Local operations walkthrough asset: `public/showcase/videos/clinicpulse-operations-walkthrough.webm`

The walkthrough video is generated locally by `npm run capture:showcase` and is intentionally ignored by git.

Target length: 60 to 90 seconds.

## Narrative Arc

1. District teams need reliable, current clinic availability before patients are sent across the network.
2. ClinicPulse gives them a district console, field reporting, public finder, partner API surface, audit history, and export readiness.
3. The walkthrough shows how a service disruption becomes a visible operational decision instead of a stale spreadsheet entry.

## Shot List

| Time | Screen | Action | Narration |
| --- | --- | --- | --- |
| 0:00-0:08 | `/` | Show landing and product premise | "ClinicPulse is a clinic operations workspace for district teams managing live facility availability." |
| 0:08-0:22 | `/demo` | Show status summary, map, and alerts | "The district console shows which clinics are operational, degraded, non-functional, or stale." |
| 0:22-0:35 | `/demo` | Trigger stockout or staffing scenario | "When conditions change, the operating picture updates immediately and flags where action is needed." |
| 0:35-0:48 | `/demo/clinics/clinic-mabopane-station` | Open Mabopane Station incident evidence | "Mabopane Station keeps incident evidence, patient routing impact, report history, and escalation context in one place." |
| 0:48-1:00 | `/field` | Submit or sync a report | "Field teams can submit updates through an offline-friendly workflow and sync when connectivity returns." |
| 1:00-1:12 | `/finder` | Search public availability | "The public finder can direct patients toward available services." |
| 1:12-1:25 | `/admin` | Show API preview, export, partner readiness | "The admin view shows integration readiness, export previews, and partner API operations." |
| 1:25-1:30 | README or docs | Show architecture/docs briefly | "The repo includes the architecture, API, schema, local run path, and tests." |

## Capture Checklist

- Reset the isolated e2e database before recording.
- Use seeded demo credentials from `README.md`.
- Keep browser zoom at 100%.
- Hide browser bookmarks and unrelated local windows.
- Record at 1080p or higher for external publishing.
- Keep narration factual and implementation-specific.
- The generated walkthrough is WebM from Playwright. Convert to MP4 only for portfolio or social platforms that require it.

## Regenerate Local Walkthrough

```bash
make db-up-e2e
make db-reset-e2e
E2E_DATABASE_URL='postgres://clinicpulse:clinicpulse@localhost:55432/clinicpulse_e2e?sslmode=disable' \
  CLINICPULSE_E2E_API_PORT=18080 \
  CLINICPULSE_E2E_WEB_PORT=13000 \
  npm run capture:showcase
```
