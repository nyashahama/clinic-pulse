# Landing Page OpenPanel Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Clinic Pulse landing page as an OpenPanel-style, product-led SaaS page that convinces district health and clinic operations buyers to book a demo.

**Architecture:** Keep `app/page.tsx` as the composition point and move landing content into small focused components. Preserve the existing demo booking modal by extracting the booking state and panel from the current hero into a standalone controller, then build new OpenPanel-inspired sections around pure Clinic Pulse content data.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, lucide-react, motion/react where already useful, Vitest for pure content/helper tests.

---

## Scope Check

This is one frontend subsystem: the public landing page. It does not require backend, database, auth, partner API, or demo workflow changes.

## Reference Sources

- Primary structure: `reference-projects/openpanel/apps/public/src/app/(home)/page.tsx`
- Hero structure: `reference-projects/openpanel/apps/public/src/app/(home)/_sections/hero.tsx`
- Feature grid: `reference-projects/openpanel/apps/public/src/app/(home)/_sections/analytics-insights.tsx`
- Workflow section: `reference-projects/openpanel/apps/public/src/app/(home)/_sections/collaboration.tsx`
- Trust section: `reference-projects/openpanel/apps/public/src/app/(home)/_sections/data-privacy.tsx`
- CTA section: `reference-projects/openpanel/apps/public/src/app/(home)/_sections/cta-banner.tsx`
- Section primitive reference: `reference-projects/openpanel/apps/public/src/components/section.tsx`
- Card primitive reference: `reference-projects/openpanel/apps/public/src/components/feature-card.tsx`

## File Structure

Create:

- `lib/landing/openpanel-refactor-content.ts` - pure landing copy/data contract for the new page.
- `lib/landing/openpanel-refactor-content.test.ts` - Vitest guard for approved content, CTAs, and no OpenPanel copy leakage.
- `components/landing/booking-demo-controller.tsx` - client booking controller extracted from the current `BookingHero`.
- `components/landing/landing-section.tsx` - OpenPanel-style local section/header primitives.
- `components/landing/landing-feature-card.tsx` - OpenPanel-style local feature card primitive.
- `components/landing/openpanel-product-hero.tsx` - new product-led hero with native Clinic Pulse browser frame.
- `components/landing/stakeholder-proof.tsx` - compact stakeholder/perks proof row.
- `components/landing/operating-gap.tsx` - buyer-facing problem section.
- `components/landing/workflow-timeline.tsx` - field report to audit timeline.
- `components/landing/product-feature-cards.tsx` - three feature cards.

Modify:

- `app/page.tsx` - replace current section assembly with the approved OpenPanel-first flow.
- `components/landing/nav.tsx` - update anchors and CTA labels to match the new sections.
- `components/landing/trust-infrastructure.tsx` - rewrite into the approved trust/API/audit block using the new content.
- `components/landing/demo-booking-cta.tsx` - rewrite as a polished OpenPanel-style CTA banner.
- `components/landing/footer.tsx` - update landing anchors and product links to match the new section names.

Leave in place unless a build/lint failure forces cleanup:

- `components/landing/booking-hero.tsx`
- `components/landing/proof-strip.tsx`
- `components/landing/problem-contrast.tsx`
- `components/landing/product-flow.tsx`
- `components/landing/routing-moment.tsx`

These become unused by `app/page.tsx`. Delete them only in a follow-up cleanup after the visual refactor is accepted.

---

### Task 1: Landing Content Contract

**Files:**

- Create: `lib/landing/openpanel-refactor-content.ts`
- Create: `lib/landing/openpanel-refactor-content.test.ts`

- [ ] **Step 1: Write the failing content test**

Create `lib/landing/openpanel-refactor-content.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  featureCards,
  heroClinicRows,
  landingHero,
  stakeholderProofItems,
  trustObjects,
  workflowSteps,
} from "@/lib/landing/openpanel-refactor-content";

function collectText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(collectText).join(" ");
  }

  if (value && typeof value === "object") {
    return Object.values(value).map(collectText).join(" ");
  }

  return "";
}

describe("OpenPanel-first landing content", () => {
  it("keeps the approved Clinic Pulse hero and booking CTAs", () => {
    expect(landingHero.title).toBe("Clinic Pulse");
    expect(landingHero.primaryCta.href).toBe("/?booking=1");
    expect(landingHero.secondaryCta.href).toBe("#flow");
    expect(landingHero.description).toContain("Live clinic availability");
  });

  it("covers the approved stakeholder, workflow, feature, and trust sections", () => {
    expect(stakeholderProofItems.map((item) => item.title)).toEqual([
      "District teams",
      "Field workers",
      "Clinic coordinators",
      "Patients",
    ]);
    expect(workflowSteps).toHaveLength(5);
    expect(featureCards.map((card) => card.title)).toEqual([
      "Field reports",
      "District console",
      "Patient rerouting",
    ]);
    expect(trustObjects.map((object) => object.label)).toEqual([
      "Freshness",
      "Source and permissions",
      "Audit ledger",
      "Exports and API",
      "Webhook readiness",
      "Offline queue",
    ]);
  });

  it("does not leak OpenPanel reference copy or unsupported claims", () => {
    const text = collectText([
      landingHero,
      stakeholderProofItems,
      workflowSteps,
      featureCards,
      trustObjects,
      heroClinicRows,
    ]);

    expect(text).not.toMatch(/OpenPanel|Mixpanel|GDPR|SOC 2|customers love us/i);
    expect(text).toMatch(/Clinic Pulse|ClinicPulse/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- lib/landing/openpanel-refactor-content.test.ts
```

Expected: FAIL because `lib/landing/openpanel-refactor-content.ts` does not exist.

- [ ] **Step 3: Add the content module**

Create `lib/landing/openpanel-refactor-content.ts`:

```ts
export const landingHero = {
  eyebrow: "Clinic operations platform",
  title: "Clinic Pulse",
  description:
    "Live clinic availability, field reporting, patient rerouting, and audit-ready records in one operations workspace.",
  primaryCta: {
    label: "Book demo",
    href: "/?booking=1",
  },
  secondaryCta: {
    label: "View demo flow",
    href: "#flow",
  },
  perks: [
    "Offline-ready reports",
    "Audit trail",
    "Public rerouting",
    "Freshness checks",
  ],
} as const;

export const heroClinicRows = [
  {
    clinic: "Mamelodi East Community Clinic",
    status: "Non-functional",
    tone: "critical",
    reason: "Pharmacy stockout reported by field worker",
    freshness: "2 min ago",
    action: "Reroute",
  },
  {
    clinic: "Soshanguve Block F Clinic",
    status: "Degraded",
    tone: "warning",
    reason: "Staffing pressure during afternoon shift",
    freshness: "7 min ago",
    action: "Limit visits",
  },
  {
    clinic: "Akasia Hills Clinic",
    status: "Operational",
    tone: "healthy",
    reason: "Primary care and ARV pickup available",
    freshness: "Now",
    action: "Accepting",
  },
] as const;

export const heroStats = [
  { value: "42", label: "demo clinics" },
  { value: "17", label: "offline syncs" },
  { value: "3 min", label: "freshness target" },
] as const;

export const stakeholderProofItems = [
  {
    title: "District teams",
    description: "See clinic availability, source, reason, and freshness before decisions are made.",
    icon: "landmark",
  },
  {
    title: "Field workers",
    description: "Submit facility reports even when connectivity is weak, then sync when signal returns.",
    icon: "radio",
  },
  {
    title: "Clinic coordinators",
    description: "Confirm service status and keep a traceable source record for each change.",
    icon: "clipboard-check",
  },
  {
    title: "Patients",
    description: "Get routed away from unavailable services toward compatible clinics that can help now.",
    icon: "route",
  },
] as const;

export const operatingGap = {
  label: "The operating gap",
  title: "Clinic status changes before district systems catch up.",
  description:
    "Calls, messages, and late reports make stale data look confident. Clinic Pulse connects field signal, district visibility, public routing, and audit history in one operating record.",
  before: [
    "Patients travel before knowing if a clinic can serve them.",
    "District teams reconcile calls, WhatsApp notes, and delayed reports.",
    "Stale clinic data looks as confident as fresh clinic data.",
  ],
  after: [
    "Availability is visible by status, reason, source, and freshness.",
    "Field reports update the district console and public finder.",
    "Every reroute and status change leaves an audit trail.",
  ],
} as const;

export const workflowSteps = [
  {
    title: "Field report",
    description: "A field worker submits clinic status, service pressure, and notes.",
    detail: "Queued offline when signal is weak",
  },
  {
    title: "Status update",
    description: "The district console changes the clinic from operational to non-functional.",
    detail: "Reason: pharmacy stockout",
  },
  {
    title: "Coordinator review",
    description: "The alert opens with source, timestamp, service impact, and recommended action.",
    detail: "Fresh - 2 min ago",
  },
  {
    title: "Patient reroute",
    description: "The public finder recommends the nearest compatible operational clinic.",
    detail: "Route to Akasia Hills Clinic",
  },
  {
    title: "Audit record",
    description: "The source, sync event, status change, and routing decision are recorded.",
    detail: "Traceable operating record",
  },
] as const;

export const featureCards = [
  {
    title: "Field reports",
    description:
      "Offline-capable facility updates capture service pressure, source, sync state, and notes from the operating day.",
    icon: "wifi-off",
  },
  {
    title: "District console",
    description:
      "Clinic status, freshness, alerts, and routing readiness sit in one workspace for district teams.",
    icon: "layout-dashboard",
  },
  {
    title: "Patient rerouting",
    description:
      "Unavailable clinic context is paired with a compatible alternative so patients avoid wasted trips.",
    icon: "navigation",
  },
] as const;

export const trustObjects = [
  {
    label: "Freshness",
    value: "Fresh - 2 min ago",
    description: "Every status carries confidence context.",
  },
  {
    label: "Source and permissions",
    value: "Field worker / district manager",
    description: "Teams can see who reported and who can publish changes.",
  },
  {
    label: "Audit ledger",
    value: "5 events linked",
    description: "Reports, syncs, alerts, reroutes, and exports stay traceable.",
  },
  {
    label: "Exports and API",
    value: "CSV + status endpoint",
    description: "Pilot teams can hand records to reporting and partner systems.",
  },
  {
    label: "Webhook readiness",
    value: "Preview delivery recorded",
    description: "Integration handoffs can be tested before production rollout.",
  },
  {
    label: "Offline queue",
    value: "3 reports queued",
    description: "Weak signal is treated as an expected workflow state.",
  },
] as const;

export const demoCta = {
  label: "Pilot walkthrough",
  title: "Book a Clinic Pulse demo.",
  description:
    "Walk through district visibility, offline field reports, patient rerouting, audit history, exports, and partner readiness with seeded demo data.",
  cta: {
    label: "Book demo",
    href: "/?booking=1",
  },
  note: "Demo data is seeded to show the operating model clearly.",
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm run test -- lib/landing/openpanel-refactor-content.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/landing/openpanel-refactor-content.ts lib/landing/openpanel-refactor-content.test.ts
git commit -m "test: add landing content contract"
```

---

### Task 2: Extract Booking Modal Controller

**Files:**

- Create: `components/landing/booking-demo-controller.tsx`
- Read from: `components/landing/booking-hero.tsx`
- Test: `lib/landing/booking-modal.test.ts`

- [ ] **Step 1: Create the controller wrapper**

Create `components/landing/booking-demo-controller.tsx` with this top-level structure:

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Globe2,
  Monitor,
  UserRound,
  X,
} from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useDemoStore } from "@/lib/demo/demo-store";
import {
  shouldOpenBookingModal,
  shouldOpenBookingModalFromSearchParams,
} from "@/lib/landing/booking-modal";
import { cn } from "@/lib/utils";
import type { DemoLeadFormInput } from "@/components/demo/demo-lead-form";

const monthDays = Array.from({ length: 31 }, (_, index) => index + 1);
const leadingBlankDays = Array.from({ length: 5 }, (_, index) => `blank-${index}`);
const timeSlots = ["09:00", "10:30", "12:00", "14:00", "15:30"];

type InterestType = DemoLeadFormInput["interest"];

type BookingDemoControllerProps = {
  children: (controls: { openBooking: () => void }) => ReactNode;
};

export function BookingDemoController({ children }: BookingDemoControllerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addDemoLead } = useDemoStore();
  const [duration, setDuration] = useState<30 | 45>(30);
  const [selectedDay, setSelectedDay] = useState(4);
  const [selectedTime, setSelectedTime] = useState("10:30");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [lead, setLead] = useState({
    name: "",
    workEmail: "",
    organization: "",
    role: "",
    interest: "clinic_operator" as InterestType,
    note: "",
  });

  const selectedDateLabel = useMemo(
    () => `May ${selectedDay}, 2026 at ${selectedTime}`,
    [selectedDay, selectedTime],
  );
  const bookingUrlOpen = shouldOpenBookingModalFromSearchParams(searchParams);
  const bookingOpen = isBookingOpen || bookingUrlOpen;

  useEffect(() => {
    const syncBookingHash = () => {
      if (window.location.hash === "#booking") {
        setIsBookingOpen(true);
      }
    };

    const openBooking = window.setTimeout(syncBookingHash, 0);
    window.addEventListener("hashchange", syncBookingHash);

    return () => {
      window.clearTimeout(openBooking);
      window.removeEventListener("hashchange", syncBookingHash);
    };
  }, []);

  const closeBooking = () => {
    setIsBookingOpen(false);

    if (shouldOpenBookingModal(window.location.href)) {
      router.replace("/", { scroll: false });
    }
  };

  const isSubmitDisabled =
    isSubmitting ||
    lead.name.trim().length === 0 ||
    lead.workEmail.trim().length === 0 ||
    lead.organization.trim().length === 0 ||
    lead.role.trim().length === 0;

  const updateLead = (field: keyof typeof lead, value: string) => {
    setLead((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitDisabled) {
      return;
    }

    setIsSubmitting(true);

    const note = [
      lead.note.trim(),
      `Requested slot: ${selectedDateLabel}`,
      `Duration: ${duration} minutes`,
    ]
      .filter(Boolean)
      .join("\n");

    addDemoLead({
      ...lead,
      name: lead.name.trim(),
      workEmail: lead.workEmail.trim(),
      organization: lead.organization.trim(),
      role: lead.role.trim(),
      note,
      createdAt: new Date().toISOString(),
      status: "new",
    });

    router.push(
      `/book-demo/thanks?name=${encodeURIComponent(lead.name)}&organization=${encodeURIComponent(
        lead.organization,
      )}`,
    );
  };

  return (
    <>
      {children({ openBooking: () => setIsBookingOpen(true) })}

      {bookingOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-start overflow-y-auto bg-neutral-950/52 px-4 py-8 backdrop-blur-[2px] sm:place-items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Book a Clinic Pulse demo"
        >
          <BookingPanel
            duration={duration}
            isSubmitDisabled={isSubmitDisabled}
            isSubmitting={isSubmitting}
            lead={lead}
            selectedDateLabel={selectedDateLabel}
            selectedDay={selectedDay}
            selectedTime={selectedTime}
            onClose={closeBooking}
            onDurationChange={setDuration}
            onLeadChange={updateLead}
            onSelectedDayChange={setSelectedDay}
            onSelectedTimeChange={setSelectedTime}
            onSubmit={handleSubmit}
          />
        </div>
      ) : null}
    </>
  );
}
```

- [ ] **Step 2: Move the existing panel implementation**

In the same new file, below `BookingDemoController`, move these definitions from `components/landing/booking-hero.tsx` without behavior changes:

- `type BookingPanelProps`
- `function BookingPanel(...)`
- `type LeadInputProps`
- `function LeadInput(...)`

Keep the existing form fields, calendar behavior, submit button, and local styles. Change only visible brand text from `ClinicPulse` to `Clinic Pulse` where it appears in labels.

- [ ] **Step 3: Run booking helper test**

Run:

```bash
npm run test -- lib/landing/booking-modal.test.ts
```

Expected: PASS. This confirms the query/hash behavior used by the extracted controller still matches the helper contract.

- [ ] **Step 4: Commit**

```bash
git add components/landing/booking-demo-controller.tsx
git commit -m "refactor: extract landing booking controller"
```

---

### Task 3: Shared Landing Primitives

**Files:**

- Create: `components/landing/landing-section.tsx`
- Create: `components/landing/landing-feature-card.tsx`

- [ ] **Step 1: Add the section primitive**

Create `components/landing/landing-section.tsx`:

```tsx
import { ReactNode } from "react";

import { MaxWidthWrapper } from "@/components/ui/max-width-wrapper";
import { cn } from "@/lib/utils";

type LandingSectionProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  id?: string;
};

export function LandingSection({
  children,
  className,
  contentClassName,
  id,
}: LandingSectionProps) {
  return (
    <section id={id} className={cn("relative bg-[#eef3f2]", className)}>
      <MaxWidthWrapper className={cn("py-16 sm:py-20 lg:py-24", contentClassName)}>
        {children}
      </MaxWidthWrapper>
    </section>
  );
}

type LandingSectionHeaderProps = {
  align?: "left" | "center";
  className?: string;
  description?: ReactNode;
  eyebrow?: string;
  title: ReactNode;
};

export function LandingSectionHeader({
  align = "left",
  className,
  description,
  eyebrow,
  title,
}: LandingSectionHeaderProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className="font-display text-3xl leading-[1.08] text-neutral-950 sm:text-4xl lg:text-5xl"
        style={{ textWrap: "balance" }}
      >
        {title}
      </h2>
      {description ? (
        <p className="text-base leading-7 text-neutral-600 sm:text-lg">{description}</p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Add the feature card primitive**

Create `components/landing/landing-feature-card.tsx`:

```tsx
import type { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

import { cn } from "@/lib/utils";

type LandingFeatureCardProps = {
  children?: ReactNode;
  className?: string;
  description: string;
  icon?: LucideIcon;
  title: string;
};

export function LandingFeatureCard({
  children,
  className,
  description,
  icon: Icon,
  title,
}: LandingFeatureCardProps) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(13,122,107,0.08),transparent_42%,rgba(15,23,42,0.05))] opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">
        {Icon ? (
          <span className="mb-5 flex size-10 items-center justify-center rounded-lg bg-neutral-950 text-white">
            <Icon className="size-5" />
          </span>
        ) : null}
        <h3 className="text-lg font-semibold text-neutral-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>
        {children ? <div className="mt-5">{children}</div> : null}
      </div>
    </article>
  );
}
```

- [ ] **Step 3: Run lint on new files**

Run:

```bash
npm run lint -- components/landing/landing-section.tsx components/landing/landing-feature-card.tsx
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/landing/landing-section.tsx components/landing/landing-feature-card.tsx
git commit -m "feat: add landing section primitives"
```

---

### Task 4: Product-Led Hero

**Files:**

- Create: `components/landing/openpanel-product-hero.tsx`
- Uses: `lib/landing/openpanel-refactor-content.ts`

- [ ] **Step 1: Create hero component shell**

Create `components/landing/openpanel-product-hero.tsx`:

```tsx
"use client";

import {
  Activity,
  ArrowRight,
  ClipboardCheck,
  MapPin,
  Radio,
  Route,
  ShieldCheck,
} from "lucide-react";

import {
  heroClinicRows,
  heroStats,
  landingHero,
} from "@/lib/landing/openpanel-refactor-content";
import { cn } from "@/lib/utils";

type OpenPanelProductHeroProps = {
  onBookDemo: () => void;
};

const statusStyles = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-800",
} as const;

export function OpenPanelProductHero({ onBookDemo }: OpenPanelProductHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-neutral-200 bg-[#eef3f2]">
      <div className="mx-auto grid w-full max-w-screen-xl gap-10 px-4 py-12 sm:px-6 lg:min-h-[640px] lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:px-10 lg:py-16">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {landingHero.eyebrow}
          </p>
          <h1 className="mt-5 font-display text-5xl leading-[0.98] text-neutral-950 sm:text-6xl lg:text-7xl">
            {landingHero.title}
          </h1>
          <p className="mt-6 text-lg leading-8 text-neutral-600">
            {landingHero.description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onBookDemo}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              {landingHero.primaryCta.label}
              <ArrowRight className="size-4" />
            </button>
            <a
              href={landingHero.secondaryCta.href}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-950 transition hover:border-neutral-400 hover:bg-neutral-50"
            >
              {landingHero.secondaryCta.label}
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {landingHero.perks.map((perk) => (
              <span
                key={perk}
                className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600"
              >
                {perk}
              </span>
            ))}
          </div>
        </div>

        <ProductPreview />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add native product preview**

Append these helper components in the same file:

```tsx
function ProductPreview() {
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
        <div className="flex h-12 items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-red-400" />
            <span className="size-3 rounded-full bg-amber-400" />
            <span className="size-3 rounded-full bg-emerald-400" />
          </div>
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-1 font-mono text-xs text-neutral-500">
            clinicpulse.demo/district-console
          </div>
          <span className="hidden text-xs font-semibold text-neutral-500 sm:block">
            Live demo
          </span>
        </div>

        <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="border-b border-neutral-200 bg-[#f8faf9] p-4 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">
                  Gauteng district
                </p>
                <h2 className="mt-1 text-lg font-semibold text-neutral-950">
                  Clinic availability
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                live
              </span>
            </div>

            <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-xl border border-neutral-200 bg-[#dfe7e3]">
              <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(255,255,255,0.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.55)_1px,transparent_1px)] [background-size:32px_32px]" />
              {[
                ["left-[22%] top-[26%]", "bg-emerald-500"],
                ["left-[45%] top-[32%]", "bg-emerald-500"],
                ["left-[58%] top-[22%]", "bg-amber-500"],
                ["left-[36%] top-[56%]", "bg-red-500"],
                ["left-[66%] top-[58%]", "bg-emerald-500"],
              ].map(([position, color]) => (
                <span
                  key={position}
                  className={cn("absolute size-4 rounded-full border-2 border-white shadow-lg", position, color)}
                />
              ))}
              <div className="absolute bottom-4 left-4 rounded-xl bg-neutral-950 px-4 py-3 text-white shadow-xl">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                  Capacity score
                </p>
                <p className="mt-1 text-2xl font-semibold">78%</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-3.5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
                    Route alert
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-neutral-950">
                    Mamelodi East cannot accept ARV visits
                  </h3>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-primary">
                  fresh
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              {heroClinicRows.map((row) => (
                <div key={row.clinic} className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-950">{row.clinic}</p>
                      <p className="mt-1 text-xs text-neutral-500">{row.reason}</p>
                    </div>
                    <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold", statusStyles[row.tone])}>
                      {row.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs font-semibold text-primary">
                    <span className="inline-flex items-center gap-1.5">
                      <Route className="size-3.5" />
                      {row.action}
                    </span>
                    <span className="text-neutral-500">{row.freshness}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {heroStats.map((stat, index) => {
                const icons = [Activity, Radio, ShieldCheck] as const;
                const Icon = icons[index] ?? ClipboardCheck;

                return (
                  <div key={stat.label} className="rounded-xl border border-neutral-200 bg-neutral-50 p-2.5">
                    <Icon className="size-4 text-primary" />
                    <p className="mt-2 text-lg font-semibold text-neutral-950">{stat.value}</p>
                    <p className="text-xs font-medium text-neutral-500">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 right-6 hidden rounded-xl border border-neutral-200 bg-white p-3 shadow-xl lg:block">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-950">
          <MapPin className="size-4 text-primary" />
          Akasia Hills Clinic ready for reroutes
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run lint on hero**

Run:

```bash
npm run lint -- components/landing/openpanel-product-hero.tsx
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/landing/openpanel-product-hero.tsx
git commit -m "feat: add product-led landing hero"
```

---

### Task 5: Mid-Page OpenPanel Sections

**Files:**

- Create: `components/landing/stakeholder-proof.tsx`
- Create: `components/landing/operating-gap.tsx`
- Create: `components/landing/workflow-timeline.tsx`
- Create: `components/landing/product-feature-cards.tsx`
- Uses: `lib/landing/openpanel-refactor-content.ts`
- Uses: `components/landing/landing-section.tsx`
- Uses: `components/landing/landing-feature-card.tsx`

- [ ] **Step 1: Create stakeholder proof row**

Create `components/landing/stakeholder-proof.tsx` using this icon mapping and layout:

```tsx
import { ClipboardCheck, Landmark, Radio, Route } from "lucide-react";

import { LandingFeatureCard } from "@/components/landing/landing-feature-card";
import { LandingSection } from "@/components/landing/landing-section";
import { stakeholderProofItems } from "@/lib/landing/openpanel-refactor-content";

const iconMap = {
  "clipboard-check": ClipboardCheck,
  landmark: Landmark,
  radio: Radio,
  route: Route,
} as const;

export function StakeholderProof() {
  return (
    <LandingSection className="border-b border-neutral-200" contentClassName="py-10">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stakeholderProofItems.map((item) => (
          <LandingFeatureCard
            key={item.title}
            title={item.title}
            description={item.description}
            icon={iconMap[item.icon]}
            className="min-h-44"
          />
        ))}
      </div>
    </LandingSection>
  );
}
```

- [ ] **Step 2: Create buyer-facing operating gap**

Create `components/landing/operating-gap.tsx`:

```tsx
import Image from "next/image";
import { CheckCircle2, XCircle } from "lucide-react";

import {
  LandingSection,
  LandingSectionHeader,
} from "@/components/landing/landing-section";
import { demoImages } from "@/lib/demo/images";
import { operatingGap } from "@/lib/landing/openpanel-refactor-content";

export function OperatingGap() {
  return (
    <LandingSection id="problem">
      <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
        <LandingSectionHeader
          eyebrow={operatingGap.label}
          title={operatingGap.title}
          description={operatingGap.description}
        />

        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="relative aspect-[16/8]">
            <Image
              src={demoImages["district-operations-room"].src}
              alt={demoImages["district-operations-room"].alt}
              fill
              sizes="(min-width: 1024px) 44rem, 100vw"
              className="object-cover"
            />
          </div>
          <div className="grid gap-0 md:grid-cols-2">
            <StatusList title="Before" tone="before" items={operatingGap.before} />
            <StatusList title="With Clinic Pulse" tone="after" items={operatingGap.after} />
          </div>
        </div>
      </div>
    </LandingSection>
  );
}

function StatusList({
  items,
  title,
  tone,
}: {
  items: readonly string[];
  title: string;
  tone: "before" | "after";
}) {
  const Icon = tone === "before" ? XCircle : CheckCircle2;

  return (
    <div className={tone === "before" ? "border-t border-neutral-200 p-5 md:border-r" : "border-t border-neutral-200 bg-emerald-50/60 p-5"}>
      <p className="text-sm font-semibold text-neutral-950">{title}</p>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div key={item} className="flex gap-2 text-sm leading-6 text-neutral-700">
            <Icon className={tone === "before" ? "mt-1 size-4 shrink-0 text-red-500" : "mt-1 size-4 shrink-0 text-primary"} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create workflow timeline**

Create `components/landing/workflow-timeline.tsx` using `workflowSteps`. Use `id="flow"` so hero/secondary CTA and nav anchors work:

```tsx
import { ArrowRight, ClipboardList } from "lucide-react";

import {
  LandingSection,
  LandingSectionHeader,
} from "@/components/landing/landing-section";
import { workflowSteps } from "@/lib/landing/openpanel-refactor-content";

export function WorkflowTimeline() {
  return (
    <LandingSection id="flow" className="border-y border-neutral-200 bg-neutral-950 text-white">
      <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
        <LandingSectionHeader
          eyebrow="Product flow"
          title="One operating record from field report to audit trail."
          description="Each Clinic Pulse event updates the next surface: field report, district console, public finder, and audit history."
          className="[&_h2]:text-white [&_p:last-child]:text-white/60 [&_p:first-child]:text-emerald-300"
        />

        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="size-4 text-emerald-300" />
              <p className="text-sm font-semibold">Clinic Pulse workflow</p>
            </div>
            <p className="font-mono text-xs text-white/40">LIVE_DEMO / SEEDED_DATA</p>
          </div>
          <div className="grid gap-0 p-4">
            {workflowSteps.map((step, index) => (
              <div
                key={step.title}
                className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-white/10 py-4 last:border-b-0"
              >
                <span className="flex size-9 items-center justify-center rounded-md border border-emerald-300/30 bg-neutral-950 font-mono text-xs text-emerald-300">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                  <p className="mt-1 text-xs leading-5 text-white/50">{step.description}</p>
                  <p className="mt-1 font-mono text-xs text-emerald-200/80">{step.detail}</p>
                </div>
                <ArrowRight className="size-4 text-white/30" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
```

- [ ] **Step 4: Create feature cards grid**

Create `components/landing/product-feature-cards.tsx` with icon mapping for `featureCards`:

```tsx
import { LayoutDashboard, Navigation, WifiOff } from "lucide-react";

import { LandingFeatureCard } from "@/components/landing/landing-feature-card";
import {
  LandingSection,
  LandingSectionHeader,
} from "@/components/landing/landing-section";
import { featureCards } from "@/lib/landing/openpanel-refactor-content";

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  navigation: Navigation,
  "wifi-off": WifiOff,
} as const;

export function ProductFeatureCards() {
  return (
    <LandingSection id="product">
      <LandingSectionHeader
        align="center"
        eyebrow="Product surfaces"
        title="Built around the work clinic teams already do."
        description="Clinic Pulse turns field signal into district decisions, patient guidance, and audit records without making weak connectivity a blocker."
      />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {featureCards.map((feature) => (
          <LandingFeatureCard
            key={feature.title}
            title={feature.title}
            description={feature.description}
            icon={iconMap[feature.icon]}
            className="min-h-64"
          />
        ))}
      </div>
    </LandingSection>
  );
}
```

- [ ] **Step 5: Run lint on new sections**

Run:

```bash
npm run lint -- components/landing/stakeholder-proof.tsx components/landing/operating-gap.tsx components/landing/workflow-timeline.tsx components/landing/product-feature-cards.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/landing/stakeholder-proof.tsx components/landing/operating-gap.tsx components/landing/workflow-timeline.tsx components/landing/product-feature-cards.tsx
git commit -m "feat: add OpenPanel-style landing sections"
```

---

### Task 6: Trust Block, CTA, Nav, And Footer

**Files:**

- Modify: `components/landing/trust-infrastructure.tsx`
- Modify: `components/landing/demo-booking-cta.tsx`
- Modify: `components/landing/nav.tsx`
- Modify: `components/landing/footer.tsx`
- Uses: `lib/landing/openpanel-refactor-content.ts`

- [ ] **Step 1: Rewrite trust infrastructure**

Replace `components/landing/trust-infrastructure.tsx` with a non-animated trust/API/audit section that maps `trustObjects`. Keep `id="trust"`:

```tsx
import { Braces, FileDown, ShieldCheck, type LucideIcon } from "lucide-react";

import { LandingFeatureCard } from "@/components/landing/landing-feature-card";
import {
  LandingSection,
  LandingSectionHeader,
} from "@/components/landing/landing-section";
import { trustObjects } from "@/lib/landing/openpanel-refactor-content";

export function TrustInfrastructure() {
  return (
    <LandingSection id="trust" className="border-y border-neutral-200">
      <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
        <div>
          <LandingSectionHeader
            eyebrow="Trust and infrastructure"
            title="Public-sector trust comes from records, not claims."
            description="Clinic Pulse keeps source, freshness, permissions, exports, partner handoffs, and audit history attached to the operating decision."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {trustObjects.map((object) => (
              <LandingFeatureCard
                key={object.label}
                title={object.label}
                description={object.description}
                className="min-h-40"
              >
                <p className="font-mono text-sm font-semibold text-neutral-950">{object.value}</p>
              </LandingFeatureCard>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-950 text-white shadow-sm">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-300" />
                <p className="text-sm font-semibold">Audit ledger</p>
              </div>
              <p className="font-mono text-xs text-white/40">traceable trail</p>
            </div>
            <div className="grid gap-2 p-4 font-mono text-xs text-white/70">
              <p className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">report.received_offline / field_worker / queued locally</p>
              <p className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">clinic.status_changed / non-functional / pharmacy stockout</p>
              <p className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">routing.alternative_recommended / Akasia Hills Clinic</p>
              <p className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">webhook.preview_recorded / partner handoff ready</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CodePanel icon={FileDown} title="District export" lines={["CSV / incident_report", "district=Tshwane North Demo", "freshness=required"]} />
            <CodePanel icon={Braces} title="API preview" lines={["GET /clinics/status", "status=non_functional", "source=field_worker"]} />
          </div>
        </div>
      </div>
    </LandingSection>
  );
}

function CodePanel({
  icon: Icon,
  lines,
  title,
}: {
  icon: LucideIcon;
  lines: readonly string[];
  title: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-neutral-950">
        <Icon className="size-4 text-primary" />
        {title}
      </div>
      <div className="mt-3 rounded-md bg-neutral-950 p-3 font-mono text-xs leading-6 text-emerald-200">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite CTA banner**

Replace `components/landing/demo-booking-cta.tsx`:

```tsx
import { ArrowRight } from "lucide-react";

import { ButtonLink } from "@/components/landing/button-link";
import { demoCta } from "@/lib/landing/openpanel-refactor-content";

export function DemoBookingCTA() {
  return (
    <section className="bg-[#eef3f2] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-screen-xl overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 px-6 py-14 text-white shadow-2xl sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-4xl gap-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
            {demoCta.label}
          </p>
          <h2 className="font-display text-3xl leading-[1.08] sm:text-4xl lg:text-5xl">
            {demoCta.title}
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-7 text-white/60">
            {demoCta.description}
          </p>
          <div className="flex justify-center">
            <ButtonLink href={demoCta.cta.href} variant="primary" className="h-11 bg-white text-neutral-950 hover:bg-neutral-100 hover:ring-white/10">
              {demoCta.cta.label}
              <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
          <p className="text-xs text-white/40">{demoCta.note}</p>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Update nav anchors**

In `components/landing/nav.tsx`, replace `NAV_ITEMS` with:

```ts
const NAV_ITEMS = [
  { name: "Problem", href: "#problem" },
  { name: "Flow", href: "#flow" },
  { name: "Product", href: "#product" },
  { name: "Trust", href: "#trust" },
];
```

Keep the sign-in and booking links. Change visible booking text to `Book demo` for case consistency.

- [ ] **Step 4: Update footer links**

In `components/landing/footer.tsx`, set the proof links to:

```ts
proof: [
  { name: "Operating Gap", href: "/#problem" },
  { name: "Product Flow", href: "/#flow" },
  { name: "Product Surfaces", href: "/#product" },
  { name: "Trust Layer", href: "/#trust" },
],
```

Keep product links that point to existing routes. Change footer note to `Demo data is seeded to show the Clinic Pulse operating model.`

- [ ] **Step 5: Run lint on modified files**

Run:

```bash
npm run lint -- components/landing/trust-infrastructure.tsx components/landing/demo-booking-cta.tsx components/landing/nav.tsx components/landing/footer.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/landing/trust-infrastructure.tsx components/landing/demo-booking-cta.tsx components/landing/nav.tsx components/landing/footer.tsx
git commit -m "feat: refresh landing trust and navigation"
```

---

### Task 7: Landing Page Assembly

**Files:**

- Modify: `app/page.tsx`
- Uses: `components/landing/booking-demo-controller.tsx`
- Uses: `components/landing/openpanel-product-hero.tsx`
- Uses: all new section components

- [ ] **Step 1: Replace imports in `app/page.tsx`**

Use these imports:

```tsx
import type { Metadata } from "next";
import { Suspense } from "react";

import { DemoBookingCTA } from "@/components/landing/demo-booking-cta";
import { Footer } from "@/components/landing/footer";
import { Nav } from "@/components/landing/nav";
import { BookingDemoController } from "@/components/landing/booking-demo-controller";
import { OpenPanelProductHero } from "@/components/landing/openpanel-product-hero";
import { OperatingGap } from "@/components/landing/operating-gap";
import { ProductFeatureCards } from "@/components/landing/product-feature-cards";
import { StakeholderProof } from "@/components/landing/stakeholder-proof";
import { TrustInfrastructure } from "@/components/landing/trust-infrastructure";
import { WorkflowTimeline } from "@/components/landing/workflow-timeline";
import { DemoStoreProvider } from "@/lib/demo/demo-store";
```

Remove the old `Background`, `BookingHero`, `ProofStrip`, `ProblemContrast`, `ProductFlow`, and `RoutingMoment` imports.

- [ ] **Step 2: Update metadata**

Set metadata:

```tsx
export const metadata: Metadata = {
  title: "Clinic Pulse | Clinic operations platform",
  description:
    "Clinic Pulse gives district teams live clinic availability, offline field reporting, patient rerouting, and audit-ready operating records.",
};
```

- [ ] **Step 3: Replace the page component**

Use this component body:

```tsx
export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <DemoStoreProvider>
          <Suspense fallback={null}>
            <BookingDemoController>
              {({ openBooking }) => <OpenPanelProductHero onBookDemo={openBooking} />}
            </BookingDemoController>
          </Suspense>
        </DemoStoreProvider>
        <StakeholderProof />
        <OperatingGap />
        <WorkflowTimeline />
        <ProductFeatureCards />
        <TrustInfrastructure />
        <DemoBookingCTA />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
npm run test -- lib/landing/openpanel-refactor-content.test.ts lib/landing/booking-modal.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run lint on page assembly**

Run:

```bash
npm run lint -- app/page.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx
git commit -m "feat: assemble OpenPanel-first landing page"
```

---

### Task 8: Full Verification And Visual Review

**Files:**

- No planned source edits unless verification finds issues.

- [ ] **Step 1: Run full automated verification**

Run:

```bash
npm run test
npm run lint
npm run build
```

Expected:

- `npm run test`: PASS
- `npm run lint`: PASS
- `npm run build`: PASS

- [ ] **Step 2: Start local dev server**

Run:

```bash
npm run dev
```

Expected: Next.js starts and prints a local URL, usually `http://localhost:3000`.

- [ ] **Step 3: Desktop manual review**

Open the local URL and check:

- First viewport shows `Clinic Pulse`, the product category, CTAs, and the native product browser frame.
- A hint of `StakeholderProof` is visible below the fold on common desktop height.
- `Book demo` opens the booking modal.
- `View demo flow` scrolls to `#flow`.
- Nav anchors scroll to `#problem`, `#flow`, `#product`, and `#trust`.
- No OpenPanel branding or copy appears.
- Hero/dashboard text does not overlap.

- [ ] **Step 4: Mobile manual review**

Use browser responsive tools around 390px width and check:

- Hero text fits without horizontal scrolling.
- The product preview simplifies enough to remain legible.
- Feature cards stack cleanly.
- CTA buttons fit without clipping.
- Booking modal can open, scroll, and close.

- [ ] **Step 5: Fix any verification failures**

If a command or manual review fails, make the smallest scoped edit to the affected file and rerun the failed command. Commit the fix separately:

```bash
git add <fixed-files>
git commit -m "fix: polish OpenPanel landing refactor"
```

- [ ] **Step 6: Final commit if no fixes were needed**

If Task 8 made no source changes, no commit is needed. If it made source changes, the previous step already created the verification fix commit.

---

## Final Completion Checklist

- [ ] `app/page.tsx` imports only the new approved landing sections.
- [ ] `?booking=1` and `#booking` still open the modal.
- [ ] The first viewport presents Clinic Pulse as a clinic operations platform.
- [ ] The page no longer uses internal critique copy such as "The landing page has to show".
- [ ] The hero preview is native React markup, not an iframe.
- [ ] `npm run test` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Local desktop and mobile review are complete.
