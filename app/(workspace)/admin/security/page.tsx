import {
  AdminFilterBar,
  AdminModuleHeader,
} from "@/components/product/admin-module";
import { SecurityEvidenceWorkspace } from "@/components/product/security-evidence-workspace";
import { buildSecurityEvidenceViewModel } from "@/lib/demo/admin-security-evidence";
import { requireDashboardWorkflowAccess } from "../../workflow-guard";
import { loadAdminGovernanceData } from "../admin-loaders";
import { StatusBadge } from "../governance-formatters";

export default async function Page() {
  await requireDashboardWorkflowAccess("admin");

  const { auditEvents, partnerReadiness, users } = await loadAdminGovernanceData();
  const securityEvidence = buildSecurityEvidenceViewModel({
    apiKeys: partnerReadiness.apiKeys,
    webhookSubscriptions: partnerReadiness.webhookSubscriptions,
    webhookEvents: partnerReadiness.webhookEvents,
    users,
    auditEvents,
  });

  return (
    <div className="space-y-4" data-admin-module="security">
      <AdminModuleHeader
        eyebrow="Platform operations"
        title="Security posture"
        description="Read-only platform evidence for credential lifecycle, webhook delivery integrity, privileged access, and access-related audit activity."
      />
      <AdminFilterBar>
        <StatusBadge tone={securityEvidence.posture.tone}>Security posture evidence</StatusBadge>
        <span className="text-sm text-muted-foreground">
          {securityEvidence.posture.summary} Rotation, retry, and incident handoff controls remain outside this read-only review surface.
        </span>
      </AdminFilterBar>
      <SecurityEvidenceWorkspace
        metrics={securityEvidence.metrics}
        posture={securityEvidence.posture}
        rows={securityEvidence.rows}
      />
    </div>
  );
}
