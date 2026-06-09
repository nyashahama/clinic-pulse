import {
  Activity,
  CloudOff,
  Database,
  Route,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type FeatureVisual = "realtime-api" | "offline-sync" | "predict" | "reroute" | "audit";

export interface FeatureData {
  key: string;
  title: string;
  subtitle: string;
  description: string;
  iconKey: string;
  highlights: string[];
  visual: FeatureVisual;
  href: string;
  isMain?: boolean;
}

export const featuresData: FeatureData[] = [
  {
    key: "realtime-api",
    title: "Real-time API",
    subtitle: "Sub-100ms responses at any scale",
    description: "3,500+ clinics, 52 districts, one edge-cached API. Query any clinic's status in under 100ms.",
    iconKey: "activity",
    highlights: [
      "47ms avg response time",
      "Edge cached globally",
      "99.99% uptime SLA",
      "OpenAPI 3.1 spec",
    ],
    visual: "realtime-api",
    href: "/product/api",
    isMain: true,
  },
  {
    key: "offline-sync",
    title: "Offline-first",
    subtitle: "Works where the network doesn't",
    description: "Reports queue locally and sync when connectivity returns. Zero data loss, no double entries.",
    iconKey: "cloud-off",
    highlights: [
      "Auto-sync on reconnect",
      "5 MB local queue",
      "Conflict resolution",
      "IndexedDB storage",
    ],
    visual: "offline-sync",
    href: "/product/offline",
  },
  {
    key: "predict",
    title: "Predictive capacity",
    subtitle: "Know before they arrive",
    description: "Staff levels, stock data, and history predict which clinics will be overwhelmed. Route patients before the queue forms.",
    iconKey: "database",
    highlights: [
      "30-day rolling model",
      "Staff + stock signals",
      "87% accuracy",
      "Real-time forecasts",
    ],
    visual: "predict",
    href: "/product/predict",
  },
  {
    key: "reroute",
    title: "Automatic rerouting",
    subtitle: "Redirect before they travel",
    description: "When a clinic goes down, the system finds the nearest operational alternative and routes patients there automatically.",
    iconKey: "route",
    highlights: [
      "18 min avg trip saved",
      "Google Maps integration",
      "Real-time capacity",
      "Patient notifications",
    ],
    visual: "reroute",
    href: "/product/reroute",
  },
  {
    key: "audit",
    title: "Immutable audit trail",
    subtitle: "Every change accounted for",
    description: "Immutable history of every status change. Who reported it, when, what changed. Compliance and analysis, built in.",
    iconKey: "shield-check",
    highlights: [
      "SHA-256 chained",
      "Tamper-evident",
      "Export CSV/PDF",
      "POPIA compliant",
    ],
    visual: "audit",
    href: "/product/audit",
  },
];

const iconMap: Record<string, LucideIcon> = {
  activity: Activity,
  "cloud-off": CloudOff,
  database: Database,
  route: Route,
  "shield-check": ShieldCheck,
};

export function getIcon(key: string): LucideIcon {
  return iconMap[key] || Database;
}

export function getMainFeature(): FeatureData | undefined {
  return featuresData.find((f) => f.isMain);
}

export function getSecondaryFeatures(): FeatureData[] {
  return featuresData.filter((f) => !f.isMain);
}
