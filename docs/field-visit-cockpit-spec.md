# Field Visit Cockpit Spec

Date: 2026-05-26
Status: Approved design for implementation planning
Route: `/field`

## Goal

Redesign the field reporter home into a mobile-first Field Visit Cockpit. The first viewport will show the next selected clinic, the report action, and the device sync state before aggregate metrics or long lists.

This is frontend web work only. The implementation will use the existing Next.js, React, TypeScript, IndexedDB, and PWA-style primitives already in ClinicPulse. Java, Kotlin, Dart, Swift, and native app source are out of scope for this slice.

## Research Basis

The local reference pack under `reference-projects/field-role/` has been corrected to web-only sources:

- ODK Web Forms for browser form host callbacks, geolocation request states, and validation-first submit.
- Enketo Core for mature web form validation, page navigation, file/geopoint widgets, and save/invalidated events.
- React Use Wizard and Stepperize for guided step state and transition lifecycle ideas.
- React Use Offline, TanStack Query, Workbox, and StrataSync for IndexedDB queues, paused mutations, retry/backlog state, and web-safe sync wording.

The implementation will adapt patterns, not copy large subsystems. Sources without a clear root license file are inspect/adapt references unless their package license is rechecked before copying any code.

## Current State

The existing `/field` route has the required operational primitives:

- `app/(demo)/field/page-client.tsx` owns selected clinic state, online override, submit handling, and queue sync.
- `components/demo/field-clinic-list.tsx` renders assigned clinic choices.
- `components/demo/report-form.tsx` captures status, pressures, reason, notes, and online/offline submit state.
- `components/demo/offline-queue.tsx` and `components/demo/sync-status.tsx` expose queued reports and sync state.
- `lib/demo/field-report.ts` provides report creation, IndexedDB queue helpers, stale syncing recovery, and sync result handling.
- Existing tests cover field report behavior and feedback flows.

The issue is the page hierarchy and language. On mobile, the user sees summary cards and a long clinic list before the core visit action. Queue language is technically correct but not operational enough for a field worker.

## User Experience

The first screen becomes a cockpit band with:

- Selected or recommended clinic name.
- Visit position, such as `Stop 1 of 8`.
- Compact status chips for clinic status, freshness, and review/sync pressure.
- Primary action: `Start report` or `Continue report`.
- Secondary action: `Change clinic`.
- Device state strip: online reachability, saved-on-device count, last sync time, and retry pressure.

The first 390px mobile viewport must include the clinic identity and the primary report action without scrolling.

## Layout

`/field` will use three visible zones:

1. Cockpit header: the selected visit, main action, and device sync strip.
2. Visit work area: guided report capture for the selected clinic.
3. Itinerary and queue: compact clinic route rows plus saved-device queue.

Desktop will use a dense operational layout, not oversized marketing-style cards. The desktop structure is a full-width cockpit at the top, then a two-column grid where report capture owns the wider column and itinerary/queue owns the narrower column.

Mobile will keep controls compact and stable. Avoid nested cards. Use full-width bands and framed cards only for repeated clinic rows, queue rows, or the report tool surface.

## Field Itinerary

The clinic list becomes an itinerary:

- Compact rows by default.
- The selected clinic row expands with reason, last report, and direct action.
- Prioritize stale, unknown, non-functional, and degraded clinics before healthy fresh clinics. Preserve the seeded clinic order only as a tie-breaker inside the same risk band.
- Preserve the current selected-clinic behavior so changing clinics updates the cockpit and report form.

The itinerary is presented as today's work list, not as a dashboard roster.

## Report Capture

The first slice keeps the current field values but presents them as a guided visit flow:

1. Confirm clinic.
2. Set clinic operating status.
3. Capture staffing, stock, and queue pressure.
4. Add reason and notes.
5. Review and send or save on this device.

The first slice will implement this as one compact form with visible step sections. It will not add a stepper state machine yet. A full wizard component can follow once screenshots confirm the cockpit direction.

Validation will remain explicit. If required data is missing, the UI will point to the missing field before submit.

## Device Queue

Queue language will be operational:

- `Saved on this device`
- `Ready to sync`
- `Syncing`
- `Needs retry`
- `Sent for district review`

Do not promise native-grade background delivery. The page will say reports sync when the app is open and ClinicPulse can be reached.

The queue will stay visibly tied to the selected clinic when possible. If the selected clinic has a queued report, the cockpit will show that state.

Existing queue states will remain the source of truth for this slice:

- `queued` maps to `Saved on this device`.
- `retry_wait` and `failed` map to `Needs retry`.
- `syncing` maps to `Syncing`.
- `conflict` maps to `Needs review`.
- `synced` maps to `Sent for district review`.

## Error Handling

Use browser online state only as a hint:

- If the API succeeds, show `Sent for district review`.
- If the browser is offline, save the report on this device.
- If the browser appears online but the API cannot be reached, save the report on this device and explain that ClinicPulse could not be reached.
- If the API rejects validation or authorization, show the error and do not silently queue invalid data.
- If retry fails repeatedly, keep the queue item visible with retry affordance and the last failure reason.

## Architecture

Add a small field cockpit view-model layer rather than pushing new sorting and label logic directly into the page component. The helper will derive:

- selected clinic summary
- itinerary rows
- primary action label
- device/sync strip labels
- selected-clinic queued-report state

Implementation files:

- New helper under `lib/demo/field-visit-cockpit.ts`.
- New focused tests under `lib/demo/field-visit-cockpit.test.ts`.
- Updates to `app/(demo)/field/page-client.tsx` to consume the helper.
- Updates to `components/demo/field-clinic-list.tsx` for itinerary presentation.
- Updates to `components/demo/report-form.tsx`, `offline-queue.tsx`, and `sync-status.tsx` only where needed for language and layout.

Keep the first slice narrow. Do not add a new form engine, service worker, media capture, or auth role.

## Visual Acceptance

Required screenshots after implementation:

- Desktop field cockpit.
- Mobile first viewport with selected clinic and primary report action.
- Mobile report capture.
- Mobile saved-on-device or needs-retry queue state.

The screenshots will prove the first action is visible immediately, text does not overlap, and the sync/device state is understandable without reading code.

## Test Plan

Run and keep passing:

- `npm test -- lib/demo/field-report.test.ts lib/demo/field-report-feedback.test.ts`
- New unit test for the cockpit view model.
- Existing field E2E: `tests/e2e/field-pending-review.spec.ts`.

Add or extend E2E coverage for:

- Reporter reaches `/field` and the mobile first viewport includes selected clinic plus `Start report` or `Continue report`.
- Offline submit saves with `Saved on this device` or `Ready to sync` language.
- Sync/retry state remains visible after a queued report exists.

## Non-Goals

- No Java, Kotlin, Dart, Swift, or native implementation reference.
- No copied AGPL source.
- No copied code from references with unclear root license files until license is rechecked.
- No full ODK/Enketo replacement.
- No large media uploads.
- No native-grade background sync claims.
- No new role beyond existing `reporter`.

## Implementation Decisions

- The first slice uses one form with step styling, not a stateful wizard.
- Itinerary sorting is risk-first, with seeded order as the tie-breaker.
- Queue state changes are presentation labels over the existing `OfflineReportQueueStatus` values.
