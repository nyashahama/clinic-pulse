import type { ClientAuthSession } from "@/lib/auth/api";

export type DistrictCommandStatus =
  | "operational"
  | "degraded"
  | "non_functional"
  | "unknown";

export type DistrictCommandFreshness =
  | "fresh"
  | "stale"
  | "unknown"
  | "needs_confirmation";

export type DistrictCommandTrend = "improving" | "stable" | "worsening" | "unknown";

export type DistrictSeverityLabel = "critical" | "watch" | "attention" | "stable";

export type DistrictSeverityReasonCode =
  | "service_unavailable"
  | "service_degraded"
  | "stale_report"
  | "unknown_signal"
  | "needs_confirmation"
  | "active_alert"
  | "offline_backlog"
  | "no_alternative_capacity"
  | "limited_alternative_capacity"
  | "worsening_trend"
  | "operational_baseline";

export type DistrictCommandClinicInput = {
  id: string;
  name: string;
  district?: string | null;
  status: DistrictCommandStatus;
  freshness: DistrictCommandFreshness;
  services: string[];
  updatedAt?: string | null;
  hasActiveAlert: boolean;
  isInOfflineQueue: boolean;
  alternativeCount: number;
  recentTrend: DistrictCommandTrend;
};

export type DistrictSeverityScore = {
  score: number;
  severityLabel: DistrictSeverityLabel;
  reasonCodes: DistrictSeverityReasonCode[];
  patientImpact: string;
  recommendedAction: string;
  verificationNeed: string;
};

export type DistrictSeverityQueueItem = DistrictSeverityScore & {
  id: string;
  clinicId: string;
  clinicName: string;
  districtLabel: string;
  status: DistrictCommandStatus;
  freshness: DistrictCommandFreshness;
  services: string[];
  updatedAt?: string | null;
  availableAlternatives: number;
};

export type DistrictCommandCenterInput = {
  session: ClientAuthSession | null;
  clinics: DistrictCommandClinicInput[];
  activeAlertCount: number;
  offlineQueueCount: number;
  lastSyncAt: string | null;
  selectedClinicId: string | null;
};

export type DistrictCommandCenter = {
  brief: {
    operatorName: string;
    districtLabel: string;
    riskLabel: string;
    summary: string;
    immediateFocus: string;
    posture: "critical" | "active" | "watch" | "stable";
    lastSyncLabel: string;
  };
  queue: DistrictSeverityQueueItem[];
  selectedItem: DistrictSeverityQueueItem | null;
  intervention: {
    primaryAction: { label: string; description: string };
    secondaryActions: Array<{ label: string; description: string }>;
    expectedOutcome: string;
    verificationStep: string;
  };
  analytics: {
    statusMix: Record<DistrictSeverityLabel, number>;
    freshnessRiskCount: number;
    offlineQueueCount: number;
    activeAlertCount: number;
    topReasonCodes: Array<{ code: DistrictSeverityReasonCode; count: number }>;
  };
  handover: { title: string; items: string[] };
};

const STATUS_SCORE: Record<DistrictCommandStatus, number> = {
  non_functional: 45,
  degraded: 28,
  unknown: 18,
  operational: 0,
};

const FRESHNESS_SCORE: Record<DistrictCommandFreshness, number> = {
  stale: 18,
  unknown: 14,
  needs_confirmation: 10,
  fresh: 0,
};

const REASON_PRIORITY: DistrictSeverityReasonCode[] = [
  "service_unavailable",
  "service_degraded",
  "stale_report",
  "unknown_signal",
  "needs_confirmation",
  "active_alert",
  "offline_backlog",
  "no_alternative_capacity",
  "limited_alternative_capacity",
  "worsening_trend",
  "operational_baseline",
];

export function scoreDistrictSeverityItem(
  clinic: DistrictCommandClinicInput,
): DistrictSeverityScore {
  let score = STATUS_SCORE[clinic.status] + FRESHNESS_SCORE[clinic.freshness];
  const reasonCodes: DistrictSeverityReasonCode[] = [];

  if (clinic.status === "non_functional") {
    reasonCodes.push("service_unavailable");
  } else if (clinic.status === "degraded") {
    reasonCodes.push("service_degraded");
  } else if (clinic.status === "unknown") {
    reasonCodes.push("unknown_signal");
  }

  if (clinic.freshness === "stale") {
    reasonCodes.push("stale_report");
  } else if (clinic.freshness === "unknown") {
    reasonCodes.push("unknown_signal");
  } else if (clinic.freshness === "needs_confirmation") {
    reasonCodes.push("needs_confirmation");
  }

  if (clinic.hasActiveAlert) {
    score += 16;
    reasonCodes.push("active_alert");
  }

  if (clinic.isInOfflineQueue) {
    score += 10;
    reasonCodes.push("offline_backlog");
  }

  if (clinic.alternativeCount <= 0) {
    score += 12;
    reasonCodes.push("no_alternative_capacity");
  } else if (clinic.alternativeCount === 1) {
    score += 6;
    reasonCodes.push("limited_alternative_capacity");
  }

  if (clinic.recentTrend === "worsening") {
    score += 8;
    reasonCodes.push("worsening_trend");
  } else if (clinic.recentTrend === "unknown") {
    reasonCodes.push("unknown_signal");
  }

  const uniqueReasonCodes = dedupeReasonCodes(reasonCodes);

  if (score === 0 && uniqueReasonCodes.length === 0) {
    uniqueReasonCodes.push("operational_baseline");
  }

  const severityLabel = severityFromScore(score);

  return {
    score,
    severityLabel,
    reasonCodes: uniqueReasonCodes,
    patientImpact: buildPatientImpact(clinic, severityLabel, uniqueReasonCodes),
    recommendedAction: buildRecommendedAction(clinic, severityLabel, uniqueReasonCodes),
    verificationNeed: buildVerificationNeed(clinic, severityLabel, uniqueReasonCodes),
  };
}

export function buildDistrictCommandCenter(
  input: DistrictCommandCenterInput,
): DistrictCommandCenter {
  const queue = input.clinics
    .map(toQueueItem)
    .sort((left, right) => right.score - left.score || compareClinicNameAsc(left, right));

  const derivedOfflineQueueCount = input.clinics.filter((clinic) => clinic.isInOfflineQueue).length;
  const derivedActiveAlertCount = input.clinics.filter((clinic) => clinic.hasActiveAlert).length;

  const selectedItem =
    queue.find((item) => item.clinicId === input.selectedClinicId) ?? queue[0] ?? null;

  const statusMix = queue.reduce<Record<DistrictSeverityLabel, number>>(
    (mix, item) => {
      mix[item.severityLabel] += 1;
      return mix;
    },
    { critical: 0, watch: 0, attention: 0, stable: 0 },
  );

  return {
    brief: buildBrief(input, queue, selectedItem),
    queue,
    selectedItem,
    intervention: buildIntervention(selectedItem),
    analytics: {
      statusMix,
      freshnessRiskCount: queue.filter((item) => item.freshness !== "fresh").length,
      offlineQueueCount: derivedOfflineQueueCount,
      activeAlertCount: derivedActiveAlertCount,
      topReasonCodes: buildTopReasonCodes(queue),
    },
    handover: buildHandover(queue, selectedItem),
  };
}

function toQueueItem(clinic: DistrictCommandClinicInput): DistrictSeverityQueueItem {
  const score = scoreDistrictSeverityItem(clinic);

  return {
    ...score,
    id: `severity-${clinic.id}`,
    clinicId: clinic.id,
    clinicName: clinic.name,
    districtLabel: clinic.district?.trim() || "Unassigned district",
    status: clinic.status,
    freshness: clinic.freshness,
    services: [...clinic.services],
    updatedAt: clinic.updatedAt,
    availableAlternatives: Math.max(0, clinic.alternativeCount),
  };
}

function compareClinicNameAsc(
  left: DistrictSeverityQueueItem,
  right: DistrictSeverityQueueItem,
): number {
  const leftName = left.clinicName.trim().toLowerCase();
  const rightName = right.clinicName.trim().toLowerCase();

  if (leftName < rightName) return -1;
  if (leftName > rightName) return 1;
  if (left.clinicName < right.clinicName) return -1;
  if (left.clinicName > right.clinicName) return 1;
  return 0;
}

function severityFromScore(score: number): DistrictSeverityLabel {
  if (score >= 70) return "critical";
  if (score >= 45) return "watch";
  if (score >= 20) return "attention";
  return "stable";
}

function dedupeReasonCodes(
  reasonCodes: DistrictSeverityReasonCode[],
): DistrictSeverityReasonCode[] {
  const seen = new Set<DistrictSeverityReasonCode>();
  const result: DistrictSeverityReasonCode[] = [];

  for (const code of reasonCodes) {
    if (!seen.has(code)) {
      seen.add(code);
      result.push(code);
    }
  }

  return result;
}

function buildPatientImpact(
  clinic: DistrictCommandClinicInput,
  severityLabel: DistrictSeverityLabel,
  reasonCodes: DistrictSeverityReasonCode[],
): string {
  const serviceLabel = clinic.services.length > 0 ? clinic.services.join(", ") : "clinic services";

  if (reasonCodes.includes("operational_baseline")) {
    return `Service continuity is currently stable for ${serviceLabel}.`;
  }

  if (severityLabel === "critical") {
    return `Patients may lose access to ${serviceLabel} unless the district coordinates immediate support.`;
  }

  if (severityLabel === "watch") {
    return `Patients may face disruption to ${serviceLabel}; monitor capacity and escalation paths.`;
  }

  return `Patients have early risk signals for ${serviceLabel}; confirm whether service continuity is affected.`;
}

function buildRecommendedAction(
  clinic: DistrictCommandClinicInput,
  severityLabel: DistrictSeverityLabel,
  reasonCodes: DistrictSeverityReasonCode[],
): string {
  if (reasonCodes.includes("operational_baseline")) {
    return "Maintain routine monitoring and keep the clinic in the handover baseline.";
  }

  if (reasonCodes.includes("no_alternative_capacity")) {
    return "Open an intervention plan and identify diversion capacity before patient flow is redirected.";
  }

  if (severityLabel === "critical") {
    return "Open an intervention plan and assign district follow-up immediately.";
  }

  if (clinic.alternativeCount === 1) {
    return "Confirm the single available alternative and prepare a backup escalation path.";
  }

  return "Confirm the signal, update the clinic status, and keep the queue owner informed.";
}

function buildVerificationNeed(
  clinic: DistrictCommandClinicInput,
  severityLabel: DistrictSeverityLabel,
  reasonCodes: DistrictSeverityReasonCode[],
): string {
  if (reasonCodes.includes("operational_baseline")) {
    return "Verify again at the next scheduled district sync.";
  }

  if (reasonCodes.includes("stale_report") || reasonCodes.includes("needs_confirmation")) {
    return "Call the clinic to confirm current service status and update the report timestamp.";
  }

  if (severityLabel === "critical") {
    return "Confirm patient redirection, alert ownership, and next update time.";
  }

  return `Confirm whether ${clinic.name} still needs district attention.`;
}

function buildBrief(
  input: DistrictCommandCenterInput,
  queue: DistrictSeverityQueueItem[],
  selectedItem: DistrictSeverityQueueItem | null,
): DistrictCommandCenter["brief"] {
  const operatorName = input.session?.displayName ?? input.session?.name ?? "District operator";
  const districtLabel = input.session?.district ?? selectedItem?.districtLabel ?? "District command";
  const lastSyncLabel = input.lastSyncAt ? `Last sync ${input.lastSyncAt}` : "Last sync unavailable";

  if (queue.length === 0) {
    return {
      operatorName,
      districtLabel,
      riskLabel: "No clinic signal loaded",
      summary: "Load clinic signal to build the district command queue.",
      immediateFocus: "No immediate focus until clinic data is available.",
      posture: "stable",
      lastSyncLabel,
    };
  }

  const criticalCount = queue.filter((item) => item.severityLabel === "critical").length;
  const watchCount = queue.filter((item) => item.severityLabel === "watch").length;
  const activeAlertCount = queue.filter((item) => item.reasonCodes.includes("active_alert")).length;
  const riskLabel =
    criticalCount > 0
      ? `${criticalCount} critical clinic${criticalCount === 1 ? "" : "s"}`
      : watchCount > 0
        ? `${watchCount} clinic${watchCount === 1 ? "" : "s"} on watch`
        : "District signal stable";

  return {
    operatorName,
    districtLabel,
    riskLabel,
    summary: `${queue.length} clinic${queue.length === 1 ? "" : "s"} ranked for district triage.`,
    immediateFocus: selectedItem
      ? `${selectedItem.clinicName}: ${selectedItem.recommendedAction}`
      : "No clinic selected.",
    posture: criticalCount > 0 ? "critical" : watchCount > 0 ? "watch" : activeAlertCount > 0 ? "active" : "stable",
    lastSyncLabel,
  };
}

function buildIntervention(
  selectedItem: DistrictSeverityQueueItem | null,
): DistrictCommandCenter["intervention"] {
  if (!selectedItem) {
    return {
      primaryAction: {
        label: "Load district signal",
        description: "Import or sync clinic reports before opening an intervention.",
      },
      secondaryActions: [
        {
          label: "Check sync status",
          description: "Confirm whether reports are delayed before the next handover.",
        },
      ],
      expectedOutcome: "A populated command queue with a clear first clinic to assess.",
      verificationStep: "Confirm clinic signal has loaded successfully.",
    };
  }

  return {
    primaryAction: {
      label: "Open intervention plan",
      description: selectedItem.recommendedAction,
    },
    secondaryActions: [
      {
        label: "Verify clinic signal",
        description: selectedItem.verificationNeed,
      },
      {
        label: "Review alternatives",
        description: `${selectedItem.availableAlternatives} alternative clinic${
          selectedItem.availableAlternatives === 1 ? " is" : "s are"
        } currently available.`,
      },
    ],
    expectedOutcome: `Stabilise ${selectedItem.clinicName} service continuity and document the next owner.`,
    verificationStep: selectedItem.verificationNeed,
  };
}

function buildTopReasonCodes(
  queue: DistrictSeverityQueueItem[],
): Array<{ code: DistrictSeverityReasonCode; count: number }> {
  const counts = new Map<DistrictSeverityReasonCode, number>();

  for (const item of queue) {
    for (const code of item.reasonCodes) {
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([code, count]) => ({ code, count }))
    .sort(
      (left, right) =>
        right.count - left.count || REASON_PRIORITY.indexOf(left.code) - REASON_PRIORITY.indexOf(right.code),
    );
}

function buildHandover(
  queue: DistrictSeverityQueueItem[],
  selectedItem: DistrictSeverityQueueItem | null,
): DistrictCommandCenter["handover"] {
  if (queue.length === 0) {
    return {
      title: "Handover baseline",
      items: ["No clinics are loaded for this command-center view."],
    };
  }

  const items = queue.slice(0, 3).map((item) => {
    return `${item.clinicName}: ${item.severityLabel} (${item.reasonCodes.join(", ")}). ${item.verificationNeed}`;
  });

  if (selectedItem && !items.some((item) => item.startsWith(`${selectedItem.clinicName}:`))) {
    items.push(`${selectedItem.clinicName}: selected for follow-up. ${selectedItem.verificationNeed}`);
  }

  return {
    title: "District handover priorities",
    items,
  };
}
