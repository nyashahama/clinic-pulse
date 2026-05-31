import type { PartnerReadinessMetric, PartnerReadinessSeverity } from "@/lib/demo/partner-readiness";
import type { DemoLead } from "@/lib/demo/types";
import type {
  EvidenceCommandChip,
  EvidenceCommandDecision,
  EvidenceCommandMetric,
  EvidenceCommandSection,
  EvidenceCommandTimelineItem,
  EvidenceCommandTone,
} from "@/lib/product/evidence-command";

export type SystemAdminCommandTone = "clear" | "attention" | "blocked" | "info";

export type SystemAdminReference = {
  source: string;
  role: string;
  href: string;
  licenseUse: "adaptable" | "reference-only";
};

export type SystemAdminMetricId =
  | "tenant-health"
  | "ingestion-pressure"
  | "security-posture"
  | "audit-readiness";

export type SystemAdminCommandMetric = {
  id: SystemAdminMetricId;
  label: string;
  value: string;
  detail: string;
  tone: SystemAdminCommandTone;
  href: string;
  actionLabel: string;
  sourcePattern: string;
};

export type SystemAdminLaneId = "needs-action" | "watching" | "clear";

export type SystemAdminLaneItem = {
  id: string;
  label: string;
  title: string;
  detail: string;
  value: string;
  href: string;
  tone: SystemAdminCommandTone;
  sourcePattern: string;
};

export type SystemAdminCommandLane = {
  id: SystemAdminLaneId;
  label: string;
  description: string;
  items: SystemAdminLaneItem[];
};

export type SystemAdminEvidenceRow = {
  id: string;
  label: string;
  title: string;
  detail: string;
  href: string;
  actionLabel: string;
  tone: SystemAdminCommandTone;
  sourcePattern: string;
};

export type SystemAdminReliabilityRow = {
  id: string;
  label: string;
  status: string;
  detail: string;
  tone: SystemAdminCommandTone;
};

export type SystemAdminCommandModel = {
  header: {
    eyebrow: string;
    title: string;
    description: string;
    syncLabel: string;
    activeAlertLabel: string;
  };
  commandBrief: {
    chips: EvidenceCommandChip[];
    metrics: EvidenceCommandMetric[];
    caseBrief: {
      title: string;
      description: string;
      summary: {
        label: string;
        value: string;
        tone: EvidenceCommandTone;
        emphasis: true;
      };
      primaryFields: Array<{
        label: string;
        value: string;
        href?: string;
        tone?: EvidenceCommandTone;
        emphasis?: boolean;
      }>;
      sections: EvidenceCommandSection[];
    };
    decision: EvidenceCommandDecision;
    timeline: {
      title: string;
      description: string;
      items: EvidenceCommandTimelineItem[];
    };
  };
  metrics: SystemAdminCommandMetric[];
  lanes: SystemAdminCommandLane[];
  evidenceRows: SystemAdminEvidenceRow[];
  reliabilityRows: SystemAdminReliabilityRow[];
  references: SystemAdminReference[];
};

export type SystemAdminCommandInput = {
  clinicCount: number;
  staleClinicCount: number;
  queuedReports: number;
  pendingReviewCount: number;
  activeAlertCount: number;
  auditEventCount: number;
  leadStatusCount: Record<DemoLead["status"], number>;
  partnerReadiness: {
    severity: PartnerReadinessSeverity;
    metrics: PartnerReadinessMetric[];
  };
  syncSummary: {
    lastSyncAt?: string | null;
    pendingOfflineReports: number;
    validationFailures: number;
    conflictsNeedingAttention: number;
    staleClinics: number;
    needsConfirmationClinics: number;
  };
};

const numberFormatter = new Intl.NumberFormat("en-ZA");
const timeFormatter = new Intl.DateTimeFormat("en-ZA", {
  hour: "2-digit",
  minute: "2-digit",
});

const references: SystemAdminReference[] = [
  {
    source: "Supabase Studio",
    role: "Scaffolded control-plane page structure and concise page sections.",
    href: "https://github.com/supabase/supabase",
    licenseUse: "adaptable",
  },
  {
    source: "shadcn dashboard",
    role: "Compact metric cards, dense data surfaces, and accessible primitives.",
    href: "https://github.com/shadcn-ui/ui",
    licenseUse: "adaptable",
  },
  {
    source: "Unkey audit logs",
    role: "Filterable evidence console with selected-row detail behavior.",
    href: "https://github.com/unkeyed/unkey",
    licenseUse: "reference-only",
  },
  {
    source: "OpenStatus",
    role: "Status strip language for platform reliability and service health.",
    href: "https://github.com/openstatusHQ/openstatus",
    licenseUse: "reference-only",
  },
  {
    source: "Trigger.dev",
    role: "Queue pressure, run state, and operational backlog hierarchy.",
    href: "https://github.com/triggerdotdev/trigger.dev",
    licenseUse: "adaptable",
  },
  {
    source: "Logto console",
    role: "Tenant, RBAC, and security navigation framing.",
    href: "https://github.com/logto-io/logto",
    licenseUse: "reference-only",
  },
  {
    source: "Cal.com",
    role: "Integration setup, booking readiness, and operator handoff flow structure.",
    href: "https://github.com/calcom/cal.diy",
    licenseUse: "adaptable",
  },
  {
    source: "Infisical",
    role: "Secret posture, credential review, and audit-backed integration readiness.",
    href: "https://github.com/Infisical/infisical",
    licenseUse: "adaptable",
  },
  {
    source: "Dub",
    role: "Partner analytics, event logs, and compact proof cards.",
    href: "https://github.com/dubinc/dub",
    licenseUse: "reference-only",
  },
  {
    source: "Twenty",
    role: "Dense back-office relationship surfaces and activity chronology.",
    href: "https://github.com/twentyhq/twenty",
    licenseUse: "reference-only",
  },
];

function formatCount(value: number) {
  return numberFormatter.format(value);
}

function formatSyncLabel(value?: string | null) {
  if (!value) {
    return "No sync recorded";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Sync time unavailable";
  }

  return `Last sync ${timeFormatter.format(date)}`;
}

function toneForCount(value: number): SystemAdminCommandTone {
  return value > 0 ? "attention" : "clear";
}

function toneForPartnerReadiness(severity: PartnerReadinessSeverity): SystemAdminCommandTone {
  if (severity === "attention") {
    return "attention";
  }

  if (severity === "watch") {
    return "info";
  }

  return "clear";
}

function toEvidenceTone(tone: SystemAdminCommandTone): EvidenceCommandTone {
  if (tone === "blocked") {
    return "critical";
  }

  if (tone === "attention") {
    return "attention";
  }

  if (tone === "info") {
    return "info";
  }

  return "stable";
}

function evidenceMetricIcon(id: SystemAdminMetricId): EvidenceCommandMetric["icon"] {
  if (id === "ingestion-pressure") {
    return "radio";
  }

  if (id === "security-posture") {
    return "check";
  }

  if (id === "audit-readiness") {
    return "activity";
  }

  return "alert";
}

function sortByTone(left: SystemAdminLaneItem, right: SystemAdminLaneItem) {
  const order: Record<SystemAdminCommandTone, number> = {
    blocked: 0,
    attention: 1,
    info: 2,
    clear: 3,
  };

  return order[left.tone] - order[right.tone] || left.label.localeCompare(right.label);
}

export function buildSystemAdminCommandModel(
  input: SystemAdminCommandInput,
): SystemAdminCommandModel {
  const ingestionPressure =
    input.queuedReports +
    input.pendingReviewCount +
    input.syncSummary.pendingOfflineReports +
    input.syncSummary.validationFailures +
    input.syncSummary.conflictsNeedingAttention +
    input.syncSummary.staleClinics +
    input.syncSummary.needsConfirmationClinics;
  const accessReviewCount = input.leadStatusCount.new + input.leadStatusCount.contacted;
  const securityPressure = input.activeAlertCount + accessReviewCount;
  const partnerTone = toneForPartnerReadiness(input.partnerReadiness.severity);
  const readyPartnerMetrics = input.partnerReadiness.metrics.filter(
    (metric) => metric.tone === "clear" || metric.tone === "info",
  ).length;

  const metrics: SystemAdminCommandMetric[] = [
    {
      id: "tenant-health",
      label: "Tenant health",
      value:
        input.staleClinicCount > 0
          ? `${formatCount(input.staleClinicCount)} stale`
          : `${formatCount(input.clinicCount)} clear`,
      detail:
        input.staleClinicCount > 0
          ? "Clinic freshness is holding tenant readiness below launch quality."
          : "Clinic freshness and tenant scope are clear.",
      tone: toneForCount(input.staleClinicCount),
      href: "/admin/tenant-health",
      actionLabel: "Open tenant health",
      sourcePattern: "Supabase scaffold + OpenStatus service strip",
    },
    {
      id: "ingestion-pressure",
      label: "Ingestion pressure",
      value: formatCount(ingestionPressure),
      detail:
        ingestionPressure > 0
          ? "Backstop review, freshness, or validation work needs operator attention."
          : "No ingestion work is blocking platform state.",
      tone: toneForCount(ingestionPressure),
      href: "/admin/data-ingestion",
      actionLabel: "Open data ingestion",
      sourcePattern: "Trigger.dev queue/run pressure",
    },
    {
      id: "security-posture",
      label: "Security posture",
      value: securityPressure > 0 ? `${formatCount(securityPressure)} review` : "Clear",
      detail:
        securityPressure > 0
          ? "Open alerts or access follow-up records need review before platform handoff."
          : "Access and security evidence are not raising review pressure.",
      tone: toneForCount(securityPressure),
      href: "/admin/security",
      actionLabel: "Open security",
      sourcePattern: "Logto RBAC console + Infisical audit posture",
    },
    {
      id: "audit-readiness",
      label: "Audit readiness",
      value: `${formatCount(input.auditEventCount)} events`,
      detail:
        input.auditEventCount > 0
          ? "Actor, event, export, and integration evidence are available for review."
          : "Audit evidence is missing from this tenant view.",
      tone: input.auditEventCount > 0 ? "info" : "attention",
      href: "/admin/audit-evidence",
      actionLabel: "Open audit evidence",
      sourcePattern: "Unkey audit logs",
    },
  ];

  const commandItems: SystemAdminLaneItem[] = [
    {
      id: "ingestion-review",
      label: "Data ingestion",
      title:
        ingestionPressure > 0
          ? `${formatCount(ingestionPressure)} ingestion signals need review`
          : "Ingestion pipeline is clear",
      detail:
        "Review pending field reports, stale clinics, conflicts, offline queues, and validation failures.",
      value: ingestionPressure > 0 ? `${formatCount(ingestionPressure)} open` : "Clear",
      href: "/admin/data-ingestion",
      tone: toneForCount(ingestionPressure),
      sourcePattern: "Trigger.dev",
    },
    {
      id: "tenant-health",
      label: "Tenant health",
      title:
        input.staleClinicCount > 0
          ? `${formatCount(input.staleClinicCount)} stale clinic signals`
          : "Tenant health is ready for review",
      detail: "Check district readiness, clinic freshness, access risk, and partner evidence.",
      value: `${formatCount(input.clinicCount)} clinics`,
      href: "/admin/tenant-health",
      tone: toneForCount(input.staleClinicCount),
      sourcePattern: "OpenStatus",
    },
    {
      id: "security-access",
      label: "Security and access",
      title:
        securityPressure > 0
          ? `${formatCount(securityPressure)} security or access items need review`
          : "Security posture is clear",
      detail: "Review privileged access, active alerts, partner credentials, and operator actions.",
      value: securityPressure > 0 ? `${formatCount(securityPressure)} review` : "Clear",
      href: "/admin/security",
      tone: toneForCount(securityPressure),
      sourcePattern: "Logto console",
    },
    {
      id: "partner-readiness",
      label: "Partner readiness",
      title:
        partnerTone === "clear"
          ? "Partner handoff evidence is ready"
          : "Partner handoff needs another check",
      detail: "Review API keys, exports, webhooks, delivery attempts, and integration checks.",
      value: `${formatCount(readyPartnerMetrics)} ready`,
      href: "/admin/partner-readiness",
      tone: partnerTone,
      sourcePattern: "Cal.com / Infisical / Dub",
    },
    {
      id: "audit-evidence",
      label: "Audit evidence",
      title: `${formatCount(input.auditEventCount)} audit events are available`,
      detail: "Inspect actor, event, source, export, and webhook evidence before sign-off.",
      value: `${formatCount(input.auditEventCount)} events`,
      href: "/admin/audit-evidence",
      tone: input.auditEventCount > 0 ? "info" : "attention",
      sourcePattern: "Unkey audit logs",
    },
  ];
  const needsActionItems = commandItems
    .filter((item) => item.tone === "blocked" || item.tone === "attention")
    .sort(sortByTone);
  const watchingItems = commandItems
    .filter((item) => item.tone === "info")
    .sort(sortByTone);
  const clearItems = commandItems
    .filter((item) => item.tone === "clear")
    .sort(sortByTone);
  const leadItem = needsActionItems[0] ?? watchingItems[0] ?? clearItems[0] ?? commandItems[0];
  const leadTone = toEvidenceTone(leadItem.tone);
  const commandMetrics: EvidenceCommandMetric[] = metrics.map((metric) => ({
    label: metric.label,
    value: metric.value,
    detail: metric.detail,
    tone: toEvidenceTone(metric.tone),
    icon: evidenceMetricIcon(metric.id),
    href: metric.href,
    actionLabel: metric.actionLabel,
  }));
  const commandChips: EvidenceCommandChip[] = [
    { label: "Live operations", tone: "stable" },
    { label: formatSyncLabel(input.syncSummary.lastSyncAt), tone: "info" },
    {
      label:
        input.activeAlertCount > 0
          ? `${formatCount(input.activeAlertCount)} active alerts`
          : "No active alerts",
      tone: input.activeAlertCount > 0 ? "attention" : "stable",
    },
  ];
  const platformVerdict =
    needsActionItems.length > 0
      ? `${formatCount(needsActionItems.length)} command lanes need review`
      : "Platform command lanes are clear";
  const decision: EvidenceCommandDecision = {
    contextLabel: "Platform command",
    title:
      needsActionItems.length > 0
        ? "Platform readiness needs operator review"
        : "Platform readiness is clear",
    scoreLabel: "Lead lane",
    scoreValue: leadItem.label,
    chips: commandChips,
    nextStep:
      needsActionItems.length > 0
        ? `Open ${leadItem.label.toLowerCase()} and clear the lead command signal before platform handoff.`
        : "Keep monitoring tenant freshness, security, and partner proof from the command console.",
    nextStepTone: leadTone,
    impactTitle: "System impact",
    impact:
      "System administrators need one place to understand tenant readiness, ingestion pressure, security posture, and partner proof without switching context first.",
    verificationTitle: "Verification",
    verification:
      "Use the linked modules to confirm source evidence, then return to this overview to check that the command pressure has changed.",
    evidence: {
      label: platformVerdict,
      detail: "Tenant health, ingestion, security, partner readiness, and audit evidence",
      href: leadItem.href,
      tone: leadTone,
    },
    actions: [
      {
        label: leadItem.href === "/admin/data-ingestion" ? "Open data ingestion" : `Open ${leadItem.label.toLowerCase()}`,
        href: leadItem.href,
        priority: "primary",
        icon: "stream",
      },
      {
        label: "Open tenant health",
        href: "/admin/tenant-health",
        priority: "secondary",
        icon: "clinic",
      },
    ],
  };

  return {
    header: {
      eyebrow: "Platform operations",
      title: "Platform Command Console",
      description:
        "A control plane for tenant health, ingestion review, security posture, partner readiness, and audit evidence.",
      syncLabel: formatSyncLabel(input.syncSummary.lastSyncAt),
      activeAlertLabel:
        input.activeAlertCount > 0
          ? `${formatCount(input.activeAlertCount)} active alerts`
          : "No active alerts",
    },
    commandBrief: {
      chips: commandChips,
      metrics: commandMetrics,
      caseBrief: {
        title: "Platform readiness packet",
        description:
          "System-wide operating evidence for tenant health, ingestion pressure, access posture, partner proof, and audit readiness.",
        summary: {
          label: "Command verdict",
          value: platformVerdict,
          tone: leadTone,
          emphasis: true,
        },
        primaryFields: [
          {
            label: "Clinic estate",
            value: `${formatCount(input.clinicCount)} clinics`,
            href: "/admin/tenant-health",
            emphasis: true,
          },
          {
            label: "Ingestion pressure",
            value: formatCount(ingestionPressure),
            href: "/admin/data-ingestion",
          },
          {
            label: "Security pressure",
            value: securityPressure > 0 ? `${formatCount(securityPressure)} review` : "Clear",
            href: "/admin/security",
          },
        ],
        sections: [
          {
            title: "Command routing",
            description: "Primary system-admin destinations exposed from the command overview.",
            fields: metrics.map((metric) => ({
              label: metric.label,
              value: metric.actionLabel,
              href: metric.href,
            })),
          },
          {
            title: "Reliability evidence",
            description: "Health strips that explain whether the platform is clear, watching, or blocked.",
            fields: [
              {
                label: "API and ingestion",
                value: ingestionPressure > 0 ? "Review" : "Clear",
                tone: toEvidenceTone(toneForCount(ingestionPressure)),
              },
              {
                label: "Tenant freshness",
                value: input.staleClinicCount > 0 ? "Stale" : "Fresh",
                tone: toEvidenceTone(toneForCount(input.staleClinicCount)),
              },
              {
                label: "Partner proof",
                value: partnerTone === "clear" ? "Ready" : "Watch",
                tone: toEvidenceTone(partnerTone),
              },
            ],
          },
        ],
      },
      decision,
      timeline: {
        title: "Platform evidence timeline",
        description:
          "The operating sequence a system administrator should check before platform sign-off.",
        items: [
          {
            label: "Sync",
            title: formatSyncLabel(input.syncSummary.lastSyncAt),
            description: "Latest sync evidence anchors the rest of the command console.",
            tone: input.syncSummary.lastSyncAt ? "stable" : "attention",
          },
          {
            label: "Ingestion",
            title:
              ingestionPressure > 0
                ? `${formatCount(ingestionPressure)} ingestion signals open`
                : "No ingestion pressure",
            description: "Pending reports, offline queues, stale clinics, conflicts, and validation failures.",
            tone: toEvidenceTone(toneForCount(ingestionPressure)),
          },
          {
            label: "Security",
            title:
              securityPressure > 0
                ? `${formatCount(securityPressure)} security signals open`
                : "Security posture clear",
            description: "Privileged access, active alerts, and access follow-up evidence.",
            tone: toEvidenceTone(toneForCount(securityPressure)),
          },
          {
            label: "Partner",
            title:
              partnerTone === "clear"
                ? "Partner handoff ready"
                : "Partner handoff needs review",
            description: "API keys, webhooks, exports, delivery checks, and readiness evidence.",
            tone: toEvidenceTone(partnerTone),
          },
        ],
      },
    },
    metrics,
    lanes: [
      {
        id: "needs-action",
        label: "Needs action",
        description: "Work that changes readiness or exposes operational risk.",
        items: needsActionItems.length ? needsActionItems : clearItems.slice(0, 1),
      },
      {
        id: "watching",
        label: "Watching",
        description: "Evidence-heavy surfaces that should stay visible during review.",
        items: watchingItems.length ? watchingItems : commandItems.slice(0, 2),
      },
      {
        id: "clear",
        label: "Clear",
        description: "Lanes with enough evidence to move forward.",
        items: clearItems,
      },
    ],
    evidenceRows: [
      {
        id: "audit-evidence",
        label: "Audit",
        title: "Audit evidence ledger",
        detail: "Actor, role, event, export, and webhook evidence with source detail pages.",
        href: "/admin/audit-evidence",
        actionLabel: "Open audit evidence",
        tone: input.auditEventCount > 0 ? "info" : "attention",
        sourcePattern: "Unkey audit logs",
      },
      {
        id: "security-posture",
        label: "Security",
        title: "Security posture",
        detail: "Privileged access, alert state, API key posture, and credential review.",
        href: "/admin/security",
        actionLabel: "Open security",
        tone: toneForCount(securityPressure),
        sourcePattern: "Logto console + Infisical",
      },
      {
        id: "integration-checks",
        label: "Integrations",
        title: "Integration operations",
        detail: "API keys, webhook delivery, export checks, and partner readiness proof.",
        href: "/admin/integrations",
        actionLabel: "Open integrations",
        tone: partnerTone,
        sourcePattern: "Cal.com / Dub",
      },
      {
        id: "tenant-health",
        label: "Tenant",
        title: "Tenant health workspace",
        detail: "Clinic freshness, district scope, and service health evidence for launch review.",
        href: "/admin/tenant-health",
        actionLabel: "Open tenant health",
        tone: toneForCount(input.staleClinicCount),
        sourcePattern: "Supabase Studio + OpenStatus",
      },
      {
        id: "partner-readiness",
        label: "Partner",
        title: "Partner readiness cockpit",
        detail: "Handoff evidence for API keys, exports, webhooks, and credential posture.",
        href: "/admin/partner-readiness",
        actionLabel: "Open partner readiness",
        tone: partnerTone,
        sourcePattern: "Cal.com + Infisical",
      },
    ],
    reliabilityRows: [
      {
        id: "api-health",
        label: "API and ingestion",
        status: ingestionPressure > 0 ? "Review" : "Clear",
        detail:
          ingestionPressure > 0
            ? "Pending review or sync pressure is still visible."
            : "No pending ingestion pressure is visible.",
        tone: toneForCount(ingestionPressure),
      },
      {
        id: "tenant-freshness",
        label: "Tenant freshness",
        status: input.staleClinicCount > 0 ? "Stale" : "Fresh",
        detail:
          input.staleClinicCount > 0
            ? `${formatCount(input.staleClinicCount)} clinic records need freshness review.`
            : "All clinic freshness signals are acceptable.",
        tone: toneForCount(input.staleClinicCount),
      },
      {
        id: "partner-proof",
        label: "Partner proof",
        status: partnerTone === "clear" ? "Ready" : "Watch",
        detail: `${formatCount(input.partnerReadiness.metrics.length)} readiness metrics are present.`,
        tone: partnerTone,
      },
    ],
    references,
  };
}
