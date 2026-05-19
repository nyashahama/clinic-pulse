export const DISTRICT_OPERATIONS_PROVINCE = "Gauteng";
export const DISTRICT_OPERATIONS_DISTRICT = "Tshwane North District";

export const PRODUCT_LANGUAGE_BAN_LIST = [
  "Live demo",
  "Demo District",
  "demo workspace",
  "demo environment",
  "No-login public flow",
  "Book founder walkthrough",
  "Demo data is seeded",
  "Tshwane North Demo",
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
} as const;
