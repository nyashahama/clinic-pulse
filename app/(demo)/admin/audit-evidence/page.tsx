import { ArrowUpRightIcon } from "lucide-react";

import {
  AdminFilterBar,
  AdminModuleHeader,
} from "@/components/product/admin-module";
import { AuditEvidenceWorkspace } from "@/components/product/audit-evidence-workspace";
import {
  buildAuditEvidenceViewModel,
  type AuditEvidenceSourceReference,
} from "@/lib/product/audit-evidence";
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
      <AuditEvidenceSourceReferences references={auditEvidence.sourceReferences} />
    </div>
  );
}

function AuditEvidenceSourceReferences({
  references,
}: {
  references: AuditEvidenceSourceReference[];
}) {
  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm sm:p-5">
      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Research basis
          </p>
          <h2 className="break-words text-lg font-semibold text-foreground">
            Audit-evidence source references
          </h2>
        </div>
        <p className="max-w-2xl break-words text-sm text-muted-foreground">
          Audit evidence combines filtered log review, selected-record inspection, effective-access
          audit, and timeline patterns from source-available operations consoles.
        </p>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        {references.map((reference) => (
          <a
            key={reference.source}
            className="group grid min-w-0 gap-2 rounded-lg border border-border-subtle bg-bg-muted p-3 transition hover:bg-bg-default"
            href={reference.href}
            rel="noreferrer"
            target="_blank"
          >
            <span className="flex min-w-0 items-center justify-between gap-2">
              <span className="break-words text-sm font-semibold text-foreground">
                {reference.source}
              </span>
              <ArrowUpRightIcon
                className="size-3.5 shrink-0 text-muted-foreground transition group-hover:text-foreground"
                aria-hidden="true"
              />
            </span>
            <span className="break-words text-xs leading-4 text-muted-foreground">
              {reference.role}
            </span>
            <span className="inline-flex w-fit rounded-md border border-border-subtle bg-bg-default px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
              {reference.licenseUse.replace("-", " ")}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
