import type { AuthRole } from "@/lib/auth/api";

export type GovernanceTone = "clear" | "attention" | "blocked";

export type AccessRiskInput = {
  role: AuthRole;
  disabled: boolean;
  district?: string | null;
  lastSeenAt?: string | null;
};

type AccessRiskSummary = {
  tone: GovernanceTone;
  label: "Clear" | "Privileged" | "Review";
  reasons: string[];
};

export type ReportingCoverageInput = {
  clinicCount: number;
  staleClinicCount: number;
  needsConfirmationClinicCount?: number;
  pendingReviewCount: number;
  queuedOfflineCount: number;
  validationFailureCount: number;
};

type ReportingCoverageSummary = {
  tone: GovernanceTone;
  readinessPercent: number;
  blockers: string[];
};

export type SecurityPostureInput = {
  activeApiKeys: number;
  revokedApiKeys: number;
  privilegedUsers: number;
  failedWebhookEvents: number;
};

type SecurityPostureSummary = {
  tone: GovernanceTone;
  summary: string;
};

export function classifyAccessRisk(input: AccessRiskInput): AccessRiskSummary {
  const reasons: string[] = [];

  if (input.role === "system_admin") {
    reasons.push("System administrator access");
  }

  if (input.role === "district_manager" && !input.district) {
    reasons.push("Missing district scope");
  }

  if (input.disabled) {
    reasons.push("Disabled account");
  }

  if (!input.lastSeenAt) {
    reasons.push("No recent session");
  }

  return {
    tone: reasons.length > 0 ? "attention" : "clear",
    label: resolveAccessRiskLabel(input.role, reasons),
    reasons,
  };
}

export function summarizeReportingCoverage(
  input: ReportingCoverageInput,
): ReportingCoverageSummary {
  const blockers = [
    formatBlocker(input.pendingReviewCount, "pending review"),
    formatBlocker(input.staleClinicCount, "stale clinic"),
    formatBlocker(input.needsConfirmationClinicCount ?? 0, "needs-confirmation clinic"),
    formatBlocker(input.validationFailureCount, "validation failure"),
  ].filter((blocker): blocker is string => Boolean(blocker));
  const pressure =
    input.staleClinicCount +
    (input.needsConfirmationClinicCount ?? 0) +
    input.pendingReviewCount +
    input.queuedOfflineCount +
    input.validationFailureCount;
  const readinessPercent =
    input.clinicCount === 0
      ? 0
      : Math.max(0, Math.round(((input.clinicCount - pressure) / input.clinicCount) * 100));

  return {
    tone: blockers.length > 0 ? "attention" : "clear",
    readinessPercent,
    blockers,
  };
}

export function summarizeSecurityPosture(
  input: SecurityPostureInput,
): SecurityPostureSummary {
  if (input.failedWebhookEvents > 0 || input.privilegedUsers > 0) {
    return {
      tone: "attention",
      summary: `${input.failedWebhookEvents} failed webhook event and ${input.privilegedUsers} privileged users need review.`,
    };
  }

  return {
    tone: "clear",
    summary: `${input.activeApiKeys} active API keys and ${input.revokedApiKeys} revoked keys are recorded.`,
  };
}

function resolveAccessRiskLabel(
  role: AuthRole,
  reasons: string[],
): AccessRiskSummary["label"] {
  if (role === "system_admin") {
    return "Privileged";
  }

  return reasons.length > 0 ? "Review" : "Clear";
}

function formatBlocker(count: number, label: string): string | null {
  if (count <= 0) {
    return null;
  }

  return `${count} ${label}${count === 1 ? "" : "s"}`;
}
