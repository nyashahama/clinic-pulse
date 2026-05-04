import type { SyncSummaryApiResponse } from "@/lib/demo/api-types";

export type PilotReadinessSeverity = "clear" | "watch" | "attention";

export type PilotReadinessMetric = {
  label: string;
  value: string;
  tone: PilotReadinessSeverity | "info";
};

export type PilotReadinessModel = {
  severity: PilotReadinessSeverity;
  title: string;
  description: string;
  windowLabel: string;
  metrics: PilotReadinessMetric[];
};

export function createEmptySyncSummary(
  windowStartedAt = new Date().toISOString(),
): SyncSummaryApiResponse {
  return {
    windowStartedAt,
    offlineReportsReceived: 0,
    duplicateSyncsHandled: 0,
    conflictsNeedingAttention: 0,
    validationFailures: 0,
    pendingOfflineReports: 0,
    needsConfirmationClinics: 0,
    staleClinics: 0,
    medianCurrentStatusAgeHours: null,
  };
}

export function getPilotReadinessSeverity(summary: SyncSummaryApiResponse) {
  if (summary.conflictsNeedingAttention > 0 || summary.staleClinics > 0) {
    return "attention" as const;
  }
  if (summary.validationFailures > 0 || summary.needsConfirmationClinics > 0) {
    return "watch" as const;
  }
  return "clear" as const;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-ZA").format(value);
}

export function formatMedianStatusAge(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "n/a";
  }

  if (value < 1) {
    return "<1h";
  }

  return `${Math.round(value)}h`;
}

function formatWindowStartedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Window unavailable";
  }

  return `Since ${new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)}`;
}

function getMetricTone(
  key: keyof Pick<
    SyncSummaryApiResponse,
    | "conflictsNeedingAttention"
    | "validationFailures"
    | "needsConfirmationClinics"
    | "staleClinics"
  >,
  value: number,
): PilotReadinessMetric["tone"] {
  if (value === 0) {
    return "clear";
  }

  if (key === "conflictsNeedingAttention" || key === "staleClinics") {
    return "attention";
  }

  return "watch";
}

export function buildPilotReadinessModel(
  summary: SyncSummaryApiResponse,
): PilotReadinessModel {
  const severity = getPilotReadinessSeverity(summary);
  const statusCopy = {
    clear: {
      title: "Pilot readiness clear",
      description: "Offline sync and status freshness are within operating thresholds.",
    },
    watch: {
      title: "Pilot readiness watch",
      description: "Review validation failures or clinics that need confirmation before handoff.",
    },
    attention: {
      title: "Operator attention needed",
      description: "Resolve conflicts or stale clinic status before relying on pilot routing data.",
    },
  } satisfies Record<PilotReadinessSeverity, { title: string; description: string }>;

  return {
    severity,
    title: statusCopy[severity].title,
    description: statusCopy[severity].description,
    windowLabel: formatWindowStartedAt(summary.windowStartedAt),
    metrics: [
      {
        label: "Offline reports received",
        value: formatCount(summary.offlineReportsReceived),
        tone: "info",
      },
      {
        label: "Duplicates handled",
        value: formatCount(summary.duplicateSyncsHandled),
        tone: "info",
      },
      {
        label: "Conflicts",
        value: formatCount(summary.conflictsNeedingAttention),
        tone: getMetricTone("conflictsNeedingAttention", summary.conflictsNeedingAttention),
      },
      {
        label: "Validation failures",
        value: formatCount(summary.validationFailures),
        tone: getMetricTone("validationFailures", summary.validationFailures),
      },
      {
        label: "Offline reports pending review",
        value: formatCount(summary.pendingOfflineReports),
        tone: summary.pendingOfflineReports > 0 ? "watch" : "clear",
      },
      {
        label: "Needs confirmation",
        value: formatCount(summary.needsConfirmationClinics),
        tone: getMetricTone("needsConfirmationClinics", summary.needsConfirmationClinics),
      },
      {
        label: "Stale clinics",
        value: formatCount(summary.staleClinics),
        tone: getMetricTone("staleClinics", summary.staleClinics),
      },
      {
        label: "Median status age",
        value: formatMedianStatusAge(summary.medianCurrentStatusAgeHours),
        tone: "info",
      },
    ],
  };
}
