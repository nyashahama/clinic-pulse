# Landing Real Images and Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add polished real healthcare imagery and restrained Dub-style motion to the ClinicPulse landing page.

**Architecture:** Keep the current landing page structure. Add a small shared image data/primitive layer, configure strict remote image hosts, then update the hero, product modules, and interface showcase so real photos support animated product UI rather than replacing it.

**Tech Stack:** Next.js 16.2.4 App Router, React 19, `next/image`, Tailwind CSS v4 classes, `motion/react`, `@number-flow/react`, ESLint.

---

## File Structure

- Modify `next.config.ts`: allow the exact remote photo hosts used by `next/image`.
- Create `components/landing/photo-assets.ts`: central source of approved remote image URLs, alt text, and photographer/source labels.
- Create `components/landing/photo-panel.tsx`: reusable `next/image` wrapper for landing photo tiles with fixed aspect ratios, overlays, and captions.
- Modify `components/landing/hero.tsx`: add the editorial photo layer and floating product cards while preserving current dashboard motion.
- Modify `components/landing/product-modules.tsx`: add per-module photo panels integrated with existing product graphics.
- Modify `components/landing/interface-showcase.tsx`: add photo-backed interface cards and small floating UI states.

## Task 1: Configure Remote Images and Shared Photo Primitive

**Files:**
- Modify: `next.config.ts`
- Create: `components/landing/photo-assets.ts`
- Create: `components/landing/photo-panel.tsx`

- [ ] **Step 1: Add strict image host configuration**

Replace `next.config.ts` with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 2: Add shared photo metadata**

Create `components/landing/photo-assets.ts`:

```ts
export type LandingPhoto = {
  src: string;
  alt: string;
  credit: string;
  position?: string;
};

export const landingPhotos = {
  heroClinic: {
    src: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1600&q=85",
    alt: "Healthcare workers reviewing patient information in a bright clinic setting",
    credit: "Unsplash healthcare photography",
    position: "center",
  },
  fieldWorker: {
    src: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=85",
    alt: "Healthcare professional preparing clinical equipment",
    credit: "Unsplash healthcare photography",
    position: "center",
  },
  clinicTeam: {
    src: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=85",
    alt: "Clinical team working in a hospital corridor",
    credit: "Unsplash healthcare photography",
    position: "center",
  },
  patientCare: {
    src: "https://images.unsplash.com/photo-1550831107-1553da8c8464?auto=format&fit=crop&w=1200&q=85",
    alt: "Clinician speaking with a patient during a care visit",
    credit: "Unsplash healthcare photography",
    position: "center",
  },
} satisfies Record<string, LandingPhoto>;
```

- [ ] **Step 3: Add reusable photo panel component**

Create `components/landing/photo-panel.tsx`:

```tsx
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { LandingPhoto } from "./photo-assets";

type PhotoPanelProps = {
  photo: LandingPhoto;
  className?: string;
  imageClassName?: string;
  sizes: string;
  priority?: boolean;
  caption?: boolean;
};

export function PhotoPanel({
  photo,
  className,
  imageClassName,
  sizes,
  priority = false,
  caption = false,
}: PhotoPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-sm ring-1 ring-black/5",
        className,
      )}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={sizes}
        preload={priority}
        className={cn("object-cover", imageClassName)}
        style={{ objectPosition: photo.position ?? "center" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-white/10" />
      {caption ? (
        <div className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-[10px] font-medium text-white/85 backdrop-blur-md">
          {photo.credit}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Verify configuration and types**

Run:

```bash
npm run lint
```

Expected: ESLint exits with code 0 and no errors from `next.config.ts`, `photo-assets.ts`, or `photo-panel.tsx`.

- [ ] **Step 5: Commit**

```bash
git add next.config.ts components/landing/photo-assets.ts components/landing/photo-panel.tsx
git commit -m "Add landing photo image primitives"
```

## Task 2: Add Real Image Layer and Floating Motion to Hero

**Files:**
- Modify: `components/landing/hero.tsx`

- [ ] **Step 1: Import the photo assets and panel**

Add near the existing imports in `components/landing/hero.tsx`:

```tsx
import { PhotoPanel } from "./photo-panel";
import { landingPhotos } from "./photo-assets";
```

- [ ] **Step 2: Add floating hero photo composition before the console**

Inside `Hero`, immediately before the existing `<motion.div ... className="relative mx-auto mt-16 max-w-[1000px]">` console block, add:

```tsx
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.42, duration: 0.6, ease: "easeOut" }}
        className="relative mx-auto mt-12 grid max-w-[980px] gap-4 md:grid-cols-[0.92fr_1.08fr]"
      >
        <PhotoPanel
          photo={landingPhotos.heroClinic}
          sizes="(min-width: 768px) 420px, 92vw"
          priority
          caption
          className="min-h-[260px] md:min-h-[360px]"
        />
        <div className="relative min-h-[260px] overflow-hidden rounded-2xl border border-neutral-200 bg-white/90 p-4 shadow-lg ring-1 ring-black/5 backdrop-blur-xl md:min-h-[360px] md:p-5">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                Live Patient Routing
              </div>
              <div className="mt-1 text-sm font-semibold text-neutral-900">
                Gauteng district flow
              </div>
            </div>
            <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700 ring-1 ring-green-200">
              42 reroutes active
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {[
              ["Alexandra PHC", "Non-functional", "Reroute to Sandton Clinic"],
              ["Mamelodi Clinic", "Degraded", "Send low-acuity patients to Denneboom"],
              ["Diepsloot CHC", "Operational", "Accepting overflow"],
            ].map(([clinic, state, action], i) => (
              <motion.div
                key={clinic}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.75 + i * 0.12, duration: 0.38 }}
                className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-neutral-900">{clinic}</span>
                  <span className="text-[11px] font-semibold text-[#0D7A6B]">{state}</span>
                </div>
                <div className="mt-1 text-xs text-neutral-500">{action}</div>
              </motion.div>
            ))}
          </div>

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-4 right-4 rounded-xl border border-neutral-200 bg-neutral-950 px-3 py-2 text-white shadow-xl"
          >
            <div className="text-[10px] uppercase tracking-widest text-white/45">Capacity score</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">78%</div>
          </motion.div>
        </div>
      </motion.div>
```

- [ ] **Step 3: Adjust console spacing**

Change the existing console wrapper class from:

```tsx
className="relative mx-auto mt-16 max-w-[1000px]"
```

to:

```tsx
className="relative mx-auto mt-6 max-w-[1000px]"
```

- [ ] **Step 4: Verify hero compiles**

Run:

```bash
npm run lint
```

Expected: ESLint exits with code 0. No missing import, `Image`, or JSX errors.

- [ ] **Step 5: Commit**

```bash
git add components/landing/hero.tsx
git commit -m "Add real image motion layer to hero"
```

## Task 3: Add Photo Context to Product Modules

**Files:**
- Modify: `components/landing/product-modules.tsx`

- [ ] **Step 1: Import photo primitive and assets**

Add:

```tsx
import { PhotoPanel } from "./photo-panel";
import { landingPhotos, type LandingPhoto } from "./photo-assets";
```

- [ ] **Step 2: Extend module data with photos**

Add a `photo: LandingPhoto` property to each module:

```tsx
photo: landingPhotos.clinicTeam,
```

for the district console card,

```tsx
photo: landingPhotos.fieldWorker,
```

for the field reports card, and

```tsx
photo: landingPhotos.patientCare,
```

for the clinic finder card.

- [ ] **Step 3: Replace the single graphic box with photo plus moving UI**

Replace:

```tsx
              <div className="relative mt-5 h-44 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50">
                {mod.graphic}
              </div>
```

with:

```tsx
              <div className="relative mt-5 h-56 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50">
                <PhotoPanel
                  photo={mod.photo}
                  sizes="(min-width: 1024px) 28vw, (min-width: 768px) 45vw, 92vw"
                  className="absolute inset-0 rounded-xl border-0 shadow-none ring-0"
                  imageClassName="scale-105"
                />
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                  className="absolute bottom-3 left-3 right-3 overflow-hidden rounded-lg border border-white/60 bg-white/90 shadow-lg backdrop-blur-md"
                >
                  <div className="h-28 bg-white/85">{mod.graphic}</div>
                </motion.div>
              </div>
```

- [ ] **Step 4: Verify product modules compile**

Run:

```bash
npm run lint
```

Expected: ESLint exits with code 0. No unused `LandingPhoto` import; if TypeScript infers the type without needing the import, remove `type LandingPhoto`.

- [ ] **Step 5: Commit**

```bash
git add components/landing/product-modules.tsx
git commit -m "Blend real photos into product modules"
```

## Task 4: Add Photo-Backed Interface Cards

**Files:**
- Modify: `components/landing/interface-showcase.tsx`

- [ ] **Step 1: Import photo primitive and assets**

Add:

```tsx
import { PhotoPanel } from "./photo-panel";
import { landingPhotos } from "./photo-assets";
```

- [ ] **Step 2: Add a `photo` key to each interface object**

Use:

```tsx
photo: landingPhotos.clinicTeam,
```

for district officials,

```tsx
photo: landingPhotos.fieldWorker,
```

for field workers, and

```tsx
photo: landingPhotos.patientCare,
```

for patients/public.

- [ ] **Step 3: Add a compact photo band above each existing visual**

Inside each interface card body, replace:

```tsx
                <p className="mb-4 text-sm leading-relaxed text-neutral-500">{iface.description}</p>
                {iface.visual}
```

with:

```tsx
                <p className="mb-4 text-sm leading-relaxed text-neutral-500">{iface.description}</p>
                <div className="relative mb-4 h-36">
                  <PhotoPanel
                    photo={iface.photo}
                    sizes="(min-width: 768px) 30vw, 92vw"
                    className="h-full rounded-xl"
                  />
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.35 }}
                    className="absolute bottom-3 right-3 rounded-lg border border-white/60 bg-white/90 px-3 py-2 text-[11px] font-semibold text-neutral-800 shadow-lg backdrop-blur-md"
                  >
                    Live state synced
                  </motion.div>
                </div>
                {iface.visual}
```

- [ ] **Step 4: Verify interface showcase compiles**

Run:

```bash
npm run lint
```

Expected: ESLint exits with code 0. No missing `i` variable; the code is inside `interfaces.map((iface, i) => ...)`.

- [ ] **Step 5: Commit**

```bash
git add components/landing/interface-showcase.tsx
git commit -m "Add photo context to interface showcase"
```

## Task 5: Visual Verification and Final Polish

**Files:**
- Modify only the files touched above if verification reveals layout or lint issues.

- [ ] **Step 1: Run production build**

Run:

```bash
npm run build
```

Expected: Next.js build completes successfully. No `next/image` host errors, no TypeScript errors, no hydration errors.

- [ ] **Step 2: Start local dev server**

Run:

```bash
npm run dev
```

Expected: server prints a local URL, usually `http://localhost:3000`.

- [ ] **Step 3: Verify desktop layout**

Open the local URL at desktop width. Confirm:

- Hero photo loads above the dashboard console.
- Dashboard remains the primary visual focus.
- Floating cards do not cover headline, CTAs, or dashboard labels.
- Product module image cards look integrated rather than stock-photo-heavy.
- Interface showcase cards retain readable text and visible product UI.

- [ ] **Step 4: Verify mobile layout**

Open the local URL at mobile width. Confirm:

- Hero image/product composition stacks without horizontal overflow.
- Text does not overlap moving cards.
- Photo tiles keep stable height and aspect ratio.
- Motion does not make compact cards unreadable.

- [ ] **Step 5: Run final lint**

Run:

```bash
npm run lint
```

Expected: ESLint exits with code 0.

- [ ] **Step 6: Commit final polish if needed**

Only if Step 3 or Step 4 required changes:

```bash
git add next.config.ts components/landing/photo-assets.ts components/landing/photo-panel.tsx components/landing/hero.tsx components/landing/product-modules.tsx components/landing/interface-showcase.tsx
git commit -m "Polish landing real imagery layout"
```

## Self-Review

Spec coverage:

- Real imagery: covered by Tasks 1-4.
- Dub-like moving objects: covered by Tasks 2-4.
- Product UI remains primary: covered by Tasks 2-4 and visual checks in Task 5.
- Next.js image docs: covered by remote patterns, `next/image`, `sizes`, and hero `preload`.
- Verification: covered by lint, build, dev server, desktop, and mobile checks.

Placeholder scan: no TBD/TODO/fill-in placeholders are present.

Type consistency: `LandingPhoto`, `landingPhotos`, and `PhotoPanel` are defined in Task 1 before use in later tasks.
