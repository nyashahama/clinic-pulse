# ClinicPulse Frontend UI Demo Map

## Route Map

| Route | Demo role | What to show |
| --- | --- | --- |
| `/` | Public landing page | Founder narrative, district visibility promise, and conversion entry points. |
| `/demo` | District command console | Seeded district status, clinic map/list, alerts, reports, audit activity, and scenario controls. |
| `/clinics/[clinicId]` | Facility trust record | Clinic status, freshness, latest report, source trail, audit events, and reroute context. |
| `/finder` | Public routing finder | Search/filter clinics, select an unavailable facility, and show recommended alternatives. |
| `/field` | Field reporting flow | Mobile-style report capture, online/offline mode, queued reports, and sync behavior. |
| `/admin` | Founder infrastructure proof | Demo leads, export preview, API preview, operational metrics, and roadmap modules. |
| `/book-demo` | Conversion form | Lead capture path for pilot, NGO, or district stakeholder conversations. |
| `/book-demo/thanks` | Conversion confirmation | Confirmation state after a demo lead is saved locally. |

## Demo Data Boundary

- All current app data is seeded or stored locally in the browser.
- `lib/demo/demo-store.tsx` owns client-side state changes for the demo.
- `lib/demo/storage.ts` persists demo leads and offline queued reports in `localStorage`.
- No Phase 1 route calls a production backend.
- API preview and export preview surfaces are previews of a future integration contract.

## Founder Demo Sequence

1. Open `/demo` and frame ClinicPulse as a district visibility layer for clinic status.
2. Trigger the stockout scenario on `/demo` and show the status counts, map/list, alert stream, and audit activity change.
3. Open `/field` and submit or queue a field report to show how frontline updates enter the system.
4. Return to `/demo` and show the new report, changed clinic state, and local demo history.
5. Open `/finder`, select the affected clinic, and show rerouting based on status, freshness, service compatibility, and distance.
6. Open `/clinics/[clinicId]` for the affected clinic and show why the status is trusted: source, freshness, latest report, and audit events.
7. Open `/admin` and show export preview, API preview, demo leads, and Phase 2 infrastructure direction.
8. Close on `/book-demo` and submit the form if the audience wants a follow-up conversation.

## Acceptance Checklist

- `npm run lint` exits with zero errors and zero warnings.
- `npm run test` exits successfully.
- `npm run build` exits successfully.
- Each route above has a clear behavior in the founder demo sequence or runbook.
- `/demo`, `/field`, `/finder`, `/clinics/[clinicId]`, `/admin`, `/book-demo`, and `/book-demo/thanks` work after a clean browser reset.
- Seeded data, mock export, API preview, and frontend-only behavior are labeled honestly in the UI or supporting docs.
