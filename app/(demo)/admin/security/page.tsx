import Link from "next/link";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  FileTextIcon,
  KeyRoundIcon,
  RadioTowerIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react";

import { SecurityEvidenceWorkspace } from "@/components/product/security-evidence-workspace";
import { buttonVariants } from "@/components/ui/button";
import { buildSecurityEvidenceViewModel } from "@/lib/demo/admin-security-evidence";
import type {
  SecurityEvidenceTone,
  SecuritySummaryMetric,
} from "@/lib/product/security-evidence";
import { cn } from "@/lib/utils";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminGovernanceData } from "../admin-loaders";

const toneBadgeClassName: Record<SecurityEvidenceTone, string> = {
  clear:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
  attention:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
  blocked:
    "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
  info: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
};

const toneSurfaceClassName: Record<SecurityEvidenceTone, string> = {
  clear:
    "border-emerald-200 bg-emerald-50/55 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-100",
  attention:
    "border-amber-200 bg-amber-50/60 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-100",
  blocked:
    "border-destructive/35 bg-destructive/10 text-destructive dark:border-destructive/50 dark:bg-destructive/20",
  info: "border-sky-200 bg-sky-50/55 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/25 dark:text-sky-100",
};

function metricIcon(metric: SecuritySummaryMetric) {
  const className = "size-4";

  if (metric.id === "credential-exposure") {
    return <KeyRoundIcon className={className} />;
  }

  if (metric.id === "webhook-delivery") {
    return <RadioTowerIcon className={className} />;
  }

  if (metric.id === "privileged-access") {
    return <UserRoundIcon className={className} />;
  }

  if (metric.id === "access-audit-trail") {
    return <ActivityIcon className={className} />;
  }

  return <AlertTriangleIcon className={className} />;
}

function metricHref(metric: SecuritySummaryMetric) {
  if (metric.id === "credential-exposure" || metric.id === "webhook-delivery") {
    return "/admin/integrations";
  }

  if (metric.id === "privileged-access") {
    return "/admin/users-roles";
  }

  if (metric.id === "access-audit-trail") {
    return "/admin/audit-evidence";
  }

  return "#security-evidence-workspace";
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
  const leadEvidence =
    securityEvidence.rows.find(
      (row) => row.stateTone === "blocked" || row.stateTone === "attention",
    ) ?? securityEvidence.rows[0];

  return (
    <div className="space-y-4" data-admin-module="security">
      <section
        aria-label="Security risk surface"
        className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
      >
        <div className="grid min-w-0 gap-0 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
          <div className="grid min-w-0 gap-5 p-4 sm:p-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Platform security
              </p>
              <h1 className="mt-2 break-words text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
                Security risk surface
              </h1>
              <p className="mt-3 max-w-4xl break-words text-sm leading-6 text-muted-foreground">
                Review credentials, webhook delivery, privileged roles, and audit activity as
                separate risk lanes before trusting the platform handoff.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={cn(
                    "inline-flex max-w-full items-start rounded-md border px-2 py-0.5 text-left text-xs font-medium",
                    toneBadgeClassName[securityEvidence.posture.tone],
                  )}
                >
                  <span className="min-w-0 break-words">{securityEvidence.posture.summary}</span>
                </span>
                <span className="inline-flex max-w-full items-start rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-left text-xs font-medium text-sky-950">
                  <span className="min-w-0 break-words">
                    {securityEvidence.rows.length} source-linked rows
                  </span>
                </span>
              </div>
            </div>

            <section aria-label="Credential and access risk lanes" className="grid gap-3">
              <div className="min-w-0">
                <h2 className="break-words text-base font-semibold leading-tight text-foreground">
                  Credential and access risk lanes
                </h2>
                <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
                  Separate control lanes keep credential, webhook, role, and audit risk from
                  collapsing into one generic posture score.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {securityEvidence.metrics.map((metric) => (
                  <Link
                    className={cn(
                      "group min-w-0 rounded-lg border p-3 transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/45",
                      toneSurfaceClassName[metric.tone],
                    )}
                    href={metricHref(metric)}
                    key={metric.id}
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-xs font-semibold uppercase tracking-normal text-current/70">
                          {metric.label}
                        </p>
                        <p className="mt-1 break-words text-2xl font-semibold leading-tight">
                          {metric.value}
                        </p>
                      </div>
                      <span className="shrink-0 text-current/70" aria-hidden="true">
                        {metricIcon(metric)}
                      </span>
                    </div>
                    <p className="mt-2 break-words text-xs leading-4 text-current/75">
                      {metric.detail}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <aside
            aria-label="Security lead evidence inspector"
            className="border-t border-border-subtle bg-bg-muted/35 p-4 sm:p-5 xl:border-l xl:border-t-0"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Security lead evidence inspector
                </p>
                <h2 className="mt-1 break-words text-lg font-semibold leading-tight text-foreground">
                  {leadEvidence?.subject ?? "No security evidence selected"}
                </h2>
                <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
                  {leadEvidence?.subjectDetail ??
                    "Security evidence appears here when source-linked rows are available."}
                </p>
              </div>
              <ShieldCheckIcon className="size-5 shrink-0 text-teal-700" aria-hidden="true" />
            </div>

            {leadEvidence ? (
              <div className="mt-4 grid gap-3">
                <div
                  className={cn(
                    "rounded-lg border border-l-4 bg-bg-default p-3",
                    leadEvidence.stateTone === "clear"
                      ? "border-l-emerald-500"
                      : leadEvidence.stateTone === "blocked"
                        ? "border-l-destructive"
                        : "border-l-amber-500",
                  )}
                >
                  <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                    Current risk state
                  </p>
                  <p className="mt-2 break-words text-sm font-semibold text-foreground">
                    {leadEvidence.stateLabel}
                  </p>
                  <p className="mt-1 break-words text-xs leading-4 text-muted-foreground">
                    {leadEvidence.nextStep}
                  </p>
                </div>

                <div className="grid gap-2">
                  {leadEvidence.rawFacts.slice(0, 4).map((fact) => (
                    <div
                      className="min-w-0 rounded-lg border border-border-subtle bg-bg-default px-3 py-2"
                      key={fact.label}
                    >
                      <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                        {fact.label}
                      </p>
                      <p className="mt-1 break-words text-sm font-medium text-foreground">
                        {fact.value}
                      </p>
                    </div>
                  ))}
                </div>

                <Link
                  className={cn(buttonVariants({ size: "sm" }), "justify-between")}
                  href={leadEvidence.sourceHref}
                >
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <FileTextIcon className="size-3.5" />
                    <span className="truncate">Open source evidence</span>
                  </span>
                  <ArrowRightIcon className="size-3.5" />
                </Link>
              </div>
            ) : null}
          </aside>
        </div>
      </section>

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
