import { AuditEvidenceWorkspace } from "@/components/product/audit-evidence-workspace";
import { EvidenceOperationsBriefing } from "@/components/product/evidence-operations-briefing";
import { buildAuditEvidenceViewModel } from "@/lib/product/audit-evidence";
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

  return (
    <div className="space-y-4" data-admin-module="audit-evidence">
      <EvidenceOperationsBriefing
        eyebrow="Organisation evidence"
        title="Audit evidence cockpit"
        description="Review source-linked operating evidence for status changes, access activity, partner exports, webhook delivery, and operator decisions."
        statusLabel={statusLabel}
        statusDetail="Every row stays tied to its source record, actor, entity, timestamp, metadata, and next review step."
        latestActivityLabel={latestActivityLabel}
        packetRailLabel="Evidence packet rail"
        routingLabel="Review routing"
        metrics={auditEvidence.metrics}
        packets={auditEvidence.packets}
        routes={[
          {
            id: "workspace",
            label: "Review evidence rows",
            detail: "Open the selected source row, raw facts, and audit basis.",
            href: "#audit-evidence-workspace",
            tone: reviewMetric?.tone ?? "info",
          },
          {
            id: "security",
            label: "Open security posture",
            detail: "Trace credential lifecycle, receiver integrity, and privileged access evidence.",
            href: "/admin/security",
            tone: "attention",
          },
          {
            id: "access",
            label: "Trace users and roles",
            detail: "Follow auth, role, user, session, and API events back to access owners.",
            href: "/admin/users-roles",
            tone: "info",
          },
          {
            id: "export",
            label: "Open export proof",
            detail: "Inspect checksums and partner export package records.",
            href: "/admin/export-schema",
            tone: "clear",
          },
        ]}
        actions={[
          {
            label: "Review evidence",
            href: "#audit-evidence-workspace",
          },
          {
            label: "Open security posture",
            href: "/admin/security",
            variant: "secondary",
          },
        ]}
      />

      <section id="audit-evidence-workspace" className="scroll-mt-24">
        <AuditEvidenceWorkspace viewModel={auditEvidence} />
      </section>
    </div>
  );
}
