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
  source: "Offline field report",
  service: "ARV pickup",
  reason: "Pharmacy stockout",
  age: "Fresh - 2 min ago",
  recommendedRoute: "Akasia Hills Clinic",
  routeDetail: "18 min wasted travel avoided / best nearby compatible",
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
    title: "Wasted trip avoided",
    description:
      "The public finder warns the patient before travel and recommends the best nearby compatible clinic.",
    detail: "18 min avoided wasted travel",
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
    title: "Wasted trip avoided",
    detail: "Akasia Hills Clinic is best nearby compatible for ARV pickup",
    state: "18 min avoided",
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
      "Unavailable clinic context is paired with a best nearby compatible alternative so patients avoid wasted trips.",
    icon: "navigation",
    miniature: {
      type: "patient-reroute",
      label: "Public route",
      badge: "ready",
      rows: [
        "Impact: 18 min avoided",
        "Clinic: Best nearby compatible",
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
    { label: "Impact", value: "18 min avoided", tone: "healthy" },
    { label: "Clinic", value: "Best nearby compatible", tone: "healthy" },
    { label: "Service", value: "ARV pickup accepting", tone: "healthy" },
  ],
  "audit-ledger": [
    { label: "Source", value: "Offline field report", tone: "neutral" },
    { label: "Status change", value: "Operational to non-functional", tone: "critical" },
    { label: "Reroute", value: "Akasia Hills Clinic", tone: "healthy" },
    { label: "Export", value: "CSV ready", tone: "neutral" },
    { label: "API status", value: "200 OK", tone: "healthy" },
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

export const liveIncidentHero = {
  eyebrow: "Live clinic operations",
  title: "Know which clinics can help before patients travel.",
  description:
    "Clinic Pulse turns field reports, clinic availability, patient rerouting, and audit-ready records into one live operating view for district teams.",
  primaryCta: { label: "Book demo", href: "/?booking=1" },
  secondaryCta: { label: "Watch the incident flow", href: "#flow" },
  metrics: [
    { value: "42", label: "demo clinics monitored", detail: "Tshwane North workspace" },
    { value: "17", label: "reports synced", detail: "field updates since 07:00" },
    { value: "3m", label: "freshness target", detail: "median status age" },
  ],
  incident: {
    clinic: "Mamelodi East Community Clinic",
    status: "Non-functional",
    service: "ARV pickup",
    source: "Offline field report",
    reason: "Pharmacy stockout reported by field worker",
    freshness: "Fresh - 2 min ago",
    recommendedRoute: "Akasia Hills Clinic",
    routeDetail: "18 min wasted travel avoided",
    auditId: "AUD-2026-0504-017",
  },
} as const;

export const stakeholderImpactItems = [
  {
    role: "District team",
    outcome: "Acts on source, reason, and freshness before making a public routing decision.",
    signal: "Live district view",
    photo: "clinicTeam",
  },
  {
    role: "Field worker",
    outcome: "Submits the service update even when the report has to queue offline.",
    signal: "Queued field report",
    photo: "fieldWorker",
  },
  {
    role: "Clinic coordinator",
    outcome: "Confirms the service impact without losing the original source record.",
    signal: "Traceable status change",
    photo: "clinicExterior",
  },
  {
    role: "Patient",
    outcome: "Sees the safer nearby route before spending time travelling to a blocked service.",
    signal: "18 min avoided",
    photo: "patientCare",
  },
] as const;

export const statusGapTimeline = [
  {
    label: "08:07",
    title: "Service pressure starts locally",
    detail: "ARV pickup stock pressure is known at the clinic before the district view changes.",
    tone: "warning",
  },
  {
    label: "08:11",
    title: "Field report queues offline",
    detail: "A weak-signal report keeps the source and notes until connectivity returns.",
    tone: "neutral",
  },
  {
    label: "08:13",
    title: "Stale public data creates risk",
    detail: "Patients can still see the clinic as available unless freshness is visible.",
    tone: "critical",
  },
  {
    label: "08:15",
    title: "ClinicPulse updates the operating record",
    detail: "The district console, public finder, and audit ledger receive the same incident state.",
    tone: "healthy",
  },
] as const;

export const incidentFlowSteps = [
  {
    step: "01",
    surface: "Field report",
    title: "Offline report queued",
    detail: "Mamelodi East / ARV pickup / pharmacy stockout",
    state: "Queued offline",
    tone: "warning",
  },
  {
    step: "02",
    surface: "District alert",
    title: "Clinic status changed",
    detail: "Operational to non-functional from field source",
    state: "Fresh - 2 min ago",
    tone: "critical",
  },
  {
    step: "03",
    surface: "Public finder",
    title: "Wasted trip avoided",
    detail: "Akasia Hills Clinic is best nearby compatible for ARV pickup",
    state: "18 min avoided",
    tone: "healthy",
  },
  {
    step: "04",
    surface: "Audit ledger",
    title: "Operating record sealed",
    detail: "Source, sync, status change, and reroute linked",
    state: "AUD-2026-0504-017",
    tone: "neutral",
  },
] as const;

export const productOperationsModules = [
  {
    title: "District command center",
    description:
      "See service availability, field source, freshness, and routing action in one operating view.",
    metric: "42 clinics monitored",
    type: "district-console",
  },
  {
    title: "Offline field reports",
    description:
      "Capture service pressure and notes in weak-signal environments, then sync with source intact.",
    metric: "3 reports queued",
    type: "field-report",
  },
  {
    title: "Patient rerouting",
    description:
      "Warn patients before a wasted trip and recommend the best nearby compatible clinic.",
    metric: "18 min avoided",
    type: "patient-reroute",
  },
  {
    title: "Audit and export readiness",
    description:
      "Keep the source, status change, reroute, export, and API evidence attached to the decision.",
    metric: "5 events linked",
    type: "audit-ledger",
  },
] as const;

export const trustEvidencePanels = [
  {
    title: "Source and permissions",
    label: "field_worker / district_manager",
    lines: ["actor=field_worker", "permission=publish_status", "source=offline_sync"],
  },
  {
    title: "Freshness and audit",
    label: "AUD-2026-0504-017",
    lines: ["status=non_functional", "freshness=2m", "route=Akasia Hills Clinic"],
  },
  {
    title: "Offline queue",
    label: "3 reports queued",
    lines: ["queue=offline_reports", "sync=when_signal_returns", "source_notes=preserved"],
  },
  {
    title: "District export",
    label: "CSV ready",
    lines: ["report=incident_summary", "district=Tshwane North Demo", "rows=42 clinics"],
  },
  {
    title: "API/status endpoint",
    label: "200 OK",
    lines: ["GET /v1/clinics/mamelodi-east/status", "payload=status_incident", "freshness=2m"],
  },
  {
    title: "Webhook preview",
    label: "partner handoff",
    lines: ["webhook=preview_sent", "recipient=partner_app", "retry=false"],
  },
] as const;

export const incidentDemoCta = {
  eyebrow: "Pilot walkthrough",
  title: "Walk through a live clinic status incident.",
  description:
    "Follow the same incident through district visibility, offline field reporting, patient rerouting, audit history, exports, and partner readiness.",
  primaryCta: { label: "Book demo", href: "/?booking=1" },
  secondaryCta: { label: "Sign in to demo workspace", href: "/login" },
  note: "Demo data is seeded to show the operating model clearly.",
} as const;
