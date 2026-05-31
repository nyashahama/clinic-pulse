import { EvidenceOperationsBriefing } from "@/components/product/evidence-operations-briefing";
import { SecurityEvidenceWorkspace } from "@/components/product/security-evidence-workspace";
import { buildSecurityEvidenceViewModel } from "@/lib/demo/admin-security-evidence";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminGovernanceData } from "../admin-loaders";
import { formatDateTime } from "../governance-formatters";

type SecurityActivityInput = Awaited<ReturnType<typeof loadAdminGovernanceData>>;

function getLatestSecurityActivityLabel({
  auditEvents,
  partnerReadiness,
  users,
}: SecurityActivityInput) {
  const latest = [
    ...auditEvents.map((event) => event.createdAt),
    ...partnerReadiness.apiKeys.flatMap((apiKey) => [
      apiKey.updatedAt,
      apiKey.lastUsedAt,
      apiKey.revokedAt,
      apiKey.createdAt,
    ]),
    ...partnerReadiness.webhookSubscriptions.flatMap((subscription) => [
      subscription.updatedAt,
      subscription.lastTestedAt,
      subscription.createdAt,
    ]),
    ...partnerReadiness.webhookEvents.flatMap((event) => [
      event.deliveredAt,
      event.createdAt,
    ]),
    ...users.flatMap((user) => [user.lastSeenAt, user.createdAt]),
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => right.getTime() - left.getTime())[0];

  return latest ? formatDateTime(latest.toISOString()) : "Unavailable";
}

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  const governanceData = await loadAdminGovernanceData();
  const { auditEvents, partnerReadiness, users } = governanceData;
  const securityEvidence = buildSecurityEvidenceViewModel({
    apiKeys: partnerReadiness.apiKeys,
    webhookSubscriptions: partnerReadiness.webhookSubscriptions,
    webhookEvents: partnerReadiness.webhookEvents,
    users,
    auditEvents,
  });
  const credentialMetric = securityEvidence.metrics.find(
    (metric) => metric.id === "credential-exposure",
  );
  const webhookMetric = securityEvidence.metrics.find(
    (metric) => metric.id === "webhook-delivery",
  );
  const privilegedMetric = securityEvidence.metrics.find(
    (metric) => metric.id === "privileged-access",
  );
  const auditMetric = securityEvidence.metrics.find(
    (metric) => metric.id === "access-audit-trail",
  );

  return (
    <div className="space-y-4" data-admin-module="security">
      <EvidenceOperationsBriefing
        eyebrow="Platform evidence"
        title="Security posture cockpit"
        description="Inspect credential lifecycle, webhook receiver integrity, privileged access, and access-related audit activity from one evidence surface."
        statusLabel={securityEvidence.posture.summary}
        statusDetail="Rotation, retry, and incident handoff controls stay outside this read-only surface; source-linked evidence remains visible for review."
        latestActivityLabel={getLatestSecurityActivityLabel(governanceData)}
        packetRailLabel="Credential lifecycle rail"
        routingLabel="Privileged access watch"
        metrics={securityEvidence.metrics}
        packets={[
          {
            id: "credential",
            label: "Credential lifecycle rail",
            value: credentialMetric?.value ?? "0",
            detail: credentialMetric?.detail ?? "No credential evidence",
            tone: credentialMetric?.tone ?? "info",
          },
          {
            id: "webhook",
            label: "Receiver integrity",
            value: webhookMetric?.value ?? "0",
            detail: webhookMetric?.detail ?? "No receiver evidence",
            tone: webhookMetric?.tone ?? "info",
          },
          {
            id: "privileged",
            label: "Privileged access watch",
            value: privilegedMetric?.value ?? "0",
            detail: privilegedMetric?.detail ?? "No privileged users",
            tone: privilegedMetric?.tone ?? "info",
          },
          {
            id: "audit",
            label: "Access audit trail",
            value: auditMetric?.value ?? "0",
            detail: auditMetric?.detail ?? "No access audit evidence",
            tone: auditMetric?.tone ?? "info",
          },
        ]}
        routes={[
          {
            id: "workspace",
            label: "Review security evidence",
            detail: "Inspect source rows, raw facts, and current review state.",
            href: "#security-evidence-workspace",
            tone: securityEvidence.posture.tone,
          },
          {
            id: "audit",
            label: "Open audit evidence",
            detail: "Move from security posture into the full audit event trail.",
            href: "/admin/audit-evidence",
            tone: "info",
          },
          {
            id: "access",
            label: "Open users and roles",
            detail: "Review owners, roles, stale sessions, and access lifecycle controls.",
            href: "/admin/users-roles",
            tone: privilegedMetric?.tone ?? "attention",
          },
        ]}
        actions={[
          {
            label: "Review security evidence",
            href: "#security-evidence-workspace",
          },
          {
            label: "Open audit evidence",
            href: "/admin/audit-evidence",
            variant: "secondary",
          },
        ]}
      />

      <section id="security-evidence-workspace" className="scroll-mt-24">
        <SecurityEvidenceWorkspace
          metrics={securityEvidence.metrics}
          posture={securityEvidence.posture}
          rows={securityEvidence.rows}
        />
      </section>
    </div>
  );
}
