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
    description:
      "See clinic availability, source, reason, and freshness before decisions are made.",
    icon: "landmark",
  },
  {
    title: "Field workers",
    description:
      "Submit facility reports even when connectivity is weak, then sync when signal returns.",
    icon: "radio",
  },
  {
    title: "Clinic coordinators",
    description:
      "Confirm service status and keep a traceable source record for each change.",
    icon: "clipboard-check",
  },
  {
    title: "Patients",
    description:
      "Get routed away from unavailable services toward compatible clinics that can help now.",
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
    description:
      "The district console changes the clinic from operational to non-functional.",
    detail: "Reason: pharmacy stockout",
  },
  {
    title: "Coordinator review",
    description:
      "The alert opens with source, timestamp, service impact, and recommended action.",
    detail: "Fresh - 2 min ago",
  },
  {
    title: "Patient reroute",
    description:
      "The public finder recommends the nearest compatible operational clinic.",
    detail: "Route to Akasia Hills Clinic",
  },
  {
    title: "Audit record",
    description:
      "The source, sync event, status change, and routing decision are recorded.",
    detail: "Traceable operating record",
  },
] as const;

export const featureCards = [
  {
    title: "Field reports",
    description:
      "Offline-capable facility updates capture service pressure, source, sync state, and notes from the operating day.",
    icon: "wifi-off",
    miniature: {
      type: "field-report",
      label: "Mobile report",
      badge: "queued",
      rows: [
        "Mamelodi East Community Clinic",
        "Pharmacy stockout reported",
        "Offline sync pending",
      ],
    },
  },
  {
    title: "District console",
    description:
      "Clinic status, freshness, alerts, and routing readiness sit in one workspace for district teams.",
    icon: "layout-dashboard",
    miniature: {
      type: "district-console",
      label: "District console",
      badge: "live",
      rows: [
        "42 demo clinics monitored",
        "17 offline syncs reconciled",
        "3 min freshness target",
      ],
    },
  },
  {
    title: "Patient rerouting",
    description:
      "Unavailable clinic context is paired with a compatible alternative so patients avoid wasted trips.",
    icon: "navigation",
    miniature: {
      type: "patient-reroute",
      label: "Public route",
      badge: "ready",
      rows: [
        "From Mamelodi East",
        "To Akasia Hills Clinic",
        "ARV pickup accepting now",
      ],
    },
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
    description:
      "Reports, syncs, alerts, reroutes, and exports stay traceable.",
  },
  {
    label: "Exports and API",
    value: "CSV + status endpoint",
    description: "Pilot teams can hand records to reporting and partner systems.",
  },
  {
    label: "Webhook readiness",
    value: "Preview delivery recorded",
    description:
      "Integration handoffs can be tested before production rollout.",
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
