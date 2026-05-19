export const DISTRICT_OPERATIONS_PROVINCE = "Gauteng";
export const DISTRICT_OPERATIONS_DISTRICT = "Tshwane North District";

export type OperationsIncidentLifecycleId =
  | "signal_received"
  | "district_triage"
  | "field_update"
  | "admin_review"
  | "monitoring";

export type OperationsIncidentStatus = "non_functional";
export type OperationsIncidentFreshness = "fresh";

export type OperationsIncidentScenario = {
  readonly sourceClinicId: string;
  readonly sourceClinicName: string;
  readonly affectedService: string;
  readonly affectedServices: readonly string[];
  readonly recommendedAlternativeId: string;
  readonly recommendedAlternativeName: string;
  readonly districtOwner: string;
  readonly fieldReporter: string;
  readonly adminReviewer: string;
  readonly status: OperationsIncidentStatus;
  readonly freshness: OperationsIncidentFreshness;
  readonly signalSummary: string;
  readonly fieldUpdateSummary: string;
  readonly adminReviewSummary: string;
  readonly monitoringSummary: string;
  readonly auditId: string;
  readonly lifecycle: readonly OperationsIncidentLifecycleId[];
};

export const PRODUCT_LANGUAGE_BAN_LIST = [
  "Live demo",
  "Demo District",
  "demo workspace",
  "demo environment",
  "No-login public flow",
  "Book founder walkthrough",
  "Demo data is seeded",
  "Tshwane North Demo",
  "Demo controls",
  "Controlled demo reset",
  "Add seeded scenario presets for demos",
  "Demo tenant estate",
  "demo-seeded",
  "Reset demo",
  "Demo actions",
  "mock state",
  "Reset walkthrough data",
  "YC demo-critical",
  "demo booking intake",
  "Mock partner API surface",
  "founder demo",
  "founder demos",
  "demo endpoints",
  "demo API docs",
  "demo_token",
  "Quick actions for the founder-led demo flow",
  "Clear local demo changes",
  "Demo reset",
  "Demo lead event",
  "Demo export payload",
  "Demo data",
  "Seeded demo data",
  "demo organisation",
  "The demo has",
  "demo replay state",
  "founder pitch",
  "Demo leads",
  "demo booking submissions",
  "demo requests",
  "Founder package",
  "founder pipeline",
  "YC-ready",
  "current demo state",
  "Demo partner integration",
  "Demo partner webhook",
  "Refresh the demo surface",
] as const;

export const OPERATIONS_INCIDENT = {
  sourceClinicId: "clinic-mabopane-station",
  sourceClinicName: "Mabopane Station Clinic",
  affectedService: "Pharmacy",
  affectedServices: ["Pharmacy", "Chronic care pickups", "Immunization"],
  recommendedAlternativeId: "clinic-akasia-hills",
  recommendedAlternativeName: "Akasia Hills Clinic",
  districtOwner: "Tshwane North operations desk",
  fieldReporter: "Mpho Ndlovu",
  adminReviewer: "Organisation Admin",
  status: "non_functional",
  freshness: "fresh",
  signalSummary: "Generator failure paused dispensing and chronic care pickup services.",
  fieldUpdateSummary:
    "Field reporter confirmed the outage, queued a status update, and routed patients to Akasia Hills Clinic.",
  adminReviewSummary:
    "Admin review is waiting on the field report and partner export evidence before the incident moves to monitoring.",
  monitoringSummary:
    "Patients are routed to Akasia Hills Clinic while Mabopane Station remains under district monitoring.",
  auditId: "AUD-OPS-MAB-001",
  lifecycle: [
    "signal_received",
    "district_triage",
    "field_update",
    "admin_review",
    "monitoring",
  ],
} as const satisfies OperationsIncidentScenario;
