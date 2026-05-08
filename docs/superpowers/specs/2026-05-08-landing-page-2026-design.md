# ClinicPulse Landing Page 2026 Design

Date: 2026-05-08
Branch: `feature/landing-page-2026`
Approved direction: Live Operations Dispatch

## Context

The current landing page is clean and coherent, but it does not yet feel like a category-defining 2026 landing page. The main weakness is not visual polish in isolation. The page presents product facts as a sequence of similar white-card sections, so the story loses momentum and the healthcare operations stakes are not visible enough.

The redesign will rebuild the landing page around one concrete operating incident:

1. A clinic service becomes unavailable.
2. A field worker reports the issue, even with weak connectivity.
3. The district console updates with source, reason, status, and freshness.
4. A patient is routed away from a wasted trip.
5. The decision becomes an audit-ready operating record.

This gives the page a product narrative, a visual spine, and a reason for every section to exist.

## Evidence Reviewed

Current ClinicPulse captures:

- `/tmp/clinicpulse-strategy-review/current/clinicpulse-desktop-full.png`
- `/tmp/clinicpulse-strategy-review/current/clinicpulse-mobile-full.png`
- `/tmp/clinicpulse-strategy-review/current/clinicpulse-tablet-full.png`
- `/tmp/clinicpulse-strategy-review/current-sections/`

Reference captures:

- Dub: `/tmp/clinicpulse-strategy-review/references/dub-full.png`
- Cal.com: `/tmp/clinicpulse-strategy-review/references/cal-full.png`
- Supabase: `/tmp/clinicpulse-strategy-review/references/supabase-full.png`
- PostHog: `/tmp/clinicpulse-strategy-review/references/posthog-full.png`
- Appwrite: `/tmp/clinicpulse-strategy-review/references/appwrite-full.png`
- Plane: `/tmp/clinicpulse-strategy-review/references/plane-full.png`
- Twenty: `/tmp/clinicpulse-strategy-review/references/twenty-full.png`
- Linear: `/tmp/clinicpulse-strategy-review/references/linear-full.png`
- Mobile references: `/tmp/clinicpulse-strategy-review/mobile-references/`

Useful benchmark patterns:

- Dub: long-form product storytelling with strong product visuals, logo proof, feature chapters, testimonial interrupts, and a high-contrast closing CTA.
- Cal.com: compact conversion flow with a clear product preview, review proof, simple workflow cards, and dense social evidence.
- Linear: premium restraint, large dark product surfaces, fewer but stronger sections, and confident spacing.
- Supabase and Appwrite: platform clarity, product grids, ecosystem proof, and security/trust chapters.
- Plane: alternating light and dark chapters that prevent sameness on long pages.

## Goals

- Make the landing page feel specific to healthcare operations, not a generic SaaS dashboard.
- Use real imagery as a first-class part of the story.
- Make one incident narrative obvious from first viewport to final CTA.
- Preserve the existing demo/product truth: district console, field reports, patient rerouting, audit ledger, exports, and partner readiness.
- Improve mobile by reducing equal-weight stacked cards and turning sections into larger story beats.
- Keep the page credible for district teams, clinic coordinators, public-sector buyers, and partners.

## Non-Goals

- Do not fake customer logos, public-sector endorsements, or testimonials.
- Do not add decorative stock imagery that is unrelated to the operating story.
- Do not redesign authenticated app surfaces outside the landing page.
- Do not build a marketing-only page that hides the actual product.
- Do not copy proprietary source code from reference sites. The redesign may use observable layout patterns, not copied implementation.

## Design Direction

The page should feel like a calm operations room during a live incident: serious, precise, human, and modern. It should avoid playful startup decoration, oversized generic hero copy, and thin card grids.

Visual principles:

- Real healthcare/public-sector imagery anchors the page.
- Product UI overlays explain what the system did with the real-world signal.
- Section rhythm alternates between light operational sections and one or two high-contrast product chapters.
- Cards are reserved for repeated items, proof snippets, and framed product modules.
- UI panels should look like believable product surfaces, not decorative mockups.
- The palette should remain mostly neutral with ClinicPulse green as an action/status color, plus restrained red/amber status tones where operationally meaningful.

## Page Architecture

### 1. Navigation

Keep a compact sticky navigation with product anchors and demo actions. The nav should not become visually dominant. On mobile, it should stay simple and avoid wrapping or text overflow.

Required links:

- Problem
- Flow
- Product
- Trust
- Sign in
- Book demo

### 2. Hero: Live District Incident

The hero should immediately show ClinicPulse as an operating system for live clinic decisions.

Content:

- Eyebrow: `Live clinic operations`
- Headline direction: `Know which clinics can help before patients travel.`
- Supporting copy: mention live availability, offline field reports, patient rerouting, and audit-ready records.
- Primary CTA: `Book demo`
- Secondary CTA: `Watch the incident flow` or `View demo flow`

Visual:

- A large product console remains the primary hero visual.
- A real-world image strip or background crop should sit behind or beside the product surface, using clinic/field context without obscuring text.
- The product surface must show a live incident: Mamelodi East unavailable, ARV pickup affected, Akasia Hills recommended, audit ID attached.
- Include 2-3 compact proof metrics in the hero, such as monitored clinics, synced reports, and freshness target. These must be clearly framed as demo/pilot metrics unless verified production numbers exist.

Hero success criteria:

- Above the fold must communicate who it is for, what problem it solves, and what the product looks like.
- The hero must contain at least one real image and one product surface.
- The CTA area must remain visible and usable on mobile.

### 3. Real-World Stakes Strip

Replace the current equal-weight stakeholder cards with a more visual, sharper section.

Purpose:

- Show the four affected groups: district team, field worker, clinic coordinator, patient.
- Tie each group to the same incident rather than separate feature claims.

Visual:

- Four compact tiles can remain, but at least two should include real-image crops or image-backed treatment.
- Each tile should include a concise outcome, not a generic description.

Example outcomes:

- District team: sees source, reason, and freshness before acting.
- Field worker: submits a report when signal is weak.
- Clinic coordinator: confirms service impact with traceable source.
- Patient: sees a safer nearby route before traveling.

### 4. Problem: Status Changes Before Systems Catch Up

Keep the core problem, but make it more visceral and less like a before/after checklist.

Visual:

- Use a real image of clinic or field context as the section anchor.
- Pair it with an incident timeline showing how stale data becomes a public-facing risk.
- Avoid a generic laptop desk image as the main proof.

Content:

- The section should explain the cost of stale confidence: wasted travel, delayed district decisions, and untraceable changes.
- Keep copy direct and operational.

### 5. Incident Flow: From Field Signal To Operating Record

This should become the central chapter of the page, inspired by Dub's feature chapters and Linear's large product surfaces.

Structure:

- Use one large product storyboard instead of a small list.
- Show four connected states:
  - Offline field report queued
  - District alert opened
  - Patient route updated
  - Audit record sealed

Visual:

- On desktop, use a large horizontal or diagonal product composition with connected panels.
- On mobile, collapse into a swipe-free vertical timeline with one strong panel per step.
- Include a real-world image accent for the field report step.

### 6. Product Surfaces

Keep the three product surfaces, but make them more dimensional and less equal.

Recommended hierarchy:

- Primary module: District command center
- Secondary modules: Field reports and Patient rerouting
- Supporting module: Audit ledger/export readiness

Visual:

- One large product screenshot-style panel should dominate the section.
- Smaller modules should connect to it as satellites.
- The section should not look like three identical cards.

Content:

- Emphasize actions and outcomes, not feature labels.
- Each product surface should answer: what decision does this help someone make?

### 7. Trust Infrastructure

Keep this section, but make it feel like public-sector operating evidence rather than a list of technical objects.

Required trust objects:

- Source and permissions
- Freshness
- Audit events
- CSV/export readiness
- API/status endpoint
- Webhook preview
- Offline queue

Visual:

- Use a dark or high-contrast product chapter here to break the white-card rhythm.
- Show an audit record and export/API panel as serious infrastructure surfaces.
- Include clear labels that make the evidence chain legible.

### 8. Proof Without Fake Logos

Because there are no verified customer logos or testimonials in the repo, the page should not invent them.

Instead, use proof formats that are truthful:

- Demo workspace proof: seeded demo data, screenshots, and walkthrough.
- Operational proof: freshness, source, audit ID, export readiness.
- Build proof: real app surfaces and demo workflow links.

If real pilot/customer proof becomes available later, add a dedicated proof strip. Until then, credibility should come from the product evidence and operating model.

### 9. Closing CTA

The final CTA should be more specific than the current generic demo block.

Content direction:

- `Walk through a live clinic status incident.`
- Supporting copy should mention district console, offline report, patient reroute, audit trail, and exports.
- Primary CTA: `Book demo`
- Secondary CTA: `Open demo workspace` if an appropriate route exists.

Visual:

- High-contrast band is acceptable.
- Include a small incident summary or product record inside the CTA so it does not become a generic black panel.

## Real Image Strategy

Existing local assets:

- `public/demo/clinics/clinic-front-01.jpg`
- `public/demo/clinics/clinic-front-02.jpg`
- `public/demo/clinics/district-operations-room.jpg`
- `public/demo/clinics/mobile-field-report.jpg`
- `public/demo/clinics/patient-routing-context.jpg`

Current concern:

- Some existing images are generic or mismatched to the specific story. The redesign can use them temporarily, but the final page should either source better licensed images or generate more specific bitmap assets.

Image requirements:

- Use images that show healthcare operations, clinic context, field reporting, or patient/service context.
- Avoid generic office laptops as hero imagery.
- Avoid images that imply a specific real clinic, patient, or government endorsement unless licensed and accurate.
- Use `next/image` with stable dimensions and responsive crops.
- Every image needs useful alt text.

Recommended image placements:

- Hero: clinic/operations environment behind product surface.
- Stakes strip: field worker and patient/clinic context crops.
- Problem section: clinic exterior or waiting/service context.
- Incident flow: field reporting image paired with product state.
- Trust section: no image required; product evidence should dominate.

## Mobile Design

Mobile must be designed as its own narrative, not as desktop stacked vertically.

Rules:

- Hero copy, CTA, and product incident should be visible quickly.
- Reduce repeated card grids where possible.
- Turn product chapters into larger panels with clear headings.
- Avoid more than three consecutive sections that are only white cards on white background.
- Keep buttons full-width only where it improves tapping; avoid excessive full-width secondary actions.
- Text inside cards and buttons must not overflow at 390px width.

Target outcome:

- The mobile page can still be long, but it should feel like 6-8 strong story beats, not dozens of equally weighted cards.

## Component Plan

Likely landing components to replace or revise:

- `components/landing/openpanel-product-hero.tsx`
- `components/landing/hero-district-console.tsx`
- `components/landing/stakeholder-proof.tsx`
- `components/landing/operating-gap.tsx`
- `components/landing/workflow-timeline.tsx`
- `components/landing/workflow-incident-panel.tsx`
- `components/landing/product-feature-cards.tsx`
- `components/landing/trust-infrastructure.tsx`
- `components/landing/demo-booking-cta.tsx`
- `lib/landing/openpanel-refactor-content.ts`

Expected new or renamed components:

- `LiveIncidentHero`
- `StakeholderImpactStrip`
- `StatusGapStory`
- `IncidentFlowStoryboard`
- `ProductOperationsShowcase`
- `EvidenceInfrastructure`
- `IncidentDemoCTA`

The exact component names can change during implementation if existing repo patterns make another naming scheme cleaner.

## Accessibility And Performance

- Preserve semantic section structure and meaningful headings.
- Use real buttons for booking interactions and links for navigation.
- Maintain visible focus states.
- Ensure image alt text describes the operational context.
- Avoid animation that hides content or blocks screenshot rendering.
- Respect reduced-motion preferences for any animated product elements.
- Keep layout stable with fixed aspect ratios for image and product panels.
- Avoid remote runtime image dependencies where possible.

## Verification Plan

Before implementation is considered complete:

- Run lint/type/test commands already used by the project.
- Capture full-page screenshots at desktop, tablet, and mobile.
- Capture above-the-fold desktop and mobile screenshots.
- Check that the page has real imagery in the hero and at least two later sections.
- Check that product surfaces are readable at desktop and mobile widths.
- Check that no text overlaps or overflows at 390px mobile width.
- Check that CTAs work and the booking flow still opens correctly.
- Compare the final full-page screenshot against the benchmark set and document remaining tradeoffs.

## Commit Plan

Implementation should use multiple small descriptive commits:

1. Add/prepare landing imagery and content model.
2. Rebuild the hero around the live incident narrative.
3. Rework problem and stakeholder sections.
4. Rebuild incident flow and product surfaces.
5. Rework trust infrastructure and closing CTA.
6. Polish responsive behavior and visual QA findings.

After verification, push the branch and open a new PR or reopen/create the appropriate PR for `feature/landing-page-2026`.
