import {
  AdminFilterBar,
  AdminModuleHeader,
} from "@/components/product/admin-module";
import { AuditEvidenceWorkspace } from "@/components/product/audit-evidence-workspace";
import { buildAuditEvidenceViewModel } from "@/lib/product/audit-evidence";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminGovernanceData } from "../admin-loaders";
import { StatusBadge } from "../governance-formatters";

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

  return (
    <div className="space-y-4" data-admin-module="audit-evidence">
      <AdminModuleHeader
        eyebrow="Organisation operations"
        title="Audit evidence"
        description="Read-only operating evidence for status changes, access activity, partner exports, webhook delivery, and operator decisions."
      />
      <AdminFilterBar>
        <StatusBadge tone={reviewMetric?.tone ?? "info"}>Audit trail evidence</StatusBadge>
        <span className="text-sm text-muted-foreground">
          {reviewMetric?.value ?? "0"} rows need review across access, freshness, export, and webhook evidence.
        </span>
      </AdminFilterBar>
      <AuditEvidenceWorkspace viewModel={auditEvidence} />
    </div>
  );
}
