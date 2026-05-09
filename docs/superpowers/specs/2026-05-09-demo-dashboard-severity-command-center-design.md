# Demo Dashboard Severity Command Center Design

## Purpose

Restructure the `/demo` dashboard for the district operator/admin role so it feels built around that user's actual job: triage district risk, choose the next intervention, and verify that action improved service continuity.

The dashboard should not be a generic console with personalized copy. The role should shape the layout, information hierarchy, interaction flow, and analytics.

## Target role

This pass targets `district_admin` / district operator users only.

Other roles may keep their existing experiences until they receive their own role-native dashboard design.

## Primary job-to-be-done

In the first 10 seconds, the dashboard must answer:

1. What is broken or risky right now?
2. Which clinic or incident matters most?
3. What action should I take next?
4. How will I know the action worked?

## Recommended structure

Use an `Incident Command Board` structure implemented as a `Severity Command Center`.

Primary flow:

1. `Risk brief`
2. `Unified severity queue`
3. `Intervention rail`
4. `Signal analytics`
5. `Verification and handover`
6. `Supporting operational details`

This flow prioritizes triage and intervention. Analytics exist to explain decisions, not to become a separate reporting dashboard.

## Page hierarchy

### 1. Risk brief

The first module gives a sharp district-level summary:

- District condition.
- Highest current risk.
- Why the risk matters.
- Current operational posture.
- Suggested immediate focus.

This replaces any generic welcome/personalized intro. The district operator should immediately feel that the page is a command surface, not a marketing or admin dashboard.

### 2. Unified severity queue

The queue is the center of the screen and the primary work area.

It ranks clinics or incidents by one explainable severity score. Each item should show:

- Clinic or incident name.
- Severity score and label.
- Status and freshness.
- Patient/service consequence.
- Reason codes explaining the score.
- Recommended next action.
- Verification need.

The queue replaces the primary role of the old dense clinic table. The dense table can remain available lower on the page as supporting detail.

### 3. Intervention rail

The intervention rail updates based on the selected queue item. On page load, the highest severity item is selected automatically.

The rail should show:

- Primary recommended action.
- Why this action is recommended.
- Available alternatives or reroute options.
- Relevant demo action buttons such as reroute, sync, replay, or clinic detail.
- Expected outcome.
- Verification step after the action.

This makes the dashboard action-oriented instead of observational.

### 4. Signal analytics

Analytics should be compact and explanatory. Each chart or card must answer one of these questions:

- Why is the district risky right now?
- What signal is driving the severity queue?
- What changed after intervention?

Useful signals include:

- Status mix.
- Freshness risk.
- Active alerts.
- Offline backlog.
- Service pressure.
- Recent worsening reports.
- Availability of alternatives.

Avoid large analytics panels that compete with triage. The operator should not need to inspect charts before knowing what to do.

### 5. Verification and handover

The dashboard should support the end of the intervention loop:

- What changed?
- What still needs confirmation?
- Which reports or audit events support the decision?
- What should the next operator know?

This may use existing audit events and report stream data, but the presentation should be concise and operational.

### 6. Supporting operational details

Existing modules remain available but should not dominate the first screen:

- Clinic map.
- Report stream.
- Incident replay panel.
- Demo controls.
- Alerts.
- Pilot readiness.
- Dense clinic table.

These modules can appear lower on the page or inside secondary sections. The command-center hierarchy comes first.

## Data model

Add a district command model derived from existing demo state and session data.

Inputs:

- Client auth session.
- Clinic rows.
- Active alerts.
- Recent report stream.
- Status counts.
- Offline queue.
- Alternative clinic lookup.
- Sync summary where available.

Core output:

- District risk brief.
- Ranked severity queue.
- Selected item details.
- Intervention actions.
- Signal analytics summaries.
- Verification and handover summary.

Each severity queue item should include:

- `id`
- `clinicId`
- `clinicName`
- `score`
- `severityLabel`
- `status`
- `freshness`
- `reasonCodes`
- `patientImpact`
- `recommendedAction`
- `verificationNeed`
- `availableAlternatives`

## Severity scoring

Use a deterministic, explainable scoring model rather than hard-coded ordering.

Suggested scoring inputs:

- Non-functional status.
- Degraded status.
- Stale, unknown, or needs-confirmation freshness.
- Active alert involvement.
- Offline queue involvement.
- Lack of available alternatives.
- Service pressure.
- Recent worsening report.
- High-impact service disruption.

The UI should expose the reasons behind a score. Operators should see why the dashboard ranked an item first.

## Interaction behavior

- The highest severity item is selected automatically on load.
- Selecting a queue item updates the intervention rail, map focus, recommended action, and verification context.
- Status filters remain available as secondary controls.
- Existing demo actions remain available: stockout trigger, staffing trigger, offline sync, incident replay, reroute, reset, and clinic detail navigation.
- The dashboard should still support demo storytelling, but the main flow must stay command-first.

## Component architecture

Proposed components:

- `DistrictCommandBrief`
- `SeverityQueue`
- `InterventionRail`
- `SignalAnalytics`
- `VerificationHandover`
- `SupportingOperations`

Proposed model module:

- `lib/demo/district-command-center.ts`

The model should be pure and testable. UI components should receive prepared command-center data rather than recomputing severity logic independently.

## Testing strategy

Add unit tests for:

- Severity scoring.
- Reason-code generation.
- Empty or low-risk fallback state.
- High-risk ordering.
- Offline/freshness/alert weighting.

Add focused UI or E2E coverage for:

- Dashboard loads after login.
- Risk brief is visible.
- Highest severity item appears first.
- Selecting a queue item updates the intervention rail.
- Existing clinic detail navigation remains available.

Avoid brittle E2E assertions around exact counts unless demo seed data is intentionally stable.

## Implementation note

There is an existing generic personalization implementation on the feature branch. That work should be treated as a prototype, not the final target. The implementation plan should either replace or substantially reshape it around this role-native command-center design.
