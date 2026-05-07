# Patient Journey Impact Design

## Purpose

ClinicPulse needs one memorable before/after journey that shows the patient value of live clinic availability: a wasted trip is avoided, wasted travel time is saved, and the best nearby compatible clinic is chosen.

The journey should be visible across the product demo instead of living as isolated copy. The landing page sells the outcome, the public finder makes the recommendation tangible, and the district demo or clinic detail explains the operational evidence behind the recommendation.

## Recommended Approach

Use a focused cross-surface journey.

The seeded story is:

- Before: a patient plans to visit Mamelodi East Community Clinic for a compatible service such as Primary care or Pharmacy.
- Problem: the clinic has a current disruption, stale report, or unavailable routing status.
- After: ClinicPulse warns the patient before travel and recommends Akasia Hills Clinic, or whichever eligible clinic the existing alternatives ranking returns first.
- Proof: the recommendation shows wasted trip avoided, estimated wasted-travel minutes saved, service compatibility, fresh operational status, and the reason the source clinic should not receive normal patient routing.

This approach gives the demo a coherent narrative without replacing the existing finder or reroute ranking logic.

## Product Story

The main headline metric is **wasted trip avoided**.

Supporting proof should make the claim credible:

- Estimated wasted-travel time saved.
- Source clinic excluded from normal routing because of status or freshness risk.
- Recommended clinic is the nearest compatible clinic within the strongest available status and freshness tier.
- Requested service is available at the recommended clinic.
- Recommendation is backed by status, freshness, last report time, and reason text.

The story should read human-first and then operational:

1. The patient would have gone to the wrong clinic.
2. ClinicPulse detected the risk before travel.
3. ClinicPulse selected a compatible alternative.
4. The interface explains why the recommendation is safe enough to act on.

## Surfaces

### Landing Page

The landing page should introduce the before/after proof moment. It should lead with "Wasted trip avoided" and use supporting chips or compact metrics for wasted-travel time saved, best nearby compatible clinic, and fresh report.

This section should feel like product proof, not a dense dashboard. It can reuse or strengthen the existing patient reroute narrative already present in landing content.

### Public Finder

The public finder should show a "Journey impact" panel when the selected clinic is unavailable for normal routing.

The panel should show:

- Before: the patient would have travelled to the affected source clinic.
- After: the recommended compatible clinic.
- Impact: wasted trip avoided, estimated wasted-travel minutes saved, service match, distance comparison, and freshness.
- Action: open directions to the recommended clinic.

If the selected clinic is available, the panel should stay quiet or show a compact "routing available" state. If no compatible alternative exists, it should show a clear no-safe-recommendation state instead of manufacturing a successful journey.

### District Demo Or Clinic Detail

The operator-facing surface should show the evidence trail:

- Latest report or status condition that made the source clinic risky.
- Routing rule excluded the source clinic from normal patient flow.
- Alternatives were ranked by compatibility, status, freshness, and distance.
- The public finder surfaced the recommended clinic.

This should help a district stakeholder trust the patient-facing recommendation.

## Data Model

Add a small patient journey impact model on top of existing clinic and alternatives data. It should format and compare the chosen source clinic and recommendation, not create a separate ranking engine.

Recommended shape:

```ts
type PatientJourneyImpact = {
  sourceClinic: ClinicRow;
  requestedService: string;
  recommendedClinic: ClinicRow | null;
  beforeOutcome: string;
  afterOutcome: string;
  impactMetrics: {
    wastedTripAvoided: boolean;
    sourceDistanceKm: number | null;
    recommendedDistanceKm: number | null;
    estimatedWastedTravelMinutesSaved: number | null;
    compatibleServices: string[];
  };
  trustSignals: {
    sourceStatus: ClinicRow["status"];
    sourceFreshness: ClinicRow["freshness"];
    recommendedStatus: ClinicRow["status"] | null;
    recommendedFreshness: ClinicRow["freshness"] | null;
    lastReportedAt: string | null;
    reason: string;
  };
};
```

The model may be adjusted during implementation to match existing `AlternativeRecommendation` fields, but it should preserve these concepts.

## Decision Rules

The journey layer should use the existing alternatives ranking first.

Rules:

- Source clinic comes from the selected clinic or seeded story.
- Requested service comes from the finder service filter when present, otherwise from the source clinic's first service.
- Recommended clinic comes from the first existing alternative recommendation.
- Compatible services come from the recommendation's compatibility fields.
- Source clinic is considered risky when existing `isClinicUnavailable` logic marks it unavailable.
- The journey should not show success if the source clinic is unavailable but no compatible alternative exists.
- The journey should not override backend recommendations when the backend provides alternatives.
- "Minutes saved" means estimated wasted travel avoided by warning the patient before they make the source-clinic trip. It must not imply the recommended clinic is always closer than the source clinic.
- "Best nearby compatible" means the first ranked eligible recommendation, where status and freshness can outrank pure distance.

The first implementation can use estimated distance and minutes already available in finder and alternative utilities. It does not need real geolocation or traffic-aware routing.

## Components And Boundaries

Implementation should stay narrow:

- Add a pure journey utility near `lib/demo/finder.ts`, likely `lib/demo/patient-journey.ts`.
- Add focused tests for the journey model.
- Add one reusable journey impact component that can be composed on finder and operator surfaces.
- Use existing seeded clinics, statuses, freshness, services, and alternative recommendations.
- Keep landing copy/data in the existing landing content structure unless the implementation reveals a cleaner local pattern.

Out of scope:

- Backend ranking changes.
- Real-time traffic or route APIs.
- Geolocation permission flows.
- Booking, appointment scheduling, SMS, or WhatsApp handoff.
- Capacity prediction.
- Multi-patient journey tracking.
- New authentication or role behavior.

## Empty And Error States

The feature must handle:

- Available source clinic: no reroute needed; show normal routing availability.
- Unavailable source clinic with alternatives: show the full before/after impact.
- Unavailable source clinic without alternatives: state that no compatible safe recommendation is available.
- Missing distance or ETA: keep the recommendation visible but label unavailable metrics honestly.
- Backend alternative fetch failure in development: use existing local fallback behavior.
- Backend alternative fetch failure in production: show no recommendation rather than a fake success.

## Testing

Add unit tests for the pure journey utility:

- Builds a successful journey when source clinic is unavailable and an alternative is compatible.
- Uses the top-ranked existing recommendation.
- Returns a no-safe-recommendation state when there are no compatible alternatives.
- Does not claim a wasted trip avoided when the source clinic is available.
- Preserves null distance or ETA values without misleading formatted text.
- Labels saved minutes as avoided wasted travel, not as a guaranteed shorter route.

Add component tests where existing patterns support them:

- Finder shows journey impact for an unavailable selected clinic.
- Finder shows no-safe-recommendation state when alternatives are empty.
- Operator evidence copy includes the source condition and recommendation reason.

Existing finder and alternatives tests should remain valid.

## Success Criteria

The demo can clearly show this story:

"Mamelodi East would have caused a wasted trip. ClinicPulse recommends Akasia Hills because it is compatible, operational, fresh, and nearby."

Acceptance criteria:

- The landing page includes a clear before/after patient journey proof moment.
- `/finder` shows patient-facing journey impact for an unavailable selected clinic.
- The operator-facing demo or clinic detail shows the evidence behind the recommendation.
- The same source clinic, recommended clinic, service, and metric labels do not contradict each other across surfaces.
- No surface claims wasted-travel time saved or best nearby compatible clinic when the required data is missing.
