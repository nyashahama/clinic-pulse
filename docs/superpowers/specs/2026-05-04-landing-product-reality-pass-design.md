# Landing Product Reality Pass Design

Date: 2026-05-04

## Goal

Make the existing Clinic Pulse landing page feel like a real, live product without doing a full page refactor. The page structure can remain: hero, stakeholder proof, operating gap, workflow, product surfaces, trust infrastructure, CTA.

The main change is visual credibility. Product surfaces should look inspectable and operational, closer to Dub, OpenPanel, and Twenty: real browser/app frames, dense but readable console states, specific data, active rows, timestamps, status changes, and subtle motion that makes the product feel alive.

## Non-Goals

- Do not rebuild the landing page from scratch.
- Do not change the core section order unless implementation exposes a clear layout bug.
- Do not add more generic stock-style imagery.
- Do not create a heavy animation showcase where motion becomes the point.
- Do not push this spec or other docs to the public repository.

## Reference Translation

OpenPanel contributes the large product-frame idea: a white page with a substantial browser/app preview that carries the product proof. Clinic Pulse should use green only for meaningful status, freshness, sync, and action states.

Twenty contributes app-shell depth: sidebars, toolbars, selected rows, object detail panels, layered drawers, and real state changes. The goal is software that looks usable, not a decorative miniature.

Dub contributes product-grid polish: compact copy, bordered cells, hover affordances, restrained spacing, and feature cards that are more product than marketing decoration.

## Current Gaps

The current landing page already has a cleaner structure, but several surfaces still read as mock marketing UI:

- The hero preview has useful data but should feel more like the central product workspace.
- The workflow section communicates the idea, but the visual is mostly a timeline instead of an incident moving through real product surfaces.
- Product cards are too shallow: they summarize surfaces rather than letting a visitor inspect them.
- Trust panels are credible in copy but could look more like real system objects: audit event, export record, API preview, webhook delivery.
- Some image/photo moments compete with the product instead of making the product feel more real.

## Design Direction

### Hero Product Preview

Keep the existing hero copy and CTA pattern, but make the preview the strongest proof point.

The hero preview should become a richer district console:

- Browser chrome with `clinicpulse.demo/district-console`.
- Left sidebar with Clinic Pulse workspace nav.
- Top toolbar with district selector, search/filter, sync/freshness indicator.
- Main content with clinic status metrics, a map/status grid, and a clinic table.
- Right alert drawer showing the active incident: Mamelodi East pharmacy stockout, source, age, impact, and recommended reroute.
- A selected row state that ties table, drawer, and route recommendation together.

Motion should be subtle: active row pulse, timestamp/freshness tick, or drawer emphasis. It should never distract from the console.

### Workflow Section

Keep the workflow section in place, but replace the generic timeline feeling with a product incident progression.

The same incident should move through:

1. Field worker submits an offline report.
2. Report syncs and updates district status.
3. District console opens an alert with source and service impact.
4. Public finder reroutes the patient to an operational clinic.
5. Audit ledger records the source, status change, routing decision, and export/webhook readiness.

The visual can remain within a white/grid page treatment rather than a full black band. If a dark panel is used, it should be contained as a product object, not a background that dominates the section.

### Product Surface Cards

Keep the product cards section, but replace simple miniatures with richer, inspectable slices:

- Field reports: mobile-like panel with clinic picker, status fields, offline queue, sync state, and submit confirmation.
- District console: table/map slice with filters, status chips, selected row, and alert count.
- Patient rerouting: public finder result list with service compatibility, distance, operational status, and route CTA.

Cards should use less descriptive copy and more product UI. Each card should feel like it was cropped from the actual application.

### Trust Infrastructure

Keep the trust section but make panels look like records from the system:

- Audit ledger with event IDs, timestamp, actor role, source, and status transition.
- Export preview with CSV/report metadata and download state.
- API preview with realistic endpoint, response snippet, and freshness fields.
- Webhook preview with delivery status, retry count, and destination.

The trust story should be: decisions are credible because every operational change has source, freshness, permission, and audit context.

### Visual Tone

Use a mostly white background with light neutral grids and borders. Green should be reserved for real product meaning: healthy status, live sync, freshness, and primary action states. Amber/red/violet should appear only where the product state calls for them.

Use fewer photos. If photos remain, they should be secondary context and should not be the primary proof of the product.

### Motion

Allowed motion:

- Live/fresh indicators.
- Queued-to-synced state.
- Selected row or active alert highlight.
- Hover reveal on product cards.
- Small progressive workflow state changes.

Avoid:

- Large decorative animations.
- Continuous motion across many elements.
- Motion that changes layout size or makes text hard to read.

## Implementation Boundaries

Likely touched areas:

- `components/landing/openpanel-product-hero.tsx`
- `components/landing/workflow-timeline.tsx`
- `components/landing/product-feature-cards.tsx`
- `components/landing/trust-infrastructure.tsx`
- `lib/landing/openpanel-refactor-content.ts`
- Optional new small landing preview components if the existing files become too dense.

Do not touch unrelated demo app workflows unless a preview needs a shared type or content constant.

## Testing And Verification

Run:

- `npm run lint`
- `npm run test`
- `npm run build`

Visual checks:

- Desktop landing page screenshot around hero, workflow, product cards, trust section.
- Mobile landing page screenshot for text fit, no overlapping UI, and stable card dimensions.
- Confirm green is no longer a dominant background theme and is used mainly for product state.
- Confirm product previews remain legible and do not collapse into decorative noise.

## Acceptance Criteria

- The landing page keeps its current structure.
- The hero preview reads as a real Clinic Pulse district console.
- Workflow communicates one incident moving through actual product surfaces.
- Product cards contain richer product UI, not shallow decorative miniatures.
- Trust panels look like real records and integration objects.
- Motion is subtle and product-driven.
- No docs are included in any public branch or PR.
