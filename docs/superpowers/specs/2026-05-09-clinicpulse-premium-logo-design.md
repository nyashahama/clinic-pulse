# ClinicPulse Premium Logo Redesign

## Status

Approved for implementation planning on 2026-05-09. This spec supersedes the 2026-05-02 shield/cross logo direction for primary brand surfaces.

## Goal

Redesign the ClinicPulse logo to feel like a premium healthtech operating system: executive, clinical, precise, and product-led. The identity should be distinctive enough to avoid generic hospital branding while still feeling trustworthy in a clinical workflow.

## Current State

The current brand mark is a shield with a medical cross and pulse line. It appears in the shared `ClinicPulseLogo` component, `app/icon.svg`, and the Apple icon route. The dashboard sidebar still uses a `Building2Icon` treatment, and auth surfaces use text-only or `CP` block treatments. These differences make the product feel less unified than the landing page.

## Selected Direction

Use the approved B1 "Obsidian Signal" direction.

The mark is a rounded-square premium app icon with a near-black emerald base, a custom C/P monogram curve, a mint signal pulse, and a small clinical plus detail. The composition should read first as a proprietary ClinicPulse product mark, then as healthcare through the plus and pulse references. The previous shield silhouette should be retired from primary brand surfaces.

The wordmark remains `ClinicPulse`. It should use restrained, high-legibility typography with tight optical alignment to the mark. It must work on light and dark surfaces without decorative lettering or marketing-style effects.

## Visual Principles

- Premium healthtech SaaS, not generic hospital software.
- Distinctive app-product mark, not a stock medical shield.
- Clinical signal language through pulse and plus details, kept minimal.
- Sharp at favicon, sidebar, nav, and auth sizes.
- Strong contrast on light and dark surfaces.
- Stable layout dimensions so nav, sidebar, and auth headers do not shift.

## Palette

- Obsidian emerald base: near-black green for the icon field.
- ClinicPulse green: primary brand signal color already used across the app.
- Mint signal highlight: used sparingly for the pulse line or emphasis stroke.
- White or near-white linework: for the plus and high-contrast mark details.
- Neutral ink: for the wordmark on light surfaces.

The redesign should not trigger a full app theme rewrite. Existing green status and action colors can remain unless a local logo surface needs a small adjustment for contrast.

## Scope

Update these primary brand surfaces:

- Shared logo component in `components/brand/clinicpulse-logo.tsx`.
- Landing navigation and footer through the shared logo component.
- Dashboard sidebar brand block in `components/app-sidebar.tsx`, replacing the building icon treatment.
- Auth layout, login, and register brand treatments, replacing the isolated `CP` block where it appears.
- `app/icon.svg` favicon/app icon.
- `app/apple-icon.tsx` Apple touch icon.

Keep the rollout focused on identity. Do not redesign unrelated page sections, marketing copy, dashboard navigation, auth form behavior, or the broader color system.

## Component Shape

The shared brand code should expose a reusable mark and logo lockup. A small API such as icon-only, mark size, wordmark visibility, and theme-appropriate color treatment is acceptable if it keeps the call sites simple.

The mark geometry should be authored as SVG or React SVG so it stays crisp, versionable, and independent of generated bitmap assets. The favicon SVG and generated Apple icon should match the same visual idea closely enough that the brand feels consistent across browser, mobile, landing, sidebar, and auth contexts.

## Non-Goals

- No generated bitmap logo assets.
- No broad landing page redesign.
- No marketing copy rewrite.
- No new product name or tagline.
- No replacement of existing icons unrelated to primary brand placement.
- No full typography system overhaul.

## Acceptance Criteria

- The new Obsidian Signal mark is visible in landing nav, landing footer, dashboard sidebar, auth layout, login, and register brand surfaces.
- `app/icon.svg` and `app/apple-icon.tsx` use the new mark direction.
- The old shield mark is no longer used in primary brand surfaces.
- The sidebar no longer uses the `Building2Icon` block as the primary ClinicPulse brand mark.
- Auth pages no longer rely on the isolated `CP` block as the primary brand mark.
- The logo remains readable at small sizes, including favicon-scale and compact sidebar sizes.
- Logo dimensions are stable and do not cause layout shifts or text overlap.
- Existing app behavior and navigation remain unchanged.

## Testing and Verification

- Add or update focused source tests that verify primary brand surfaces use the shared ClinicPulse logo or mark instead of the old `CP` and building-icon treatments.
- Run the project test suite.
- Run linting.
- Use browser screenshots for landing, auth, and dashboard/sidebar contexts to check contrast, spacing, and small-size readability.
- Check the browser console during visual verification for logo-related errors or hydration warnings.

If full type checking is blocked by unrelated existing fixtures or role definitions, record that separately during implementation verification rather than expanding this logo task.

## Risks

- The monogram can become too detailed at small sizes. Keep the geometry simple and favor strong silhouette over fine decoration.
- The dark premium mark can feel heavy in light navigation. Control this through size, spacing, and restrained shadow rather than changing the app palette.
- Duplicating geometry across React SVG, favicon SVG, and generated Apple icon can drift. Keep the visual primitives closely aligned and review them together during implementation.
