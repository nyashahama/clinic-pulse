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

export const heroConsoleNavItems = [
  { label: "District console", status: "active" },
  { label: "Field reports", status: "3 queued" },
  { label: "Public finder", status: "live" },
  { label: "Audit trail", status: "recording" },
] as const;

export const heroConsoleMetrics = [
  { label: "Clinics monitored", value: "42", detail: "Tshwane North demo" },
  { label: "Reports synced", value: "17", detail: "since 07:00" },
  { label: "Freshness target", value: "3m", detail: "median status age" },
] as const;

export const heroIncident = {
  clinic: "Mamelodi East Community Clinic",
  status: "Non-functional",
  source: "Field worker report",
  service: "ARV pickup",
  reason: "Pharmacy stockout",
  age: "Fresh - 2 min ago",
  recommendedRoute: "Akasia Hills Clinic",
  routeDetail: "8.4 km away / ARV pickup accepting",
  auditId: "AUD-2026-0504-017",
} as const;

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

export const workflowIncidentStages = [
  {
    surface: "Field report",
    title: "Offline report queued",
    detail: "Mamelodi East / ARV pickup / pharmacy stockout",
    state: "Queued locally",
    tone: "warning",
  },
  {
    surface: "District alert",
    title: "Clinic status changed",
    detail: "Operational -> non-functional from field source",
    state: "Fresh - 2 min ago",
    tone: "critical",
  },
  {
    surface: "Public finder",
    title: "Patient reroute prepared",
    detail: "Akasia Hills Clinic can accept ARV pickup",
    state: "Route ready",
    tone: "healthy",
  },
  {
    surface: "Audit ledger",
    title: "Operating record sealed",
    detail: "Source, sync, status change, and reroute linked",
    state: "AUD-2026-0504-017",
    tone: "neutral",
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
        "Clinic: Mamelodi East",
        "Service: ARV pickup",
        "Stock pressure: Pharmacy stockout",
        "Sync state: Queued offline",
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
        "Status: Non-functional",
        "Source: Field worker",
        "Freshness: 2 min ago",
        "Action: Open alert",
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
        "Nearest compatible: Akasia Hills",
        "Distance: 8.4 km",
        "Service: ARV pickup accepting",
      ],
    },
  },
] as const;

export const productSurfacePreviewRows = {
  "field-report": [
    { label: "Clinic", value: "Mamelodi East", tone: "neutral" },
    { label: "Service", value: "ARV pickup", tone: "neutral" },
    { label: "Stock pressure", value: "Pharmacy stockout", tone: "critical" },
    { label: "Sync state", value: "Queued offline", tone: "warning" },
  ],
  "district-console": [
    { label: "Status", value: "Non-functional", tone: "critical" },
    { label: "Source", value: "Field worker", tone: "neutral" },
    { label: "Freshness", value: "2 min ago", tone: "healthy" },
    { label: "Action", value: "Open alert", tone: "neutral" },
  ],
  "patient-reroute": [
    { label: "Nearest compatible", value: "Akasia Hills", tone: "healthy" },
    { label: "Distance", value: "8.4 km", tone: "neutral" },
    { label: "Service", value: "ARV pickup accepting", tone: "healthy" },
  ],
} as const;

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

export const trustSystemPanels = [
  {
    title: "Audit event",
    label: "AUD-2026-0504-017",
    lines: [
      "actor=field_worker",
      "source=offline_sync",
      "status=non_functional",
      "route=Akasia Hills Clinic",
    ],
  },
  {
    title: "District export",
    label: "CSV ready",
    lines: [
      "report=incident_summary",
      "district=Tshwane North Demo",
      "freshness_window=3m",
      "rows=42 clinics",
    ],
  },
  {
    title: "API response",
    label: "200 OK",
    lines: [
      "GET /v1/clinics/mamelodi-east/status",
      "status: non_functional",
      "source: field_worker",
      "updatedAgo: 2m",
    ],
  },
  {
    title: "Webhook delivery",
    label: "Preview sent",
    lines: [
      "destination=partner-readiness",
      "attempt=1",
      "latency=184ms",
      "retry=false",
    ],
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
