# Landing Real Images and Motion Design

**Date:** 2026-04-25
**Status:** Approved for planning

## Goal

Make the ClinicPulse landing page feel closer to dub.co's polished product-marketing style by adding real healthcare imagery and more deliberate motion, while keeping the product UI as the main visual signal.

The selected direction is **Polished Healthcare Editorial**: high-quality real healthcare photography, cropped and treated as premium visual texture, with animated ClinicPulse dashboard elements layered above it.

## Visual Direction

Use real healthcare images as supporting context, not as a photo gallery. The page should still read as a product landing page for an operational health platform.

Images should feel:

- Clean, clinical, and credible.
- Bright and high-resolution.
- Human, but not sentimental.
- Cropped tightly enough that product UI can sit beside or over them without visual clutter.

Motion should feel:

- Product-led and restrained.
- Similar to dub.co's floating cards, marquee rows, animated counters, and staggered reveals.
- Useful for showing live operations: status changes, report streams, pulsing clinic dots, alert cards, and counter updates.

Avoid busy parallax, large decorative animations, or motion that competes with the copy.

## Image Sourcing

Use high-quality free healthcare imagery from Unsplash or Pexels for the first implementation pass because the user selected the polished editorial direction. These images are more visually consistent with the dub.co look.

If a section needs stronger South African authenticity, use Wikimedia Commons selectively. Commons images may require attribution and may be less polished, so they should be used only where the local context matters more than visual refinement.

Prefer stable local assets once images are chosen. If remote images are used during implementation, configure `next.config.ts` with strict `images.remotePatterns` for the specific hosts.

## Next.js Image Handling

Follow the local Next.js image documentation in `node_modules/next/dist/docs/`.

Use `next/image` for photographic assets. For `fill` images, provide a `sizes` prop. Use `preload` only for the primary above-the-fold image if it is likely to be the LCP element. Keep animated image assets unoptimized if Next.js requires it.

Images should include meaningful `alt` text when they communicate context. Decorative background texture images should use empty `alt`.

## Page Changes

### Hero

Keep the current centered hero copy and product console, but add a real healthcare photo layer that makes the first viewport feel more tangible.

The hero should include:

- A polished healthcare image panel behind or adjacent to the dashboard console.
- Floating animated product cards layered over the image and console.
- Existing live status dots, counters, and report-stream motion.
- Subtle entrance sequencing: badge, headline, subheadline, CTAs, image/product composition, then floating cards.

The dashboard remains the focal point. The photo provides trust and atmosphere.

### Product and Interface Sections

Add real image tiles to the product/interface areas where they help explain the users of the system: district officials, field workers, clinic staff, and patients.

Each tile should be integrated into the existing card system with restrained borders, shadows, and rounded corners. Product UI snippets should remain visible and animated near the photos so the page does not become generic healthcare marketing.

### Motion System

Use the existing motion stack and CSS animations already present in the project:

- `motion/react` for entrance, float, and staggered reveal animations.
- Existing marquee and vertical scrolling animations for live report streams.
- Existing pulse/ring animations for status dots and alerts.
- `@number-flow/react` for counters where appropriate.

Respect reduced motion where the existing system supports it, and avoid adding unnecessary client components beyond the landing sections already using motion.

## Components in Scope

Likely files:

- `components/landing/hero.tsx`
- `components/landing/interface-showcase.tsx`
- `components/landing/product-modules.tsx`
- `components/landing/features-section.tsx`
- `next.config.ts` if remote image hosts are used

The final implementation may touch fewer files if the strongest result can be achieved in the hero and interface/product sections only.

## Out of Scope

- Changing the information architecture of the landing page.
- Replacing the current ClinicPulse brand direction.
- Building new backend data flows.
- Adding a full media CMS or image upload workflow.
- Creating a generic stock-photo-heavy healthcare site.

## Testing and Verification

Verify with:

- TypeScript and lint checks available in the repo.
- A local Next dev server.
- Browser screenshots at desktop and mobile widths.
- Visual checks that images load, text remains readable, motion is not overwhelming, and no product cards overlap incoherently.

The final page should feel more real, more tactile, and closer to dub.co's moving product-layer style without losing ClinicPulse's healthcare operations focus.
