export const heroIncident = {
  eyebrow: "Demo workspace",
  headline: "Live clinic availability for districts that cannot afford blind spots.",
  subhead:
    "ClinicPulse shows which clinics can serve patients right now, verifies report freshness, and reroutes patients before wasted trips happen.",
  primaryCta: "Book Demo",
  secondaryCta: "See Product Flow",
  proofLabel: "Demo data shown for YC walkthrough",
  clinic: "Mamelodi East Community Clinic",
  status: "Non-functional",
  reason: "Pharmacy stockout reported by field worker",
  freshness: "Fresh - 2 min ago",
  source: "Field report - S. Ndaba",
  recommendation: "Reroute primary care to Akasia Hills Clinic",
  audit: "Status changed after offline sync",
} as const;

export const proofMetrics = [
  {
    value: "42",
    label: "demo clinics monitored",
    note: "seeded district workspace",
  },
  {
    value: "3",
    label: "districts modeled",
    note: "Gauteng demo scenario",
  },
  {
    value: "128",
    label: "seeded reports processed",
    note: "field and coordinator events",
  },
  {
    value: "17",
    label: "offline reports queued / synced",
    note: "simulated weak-network flow",
  },
  {
    value: "3 min",
    label: "simulated update latency",
    note: "demo timing target",
  },
] as const;

export const problemContrast = {
  today: [
    "Patients travel before knowing if a clinic can serve them.",
    "District teams rely on calls, reports, and fragmented messages.",
    "Reporting systems capture data after the operational moment has passed.",
    "Stale data looks as confident as fresh data.",
  ],
  clinicPulse: [
    "Clinic availability is visible by status, reason, source, and freshness.",
    "Field reports update the district console.",
    "Routing recommendations point patients to operational alternatives.",
    "Every status change is auditable.",
  ],
} as const;

export const productFlowSteps = [
  {
    step: "01",
    title: "Field report submitted",
    description:
      "A field worker records clinic status, stock, staff, queue, and notes.",
    artifactTitle: "Mobile report",
    artifactDetail: "5 fields - queued offline",
  },
  {
    step: "02",
    title: "Status changes",
    description:
    "Mamelodi East Community Clinic moves from operational to non-functional because pharmacy stock is unavailable.",
    artifactTitle: "Status update",
    artifactDetail: "Non-functional - pharmacy stockout",
  },
  {
    step: "03",
    title: "District console updates",
    description:
      "The district view refreshes with source, reason, freshness, and active alert context.",
    artifactTitle: "District console",
    artifactDetail: "Fresh - 2 min ago",
  },
  {
    step: "04",
    title: "Patient is rerouted",
    description:
      "ClinicPulse recommends the closest operational clinic that can handle the needed service.",
    artifactTitle: "Routing decision",
    artifactDetail: "Send to Akasia Hills Clinic",
  },
  {
    step: "05",
    title: "Audit event recorded",
    description:
      "The system keeps a traceable record of who reported, when it synced, and what changed.",
    artifactTitle: "Audit trail",
    artifactDetail: "S. Ndaba - synced 14:32",
  },
] as const;

export const routingMoment = {
  before: "Patient would travel to Mamelodi East Community Clinic.",
  incident: "Mamelodi East Community Clinic is non-functional because pharmacy stock is unavailable.",
  recommendation: "Send patient to Akasia Hills Clinic.",
  reasons: [
    "Service compatible: primary care supported",
    "Operational status fresh - 4 min ago",
    "Estimated travel: 18 min",
    "Queue pressure: moderate",
  ],
} as const;

export const trustArtifacts = [
  {
    label: "Freshness",
    value: "Fresh - 2 min ago",
    detail: "Every status carries confidence context.",
  },
  {
    label: "Offline queue",
    value: "3 reports queued",
    detail: "Offline is a supported mode, not an error state.",
  },
  {
    label: "Source",
    value: "Field report - S. Ndaba",
    detail: "Teams can see where status changes came from.",
  },
  {
    label: "Audit",
    value: "Status changed - 14:32",
    detail: "The operating record explains what happened.",
  },
] as const;

export const roadmapModules = [
  "DHIS2 reconciliation: roadmap",
  "WhatsApp/SMS reporting: roadmap",
  "Stockout forecasting: roadmap",
  "NHI readiness scoring: roadmap",
] as const;
