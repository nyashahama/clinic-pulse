export type LandingMotionTone = "critical" | "warning" | "healthy" | "neutral";
export type LandingMotionStage = "report" | "status" | "route" | "audit" | "sync";

export type HeroSignalPacket = {
  id: string;
  label: string;
  detail: string;
  tone: LandingMotionTone;
  delay: string;
  x: string;
  y: string;
};

export type HeroMapPulse = {
  id: string;
  label: string;
  tone: LandingMotionTone;
  x: number;
  y: number;
  active?: boolean;
};

export type OperationsTickerEvent = {
  id: string;
  label: string;
  detail: string;
  stage: LandingMotionStage;
  tone: LandingMotionTone;
};

export const heroSignalPackets: HeroSignalPacket[] = [
  { id: "packet-field-source", label: "Field source", detail: "offline sync", tone: "warning", delay: "0s", x: "9%", y: "24%" },
  { id: "packet-arv-service", label: "ARV pickup", detail: "service affected", tone: "critical", delay: "0.8s", x: "17%", y: "66%" },
  { id: "packet-freshness", label: "Freshness", detail: "2 min ago", tone: "healthy", delay: "1.4s", x: "42%", y: "18%" },
  { id: "packet-route", label: "Reroute", detail: "Akasia Hills", tone: "healthy", delay: "2.1s", x: "72%", y: "35%" },
  { id: "packet-audit", label: "Audit", detail: "record sealed", tone: "neutral", delay: "2.7s", x: "58%", y: "78%" },
  { id: "packet-public", label: "Public finder", detail: "patient warned", tone: "healthy", delay: "3.2s", x: "84%", y: "61%" },
];

export const heroMapPulses: HeroMapPulse[] = [
  { id: "map-mamelodi", label: "Mamelodi East", tone: "critical", x: 36, y: 58, active: true },
  { id: "map-akasia", label: "Akasia Hills", tone: "healthy", x: 70, y: 60 },
  { id: "map-soshanguve", label: "Soshanguve", tone: "warning", x: 61, y: 24 },
  { id: "map-tshwane-north", label: "Tshwane North", tone: "healthy", x: 48, y: 32 },
];

export const operationsTickerEvents: OperationsTickerEvent[] = [
  { id: "event-report-queued", label: "Offline report queued", detail: "Mamelodi East / ARV pickup", stage: "report", tone: "warning" },
  { id: "event-sync-started", label: "Sync started", detail: "field source preserved", stage: "sync", tone: "neutral" },
  { id: "event-status-change", label: "Status changed", detail: "operational to non-functional", stage: "status", tone: "critical" },
  { id: "event-console-alert", label: "District alert opened", detail: "freshness verified", stage: "status", tone: "critical" },
  { id: "event-route-ready", label: "Route ready", detail: "Akasia Hills accepting", stage: "route", tone: "healthy" },
  { id: "event-public-warning", label: "Patient warned", detail: "18 min wasted travel avoided", stage: "route", tone: "healthy" },
  { id: "event-audit-source", label: "Source attached", detail: "offline field report", stage: "audit", tone: "neutral" },
  { id: "event-audit-sealed", label: "Audit sealed", detail: "AUD-2026-0504-017", stage: "audit", tone: "healthy" },
];

export const auditSealEvents: OperationsTickerEvent[] = [
  { id: "seal-source", label: "Source", detail: "Offline field report", stage: "audit", tone: "neutral" },
  { id: "seal-freshness", label: "Freshness", detail: "Fresh - 2 min ago", stage: "audit", tone: "healthy" },
  { id: "seal-route", label: "Route", detail: "Akasia Hills Clinic", stage: "route", tone: "healthy" },
  { id: "seal-export", label: "Export", detail: "CSV ready", stage: "sync", tone: "neutral" },
  { id: "seal-api", label: "API", detail: "200 OK", stage: "sync", tone: "healthy" },
];
