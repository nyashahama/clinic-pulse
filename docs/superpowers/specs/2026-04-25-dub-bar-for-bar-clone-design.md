# Dub.co Bar-for-Bar Clone — Landing Page Redesign

**Date:** 2026-04-25
**Status:** Approved for planning

## Goal

Port dub.co's entire visual system — component primitives, CSS animation keyframes, semantic design tokens, and section layout architecture — verbatim into ClinicPulse. The landing page should be indistinguishable in richness and animation quality from dub.co, with ClinicPulse-specific product content.

## Architecture

### Design Token System

Port dub.co's semantic CSS variable system. Replace flat `neutral-*` tokens with layered semantic colors. All tokens use rgb channels (space-separated) for Tailwind opacity modifier compatibility.

```css
:root, .light {
  --bg-default: 255 255 255;
  --bg-muted: 250 250 250;
  --bg-subtle: 245 245 245;
  --bg-emphasis: 229 229 229;
  --bg-inverted: 23 23 23;

  --bg-info: 219 234 254;
  --bg-success: 220 252 231;
  --bg-attention: 255 237 213;
  --bg-warning: 254 249 195;
  --bg-error: 254 226 226;

  --border-emphasis: 163 163 163;
  --border-default: 212 212 212;
  --border-muted: 245 245 245;
  --border-subtle: 229 229 229;

  --content-inverted: 255 255 255;
  --content-muted: 163 163 163;
  --content-subtle: 115 115 115;
  --content-default: 64 64 64;
  --content-emphasis: 23 23 23;

  --content-info: 37 99 235;
  --content-success: 22 163 74;
  --content-attention: 234 88 12;
  --content-warning: 202 138 4;
  --content-error: 220 38 38;
}
```

Registered as Tailwind v4 `@theme inline` colors. ClinicPulse-specific `--color-primary` (#0D7A6B teal) and semantic status colors retained alongside semantic tokens.

### CSS Animation System

Port dub.co's full keyframe set beyond what ClinicPulse already has:

| Animation | Keyframes | Duration | Purpose |
|---|---|---|---|
| `text-appear` | rotateX 45deg scale 0.95 → 0deg scale 1 | 0.15s ease | Headline letters, badges |
| `gradient-move` | background-position 0% → 200% | 5s linear infinite | Animated gradient text |
| `infinite-scroll` | translateX 0 → -150% | 22s linear infinite | Logo/trust marquee |
| `infinite-scroll-y` | translateY 0 → -150% | 22s linear infinite | Vertical status streams |
| `pulse-scale` | scale 0.8 opacity 0 → scale 2 opacity 0 | 6s ease-out infinite | Background pulse rings |
| `fade-in-blur` | opacity 0 blur 4px → opacity 1 blur 0 | 0.5s ease-out | Section entrance |
| `scale-in-content` | rotateX -30deg scale 0.9 → 0deg scale 1 | 0.2s ease | Dropdowns, modals |
| `scale-out-content` | rotateX 0deg scale 1 → -10deg scale 0.95 | 0.2s ease | Dropdowns, modals |
| `float` | scale 1 rotate 0 → scale 1.05 rotate 180deg → scale 1 rotate 360deg | 4s linear infinite | Floating decorative elements |
| `ellipsis-wave` | translateY 0 with variable offset | 1.5s ease-in-out infinite | Loading indicators |
| `fade-in` | opacity 0 → 1 | 0.2s ease-out | Fast element fade |
| `slide-up-fade` | translateY 2px opacity 0 → translateY 0 opacity 1 | 0.4s cubic-bezier | Popover/tooltip |
| `slide-down-fade` | translateY -2px opacity 0 → translateY 0 opacity 1 | 0.4s cubic-bezier | Popover/tooltip |

Registered in `app/globals.css` as both `@keyframes` and `@theme inline { --animate-* }`.

### Font System

Remove Playfair Display. Adopt dub.co's font strategy:

- **Display:** Satoshi (variable weight, 300-900). Self-hosted woff2. Applied via `font-display` class. Used for large headlines and editorial moments only.
- **Body:** Inter (Google Fonts via `next/font/google`). Applied via `font-default`. Used for body text, UI, buttons.
- **Mono:** GeistMono (Google Fonts). For code blocks in API section.

### Shared Visual Primitives (ported from dub.co verbatim)

| Component | File | Purpose |
|---|---|---|
| `ProgressiveBlur` | `components/ui/progressive-blur.tsx` | Multi-step blur gradient overlay. Configurable strength, steps, side, falloff. Used at section boundaries to create depth. |
| `DotsPattern` | `components/ui/dots-pattern.tsx` | SVG dots texture pattern. Configurable dotSize, gapSize, patternOffset. Used as subtle background texture. |
| `ShimmerDots` | `components/ui/shimmer-dots.tsx` | WebGL animated shimmering dots overlay with gold noise. Configurable dotSize, cellSize, speed, color. Used over hero for premium ambient motion. Degrades to static on context loss. |
| `Background` | `components/ui/background.tsx` | Fixed full-screen background container. Contains: radial gradient mesh (6 positions, blur 100px, saturate 150%, opacity 0.15), SVG grid overlay (inverted, opacity 0.4), gradient white-to-transparent wipe at top. Applied in root layout behind all content. |
| `BlurImage` | `components/ui/blur-image.tsx` | Next.js Image wrapper with blur placeholder and error fallback via avatar.vercel.sh. Blur clears on load. |
| `AnimatedSizeContainer` | `components/ui/animated-size-container.tsx` | Animated width/height spring transitions based on children dimensions. Uses ResizeObserver + motion.div. |
| `ScrollContainer` | `components/ui/scroll-container.tsx` | Scroll-aware container with bottom fade gradient (opacity follows scroll progress). |
| `MaxWidthWrapper` | `components/ui/max-width-wrapper.tsx` | `mx-auto w-full max-w-screen-xl px-3 lg:px-10`. Ported from dub.co. |

### Existing Components to Keep

- `Grid` — Already matches dub.co's. No changes needed.
- `GridSection` — Keep as section wrapper.
- Graphics components in `components/landing/graphics/` — Reuse in product modules and feature deep-dives (StatusMapGraphic, FieldReportsGraphic, AnalyticsGraphic, etc.)
- `AnimatedCounter` — Enhance with `@number-flow/react` for scale section.
- `StatusBadge` — Keep.
- `ButtonLink` — Enhance to match dub.co's `buttonVariants` (primary/secondary with h-8, rounded-lg, text-sm).

### Removed Components

- `LogoCarousel` — Replaced by trust strip marquee.
- `DemoCard` — Merged into hero as the main product console card.
- `ProblemSection` — Replaced by manifesto section.

---

## Page Architecture

### Section 1: Navigation (`nav.tsx` — rewrite)

- Sticky with `backdrop-blur-lg bg-white/75` on scroll (dub.co pattern via `useScroll(40)`)
- Left: ClinicPulse logo wordmark (Satoshi font)
- Center: Product, Interfaces, Proof, Infrastructure (nav items, no dropdowns needed yet)
- Right: Sign in (secondary button) + Request Demo (primary button)
- Live status pill: "Live network: 3,500+" with green pulse dot
- On scroll: border-b appears, backdrop-blur activates

### Section 2: Hero (`hero.tsx` — rewrite, product-led)

- `Background` component provides fixed radial gradient + grid behind entire page
- `DotsPattern` overlay at very low opacity
- `ShimmerDots` WebGL effect subtly animating in hero background
- `ProgressiveBlur` at bottom edge transitioning to trust strip
- Text content centered, max-width ~640px
- Live status pill badge: "Live — 3,500+ clinics monitored across 52 districts"
- Headline: "A live operating layer for primary healthcare." (Satoshi display, large)
- Subheadline: "Know which clinics are open, overloaded, out of stock, or ready to receive patients — before anyone starts travelling."
- Two CTAs: Primary "Request Demo" (black), Secondary "Watch Live Flow"
- Below text: large product console card containing:
  - Map panel with 15+ animated status dots, ring-pulse on highlighted dots
  - Live report stream (clinic name + status badge + timestamp, auto-scrolling via infinite-scroll-y)
  - District health score counter
  - Patient rerouting strip
  - Floating alert card for a non-functional clinic
  - Small field-worker mobile card entering from side
- Staggered page-load animation sequence (badge → headline → subheadline → CTAs → console → floating cards)
- Console card has dub.co-style rounded-2xl, border, shadow, ring
- Map dots pulse continuously after load
- Report rows stream downward

### Section 3: Trust Strip (`trust-strip.tsx` — new)

- Auto-scrolling horizontal marquee using CSS `infinite-scroll` (22s linear infinite)
- Duplicate content to create seamless loop
- Neutral operational marks: "District Health Teams", "NGO Networks", "CHW Teams", "NHI Readiness", "Open Data"
- Monochrome icon + label, not colorful fake logos
- Credibility line below marks: "Built for district managers, NGOs, community health workers, and public clinic finders."
- MaxWidthWrapper, subtle border-top

### Section 4: Manifesto (`manifesto.tsx` — new, replaces problem-section)

- Section label: "The Problem" (uppercase tracking-widest, teal)
- Heading: "Healthcare access is not just about facilities. It is about what is working today." (Satoshi display)
- Two-column grid (lg):
  - Left: two polished paragraphs about clinic availability, travel cost, staff capacity, stockouts, district coordination
  - Right: animated clinic report row feed — rows of clinic entries with status badges and timestamps, streaming with staggered entrance (motion.div, staggerChildren)
- GridSection wrapper
- Scroll-triggered entrance (whileInView)

### Section 5: Product Modules (`product-modules.tsx` — new)

- Three cards in a row (1-col mobile, 3-col lg)
- Each card: rounded-2xl, border border-default, bg-white, shadow, hover: scale 1.02 + shadow elevation
- Card contents: icon + label + heading + description + mini product UI visual + "Learn more →"

| Card | Label | Heading | Visual |
|---|---|---|---|
| District Console | "Product" | "See every clinic in real time" | Map + table + sparkline mockup (reuse StatusMapGraphic/AnalyticsGraphic) |
| Field Reports | "Product" | "Report from anywhere, even offline" | Phone-shaped offline report flow + sync indicator (reuse FieldReportsGraphic) |
| Patient Finder | "Product" | "Route patients to working clinics" | Search bar + nearest clinic card + directions handoff |

- Scroll-triggered stagger entrance (STAGGER_CHILD_VARIANTS)

### Section 6: Feature Deep-Dives (`features-section.tsx` — rewrite)

- Section label: "Infrastructure"
- Heading: "Built to operate under pressure" (Satoshi display)
- Reframe from generic feature cards to operational infrastructure cards
- 6 cards in 2x3 grid, each with a small UI artifact:
  1. API Response — JSON snippet showing clinic status endpoint
  2. Sync Queue — offline report sync status indicator
  3. Capacity Score — animated gauge showing district load
  4. Routing Logic — decision tree for patient referrals
  5. Report Schema — field report data model preview
  6. Audit Trail — event log with timestamps
- Subtle hover motion (translateY -2px, shadow increase)
- Data-line animations on scroll-into-view (motion.pulse or CSS animation)
- GridSection wrapper, Grid background

### Section 7: Interface Showcase (`interface-showcase.tsx` — rewrite)

- Staggered device/product cards (not equal plain cards)
- Three interfaces: Desktop console, Mobile field report, Tablet clinic finder
- Cards positioned at different vertical offsets (staggered layout)
- Small illustrated silhouettes or product UI snippets behind cards
- ProgressiveBlur at bottom edge
- Show realistic UI states: queued offline report, escalated clinic, patient redirected
- Scroll-triggered entrance

### Section 8: Social Proof (`social-proof.tsx` — rewrite)

- Dub.co pattern: one featured large testimonial + two smaller beside it
- Portrait/avatar cards with organization tags and role
- Pull quote styling (large quote marks, serif or display font)
- Fix "spreadshets" typo
- Use neutral placeholder avatars (avatar.vercel.sh) until real photos provided
- Names/roles kept as sample content, easy to replace

### Section 9: Scale Section (`scale-section.tsx` — new)

- Dark, high-contrast operations-room panel (bg-neutral-900, text-white)
- Full-width, no GridSection (breaks the grid rhythm for impact)
- Three animated number counters using `@number-flow/react`:
  - "3,500+ Clinics monitored"
  - "12,000+ Reports processed monthly"
  - "45,000+ Patients rerouted"
- `pulse-scale` CSS animation behind each number for ambient motion
- Headline: "Built to operate at national scale"
- Fade-in-blur entrance animation

### Section 10: Final CTA (`cta-section.tsx` — rewrite)

- Dark mode panel with animated map/status glow behind copy
- Headline: "See the clinic network before the crisis reaches the queue."
- Primary CTA: "Request Demo" (white bg, black text)
- Secondary link: "Explore product flow"
- ProgressiveBlur at top edge transitioning from scale section
- GridSection width constrained but dark background extends full width

### Section 11: Footer (`footer.tsx` — rewrite)

- Port dub.co's footer pattern exactly:
  - `MaxWidthWrapper` with `bg-white/50 backdrop-blur-lg rounded-t-2xl border border-b-0 border-neutral-200`
  - Logo wordmark (Satoshi) top-left
  - Social icons: GitHub, Twitter, LinkedIn (rounded-full, hover color transition)
  - 4-column link grid: Product, Solutions, Resources, Company
  - Bottom row: status badge + copyright "© 2026 ClinicPulse"
- `useParams` / `createHref` pattern simplified for single-domain use

---

## Page Composition

`app/page.tsx` remains a server component composing client sections:

```tsx
<Background />
<Nav />
<main>
  <Hero />
  <TrustStrip />
  <Manifesto />
  <ProductModules />
  <FeaturesSection />
  <InterfaceShowcase />
  <SocialProofSection />
  <ScaleSection />
  <CTASection />
</main>
<Footer />
```

---

## Animation Strategy

### Page Load Sequence (Hero)
1. Nav (immediate)
2. Live pill badge (0.1s, text-appear)
3. Headline (0.2s, slide-up-fade)
4. Subheadline (0.35s, slide-up-fade)
5. CTAs (0.45s, slide-up-fade)
6. Product console card (0.6s, scale-in-fade)
7. Floating alert cards (0.8s+, staggered)
8. Map dots pulse continuously
9. Report rows stream with infinite-scroll-y

### Scroll-Triggered (all other sections)
- Each section content reveals with `whileInView` + `STAGGER_CHILD_VARIANTS`
- Children within each section stagger with `staggerChildren: 0.1`

### Continuous (ambient)
- `Background` radial gradients always visible (fixed)
- Map status dots in hero console pulse
- Report rows stream in hero
- `ShimmerDots` animate in hero background
- `infinite-scroll` for trust strip marquee
- `pulse-scale` behind scale section counters
- Floating decorative elements with `float` animation

### Reduced Motion
When `prefers-reduced-motion: reduce`:
- Disable all infinite/continuous animations
- Use static opacity states instead of motion transitions
- Replace staggered animations with immediate display
- Disable shimmer dots

---

## Constraints

- Follow Next.js 16 documentation before using Next APIs
- Keep `app/page.tsx` as a server component composing client sections
- Do not add remote image dependencies unless `next.config.ts` is configured
- Prefer local CSS/SVG/product mockups over large external assets
- Use `motion` (v12) library — upgrade from `framer-motion` to `motion` (same API, dub.co uses it)
- Tailwind v4 `@theme inline` approach remains (no tailwind.config.ts needed)
- Fonts: Satoshi self-hosted in `app/fonts/`, Inter + GeistMono via `next/font/google`
- Preserve existing graphics components in `components/landing/graphics/`
- Mobile responsive: hero visual collapses to stacked layout

---

## Acceptance Criteria

- Landing page renders with `Background` component providing fixed radial gradient + grid
- Hero contains an animated product console card (not just text)
- Trust strip uses `infinite-scroll` CSS animation for marquee
- ProgressiveBlur is visible at section boundaries
- All sections have scroll-triggered staggered entrance animations
- Scale section uses `@number-flow/react` for animated counters
- Footer uses `backdrop-blur-lg bg-white/50 rounded-t-2xl` glass style
- Build and lint pass with zero errors
- Reduced-motion media query disables all continuous animations
- At least 5 sections include product visuals or image-like panels
