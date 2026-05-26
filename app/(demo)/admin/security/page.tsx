import {
  AdminFilterBar,
  AdminModuleHeader,
} from "@/components/product/admin-module";
import { ArrowUpRightIcon } from "lucide-react";
import { SecurityEvidenceWorkspace } from "@/components/product/security-evidence-workspace";
import { buildSecurityEvidenceViewModel } from "@/lib/demo/admin-security-evidence";
import type { SecurityEvidenceSourceReference } from "@/lib/product/security-evidence";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminGovernanceData } from "../admin-loaders";
import { StatusBadge } from "../governance-formatters";

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

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
      <SecuritySourceReferences references={securityEvidence.sourceReferences} />
    </div>
  );
}

function SecuritySourceReferences({
  references,
}: {
  references: SecurityEvidenceSourceReference[];
}) {
  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm sm:p-5">
      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Research basis
          </p>
          <h2 className="break-words text-lg font-semibold text-foreground">
            Security source references
          </h2>
        </div>
        <p className="max-w-2xl break-words text-sm text-muted-foreground">
          Security posture combines selected-row audit review with credential, RBAC, and advisor
          patterns from source-available consoles.
        </p>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
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
