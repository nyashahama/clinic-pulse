import type { AdminTone } from "@/components/product/admin-module";

export type OrgAdminPartnerReadinessSeverity = "clear" | "watch" | "attention";

export type OrgAdminPartnerReadinessMetric = {
  label: string;
  value: string;
  detail?: string;
  tone: OrgAdminPartnerReadinessSeverity | "info";
};

export type OrgAdminGovernanceWorkbenchInput = {
  clinicCount: number;
  staleClinicCount: number;
  needsConfirmationClinicCount: number;
  pendingReviewCount: number;
  queuedOfflineCount: number;
  activeAlertCount: number;
  newStakeholderCount: number;
  followUpStakeholderCount: number;
  partnerCheckCount: number;
  partnerSeverity: OrgAdminPartnerReadinessSeverity;
  latestActivityLabel: string;
};

export type OrgAdminWorkbenchHero = {
  scopeLabel: string;
  activeBlocker: string;
  description: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  secondaryActionLabel: string;
  secondaryActionHref: string;
  latestActivityLabel: string;
};

export type OrgAdminTaskQueueItem = {
  id:
    | "review-field-evidence"
    | "resolve-coverage"
    | "review-access"
    | "confirm-evidence";
  title: string;
  description: string;
  stateLabel: string;
  href: string;
  tone: AdminTone;
};

export type OrgAdminReadinessMetric = {
  label: string;
  value: string;
  detail: string;
  tone: AdminTone;
};

export type OrgAdminEvidenceLink = {
  label: string;
  href: string;
  detail: string;
  stateLabel: string;
  tone: AdminTone;
};

export type OrgAdminGovernanceWorkbenchModel = {
  hero: OrgAdminWorkbenchHero;
  taskQueue: OrgAdminTaskQueueItem[];
  readinessStrip: OrgAdminReadinessMetric[];
  evidenceLinks: OrgAdminEvidenceLink[];
};

function formatCount(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function metricTone(count: number): AdminTone {
  return count > 0 ? "attention" : "clear";
}

function partnerTone(severity: OrgAdminPartnerReadinessSeverity): AdminTone {
  return severity === "clear" ? "clear" : "attention";
}

function calculateGovernanceReadinessPercent({
  clinicCount,
  staleClinicCount,
  needsConfirmationClinicCount,
  pendingReviewCount,
  queuedOfflineCount,
}: Pick<
  OrgAdminGovernanceWorkbenchInput,
  | "clinicCount"
  | "staleClinicCount"
  | "needsConfirmationClinicCount"
  | "pendingReviewCount"
  | "queuedOfflineCount"
>) {
  if (clinicCount <= 0) {
    return 0;
  }

  const pressure =
    staleClinicCount +
    needsConfirmationClinicCount +
    pendingReviewCount +
    queuedOfflineCount;

  return Math.max(0, Math.round(((clinicCount - pressure) / clinicCount) * 100));
}

function activeBlocker(input: OrgAdminGovernanceWorkbenchInput) {
  if (input.clinicCount <= 0) {
    return "No clinics in organisation scope";
  }

  if (input.pendingReviewCount > 0) {
    return `${formatCount(input.pendingReviewCount, "field report")} need governance review`;
  }

  const coverageBlockers =
    input.staleClinicCount + input.needsConfirmationClinicCount + input.queuedOfflineCount;
  if (coverageBlockers > 0) {
    const verb = coverageBlockers === 1 ? "affects" : "affect";

    return `${formatCount(coverageBlockers, "coverage blocker")} ${verb} readiness`;
  }

  if (input.activeAlertCount > 0) {
    return `${formatCount(input.activeAlertCount, "open alert")} need ownership`;
  }

  if (input.partnerSeverity !== "clear") {
    return "Partner evidence needs confirmation";
  }

  return "No governance blockers";
}

function primaryAction(input: OrgAdminGovernanceWorkbenchInput) {
  if (input.pendingReviewCount > 0) {
    return {
      label: "Review field evidence",
      href: "#report-review-lane",
    };
  }

  return {
    label: "Inspect coverage",
    href: "#coverage-ledger",
  };
}

export function buildOrgAdminGovernanceWorkbenchModel(
  input: OrgAdminGovernanceWorkbenchInput,
): OrgAdminGovernanceWorkbenchModel {
  const readinessPercent = calculateGovernanceReadinessPercent(input);
  const coverageBlockerCount =
    input.staleClinicCount + input.needsConfirmationClinicCount + input.queuedOfflineCount;
  const accessFollowUpCount = input.newStakeholderCount + input.followUpStakeholderCount;
  const action = primaryAction(input);

  return {
    hero: {
      scopeLabel: "Organisation governance",
      activeBlocker: activeBlocker(input),
      description:
        "Review field evidence, coverage gaps, access hygiene, and partner proof before declaring the organisation ready.",
      primaryActionLabel: action.label,
      primaryActionHref: action.href,
      secondaryActionLabel: "Open partner evidence",
      secondaryActionHref: "/admin/partner-readiness",
      latestActivityLabel: input.latestActivityLabel,
    },
    taskQueue: [
      {
        id: "review-field-evidence",
        title: "Review field evidence",
        description:
          "Accept or reject submitted field reports before they change organisation readiness.",
        stateLabel:
          input.pendingReviewCount > 0
            ? formatCount(input.pendingReviewCount, "pending report")
            : "No pending reports",
        href: "#report-review-lane",
        tone: metricTone(input.pendingReviewCount),
      },
      {
        id: "resolve-coverage",
        title: "Resolve coverage gaps",
        description:
          "Check stale clinics, needs-confirmation stops, and queued device reports.",
        stateLabel:
          coverageBlockerCount > 0
            ? formatCount(coverageBlockerCount, "blocker")
            : "Coverage clear",
        href: "#coverage-ledger",
        tone: metricTone(coverageBlockerCount),
      },
      {
        id: "review-access",
        title: "Review access hygiene",
        description:
          "Confirm users, roles, and stakeholder follow-up before rollout evidence is trusted.",
        stateLabel:
          accessFollowUpCount > 0
            ? formatCount(accessFollowUpCount, "follow-up")
            : "Access clear",
        href: "#access-hygiene",
        tone: metricTone(accessFollowUpCount),
      },
      {
        id: "confirm-evidence",
        title: "Confirm partner proof",
        description:
          "Keep API keys, exports, webhook checks, and audit evidence in the readiness trail.",
        stateLabel:
          input.partnerSeverity === "clear"
            ? `${input.partnerCheckCount} checks ready`
            : `${input.partnerCheckCount} checks need review`,
        href: "#evidence-strip",
        tone: partnerTone(input.partnerSeverity),
      },
    ],
    readinessStrip: [
      {
        label: "Governance readiness",
        value: `${readinessPercent}%`,
        detail: `${input.clinicCount} clinics in organisation scope.`,
        tone: input.clinicCount <= 0 ? "blocked" : readinessPercent === 100 ? "clear" : "attention",
      },
      {
        label: "Report reviews",
        value: String(input.pendingReviewCount),
        detail: "Field reports waiting for organisation review.",
        tone: metricTone(input.pendingReviewCount),
      },
      {
        label: "Coverage blockers",
        value: String(coverageBlockerCount),
        detail: "Stale, needs-confirmation, or queued reports.",
        tone: metricTone(coverageBlockerCount),
      },
      {
        label: "Evidence state",
        value: input.partnerSeverity === "clear" ? "Ready" : "Review",
        detail: `${input.partnerCheckCount} partner checks in the evidence trail.`,
        tone: partnerTone(input.partnerSeverity),
      },
    ],
    evidenceLinks: [
      {
        label: "Reporting coverage",
        href: "/admin/reporting-coverage",
        detail: "Clinic freshness, source trust, and review receipts.",
        stateLabel:
          coverageBlockerCount > 0
            ? formatCount(coverageBlockerCount, "blocker")
            : "Clear",
        tone: metricTone(coverageBlockerCount),
      },
      {
        label: "Users and roles",
        href: "/admin/users-roles",
        detail: "User lifecycle, role scope, and stale access evidence.",
        stateLabel:
          accessFollowUpCount > 0
            ? formatCount(accessFollowUpCount, "follow-up")
            : "Clear",
        tone: metricTone(accessFollowUpCount),
      },
      {
        label: "Partner readiness",
        href: "/admin/partner-readiness",
        detail: "API keys, export package, webhooks, and launch checks.",
        stateLabel: input.partnerSeverity === "clear" ? "Ready" : "Review",
        tone: partnerTone(input.partnerSeverity),
      },
      {
        label: "Audit evidence",
        href: "/admin/audit-evidence",
        detail: "Governance actions and source records for review proof.",
        stateLabel:
          input.activeAlertCount > 0
            ? formatCount(input.activeAlertCount, "open alert")
            : "Clear",
        tone: metricTone(input.activeAlertCount),
      },
      {
        label: "Export schema",
        href: "/admin/export-schema?from=admin",
        detail: "Payload shape used for partner handoff and external review.",
        stateLabel: "Proof",
        tone: "info",
      },
      {
        label: "API contract",
        href: "/admin/api-contract?from=admin",
        detail: "Contract surface for clinic, status, and alternative-service data.",
        stateLabel: "Proof",
        tone: "info",
      },
    ],
  };
}
