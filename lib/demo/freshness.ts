import type { Freshness } from "@/lib/demo/types";

const HOUR_IN_MS = 60 * 60 * 1000;

export function getFreshnessFromTimestamp(
  timestamp: string,
  now = new Date(),
): Freshness {
  const reportedAt = new Date(timestamp);
  const ageMs = now.getTime() - reportedAt.getTime();

  if (Number.isNaN(reportedAt.getTime())) {
    return "unknown";
  }

  if (ageMs <= 6 * HOUR_IN_MS) {
    return "fresh";
  }

  if (ageMs <= 24 * HOUR_IN_MS) {
    return "needs_confirmation";
  }

  if (ageMs > 24 * HOUR_IN_MS) {
    return "stale";
  }

  return "unknown";
}

export function getFreshnessLabel(freshness: Freshness): string {
  switch (freshness) {
    case "fresh":
      return "Fresh";
    case "needs_confirmation":
      return "Needs confirmation";
    case "stale":
      return "Stale";
    case "unknown":
    default:
      return "Unknown";
  }
}

export function getHoursSinceReport(timestamp: string, now = new Date()): number {
  return Math.max(
    0,
    Math.round((now.getTime() - new Date(timestamp).getTime()) / HOUR_IN_MS),
  );
}
