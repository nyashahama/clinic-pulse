# Real-world Stakes Section Redesign

## Overview

Replace the current generic "Real-world stakes" stakeholder-impact strip with a patient journey timeline that shows live ClinicPulse data at each critical moment. The timeline demonstrates how real-time facility status changes human outcomes—specifically, how a patient's 90-minute wasted trip becomes an 18-minute detour when ClinicPulse surfaces live status with freshness and source.

## Problem with Current Implementation

The current component (`StakeholderImpactStrip`) shows four cards with feature-signal labels:
- "Live district view" → "Acts on source, reason, and freshness"
- "Queued field report" → "Submits the service update even when the report has to queue offline"
- "Traceable status change" → "Confirms the service impact without losing the original source record"
- "18 min avoided" → "Sees the safer nearby route before spending time travelling to a blocked service"

These are feature descriptions, not human stakes. They describe what the product does, not what happens to people when it doesn't exist.

## Design Concept: Patient Journey Timeline with Live Data

A horizontal timeline (desktop) / vertical stack (mobile) showing 5 moments in a real patient's physical journey. Each step displays live ClinicPulse UI artifacts—status badges with freshness, source attribution, mini finder cards, mini district alerts—drawn directly from the Mabopane Station incident (AUD-OPS-MAB-001).

### Timeline Steps

| Step | Moment | Time | Location | ClinicPulse Data Displayed |
|------|--------|------|----------|---------------------------|
| 1 | **DEPART** | 07:30 | Patient home | Finder card: "Mabopane Station • Pharmacy: Operational • Last updated: 3 days ago • ⚠ Stale" |
| 2 | **TRAVEL** | 07:30–08:15 | In transit | Field report card: "Queued offline • Generator failure • Pharmacy paused • Source: Field worker • Will sync on signal" |
| 3 | **ARRIVE** | 08:15 | Mabopane Station | Status badge: "Non-functional • Source: Field worker • Fresh: 2 min ago • Reason: Generator failure" |
| 4 | **DISCOVER** | 08:15 | Pharmacy counter | Human impact: "No chronic meds. No staff. Wasted: 90 min round-trip. Next refill: 30 days." |
| 5 | **REROUTE** | 08:16 | On phone / finder | Finder card: "Akasia Hills Clinic • Pharmacy: Accepting rerouted pickups • 18 min detour • Fresh: Now • Directions" |

### Visual Treatment

- **Layout**: Horizontal snap-scrolling timeline on desktop (≥1024px), vertical stack on mobile
- **Step component**: Large step number (01–05), time label, location badge, primary data card, secondary context line
- **Color progression**: Neutral (step 1) → Amber/warning (step 2) → Red/critical (steps 3–4) → Green/healthy (step 5)
- **Background rail**: Faint clinic rail line connecting steps (reuses existing `--clinic-rail` CSS custom properties)
- **Animation**: Subtle fade/slide on scroll into view (IntersectionObserver), respects `prefers-reduced-motion`
- **Data artifacts**: Mini ClinicPulse UI components—status badges with freshness pills, finder cards with distance, field report queue cards

### Data Integrity

Every piece of data shown is real demo data from the Mabopane incident:
- Clinic: Mabopane Station Clinic
- Service: Pharmacy (chronic medication dispensing)
- Disruption: Generator failure paused dispensing and chronic care pickup
- Field report: Offline queued at 08:11, synced at 08:13
- District alert: Operational → Non-functional at 08:13, source: field_worker, freshness: 2 min
- Alternative: Akasia Hills Clinic, pharmacy accepting, 18 min travel, freshness: Now
- Audit ID: AUD-OPS-MAB-001

No fabricated data. The timeline *is* the demo incident, viewed from the patient's physical perspective.

### Responsive Behavior

| Breakpoint | Layout | Navigation |
|------------|--------|------------|
| ≥1024px | Horizontal scroll-snap, 5 steps visible with partial peek | Mouse wheel, touch drag, scroll snap |
| 768–1023px | Horizontal scroll, 2–3 steps visible | Touch drag, scroll snap |
| <768px | Vertical stack, full-width cards | Native scroll |

### Accessibility

- Semantic `<ol>` with `<li>` for each step
- `aria-label` on timeline: "Patient journey: how live clinic status changes the outcome"
- Each step has `aria-labelledby` referencing its step number + moment
- Status badges use both color and text (never color alone)
- Freshness pills have sufficient contrast in light/dark modes
- Keyboard navigable: Tab enters timeline, Arrow keys move between steps
- Screen reader announces step number, moment, and key status change

## Component Architecture

### New Components

```
components/landing/
├── patient-journey-timeline.tsx       # Main timeline container
├── patient-journey-step.tsx           # Individual step card
├── timeline-rail.tsx                  # Background connecting line
├── mini-finder-card.tsx               # Reusable finder card artifact
├── mini-field-report-card.tsx         # Reusable field report artifact
├── mini-status-badge.tsx              # Status + freshness + source
└── timeline-navigation.tsx            # Optional: step indicators/dots
```

### Data Source

Single source of truth: `lib/landing/patient-journey-data.ts` exporting typed timeline steps matching the Mabopane incident exactly. This ensures the timeline, hero incident, workflow steps, and demo controls all reference identical data.

### Integration Point

Replace `<StakeholderProof />` in `app/page.tsx` with `<PatientJourneyTimeline />`. The section retains the same `LandingSection` wrapper and spacing.

## Acceptance Criteria

- [ ] Timeline renders 5 steps in correct order with correct data
- [ ] Horizontal scroll-snap works on desktop, vertical stack on mobile
- [ ] Color progression: neutral → amber → red → red → green
- [ ] All status badges show freshness (e.g., "Fresh: 2 min ago", "Stale: 3 days ago")
- [ ] All status badges show source (e.g., "Source: Field worker", "Source: Finder (stale)")
- [ ] Mini finder cards show clinic name, service, status, distance, freshness
- [ ] Mini field report card shows queued state, disruption reason, sync state
- [ ] Background rail renders and connects steps visually
- [ ] Scroll animations trigger on IntersectionObserver, respect reduced motion
- [ ] Keyboard navigation works (Tab + Arrow keys)
- [ ] Screen reader announces each step meaningfully
- [ ] Dark mode renders correctly
- [ ] No hardcoded strings—all data from `patient-journey-data.ts`
- [ ] Component passes existing lint/typecheck

## Implementation Notes

- Reuse existing status badge patterns from `components/ui/status-badge.tsx` and freshness patterns from district console
- Mini finder card can share structure with `app/finder` clinic cards (simplified)
- Timeline rail reuses existing CSS custom properties from `stakeholder-impact-strip.tsx`
- Consider `framer-motion` or native CSS scroll-driven animations for scroll effects
- Keep total bundle impact minimal—this is a landing page section

## Future Extensibility

- Scenario selector: allow switching between Mabopane, maternal, TB, emergency scenarios (each with own data file)
- Demo control integration: founder can trigger "patient arrives now" highlight during live walkthrough
- Analytics: track which step users spend most time on