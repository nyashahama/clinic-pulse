# ClinicPulse Product Roadmap

This document is the working memory for the next phase of ClinicPulse. It records where the project is now, the product direction we agreed on, and how each future phase should be specified and planned before implementation.

This is not an implementation spec. Each phase below should get its own focused spec and plan before code changes start.

## Current State

ClinicPulse is currently a polished full-stack clinic operations demo. It already has:

- A Next.js app with public, auth, demo, field, admin, and clinic detail routes.
- A Go API with Postgres, migrations, seeded demo users, role-aware sessions, reports, audit events, sync, partner readiness, and admin endpoints.
- A demo store and seeded demo state that keep the walkthrough controlled.
- Role boundaries for reporter, district manager, organisation admin, and system admin.
- A Vercel-inspired light/dark dashboard direction, including the black dark mode treatment.
- Unit, integration, and E2E coverage for the core demo flows.

The project is no longer only a static demo. The next phase should turn it into a product-backed demo: still controlled and impressive, but increasingly powered by real product workflows.

## Direction

The next product phase starts with UI/UX, not backend complexity.

ClinicPulse is role-driven. The product only works if each user role gets the right surface, the right actions, and the right handoff to the next role. Designing the role experience first reduces the risk of building the wrong backend model or exposing the right data in the wrong way.

The goal is not to design every edge case upfront. The goal is a role-based product blueprint that makes implementation decisions obvious.

## UI/UX Principles

All UI/UX work should be reference-backed.

- Start from credible product references instead of inventing random UI.
- Prefer open-source or publicly inspectable projects when borrowing structure, interaction patterns, or implementation ideas.
- Record the reference source for each major screen or component direction.
- Adapt references to ClinicPulse's domain instead of copying blindly.
- Keep dashboards dense, operational, and usable for repeat work.
- Avoid decorative layouts that weaken the product story.
- Preserve light and Vercel-black dark mode from the start.
- Review screens visually across desktop and mobile before considering work complete.

## Reference Protocol

Every UI/UX phase should include a reference inventory with:

- Reference product or project name.
- Link or local path, such as `reference-projects/<project>`.
- Specific screen, component, or interaction being studied.
- What ClinicPulse is borrowing from it.
- What ClinicPulse is intentionally not borrowing.

When code is adapted from a reference, the spec should identify the file or component that inspired it. If the reference cannot be used directly because of licensing, framework mismatch, or product mismatch, the spec should say so and use it only as visual or interaction inspiration.

## Product Personas And Active Roles

The broader product personas to keep in mind are:

- **Field worker / reporter**: submits clinic status and service availability from the field, including offline or low-connectivity states.
- **Clinic coordinator**: reviews clinic-level status, confirms context, and keeps local readiness evidence current.
- **District / operations manager**: watches the district operating picture, prioritizes alerts, reroutes patients, and coordinates interventions.
- **Organisation admin**: manages governance, access, readiness, reporting coverage, exports, partner evidence, and audit posture.
- **System admin**: manages cross-tenant health, platform security, and operational oversight.
- **Partner / API user**: consumes exports, webhook events, or integration readiness artifacts.

These personas can be refined as real workflows require them. The important rule is that any persona promoted into an authenticated role must have a clear home, top tasks, permissions, and handoffs.

Current authenticated role scope is constrained by the accepted [product role model decision](./product-role-model-decision.md): do not add every future persona as a first-class authenticated role before Phase 3. The four active product roles are reporter, district manager, organisation admin, and system admin. Clinic coordinator, partner/API user, public user, and founder/admin remain modeled as future roles, public routes, admin sub-surfaces, or demo-only responsibilities until a real workflow requires promotion.

## Phase Roadmap

### Phase 1: Role UI/UX Blueprint

Purpose: define the product experience before deeper implementation.

Expected outputs:

- Role definitions and permission boundaries.
- Role-specific dashboard goals.
- Top workflows per role.
- Navigation model for each role.
- Screen inventory: keep, redesign, hide, build, or remove.
- Role handoff map.
- Reference inventory for dashboard and workflow patterns.

This phase should end with a written spec and implementation plan, but no broad backend work.

### Phase 2: Product Shell And Design System

Purpose: standardize the reusable product frame.

Expected outputs:

- Shared dashboard shell patterns.
- Navigation and role switch behavior.
- Dashboard surface primitives, such as panels, metric tiles, evidence lists, status cards, tables, empty states, loading states, and error states.
- Dark/light mode rules for product surfaces.
- Visual regression checklist for key product routes.

### Phase 3: First Real Vertical Slice

Purpose: turn the strongest demo workflow into real product behavior.

Recommended slice:

Field report submission -> API/database persistence -> dashboard update -> audit trail -> admin review.

Expected outputs:

- Real field report creation and review path.
- Clear status transition behavior.
- Audit evidence visible in clinic and admin surfaces.
- E2E tests proving the role handoff.
- Demo still remains controlled, but uses the real workflow underneath where possible.

### Phase 4: Admin And Governance Productization

Purpose: make the organisation/admin story credible beyond demo panels.

Expected outputs:

- Users and roles screen.
- Access review workflow.
- Partner readiness workflow.
- Export and audit evidence views.
- Tenant health and security posture screens.

### Phase 5: Partner And Integration Readiness

Purpose: make external-facing product value concrete.

Expected outputs:

- API key management refinement.
- Export package lifecycle.
- Webhook preview and delivery state.
- Partner evidence bundle.
- Human-readable and machine-readable API documentation.

## Per-Phase Workflow

Each phase should follow this sequence:

1. Write a focused spec.
2. Include reference inventory and inspiration notes.
3. Define scope and non-goals.
4. Define screens, states, components, data flow, and tests.
5. Review the spec before implementation.
6. Write an implementation plan.
7. Implement in small, meaningful commits.
8. Capture or inspect screenshots for affected screens.
9. Run unit, lint, build, and relevant E2E verification.
10. Open or update a PR with a clear summary and verification notes.

## Current Next Step

The next concrete task is:

**Execute Phase 3: First Real Vertical Slice.**

Phase 1 role UI/UX and Phase 2 product shell/design-system work have been specified, implemented, merged, and pulled into `main`. The durable Phase 3 planning docs are:

- [Phase 3 First Real Vertical Slice Spec](./phase-3-first-real-vertical-slice-spec.md)
- [Phase 3 First Real Vertical Slice Implementation Plan](./phase-3-first-real-vertical-slice-implementation-plan.md)

The next implementation branch should turn the field report -> district review -> audit/admin evidence handoff into product-backed behavior while keeping the four active authenticated roles and preserving `/demo` as showcase/sandbox.
