# Clinic Pulse Landing Page OpenPanel-First Refactor Design

Date: 2026-05-04
Status: approved for planning

## Goal

Refactor the Clinic Pulse landing page into a polished, product-led SaaS page modeled primarily on OpenPanel's public homepage structure. The page should convince district health and clinic operations buyers to book a demo while still making the opportunity clear to investors, pilot partners, and NGO stakeholders.

The refactor should make Clinic Pulse feel like a working operations product immediately. The first viewport must show the brand, the category, the core promise, and a believable product preview rather than an abstract marketing composition or internal demo language.

## Approved Direction

Use Option 1: OpenPanel-first.

Primary reference project:

- `reference-projects/openpanel/apps/public/src/app/(home)/page.tsx`
- `reference-projects/openpanel/apps/public/src/app/(home)/_sections/hero.tsx`
- `reference-projects/openpanel/apps/public/src/app/(home)/_sections/analytics-insights.tsx`
- `reference-projects/openpanel/apps/public/src/app/(home)/_sections/collaboration.tsx`
- `reference-projects/openpanel/apps/public/src/app/(home)/_sections/data-privacy.tsx`
- `reference-projects/openpanel/apps/public/src/app/(home)/_sections/cta-banner.tsx`
- `reference-projects/openpanel/apps/public/src/components/section.tsx`
- `reference-projects/openpanel/apps/public/src/components/feature-card.tsx`

Secondary reference project:

- `reference-projects/twenty/packages/twenty-website-new/src/app/[locale]/(home)/page.tsx`

Twenty is only a pacing reference for narrative clarity. Do not transplant its Linaria design system or heavy site architecture.

## Current Problems To Fix

The current landing page contains useful Clinic Pulse content and assets, but the composition does not yet feel like a focused buyer-facing landing page.

- The hero is visually heavy and mixes lead capture, booking modal state, customer logos, and a large bespoke product mockup in one component.
- Several section headings read like internal product critique or demo guidance rather than buyer-facing copy.
- The page story is split across many custom components with inconsistent visual rhythm.
- Product proof exists, but the first impression does not cleanly communicate the product category and value proposition.
- The page should lean more on reusable section/card patterns so the refactor is easier to maintain.

## Target Audience

Primary:

- District health teams
- Clinic operations managers
- Public health program operators

Secondary:

- Investors and accelerator reviewers
- NGO implementation partners
- Integration partners evaluating pilot readiness

The primary conversion is booking a demo or pilot walkthrough.

## Page Structure

The approved page flow is:

1. Hero with product browser frame
2. Stakeholder proof/perks row
3. Operating gap
4. Workflow timeline
5. Three product feature cards
6. Trust, audit, API, and infrastructure block
7. Demo CTA banner

## Section Designs

### Hero

Reference source: OpenPanel `hero.tsx`.

The hero should use OpenPanel's product-led structure: strong left-side copy, clear CTAs, concise proof/perks, and a right-side browser-style product frame.

Content requirements:

- H1 should be `Clinic Pulse`.
- Supporting copy should explain live clinic availability, field reporting, patient rerouting, and audit-ready records.
- Primary CTA should open or route to the existing demo booking flow.
- Secondary CTA should point to an existing demo/product flow route or anchor.
- Perks should communicate concrete operational trust, such as offline-ready reports, audit trail, public rerouting, and freshness checks.

Visual requirements:

- The hero preview must be native React markup using Clinic Pulse demo data, not an external iframe.
- The preview should look like an operations workspace: district console, clinic status table/map, incident freshness, and routing decision.
- The first viewport must show a hint of the next section on common desktop and mobile viewports.
- Avoid abstract decorative hero art, gradient blobs, or a purely atmospheric clinic photo as the main product signal.

### Stakeholder Proof

Reference source: OpenPanel `WhyOpenPanel` structure, adapted into compact proof/perks instead of customer-logo claims.

Show four stakeholder tiles:

- District teams: live availability visibility
- Field workers: offline-ready reporting
- Clinic coordinators: status confirmation and source record
- Patients: safer public rerouting

This replaces vague social proof with domain-specific operational proof. Do not claim real customer adoption unless the repo already contains real customer proof.

### Operating Gap

Reference source: Twenty home problem pacing, implemented with local Tailwind patterns.

Replace internal copy such as "The landing page has to show..." with buyer-facing framing:

- Clinic status changes before district systems catch up.
- Patients and coordinators need accurate freshness, service availability, and rerouting context.
- Clinic Pulse closes the gap between field signal, district visibility, public routing, and audit history.

Use existing demo assets from `public/demo/clinics/` where they improve credibility.

### Workflow Timeline

Reference source: OpenPanel `collaboration.tsx`, adapted to operational workflow.

Show a linear product story:

1. Field report received or queued offline
2. District console updates clinic status
3. Alert opens for coordinator review
4. Public finder recommends an alternative clinic
5. Audit record stores source, timestamp, and decision trail

The timeline should be scannable and should not require animation to make sense. Motion can enhance it, but static rendering must still communicate the workflow.

### Feature Cards

Reference source: OpenPanel `analytics-insights.tsx` and `feature-card.tsx`.

Use a three-card grid:

- Field Reports: offline-capable facility updates with source and sync state
- District Console: clinic status, freshness, alerts, and routing readiness in one workspace
- Patient Rerouting: unavailable clinic context plus compatible alternative clinic recommendation

Cards should use a shared local landing card pattern derived from OpenPanel's card composition. Use Clinic Pulse data and simple product miniatures rather than importing OpenPanel illustrations.

### Trust Infrastructure

Reference source: OpenPanel `data-privacy.tsx`, adapted for public-sector trust.

Show operational trust objects:

- Freshness checks
- Source and role permissions
- Audit ledger
- Export path
- API/webhook readiness
- Offline queue state

This section should make Clinic Pulse feel pilot-ready and integration-aware without overpromising production certifications that are not represented in the repo.

### Demo CTA

Reference source: OpenPanel `cta-banner.tsx`, with Clinic Pulse styling.

The final CTA should be a polished booking banner:

- Headline: direct invitation to book a Clinic Pulse demo or pilot walkthrough
- Body: concise summary of what the walkthrough covers
- CTA: existing booking flow
- Secondary note: demo data is seeded to show the operating model clearly

The CTA should not rely on decorative SVG arcs from OpenPanel if they conflict with the Clinic Pulse visual direction. Use a restrained product-led treatment.

## Component Architecture

Keep `app/page.tsx` as the assembly point.

Recommended new or refactored components:

- `components/landing/landing-section.tsx`
- `components/landing/landing-feature-card.tsx`
- `components/landing/openpanel-product-hero.tsx`
- `components/landing/stakeholder-proof.tsx`
- `components/landing/operating-gap.tsx`
- `components/landing/workflow-timeline.tsx`
- `components/landing/product-feature-cards.tsx`
- `components/landing/trust-infrastructure.tsx`
- `components/landing/demo-booking-cta.tsx`

Existing components can be replaced or rewritten when their purpose overlaps with the approved structure. Keep unrelated demo pages and app workflows unchanged.

The booking modal behavior currently attached to the landing hero should be preserved, but the hero should not remain a large all-in-one component. If booking state is still needed on the page, isolate it into a focused booking component or keep the existing modal panel behind a smaller trigger.

## Data And Assets

Use existing Clinic Pulse assets:

- `public/demo/clinics/clinic-front-01.jpg`
- `public/demo/clinics/clinic-front-02.jpg`
- `public/demo/clinics/mobile-field-report.jpg`
- `public/demo/clinics/district-operations-room.jpg`
- `public/demo/clinics/patient-routing-context.jpg`

Use existing Clinic Pulse demo data patterns from landing components where possible, but rewrite copy into buyer-facing language.

Do not add new remote image dependencies for the first implementation unless an existing image is insufficient for a specific section.

## Behavior

Preserve:

- Existing navigation to sign in and booking/demo entry points
- Existing `?booking=1` and `#booking` booking-modal behavior if the modal remains part of the landing page
- Existing demo lead storage behavior through `DemoStoreProvider`

Avoid:

- External product iframes in the hero
- Claims about real customers, compliance, or certifications that are not backed by local content
- Decorative gradients or blobs as primary visual content
- Visible in-page instructions explaining how the page works

## Accessibility And Responsive Requirements

- All CTAs must have clear accessible labels.
- The hero preview must not collapse into unreadable tiny text on mobile.
- On mobile, product previews can become simplified cards rather than full dense dashboards.
- Text must fit within cards and buttons at common mobile and desktop widths.
- Motion should be nonessential and should not obscure the content.

## Acceptance Criteria

- The landing page clearly presents Clinic Pulse as a clinic operations platform in the first viewport.
- The section order matches the approved OpenPanel-first flow.
- The hero uses a native Clinic Pulse product preview rather than an iframe.
- Existing booking entry points still work.
- The copy is buyer-facing and no longer reads like internal demo critique.
- The page uses Clinic Pulse assets and data, not OpenPanel branding or content.
- The implementation passes `npm run lint` and `npm run build`.
- Desktop and mobile manual review confirm text fit, coherent spacing, and visible first-viewport product signal.

## Out Of Scope

- Backend changes
- Database changes
- New authentication flows
- New real customer logos or testimonials
- New certification/compliance claims
- Rebuilding the full app dashboard
- Importing OpenPanel's full design system

## Implementation Notes

The implementation plan should begin by creating the shared section/card primitives, then refactor the hero and page assembly, then replace downstream sections one by one. The plan should verify after each major section that the page still builds and the booking flow remains reachable.
