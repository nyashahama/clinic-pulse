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

export type LandingMotionEvent = {
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

export const auditSealEvents: LandingMotionEvent[] = [
  { id: "seal-source", label: "Source", detail: "Offline field report", stage: "audit", tone: "neutral" },
  { id: "seal-freshness", label: "Freshness", detail: "Fresh - 2 min ago", stage: "audit", tone: "healthy" },
  { id: "seal-route", label: "Route", detail: "Akasia Hills Clinic", stage: "route", tone: "healthy" },
  { id: "seal-export", label: "Export", detail: "CSV ready", stage: "sync", tone: "neutral" },
  { id: "seal-api", label: "API", detail: "200 OK", stage: "sync", tone: "healthy" },
];
