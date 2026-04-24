# ClinicPulse Dub-Plus Landing Redesign

**Date:** 2026-04-24
**Status:** Approved for planning

## Direction

ClinicPulse should feel like a premium Dub-level SaaS landing page, but not like a copied template. The direction is **70% healthcare-specific product polish, 20% cinematic urgency, 10% Dub restraint**.

The landing page should keep Dub's best patterns: product-led storytelling, precise grid sections, clean typography, animated UI panels, customer proof, and strong section rhythm. It should add ClinicPulse-specific identity through live clinic maps, field report surfaces, patient-routing visuals, district escalation states, South African healthcare context, and carefully chosen healthcare imagery or image-like panels.

## What Dub Gets Right

- Product visuals are the page, not decoration. Every major section shows a tangible interface or data artifact.
- Motion is specific. Numbers count, panels slide, rows move, and interface elements feel active.
- The layout has rhythm: hero, proof, product modules, testimonials, integrations/infrastructure, final CTA.
- Copy is sharp and outcome-driven. It avoids generic "manage everything in one place" language.
- Visual detail density is high, but the hierarchy stays calm.

## Redesign Goals

- Make the first screen feel alive: live map pulses, floating reports, operational counters, and a clear "this is happening now" mood.
- Replace generic feature-card feel with product scenes: district console, field-worker mobile report, patient clinic finder, and API/infrastructure.
- Add imagery without relying on stock-photo cliches. Use cropped field-worker/clinic panels where useful, but pair them with product UI overlays so they remain purposeful.
- Increase motion quality: staggered hero entry, floating product cards, marquee status streams, animated counters, map pulse rings, scanline/data sync effects, and scroll reveal.
- Preserve performance and readability: mostly CSS/framer-motion transforms, no heavy video requirement, responsive from mobile to desktop.

## Page Architecture

### 1. Navigation

Fixed translucent nav with a stronger "operating system" feel:

- Left: ClinicPulse logo with heartbeat mark.
- Center: Product, Interfaces, Proof, Infrastructure.
- Right: Sign in and black Request Demo CTA.
- Add a compact live status pill: "Live network: 3,512 clinics".

### 2. Hero: Live Operating Layer

Hero should be the major upgrade.

- Headline: "A live operating layer for primary healthcare."
- Supporting line: "Know which clinics are open, overloaded, out of stock, or ready to receive patients before anyone starts travelling."
- Primary CTA: "Request Demo".
- Secondary CTA: "Watch Live Flow".
- Background: soft grid, teal glow, subtle radial healthcare pulse, restrained enough to stay premium.
- Main visual: a large product console card with:
  - map panel with status dots and animated rings,
  - live report stream,
  - district health score,
  - patient rerouting strip,
  - floating alert card for a non-functional clinic,
  - small field-worker mobile card entering from the side.

### 3. Trust Strip

Replace plain logos with a Dub-like proof band:

- Scrolling or tiled partner-style marks: District Health, NGO Network, CHW Teams, NHI Readiness, Open Data.
- Use neutral logo treatments, not colorful fake logos.
- Include a short credibility line: "Built for district managers, NGOs, community health workers, and public clinic finders."

### 4. Outcome Manifesto

Short editorial section modeled on Dub's "not about clicks, about outcomes" moment.

- Heading: "Healthcare access is not just about facilities. It is about what is working today."
- Body: one or two polished paragraphs connecting clinic availability, travel cost, staff capacity, stockouts, and district coordination.
- Visual side: animated rows of clinic reports with timestamps and status changes.

### 5. Product Modules

Three major product modules, each with a dedicated visual instead of generic cards:

- District Console: desktop map/table interface, filters, selected clinic details, trend sparkline.
- Field Reports: phone-shaped offline report flow, queue/sync state, confirmation.
- Public Clinic Finder: search, nearest operational alternative, directions handoff.

Each module should have:

- section label,
- strong outcome headline,
- one concrete product visual,
- three supporting capability tiles,
- motion that matches the product interaction.

### 6. Interface Showcase

Keep the existing "three interfaces" concept, but make it visually richer:

- Use staggered device/product cards instead of equal plain cards.
- Add small image panels or illustrated silhouettes behind the cards.
- Show realistic UI states: queued offline report, escalated clinic, patient redirected.

### 7. Features / Infrastructure

Reframe from "feature grid" to "built to operate under pressure".

- Cards can remain grid-based, but each should include a small UI artifact: API response, sync queue, capacity score, routing logic, report schema, audit trail.
- Add subtle hover motion and data-line animation.
- Keep the section highly scannable.

### 8. Social Proof

Improve the current testimonial section:

- Fix typo: "spreadsheets".
- Add richer visual treatment: portrait/avatar cards, organization tags, clinic/district context.
- Include one strong pull quote as a larger feature testimonial, with two smaller quotes beside it.
- Avoid pretending these are verified real testimonials unless the product has actual permission. Treat current names and quotes as sample content unless real approvals are provided, and keep them easy to replace.

### 9. Final CTA

Use the dramatic layer here, but controlled:

- Dark, high-contrast operations-room panel.
- Animated map/status glow behind copy.
- Headline: "See the clinic network before the crisis reaches the queue."
- CTA: "Request Demo".
- Secondary link: "Explore product flow".

## Visual System

- Base: warm white, neutral borders, precise grid, high whitespace.
- Accent: teal as operational brand, green/amber/red/slate as status semantics.
- Typography: keep Inter + Playfair Display unless replaced with an equally premium pair. Use display font for large editorial moments only.
- Imagery: use purposeful clinic/field-worker imagery or image-like panels. No generic hospital stock-photo hero.
- Cards: layered, slightly dimensional, but no heavy glassmorphism.
- Borders: Dub-style 1px grid remains a core structure.

## Animation System

- Page-load sequence: nav, badge, headline, copy, CTAs, hero console, floating cards.
- Hero idle motion: status dots pulse, report rows stream, floating cards drift subtly, sync indicator rotates or scans.
- Scroll motion: section content reveals with staggered children.
- Counters: count up when visible.
- Marquees: use sparingly for trust/status streams.
- Reduced motion: disable continuous animation and use static states when `prefers-reduced-motion` is enabled.

## Component Changes

- `components/landing/hero.tsx`: major rewrite into the live operating layer.
- `components/landing/demo-card.tsx`: upgrade to richer console scene or merge into hero if duplicate.
- `components/landing/logo-carousel.tsx`: convert into trust/proof strip.
- `components/landing/problem-section.tsx`: rewrite as outcome manifesto with animated report rows.
- `components/landing/interface-showcase.tsx`: keep concept, rebuild visual composition.
- `components/landing/features-section.tsx`: reframe as infrastructure/product artifacts.
- `components/landing/social-proof.tsx`: richer proof layout and typo fix.
- `components/landing/cta-section.tsx`: controlled dramatic dark CTA.
- `app/globals.css`: add reusable keyframes and reduced-motion handling.

## Constraints

- Follow local Next.js 16 docs before using Next APIs.
- Keep `app/page.tsx` as a server component that composes client animated sections.
- Do not add remote image dependencies unless `next.config.ts` is configured intentionally.
- Prefer local CSS/SVG/product mockups over large external assets.
- Do not introduce fake verified customer claims.
- Preserve mobile usability; hero visual must collapse into a readable stacked scene.

## Acceptance Criteria

- The landing page no longer feels like a feature-card template.
- Above the fold contains a polished, animated, ClinicPulse-specific product scene.
- At least three sections include product visuals or image-like panels, not only text cards.
- Motion is visible but purposeful, with reduced-motion support.
- Build and lint pass.
- Existing user edits are preserved unless they are directly incorporated into the redesign.
