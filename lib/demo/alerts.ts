import type { Alert } from "@/lib/demo/types";

export const demoAlerts: Alert[] = [
  {
    id: "alert-001",
    clinicId: "clinic-mabopane-station",
    type: "clinic_down",
    severity: "critical",
    status: "open",
    recommendedAction: "Route dispensing and chronic care pickups to Akasia Hills Clinic immediately.",
    createdAt: "2026-05-01T06:13:00.000Z",
  },
  {
    id: "alert-002",
    clinicId: "clinic-ga-rankuwa-zone-1",
    type: "queue_overload",
    severity: "medium",
    status: "open",
    recommendedAction: "Deploy overflow triage support and confirm courier ETA before 08:30.",
    createdAt: "2026-05-01T06:00:00.000Z",
  },
  {
    id: "alert-003",
    clinicId: "clinic-hammanskraal-unit-d",
    type: "stockout",
    severity: "high",
    status: "acknowledged",
    recommendedAction: "Verify cold-chain repair and move maternal vaccines from district reserve stock.",
    createdAt: "2026-04-30T18:20:00.000Z",
  },
  {
    id: "alert-004",
    clinicId: "clinic-winterveldt-west",
    type: "stale_data",
    severity: "medium",
    status: "open",
    recommendedAction: "Dispatch field worker or phone the coordinator for a verified status update.",
    createdAt: "2026-04-30T04:00:00.000Z",
  },
  {
    id: "alert-005",
    clinicId: "clinic-atteridgeville-extension",
    type: "conflicting_reports",
    severity: "high",
    status: "open",
    recommendedAction: "Call the clinic coordinator and cross-check service availability before public routing.",
    createdAt: "2026-04-30T04:12:00.000Z",
  },
];
