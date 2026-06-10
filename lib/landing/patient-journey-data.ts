import type { LandingMotionTone } from "@/lib/landing/landing-motion-content";

export type PatientJourneyStepData = {
  step: number;
  moment: string;
  time: string;
  location: string;
  artifact: "finder-card" | "field-report" | "status-badge" | "impact-statement";
  tone: LandingMotionTone;
  headline: string;
  details: readonly string[];
  freshness: string;
  source?: string;
  metric?: string;
  metricLabel?: string;
};

export const patientJourneySteps = [
  {
    step: 1,
    moment: "Depart",
    time: "07:30",
    location: "Patient home",
    artifact: "finder-card",
    tone: "neutral",
    headline: "Mabopane Station Clinic",
    details: [
      "Pharmacy: Operational",
      "Chronic medication pickup scheduled",
    ],
    freshness: "3 days ago",
    source: "Finder (stale entry)",
  },
  {
    step: 2,
    moment: "Travel",
    time: "07:30–08:15",
    location: "In transit",
    artifact: "field-report",
    tone: "warning",
    headline: "Field report queued offline",
    details: [
      "Generator failure at Mabopane Station",
      "Pharmacy dispensing paused",
      "Chronic care pickups affected",
    ],
    freshness: "Queued for sync",
    source: "Field worker (offline)",
  },
  {
    step: 3,
    moment: "Arrive",
    time: "08:15",
    location: "Mabopane Station Clinic",
    artifact: "status-badge",
    tone: "critical",
    headline: "Non-functional",
    details: [
      "Pharmacy: Closed",
      "Reason: Generator failure",
    ],
    freshness: "2 min ago",
    source: "Field worker",
  },
  {
    step: 4,
    moment: "Discover",
    time: "08:15",
    location: "Pharmacy counter",
    artifact: "impact-statement",
    tone: "critical",
    headline: "No medication available",
    details: [
      "Chronic refill window: 30 days",
    ],
    freshness: "Now",
    metric: "90 min",
    metricLabel: "wasted round-trip",
  },
  {
    step: 5,
    moment: "Reroute",
    time: "08:16",
    location: "Akasia Hills Clinic",
    artifact: "finder-card",
    tone: "healthy",
    headline: "Akasia Hills Clinic",
    details: [
      "Pharmacy: Accepting rerouted pickups",
      "Chronic medication dispensing confirmed",
    ],
    freshness: "Now",
    source: "Finder (live)",
    metric: "18 min",
    metricLabel: "detour",
  },
] as const;
