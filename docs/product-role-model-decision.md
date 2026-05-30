# Product Role Model Decision

Date: 2026-05-11
Status: Accepted

## Decision

ClinicPulse will not introduce every future persona as a full authenticated product role before Phase 3.

The authenticated product remains centered on four roles:

- Reporter
- District manager
- Organisation admin
- System admin

Future personas remain part of the product model, but they are not separate dashboards or auth roles until a workflow proves that they need a distinct home, permissions model, and handoff responsibility.

## Reason

ClinicPulse is currently moving from a polished demo into a product-backed operations system. The clearest next proof is the operational handoff loop:

```text
Reporter submits a clinic signal
-> District manager sees and acts on the signal
-> Admin reviews evidence, audit history, and readiness
-> Public or partner surfaces consume trusted clinic availability
```

Adding every possible persona now would make the product broader before it becomes clearer. It would create more dashboards, more navigation, more permissions, and more placeholder states before the core workflow has proven itself end to end.

The product should first make one real loop credible. More roles should be promoted only when they own real work that cannot be represented cleanly by an existing role, public route, or admin sub-surface.

## Current Treatment Of Personas

| Persona | Current treatment | Why |
| --- | --- | --- |
| Reporter / field worker | Authenticated role | Owns field report submission and offline/sync workflow. |
| District manager | Authenticated role | Owns district triage, severity review, clinic network visibility, and intervention handoff. |
| Organisation admin | Authenticated role | Owns governance, users, reporting coverage, partner readiness, exports, and audit evidence. |
| System admin | Authenticated role | Owns platform health, tenant posture, data ingestion, security, and demo/platform controls. |
| Clinic coordinator | Future role or workflow participant | The current product does not yet have a clinic-level confirmation workflow that requires a separate authenticated home. |
| Partner / API user | Admin sub-surface for now | Partner readiness, exports, API keys, and evidence bundles belong under organisation admin until there is a real external partner portal. |
| Public user / patient | Public route, not auth role | Public availability and rerouting belong in `/finder` and public clinic pages, not authenticated workspace navigation. |
| Founder/admin | Split across existing admin roles and demo controls | Founder-demo controls are useful for the showcase route, but they should not become a production auth role. |

## Role Promotion Criteria

A future persona can become a first-class role only when all of these are true:

- It owns a workflow with a clear primary job.
- It needs a distinct home route or workspace.
- It needs permissions that cannot be expressed by the existing four roles.
- It participates in a product handoff that Phase 3 or later workflows can test.
- It has enough real UI states to avoid becoming a placeholder dashboard.

## Phase 3 Implication

Phase 3 should not start by expanding roles. It should use the four-role model to prove the first real vertical slice:

```text
Field report submission
-> API/database persistence
-> district dashboard update
-> audit trail
-> admin review
```

The demo route remains available as a showcase/sandbox, but the product routes stay focused:

- `/field`: reporter workspace
- `/district`: district manager workspace
- `/admin`: organisation admin and system admin workspace
- `/finder`: public availability and rerouting surface
- `/demo`: controlled showcase route

## Deferred Work

The following should be considered after the Phase 3 vertical slice is working:

- Clinic coordinator confirmation workflow.
- Partner/API portal or external partner workspace.
- Public user experience beyond finder and clinic availability pages.
- More granular admin role management.
- Route renaming or route-group cleanup beyond the current product/demo split.
