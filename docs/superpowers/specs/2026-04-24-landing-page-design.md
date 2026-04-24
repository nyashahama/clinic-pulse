# ClinicPulse Landing Page Design Spec

**Date:** 2026-04-24
**Status:** Approved

## Design Direction

Following the dub.co design language — clean, editorial, restrained. Color used only as functional accent. The product IS the visual statement; the page lets it breathe.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Visual tone | Light, editorial (dub.co pattern) | User preference after reviewing dark ops mockup; dub.co style feels premium without being sterile |
| Hero impression | Live data urgency — counters + product demo card | The four status states are the product; show them immediately |
| Page flow | Hero → Social proof → Problem → Features (6-grid) → CTA → Footer | Classic SaaS flow adapted for healthcare data product |
| Animation style | Functional motion only — counters animate on scroll, status dots pulse, sections fade in | Animation serves data, not decoration |
| Typography | Inter for body, Playfair Display (serif) for editorial headings | Dub.co uses serif+sans pairing for premium feel |
| Color palette | 90% neutral (black/white/gray), teal (#0D7A6B) as accent only | Color reserved for status semantics and brand accent |
| Hero element | Inline product demo card (split-pane map + table + counters) | Show the product working, not an illustration — dub.co's approach |
| CTA buttons | Primary: black bg/white text with ring-shadow hover. Secondary: white outline | Dub.co pattern; teal is for status, not buttons |
| Section dividers | 1px border grid system between sections | Dub.co signature pattern — architectural precision |

## Color System

### Semantic Status Colors (the product's visual vocabulary)

| Status | Fill BG | Fill Border | Text Color | Dot Color |
|--------|---------|-------------|------------|-----------|
| Operational | `bg-green-100` | `border-green-200` | `text-green-800` | `#22c55e` |
| Degraded | `bg-amber-100` | `border-amber-200` | `text-amber-800` | `#f59e0b` |
| Non-Functional | `bg-red-100` | `border-red-200` | `text-red-800` | `#ef4444` |
| Unknown | `bg-slate-100` | `border-slate-200` | `text-slate-800` | `#94a3b8` |

### UI Colors

| Role | Value | Usage |
|------|-------|-------|
| Primary background | `#FAFAFA` / `white` | Page sections (alternating) |
| Primary text | `neutral-900` (#171717) | Headings |
| Secondary text | `neutral-500` (#737373) | Body text, descriptions |
| Tertiary text | `neutral-400` (#A3A3A3) | Labels, metadata |
| Brand accent | `#0D7A6B` (teal) | Section labels, accent links, status semantics |
| CTA primary | `bg-black text-white` | Primary action buttons |
| CTA secondary | `bg-white border-neutral-200` | Secondary action buttons |
| Borders | `neutral-200` (#E5E5E5) | Cards, section dividers, grid lines |
| Card backgrounds | `white` with `neutral-200` borders | All card elements |
| Light fill | `neutral-50` (#FAFAFA) | Alternating sections, map areas |

## Typography

| Element | Font | Weight | Size | Line Height |
|---------|------|--------|------|-------------|
| Hero H1 | Playfair Display | 500 | 56px (sm), 72px (lg) | 1.1 |
| Section H2 | Playfair Display | 500 | 40px | 1.15 |
| Section label | Inter | 600 | 12px | — |
| Body large | Inter | 400 | 18px | 1.6 |
| Body standard | Inter | 400 | 16px | 1.6 |
| Card title | Inter | 500 | 15px | — |
| Card body | Inter | 400 | 14px | 1.5 |
| Badge/label | Inter | 600 | 11-12px | — |
| Stat counter | Inter | 600 | 24px | — |
| Nav link | Inter | 400 | 14px | — |

Note: `text-wrap: balance` and `text-wrap: pretty` on headings (CSS property, progressively enhanced).

## Page Sections (top to bottom)

### 1. Navigation
- Fixed, `backdrop-filter: blur(12px)`, `bg-white/80`
- Border-bottom: `1px solid #E5E5E5`
- Logo (teal square + "ClinicPulse") | Links | Sign in + Request Demo (black CTA)
- Height: 64px

### 2. Hero
- Centered text, `max-width: 800px`
- Badge: "Live — 3,500+ clinics monitored" with pulsing green dot, white bg, `border-neutral-200`, `rounded-full`
- Headline: "Know which clinics are **working today.**" — "working today" in gradient teal (`linear-gradient(135deg, #0D7A6B, #0FA89A)`, `-webkit-background-clip: text`)
- Subtitle: neutral-500, 18px
- CTA group: black primary + white outline secondary
- Social proof line: "Trusted by 120+ health organizations across 52 districts" in neutral-400

### 3. Hero Demo Card
- The centerpiece — inline product UI showing the district console
- `border: 1px solid #E5E5E5`, `rounded-2xl`, `shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)]`
- Conic gradient glow behind it (teal/emerald spectrum, `blur(80px)`, `opacity: 0.08`)
- Three-part card:
  - **Header**: "Live" indicator + "District Console · Gauteng Province"
  - **Body** (2-column grid): Left = map viewport with clinic status dots on grid lines; Right = data table with clinic name, district, status badge
  - **Footer**: 4-column status counter bar (Operational: 2,847 green / Degraded: 287 amber / Non-Functional: 107 red / Unknown: 259 slate)

### 4. Logo Carousel
- "Trusted by leading health organizations" label in neutral-400
- Logo row: `opacity: 0.5`, `filter: grayscale(100%)` → full color on hover
- Placeholder logos: WHO, Right to Care, BroadReach, moms2, Jhpiego (replace with real SVGs)

### 5. Problem Section
- Two-column grid: text left, cards right
- Section label: "THE PROBLEM" in teal, uppercase, `letter-spacing: 0.08em`
- Headline: "Patients travel to closed clinics. Districts fly blind." — Playfair Display, 500 weight
- Three problem cards: `bg-neutral-50`, `border-neutral-200`, `rounded-xl`
  - "DHIS2 reports. It doesn't operate."
  - "Data lives in silos"
  - "NHI raises the stakes"

### 6. Features Section (6-grid)
- Section label: "THE PLATFORM"
- Headline: "One system. Three interfaces."
- 3x2 grid with 1px borders between cells (dub.co pattern — `gap: 1px`, `bg: neutral-200` grid background)
- Each card: white bg, 28px padding
- Feature icon: colored background square (green-100, amber-100, blue-100, etc.) — NOT emoji
- Title: Inter 500, 15px
- Description: Inter 400, 14px, neutral-500
- Features:
  1. Real-Time Status Board
  2. Offline-First Field Reports
  3. Public API
  4. Referral Routing
  5. District Analytics
  6. NHI-Ready Data

### 7. CTA Section
- `bg: neutral-900` (#171717)
- Conic gradient glow behind content (teal spectrum, `blur(120px)`, `opacity: 0.08`)
- Headline: "Start seeing what's really happening." — Playfair Display, 500, white
- Body: `text-white/50`
- CTA: white button (`bg-white text-neutral-900`)

### 8. Footer
- `bg: neutral-50`, border-top
- Logo + name | © 2026 ClinicPulse | Privacy · Terms · Contact

## Grid-Border System (dub.co signature)

Every major section wrapped in `.grid-section` with `border-top` and `border-bottom: 1px solid #E5E5E5`. Adjacent sections collapse their shared border. Inner content has `border-left` and `border-right: 1px solid #E5E5E5` with `max-width: 1200px`.

This creates the ruled-column, Swiss-design aesthetic that makes dub.co feel architectural and precise.

## Component Patterns

### Button Primary
```
bg-neutral-900 text-white border-neutral-900 rounded-lg px-5 py-2 text-sm font-medium
hover:bg-neutral-800 hover:ring-4 hover:ring-neutral-200
```

### Button Secondary
```
bg-white text-neutral-500 border-neutral-200 rounded-lg px-5 py-2 text-sm font-medium
hover:border-neutral-400 hover:text-neutral-800 hover:ring-4 hover:ring-neutral-200
```

### Card
```
bg-white border border-neutral-200 rounded-xl p-6
hover:ring-4 hover:ring-neutral-200 (on interactive cards)
```

### Status Badge
```
Operational:  bg-green-100 border-green-200 text-green-800 rounded-full px-2 text-[11px] font-medium
Degraded:     bg-amber-100 border-amber-200 text-amber-800
Non-Functional: bg-red-100 border-red-200 text-red-800
Unknown:      bg-slate-100 border-slate-200 text-slate-800
```

### Section Label
```
text-xs font-semibold uppercase tracking-widest text-[#0D7A6B]
```

## Animation

| Element | Animation | Duration | Trigger |
|---------|-----------|----------|---------|
| Hero headline | Slide up + fade in | 0.6s ease-out | Page load |
| Hero subtitle | Slide up + fade in | 0.6s ease-out, 100ms delay | Page load |
| Hero CTA | Slide up + fade in | 0.6s ease-out, 200ms delay | Page load |
| Counter numbers | Count up from 0 | 1.5s ease-out | Scroll into view |
| Live dot | Pulse opacity | 2s ease-in-out infinite | Always |
| Status dots on map | Ring pulse on highlighted dots | 2s ease-out infinite | Always |
| Logo hover | Grayscale → color | 0.2s | Hover |
| Card hover | ring-4 ring-neutral-200 | 0.15s | Hover |
| Section content | Fade in + slide up | 0.4s ease-out | Scroll intersection |

## What We're NOT Doing

- **No dark theme on landing page** — the district console will have dark mode, but the landing page is light
- **No emoji icons** — replaced with colored icon background squares
- **No teal background sections** — teal is accent only, not section backgrounds
- **No box-shadows on cards** — use `ring` for elevation, not `shadow`
- **No bold (700) headings** — maximum `font-medium` (500), per dub.co pattern
- **No animated gradients on backgrounds** — only the conic glow decoration behind the hero card and CTA

## Tech Stack for Implementation

```
Next.js 16 (App Router, already set up)
├── Tailwind CSS v4 (already configured)
├── Playfair Display + Inter (Google Fonts via next/font)
├── Framer Motion (scroll animations, counter animations)
├── Lucide React (icons — already installed)
└── @number-flow/react (counter animations — dub.co pattern)
```

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `app/globals.css` | Modify | Design tokens, grid-border system, custom animations |
| `app/layout.tsx` | Modify | Add Playfair Display + Inter fonts, update metadata |
| `app/page.tsx` | Rewrite | Full landing page implementation |
| `components/landing/hero.tsx` | Create | Hero section with badge, title, CTAs |
| `components/landing/demo-card.tsx` | Create | Inline product demo card (map + table + counters) |
| `components/landing/logo-carousel.tsx` | Create | Partner logos row |
| `components/landing/problem-section.tsx` | Create | Problem statement + cards |
| `components/landing/features-section.tsx` | Create | 6-feature grid |
| `components/landing/cta-section.tsx` | Create | Dark CTA with glow |
| `components/landing/footer.tsx` | Create | Footer |
| `components/landing/nav.tsx` | Create | Fixed nav with blur backdrop |
| `components/landing/status-badge.tsx` | Create | Reusable status badge component |
| `components/ui/grid-section.tsx` | Create | Reusable grid-border section wrapper |

## Mockup

Visual mockup saved at: `.superpowers/brainstorm/550770-1777001966/content/dub-inspired-landing.html`