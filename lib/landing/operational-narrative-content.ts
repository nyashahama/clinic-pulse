export type IncidentStageId =
  | "field-report"
  | "district-response"
  | "patient-route"
  | "audit-record";

export type IncidentTone = "neutral" | "healthy" | "warning" | "critical";

export type ProductSurfaceId =
  | "district-console"
  | "field-report"
  | "public-routing"
  | "audit-record";

export type ClinicPoint = {
  id: string;
  name: string;
  shortName: string;
  x: number;
  y: number;
  statusLabel: string;
  tone: IncidentTone;
  serviceNote: string;
};

export type IncidentEvent = {
  label: string;
  value: string;
  tone: IncidentTone;
};

export type IncidentStage = {
  id: IncidentStageId;
  step: string;
  time: string;
  eyebrow: string;
  title: string;
  summary: string;
  statusLabel: string;
  tone: IncidentTone;
  routeState: "pending" | "evaluating" | "confirmed" | "recorded";
  events: readonly IncidentEvent[];
};

export type ProductSurface = {
  id: ProductSurfaceId;
  label: string;
  role: string;
  title: string;
  description: string;
  stageId: IncidentStageId;
  capabilities: readonly string[];
};

type OperationalNarrative = {
  disclosure: string;
  district: string;
  navigation: readonly {
    label: string;
    href: string;
  }[];
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    proofLines: readonly {
      label: string;
      detail: string;
    }[];
  };
  incident: {
    affectedClinicId: string;
    service: string;
    cause: string;
    source: string;
    reporter: string;
    auditId: string;
  };
  clinics: readonly ClinicPoint[];
  route: {
    fromClinicId: string;
    toClinicId: string;
    estimate: string;
    statusLabel: string;
    serviceNote: string;
  };
  signalRail: readonly {
    step: string;
    label: string;
    value: string;
    stageId: IncidentStageId;
  }[];
  narrative: {
    eyebrow: string;
    title: string;
    description: string;
  };
  stages: readonly IncidentStage[];
  ledger: {
    eyebrow: string;
    title: string;
    description: string;
    capabilities: readonly {
      label: string;
      value: string;
    }[];
  };
  product: {
    eyebrow: string;
    title: string;
    description: string;
  };
  productSurfaces: readonly ProductSurface[];
  cta: {
    eyebrow: string;
    title: string;
    description: string;
    coverage: readonly string[];
    primaryCta: string;
    secondaryCta: string;
  };
};

export const operationalNarrative = {
  disclosure: "Illustrative operating scenario using seeded product data.",
  district: "Tshwane North",
  navigation: [
    { label: "How it works", href: "#how-it-works" },
    { label: "Product surfaces", href: "#product-surfaces" },
    { label: "Trust and evidence", href: "#trust-and-evidence" },
  ],
  hero: {
    eyebrow: "District clinic operations",
    title: "Know which clinics can serve patients now.",
    description:
      "Clinic Pulse connects field reports, district response, patient routing, and the record behind every status change.",
    primaryCta: "Book a walkthrough",
    secondaryCta: "Follow the incident",
    proofLines: [
      {
        label: "Source + freshness",
        detail: "Every status keeps its reporter and time attached.",
      },
      {
        label: "Offline-ready",
        detail: "Weak signal becomes a visible queue, not a lost report.",
      },
      {
        label: "Traceable routing",
        detail: "The alternative clinic and decision remain linked.",
      },
    ],
  },
  incident: {
    affectedClinicId: "mabopane-station",
    service: "Pharmacy services",
    cause: "Generator failure paused dispensing and chronic-care pickup.",
    source: "Offline field report",
    reporter: "Field worker / North West team",
    auditId: "AUD-OPS-MAB-001",
  },
  clinics: [
    {
      id: "mabopane-station",
      name: "Mabopane Station Clinic",
      shortName: "Mabopane",
      x: 31,
      y: 66,
      statusLabel: "Non-functional",
      tone: "critical",
      serviceNote: "Pharmacy services unavailable",
    },
    {
      id: "akasia-hills",
      name: "Akasia Hills Clinic",
      shortName: "Akasia Hills",
      x: 73,
      y: 35,
      statusLabel: "Compatible alternative",
      tone: "healthy",
      serviceNote: "Pharmacy accepting rerouted pickups",
    },
    {
      id: "soshanguve-block-f",
      name: "Soshanguve Block F Clinic",
      shortName: "Soshanguve F",
      x: 51,
      y: 25,
      statusLabel: "Degraded",
      tone: "warning",
      serviceNote: "Longer pharmacy wait expected",
    },
    {
      id: "ga-rankuwa-view",
      name: "Ga-Rankuwa View Clinic",
      shortName: "Ga-Rankuwa",
      x: 18,
      y: 31,
      statusLabel: "Operational",
      tone: "healthy",
      serviceNote: "General services available",
    },
  ],
  route: {
    fromClinicId: "mabopane-station",
    toClinicId: "akasia-hills",
    estimate: "18 min estimated drive",
    statusLabel: "Compatible alternative",
    serviceNote: "Pharmacy accepting rerouted pickups",
  },
  signalRail: [
    {
      step: "01",
      label: "Field signal",
      value: "Report queued offline",
      stageId: "field-report",
    },
    {
      step: "02",
      label: "District view",
      value: "Source and age attached",
      stageId: "district-response",
    },
    {
      step: "03",
      label: "Patient route",
      value: "Compatible clinic identified",
      stageId: "patient-route",
    },
    {
      step: "04",
      label: "Evidence",
      value: "Decision record sealed",
      stageId: "audit-record",
    },
  ],
  narrative: {
    eyebrow: "One connected incident",
    title: "One clinic status change should update every decision that depends on it.",
    description:
      "Follow the same seeded report as it moves from a weak-signal field visit into district triage, public routing, and an accountable operating record.",
  },
  stages: [
    {
      id: "field-report",
      step: "01",
      time: "08:42",
      eyebrow: "Field signal",
      title: "Field report received",
      summary:
        "A field worker records the pharmacy disruption. Connectivity is weak, so the report keeps its source and notes while queued on the device.",
      statusLabel: "Queued offline",
      tone: "warning",
      routeState: "pending",
      events: [
        { label: "Clinic", value: "Mabopane Station Clinic", tone: "neutral" },
        { label: "Service", value: "Pharmacy services", tone: "neutral" },
        { label: "Cause", value: "Generator failure", tone: "critical" },
        { label: "Sync", value: "Queued offline, then synced", tone: "warning" },
      ],
    },
    {
      id: "district-response",
      step: "02",
      time: "08:44",
      eyebrow: "District response",
      title: "District response formed",
      summary:
        "The district view changes the clinic from operational to non-functional while preserving the original report, affected service, and review context.",
      statusLabel: "Non-functional",
      tone: "critical",
      routeState: "evaluating",
      events: [
        { label: "Status", value: "Operational → Non-functional", tone: "critical" },
        { label: "Source", value: "Offline field report", tone: "neutral" },
        { label: "Reporter", value: "Field worker / North West team", tone: "neutral" },
        { label: "Review", value: "Coordinator triage opened", tone: "warning" },
      ],
    },
    {
      id: "patient-route",
      step: "03",
      time: "08:46",
      eyebrow: "Patient routing",
      title: "Patient route updated",
      summary:
        "The unavailable pharmacy stays visible beside a compatible alternative, giving coordinators and patients the same reason and route context.",
      statusLabel: "Compatible alternative",
      tone: "healthy",
      routeState: "confirmed",
      events: [
        { label: "From", value: "Mabopane Station Clinic", tone: "critical" },
        { label: "To", value: "Akasia Hills Clinic", tone: "healthy" },
        { label: "Journey", value: "18 min estimated drive", tone: "neutral" },
        { label: "Service", value: "Pharmacy accepting rerouted pickups", tone: "healthy" },
      ],
    },
    {
      id: "audit-record",
      step: "04",
      time: "08:47",
      eyebrow: "Operating evidence",
      title: "Operating record sealed",
      summary:
        "The report, sync event, status change, district review, and routing recommendation resolve into one record that can be reviewed or exported.",
      statusLabel: "Record sealed",
      tone: "neutral",
      routeState: "recorded",
      events: [
        { label: "Record", value: "AUD-OPS-MAB-001", tone: "neutral" },
        { label: "Events", value: "Four linked operating events", tone: "neutral" },
        { label: "Review", value: "District coordinator recorded", tone: "healthy" },
        { label: "Route", value: "Akasia Hills Clinic", tone: "healthy" },
      ],
    },
  ],
  ledger: {
    eyebrow: "Trust and evidence",
    title: "The decision is only as useful as the record behind it.",
    description:
      "Clinic Pulse keeps the source, sync path, status change, district review, and routing recommendation together for operational review.",
    capabilities: [
      { label: "Export", value: "CSV export available" },
      { label: "API", value: "Status endpoint contract" },
      { label: "Partner", value: "Partner handoff preview" },
    ],
  },
  product: {
    eyebrow: "Product surfaces",
    title: "Inspect the surfaces behind the decision.",
    description:
      "Each role sees the same incident through the surface needed for its next action, without breaking the operating record into separate stories.",
  },
  productSurfaces: [
    {
      id: "district-console",
      label: "District console",
      role: "For district coordinators",
      title: "Review service status with source and freshness attached.",
      description:
        "The district view keeps the affected service, reporting source, status transition, and nearby capacity in one review surface.",
      stageId: "district-response",
      capabilities: [
        "Service-level status and reason",
        "Reporter and sync path",
        "Nearby clinic capacity context",
      ],
    },
    {
      id: "field-report",
      label: "Field report",
      role: "For field teams",
      title: "Capture the disruption even when signal is weak.",
      description:
        "A field report keeps the clinic, affected service, cause, reporter, and local queue state together until connectivity returns.",
      stageId: "field-report",
      capabilities: [
        "Queued offline, then synced",
        "Source notes preserved",
        "Explicit affected service",
      ],
    },
    {
      id: "public-routing",
      label: "Public routing",
      role: "For coordinators and patients",
      title: "Keep the unavailable service beside the compatible route.",
      description:
        "Routing presents the reason a clinic cannot help and the service compatibility of the alternative before travel.",
      stageId: "patient-route",
      capabilities: [
        "Unavailable service context",
        "Compatible alternative clinic",
        "Estimated journey clearly labeled",
      ],
    },
    {
      id: "audit-record",
      label: "Audit record",
      role: "For operational review",
      title: "Trace the decision from report to route.",
      description:
        "The final record links the field source, sync event, status transition, coordinator review, and patient-routing recommendation.",
      stageId: "audit-record",
      capabilities: [
        "AUD-OPS-MAB-001",
        "Chronological event chain",
        "Export and integration affordances",
      ],
    },
  ],
  cta: {
    eyebrow: "See the operating model",
    title: "Walk through one district incident from report to record.",
    description:
      "The session uses seeded product data to cover the full operational chain without presenting it as deployment activity.",
    coverage: [
      "Field reporting and offline queue",
      "District review and patient routing",
      "Audit record and handoff paths",
    ],
    primaryCta: "Book a walkthrough",
    secondaryCta: "Sign in",
  },
} as const satisfies OperationalNarrative;

export function getIncidentStage(stageId: IncidentStageId) {
  return operationalNarrative.stages.find((stage) => stage.id === stageId)!;
}

export function getClinicPoint(clinicId: string) {
  return operationalNarrative.clinics.find((clinic) => clinic.id === clinicId)!;
}
