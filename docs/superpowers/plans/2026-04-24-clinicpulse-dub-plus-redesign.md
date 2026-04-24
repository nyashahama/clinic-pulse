# ClinicPulse Dub-Plus Landing Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the landing page so it feels like a Dub-level premium SaaS page with ClinicPulse-specific healthcare product scenes, richer motion, and purposeful image-like visuals.

**Architecture:** Keep `app/page.tsx` as a server component that composes focused landing sections. Client components own Framer Motion animation and data-driven mock UI. Styling stays in Tailwind classes with a small set of global keyframes and reduced-motion overrides in `app/globals.css`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Framer Motion, `@number-flow/react`, Lucide React.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `app/globals.css` | Add reusable animation keyframes, utility classes, and `prefers-reduced-motion` behavior. |
| `app/page.tsx` | Compose final landing sections in the approved story order. |
| `components/landing/nav.tsx` | Add live network pill and align nav labels with the new sections. |
| `components/landing/hero.tsx` | Rewrite above-the-fold hero as the live operating layer with product scene, floating reports, map pulses, mobile report card, counters, and CTAs. |
| `components/landing/demo-card.tsx` | Convert from standalone hero demo into a reusable product module scene for district console / routing visuals, or keep as a below-hero product scene if needed. |
| `components/landing/logo-carousel.tsx` | Convert into neutral Dub-like trust strip with scrolling/tiled operational marks. |
| `components/landing/problem-section.tsx` | Rewrite as outcome manifesto with animated report rows. |
| `components/landing/interface-showcase.tsx` | Rebuild as staggered device/product cards for district officials, field workers, and patients. |
| `components/landing/features-section.tsx` | Reframe as infrastructure/product artifacts, preserving any useful existing user edits. |
| `components/landing/social-proof.tsx` | Upgrade testimonial layout, fix "spreadsheets" typo, and label content as sample-safe. |
| `components/landing/cta-section.tsx` | Rewrite final dark operations-room CTA with controlled cinematic motion. |

## Task 1: Global Motion And Navigation Foundation

**Files:**
- Modify: `app/globals.css`
- Modify: `components/landing/nav.tsx`

- [ ] **Step 1: Read local Next docs already relevant to this task**

Run:

```bash
sed -n '1,220p' node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md
sed -n '1,220p' node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md
```

Expected: Docs confirm pages are server components by default and `"use client"` is only needed for interactive/animated component entry points.

- [ ] **Step 2: Add global animation utilities**

Append these utilities to `app/globals.css`:

```css
@keyframes clinic-float {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
  50% { transform: translate3d(0, -10px, 0) rotate(0.4deg); }
}

@keyframes clinic-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes clinic-scan {
  0% { transform: translateY(-100%); opacity: 0; }
  15%, 80% { opacity: 1; }
  100% { transform: translateY(100%); opacity: 0; }
}

@keyframes clinic-glow {
  0%, 100% { opacity: 0.45; transform: scale(1); }
  50% { opacity: 0.75; transform: scale(1.04); }
}

.animate-clinic-float {
  animation: clinic-float 6s ease-in-out infinite;
}

.animate-clinic-marquee {
  animation: clinic-marquee 28s linear infinite;
}

.animate-clinic-scan {
  animation: clinic-scan 4s ease-in-out infinite;
}

.animate-clinic-glow {
  animation: clinic-glow 5s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 3: Update navigation**

In `components/landing/nav.tsx`, keep it as a server component and change the center links to:

```tsx
[
  { href: "#product", label: "Product" },
  { href: "#interfaces", label: "Interfaces" },
  { href: "#proof", label: "Proof" },
  { href: "#infrastructure", label: "Infrastructure" },
]
```

Add this live pill before the Sign in link:

```tsx
<div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-800 lg:flex">
  <span className="relative flex h-1.5 w-1.5">
    <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-emerald-500 opacity-75" />
    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
  </span>
  Live network: 3,512 clinics
</div>
```

- [ ] **Step 4: Verify lint for touched files**

Run:

```bash
npm run lint
```

Expected: ESLint exits `0`.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css components/landing/nav.tsx
git commit -m "feat: add landing motion foundation"
```

## Task 2: Rewrite Hero As Live Operating Layer

**Files:**
- Modify: `components/landing/hero.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace hero content model**

Use these arrays at the top of `components/landing/hero.tsx`:

```tsx
const liveReports = [
  { clinic: "Alexandra PHC", event: "Medicine stockout reported", status: "non-functional", time: "2m ago" },
  { clinic: "Mamelodi Clinic", event: "Queue time above threshold", status: "degraded", time: "5m ago" },
  { clinic: "Diepsloot CHC", event: "Ready for redirected patients", status: "operational", time: "8m ago" },
] as const;

const heroMetrics = [
  { value: "3,512", label: "clinics monitored" },
  { value: "94%", label: "district visibility" },
  { value: "11m", label: "median report age" },
] as const;

const mapDots = [
  { left: "18%", top: "34%", color: "bg-emerald-500", ring: "border-emerald-400/40" },
  { left: "38%", top: "22%", color: "bg-emerald-500", ring: "border-emerald-400/40" },
  { left: "56%", top: "42%", color: "bg-amber-500", ring: "border-amber-400/40" },
  { left: "72%", top: "30%", color: "bg-red-500", ring: "border-red-400/40" },
  { left: "46%", top: "68%", color: "bg-slate-400", ring: "border-slate-400/40" },
] as const;
```

- [ ] **Step 2: Rewrite the hero JSX**

The rendered hero must include:

```tsx
<section className="relative isolate overflow-hidden px-4 pb-14 pt-28 sm:px-6 sm:pb-20 sm:pt-36 lg:px-8">
  <div className="absolute inset-0 -z-10" aria-hidden="true" />
  <div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
    <div>{/* badge, headline, copy, CTAs, metrics */}</div>
    <div>{/* animated product console scene */}</div>
  </div>
</section>
```

Copy must use:

```tsx
<h1>A live operating layer for primary healthcare.</h1>
<p>Know which clinics are open, overloaded, out of stock, or ready to receive patients before anyone starts travelling.</p>
```

The product scene must include:

```tsx
<div className="relative overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-[0_30px_80px_-30px_rgba(13,122,107,0.45)]">
  {/* console header */}
  {/* map panel with mapDots and pulse rings */}
  {/* liveReports stream using StatusBadge */}
  {/* patient routing strip */}
  {/* floating mobile report card */}
</div>
```

- [ ] **Step 3: Remove duplicate above-fold demo if hero now contains the main scene**

In `app/page.tsx`, remove `<DemoCard />` immediately after `<Hero />` if the new hero scene is visually complete. Keep `DemoCard` imported only if it is reused later as a product module.

- [ ] **Step 4: Verify mobile layout manually in code**

Confirm hero grid uses one column by default and two columns only on `lg`. Confirm CTAs wrap on small screens:

```tsx
className="flex flex-col gap-3 sm:flex-row"
```

- [ ] **Step 5: Run verification**

```bash
npm run lint
npm run build
```

Expected: both commands exit `0`.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx components/landing/hero.tsx
git commit -m "feat: build live operating layer hero"
```

## Task 3: Trust Strip And Outcome Manifesto

**Files:**
- Modify: `components/landing/logo-carousel.tsx`
- Modify: `components/landing/problem-section.tsx`

- [ ] **Step 1: Rewrite trust strip data**

Use operational marks instead of unverifiable partner logos:

```tsx
const trustMarks = [
  "District Health",
  "NGO Network",
  "CHW Teams",
  "NHI Readiness",
  "Open Data",
  "Referral Routing",
] as const;
```

Render two repeated sets inside an overflow-hidden strip with `.animate-clinic-marquee`.

- [ ] **Step 2: Rewrite trust strip copy**

Use:

```tsx
<p>Built for district managers, NGOs, community health workers, and public clinic finders.</p>
```

Do not claim named organizations are customers.

- [ ] **Step 3: Rewrite problem section as manifesto**

Replace the problem cards with an editorial left column and animated report rows right column. Use this data:

```tsx
const reportRows = [
  { time: "07:42", clinic: "Alexandra PHC", event: "Closed intake", status: "non-functional" },
  { time: "07:49", clinic: "Soweto CHC", event: "Accepting referrals", status: "operational" },
  { time: "08:03", clinic: "Mamelodi Clinic", event: "Queue above 90 min", status: "degraded" },
  { time: "08:12", clinic: "Diepsloot CHC", event: "Stock confirmed", status: "operational" },
] as const;
```

Heading:

```tsx
Healthcare access is not just about facilities. It is about what is working today.
```

- [ ] **Step 4: Run verification**

```bash
npm run lint
```

Expected: ESLint exits `0`.

- [ ] **Step 5: Commit**

```bash
git add components/landing/logo-carousel.tsx components/landing/problem-section.tsx
git commit -m "feat: add trust strip and outcome manifesto"
```

## Task 4: Product Modules And Interface Showcase

**Files:**
- Modify: `components/landing/demo-card.tsx`
- Modify: `components/landing/interface-showcase.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Convert `DemoCard` into `ProductModules` or keep export name with product-module content**

If preserving imports, keep `export function DemoCard()`. It should render a section with `id="product"` and three product modules:

```tsx
const modules = [
  {
    label: "District Console",
    title: "See every clinic from the district desk.",
    description: "Map status, queue pressure, stock risk, and referral readiness in one live operating view.",
  },
  {
    label: "Field Reports",
    title: "Capture ground truth even when the signal drops.",
    description: "A five-field mobile report queues offline, syncs later, and updates the network without paper forms.",
  },
  {
    label: "Public Finder",
    title: "Route patients before they waste the trip.",
    description: "Search nearby clinics, understand today&apos;s status, and redirect to an operational facility.",
  },
] as const;
```

- [ ] **Step 2: Add module visuals**

Each module must include one UI artifact:

```tsx
// District Console: map/table split
// Field Reports: phone-shaped queue/sync card
// Public Finder: search result and routing card
```

Use CSS/SVG/Tailwind only; do not add remote images.

- [ ] **Step 3: Rebuild interface showcase**

Keep three audiences but make cards staggered and less equal-grid:

```tsx
const interfaces = [
  "District officials",
  "Field workers",
  "Patients and public",
] as const;
```

Use `motion.div` with staggered `delay: i * 0.08`, layered cards, and image-like gradient panels behind the UI.

- [ ] **Step 4: Ensure page composition**

In `app/page.tsx`, the order should be:

```tsx
<Hero />
<LogoCarousel />
<ProblemSection />
<DemoCard />
<InterfaceShowcase />
<FeaturesSection />
<SocialProofSection />
<CTASection />
```

- [ ] **Step 5: Run verification**

```bash
npm run lint
npm run build
```

Expected: both commands exit `0`.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx components/landing/demo-card.tsx components/landing/interface-showcase.tsx
git commit -m "feat: add healthcare product modules"
```

## Task 5: Infrastructure, Social Proof, And CTA Polish

**Files:**
- Modify: `components/landing/features-section.tsx`
- Modify: `components/landing/social-proof.tsx`
- Modify: `components/landing/cta-section.tsx`

- [ ] **Step 1: Preserve existing user edits before rewriting**

Run:

```bash
git diff -- components/landing/features-section.tsx components/landing/social-proof.tsx
```

Expected: Review diff and incorporate useful current edits instead of blindly replacing them.

- [ ] **Step 2: Reframe features section**

Use `id="infrastructure"` and headline:

```tsx
Built to operate under pressure.
```

Each feature card must include a small artifact type:

```tsx
const features = [
  { title: "Real-time status graph", artifact: "sparkline" },
  { title: "Offline sync queue", artifact: "queue" },
  { title: "Referral scoring", artifact: "score" },
  { title: "Open API", artifact: "code" },
  { title: "Audit trail", artifact: "timeline" },
  { title: "NHI-ready export", artifact: "schema" },
] as const;
```

- [ ] **Step 3: Upgrade social proof**

Fix the typo from `spreadshets` to `spreadsheets`.

Add visible sample disclaimer in code comments only, not user-facing copy:

```tsx
// Sample testimonial content. Replace with approved customer quotes before public launch.
```

Create one large quote card plus two smaller cards. Do not add logos for real organizations unless the existing content already uses them and the product owner confirms permission.

- [ ] **Step 4: Rewrite dark CTA**

Use headline:

```tsx
See the clinic network before the crisis reaches the queue.
```

Add a dark animated map/status glow using existing CSS animations and status dots. Keep the CTA accessible with high contrast.

- [ ] **Step 5: Run verification**

```bash
npm run lint
npm run build
```

Expected: both commands exit `0`.

- [ ] **Step 6: Commit**

```bash
git add components/landing/features-section.tsx components/landing/social-proof.tsx components/landing/cta-section.tsx
git commit -m "feat: polish infrastructure proof and cta"
```

## Task 6: Final Verification And Cleanup

**Files:**
- Review: all touched landing files

- [ ] **Step 1: Check worktree**

```bash
git status --short
```

Expected: only intentional uncommitted changes remain, or clean worktree if every task committed.

- [ ] **Step 2: Run full verification**

```bash
npm run lint
npm run build
```

Expected: both commands exit `0`.

- [ ] **Step 3: Inspect final route composition**

```bash
sed -n '1,180p' app/page.tsx
```

Expected: The route order matches the spec and no removed imports remain.

- [ ] **Step 4: Search for risky copy**

```bash
rg -n "Trusted by|spreadshets|verified customer|verified customers|unapproved" components/landing app docs/superpowers/plans/2026-04-24-clinicpulse-dub-plus-redesign.md
```

Expected: no typo and no unsupported customer claims.

- [ ] **Step 5: Final commit if needed**

If Step 1 showed uncommitted intentional cleanup:

```bash
git add app components docs/superpowers/plans/2026-04-24-clinicpulse-dub-plus-redesign.md
git commit -m "chore: finalize landing redesign"
```

Expected: commit created only if there were remaining intentional changes.

## Self-Review

Spec coverage:

- Navigation live pill is covered by Task 1.
- Hero operating layer, map pulses, floating cards, report stream, routing strip, counters, and CTAs are covered by Task 2.
- Trust strip and outcome manifesto are covered by Task 3.
- Product modules and richer interface showcase are covered by Task 4.
- Infrastructure artifacts, social proof, typo fix, and dramatic CTA are covered by Task 5.
- Build, lint, copy-risk scan, reduced-motion support, and final composition checks are covered by Tasks 1 and 6.

Completion scan:

- The plan has no deferred implementation notes or unresolved design decisions.

Type consistency:

- Existing `StatusBadge` statuses are reused: `operational`, `degraded`, `non-functional`, and `unknown`.
- Existing component export names are preserved unless the implementer explicitly updates imports in the same task.
