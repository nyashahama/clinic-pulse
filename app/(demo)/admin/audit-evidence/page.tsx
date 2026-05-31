import { AuditEvidenceWorkspace } from "@/components/product/audit-evidence-workspace";
import {
  EvidenceCaseBriefPanel,
  EvidenceCommandChip,
  EvidenceCommandHeader,
  EvidenceCommandMetricStrip,
  EvidenceDecisionPanel,
  EvidenceTimeline,
} from "@/components/product/evidence-command";
import {
  buildAuditEvidenceViewModel,
  getDefaultAuditEvidenceRowId,
  type AuditEvidenceLane,
  type AuditEvidenceMetric,
  type AuditEvidencePacket,
  type AuditEvidenceRow,
  type AuditEvidenceTone,
  type AuditEvidenceViewModel,
} from "@/lib/product/audit-evidence";
import type {
  EvidenceCommandAction,
  EvidenceCommandChip as EvidenceCommandChipModel,
  EvidenceCommandDecision,
  EvidenceCommandField,
  EvidenceCommandMetric,
  EvidenceCommandSection,
  EvidenceCommandTimelineItem,
  EvidenceCommandTone,
} from "@/lib/product/evidence-command";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminGovernanceData } from "../admin-loaders";
import { formatDateTime } from "../governance-formatters";

type AuditActivityInput = {
  auditEvents: Awaited<ReturnType<typeof loadAdminGovernanceData>>["auditEvents"];
  exportRuns: Awaited<ReturnType<typeof loadAdminGovernanceData>>["partnerReadiness"]["exportRuns"];
  webhookEvents: Awaited<ReturnType<typeof loadAdminGovernanceData>>["partnerReadiness"]["webhookEvents"];
};

function getLatestAuditActivityLabel({
  auditEvents,
  exportRuns,
  webhookEvents,
}: AuditActivityInput) {
  const latest = [
    ...auditEvents.map((event) => event.createdAt),
    ...exportRuns.map((exportRun) => exportRun.createdAt),
    ...webhookEvents.flatMap((event) => [event.deliveredAt, event.createdAt]),
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => right.getTime() - left.getTime())[0];

  return latest ? formatDateTime(latest.toISOString()) : "Unavailable";
}

function toEvidenceTone(tone?: AuditEvidenceTone): EvidenceCommandTone {
  if (tone === "blocked") {
    return "critical";
  }

  if (tone === "attention") {
    return "attention";
  }

  if (tone === "clear") {
    return "stable";
  }

  if (tone === "info") {
    return "info";
  }

  return "neutral";
}

function auditLaneLabel(lane: AuditEvidenceLane) {
  const labels: Record<AuditEvidenceLane, string> = {
    access: "Access evidence",
    report: "Report evidence",
    sync: "Sync and freshness",
    export: "Partner export",
    webhook: "Webhook delivery",
    operating: "Operating evidence",
  };

  return labels[lane];
}

function getSelectedAuditEvidenceRow(auditEvidence: AuditEvidenceViewModel) {
  const defaultRowId = getDefaultAuditEvidenceRowId(auditEvidence.rows);

  return (
    auditEvidence.rows.find((row) => row.id === defaultRowId) ??
    auditEvidence.rows[0] ??
    null
  );
}

function auditMetricHref(metric: AuditEvidenceMetric) {
  if (metric.id === "partner-handoffs") {
    return "/admin/partner-readiness";
  }

  if (metric.id === "access-events") {
    return "/admin/users-roles";
  }

  return "#audit-evidence-workspace";
}

function auditMetricActionLabel(metric: AuditEvidenceMetric) {
  if (metric.id === "partner-handoffs") {
    return "Open handoffs";
  }

  if (metric.id === "access-events") {
    return "Trace access";
  }

  if (metric.id === "review-load") {
    return "Review queue";
  }

  return "Review rows";
}

function auditMetricIcon(metric: AuditEvidenceMetric): EvidenceCommandMetric["icon"] {
  if (metric.id === "review-load") {
    return metric.tone === "clear" ? "check" : "alert";
  }

  if (metric.id === "partner-handoffs") {
    return "mail";
  }

  if (metric.id === "access-events") {
    return "user";
  }

  return "activity";
}

function buildAuditMetrics(metrics: AuditEvidenceMetric[]): EvidenceCommandMetric[] {
  return metrics.map((metric) => ({
    label: metric.label,
    value: metric.value,
    detail: metric.detail,
    tone: toEvidenceTone(metric.tone),
    icon: auditMetricIcon(metric),
    href: auditMetricHref(metric),
    actionLabel: auditMetricActionLabel(metric),
  }));
}

function buildAuditHeaderChips({
  latestActivityLabel,
  selectedRow,
  statusLabel,
}: {
  latestActivityLabel: string;
  selectedRow: AuditEvidenceRow | null;
  statusLabel: string;
}): EvidenceCommandChipModel[] {
  return [
    {
      label: statusLabel,
      tone: toEvidenceTone(selectedRow?.stateTone),
    },
    {
      label: `Latest activity ${latestActivityLabel}`,
      tone: "neutral",
    },
    {
      label: selectedRow ? `${selectedRow.sourceLabel} selected` : "No row selected",
      tone: selectedRow ? toEvidenceTone(selectedRow.stateTone) : "attention",
    },
  ];
}

function buildPacketFields(packets: AuditEvidencePacket[]): EvidenceCommandField[] {
  return packets.map((packet) => ({
    label: packet.label,
    value: `${packet.value} - ${packet.detail}`,
    tone: toEvidenceTone(packet.tone),
    fullWidth: true,
  }));
}

function buildAuditCaseBrief({
  packets,
  selectedRow,
}: {
  packets: AuditEvidencePacket[];
  selectedRow: AuditEvidenceRow | null;
}) {
  const primaryFields: EvidenceCommandField[] = selectedRow
    ? [
        {
          label: "Source",
          value: selectedRow.sourceLabel,
          href: selectedRow.sourceHref,
          emphasis: true,
        },
        {
          label: "State",
          value: selectedRow.stateLabel,
          tone: toEvidenceTone(selectedRow.stateTone),
        },
        {
          label: "Actor",
          value: selectedRow.actorLabel,
        },
        {
          label: "Entity",
          value: selectedRow.entityLabel,
        },
        {
          label: "Observed",
          value: selectedRow.observedLabel,
        },
        {
          label: "Lane",
          value: auditLaneLabel(selectedRow.lane),
        },
      ]
    : [
        {
          label: "Evidence rows",
          value: "No audit evidence rows are available",
          tone: "attention",
        },
      ];

  const sections: EvidenceCommandSection[] = selectedRow
    ? [
        {
          title: "Review basis",
          description: "Why this row is present in the audit evidence review lane.",
          fields: [
            {
              label: "Basis",
              value: selectedRow.evidenceBasis,
              fullWidth: true,
            },
            {
              label: "Review state",
              value: selectedRow.reviewState,
              fullWidth: true,
            },
          ],
        },
        {
          title: "Raw facts",
          description: "Source values retained for the selected row.",
          fields: selectedRow.rawFacts.slice(0, 6).map((fact) => ({
            label: fact.label,
            value: fact.value,
          })),
        },
        {
          title: "Linked packets",
          fields: buildPacketFields(packets),
        },
      ]
    : [
        {
          title: "Linked packets",
          fields: buildPacketFields(packets),
        },
      ];

  return {
    title: "Evidence review lane",
    description:
      "Selected source row, raw facts, packet context, and audit basis for the next administrative decision.",
    summary: {
      label: selectedRow?.stateLabel ?? "Audit evidence",
      value: selectedRow?.summary ?? "Audit evidence rows will appear here when available.",
      tone: toEvidenceTone(selectedRow?.stateTone),
      href: selectedRow?.sourceHref,
      emphasis: true,
    } satisfies EvidenceCommandField,
    primaryFields,
    sections,
  };
}

function buildAuditDecision({
  reviewMetric,
  selectedRow,
}: {
  reviewMetric?: AuditEvidenceMetric;
  selectedRow: AuditEvidenceRow | null;
}): EvidenceCommandDecision {
  const nextStepTone = toEvidenceTone(selectedRow?.stateTone ?? reviewMetric?.tone);

  return {
    contextLabel: "Operational decision",
    title: selectedRow ? selectedRow.reviewState : "Audit evidence review decision",
    scoreLabel: "Review load",
    scoreValue: reviewMetric?.value ?? "0",
    chips: [
      {
        label: selectedRow?.sourceLabel ?? "Audit source",
        tone: "neutral",
      },
      {
        label: selectedRow?.stateLabel ?? "Awaiting evidence",
        tone: nextStepTone,
      },
      {
        label: selectedRow ? auditLaneLabel(selectedRow.lane) : "Evidence lane",
        tone: selectedRow ? toEvidenceTone(selectedRow.stateTone) : "neutral",
      },
    ],
    nextStep:
      selectedRow?.nextStep ??
      "Review the audit evidence workspace when source-linked evidence rows are available.",
    nextStepTone,
    impactTitle: "Operational impact",
    impact:
      selectedRow?.evidenceBasis ??
      "Audit evidence keeps administrative decisions tied to actor, entity, timestamp, metadata, and source records.",
    verificationTitle: "Verification basis",
    verification: selectedRow
      ? "Open the source record and compare actor, entity, timestamp, metadata, and packet context before closing the review."
      : "Load source-linked audit evidence before closing an administrative review.",
    evidence: selectedRow
      ? {
          label: "Open source evidence",
          detail: selectedRow.evidenceBasis,
          href: selectedRow.sourceHref,
          tone: toEvidenceTone(selectedRow.stateTone),
        }
      : undefined,
    actions: [
      {
        label: "Review evidence",
        href: "#audit-evidence-workspace",
        priority: "primary",
        icon: "queue",
      },
      {
        label: selectedRow ? "Open source" : "Open workspace",
        href: selectedRow?.sourceHref ?? "#audit-evidence-workspace",
        priority: "secondary",
        icon: "report",
      },
    ],
  };
}

function buildAuditTimelineItems({
  packets,
  selectedRow,
}: {
  packets: AuditEvidencePacket[];
  selectedRow: AuditEvidenceRow | null;
}): EvidenceCommandTimelineItem[] {
  const packetItems = packets.map((packet) => ({
    label: packet.label,
    title: packet.value,
    description: packet.detail,
    tone: toEvidenceTone(packet.tone),
  }));

  if (!selectedRow) {
    return packetItems;
  }

  return [
    {
      label: "Selected evidence",
      title: selectedRow.title,
      description: selectedRow.summary,
      timestamp: selectedRow.observedLabel,
      tone: toEvidenceTone(selectedRow.stateTone),
    },
    ...packetItems,
  ];
}

const headerActions: EvidenceCommandAction[] = [
  {
    label: "Review evidence",
    href: "#audit-evidence-workspace",
    priority: "primary",
    icon: "queue",
  },
  {
    label: "Open security posture",
    href: "/admin/security",
    priority: "secondary",
    icon: "report",
  },
];

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  const { auditEvents, partnerReadiness, users } = await loadAdminGovernanceData();
  const auditEvidence = buildAuditEvidenceViewModel({
    auditEvents,
    exportRuns: partnerReadiness.exportRuns,
    webhookEvents: partnerReadiness.webhookEvents,
    users,
  });
  const reviewMetric = auditEvidence.metrics.find((metric) => metric.id === "review-load");
  const latestActivityLabel = getLatestAuditActivityLabel({
    auditEvents,
    exportRuns: partnerReadiness.exportRuns,
    webhookEvents: partnerReadiness.webhookEvents,
  });
  const statusLabel =
    reviewMetric?.value && reviewMetric.value !== "0"
      ? `${reviewMetric.value} evidence rows need review`
      : "Audit evidence is ready";
  const selectedRow = getSelectedAuditEvidenceRow(auditEvidence);
  const caseBrief = buildAuditCaseBrief({
    packets: auditEvidence.packets,
    selectedRow,
  });
  const decision = buildAuditDecision({
    reviewMetric,
    selectedRow,
  });
  const timelineItems = buildAuditTimelineItems({
    packets: auditEvidence.packets,
    selectedRow,
  });

  return (
    <div className="space-y-4" data-admin-module="audit-evidence">
      <EvidenceCommandHeader
        actions={headerActions}
        eyebrow="Organisation evidence"
        title="Audit evidence cockpit"
        description="Review source-linked operating evidence for status changes, access activity, partner exports, webhook delivery, and operator decisions."
      >
        <div className="flex flex-wrap gap-1.5">
          {buildAuditHeaderChips({
            latestActivityLabel,
            selectedRow,
            statusLabel,
          }).map((chip) => (
            <EvidenceCommandChip chip={chip} key={`${chip.label}-${chip.tone ?? "neutral"}`} />
          ))}
        </div>
      </EvidenceCommandHeader>

      <EvidenceCommandMetricStrip
        ariaLabel="Audit evidence command metrics"
        metrics={buildAuditMetrics(auditEvidence.metrics)}
      />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <EvidenceCaseBriefPanel
          description={caseBrief.description}
          primaryFields={caseBrief.primaryFields}
          sections={caseBrief.sections}
          summary={caseBrief.summary}
          title={caseBrief.title}
        />
        <div className="grid min-w-0 content-start gap-4">
          <EvidenceDecisionPanel decision={decision} />
          <EvidenceTimeline
            description="Selected row context followed by the audit trail, export, and webhook packets behind this review."
            items={timelineItems}
            title="Evidence packet rail"
          />
        </div>
      </div>

      <section id="audit-evidence-workspace" className="scroll-mt-24">
        <AuditEvidenceWorkspace viewModel={auditEvidence} />
      </section>
    </div>
  );
}
