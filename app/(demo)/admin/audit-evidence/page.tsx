import Link from "next/link";
import {
  ClipboardCheckIcon,
  RadioTowerIcon,
  ShieldCheckIcon,
  UserCheckIcon,
} from "lucide-react";

import {
  AdminStatusBadge,
  getAdminToneClassName,
  type AdminTone,
} from "@/components/product/admin-module";
import { AuditEvidenceWorkspace } from "@/components/product/audit-evidence-workspace";
import { buttonVariants } from "@/components/ui/button";
import { buildAuditEvidenceViewModel } from "@/lib/product/audit-evidence";
import { cn } from "@/lib/utils";
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
  const partnerMetric = auditEvidence.metrics.find((metric) => metric.id === "partner-handoffs");
  const accessMetric = auditEvidence.metrics.find((metric) => metric.id === "access-events");
  const evidenceMetric = auditEvidence.metrics.find((metric) => metric.id === "evidence-volume");
  const latestActivityLabel = getLatestAuditActivityLabel({
    auditEvents,
    exportRuns: partnerReadiness.exportRuns,
    webhookEvents: partnerReadiness.webhookEvents,
  });
  const activeBlocker =
    reviewMetric?.value && reviewMetric.value !== "0"
      ? `${reviewMetric?.value ?? "0"} audit evidence rows need review`
      : "Audit evidence is ready";
  const taskCards = [
    {
      id: "review-load",
      title: "Review open evidence",
      description:
        "Inspect failed delivery, stale freshness, access changes, and records that need an audit decision.",
      href: "#audit-evidence-workspace",
      stateLabel: reviewMetric?.value ? `${reviewMetric.value} open alerts` : "No alerts",
      tone: (reviewMetric?.tone ?? "info") as AdminTone,
      Icon: ClipboardCheckIcon,
    },
    {
      id: "audit-trail",
      title: "Preserve audit trail",
      description:
        "Keep actor, role, entity, timestamp, and metadata evidence linked to every operating decision.",
      href: "#audit-evidence-workspace",
      stateLabel: evidenceMetric?.value ? `${evidenceMetric.value} rows` : "No rows",
      tone: (evidenceMetric?.tone ?? "info") as AdminTone,
      Icon: ShieldCheckIcon,
    },
    {
      id: "partner",
      title: "Confirm partner handoffs",
      description:
        "Review export checksums and webhook delivery records before external review or integration launch.",
      href: "/admin/partner-readiness",
      stateLabel: partnerMetric?.value ? `${partnerMetric.value} records` : "No records",
      tone: (partnerMetric?.tone ?? "info") as AdminTone,
      Icon: RadioTowerIcon,
    },
    {
      id: "access",
      title: "Trace access evidence",
      description:
        "Follow auth, role, user, session, and API events back to the users and roles workspace.",
      href: "/admin/users-roles",
      stateLabel: accessMetric?.value ? `${accessMetric.value} events` : "No events",
      tone: (accessMetric?.tone ?? "info") as AdminTone,
      Icon: UserCheckIcon,
    },
  ];

  return (
    <div className="space-y-4" data-admin-module="audit-evidence">
      <section className="overflow-hidden rounded-lg border border-neutral-900 bg-neutral-950 text-white shadow-sm">
        <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-neutral-400">
              Organisation operations
            </p>
            <h1 className="mt-2 break-words text-2xl font-semibold leading-tight sm:text-3xl">
              Audit evidence command centre
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-300">
              Review operating evidence for status changes, access activity, partner exports, webhook delivery, and operator decisions.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-normal text-neutral-400">
                  Active blocker
                </p>
                <p className="mt-1 break-words text-xl font-semibold">
                  {activeBlocker}
                </p>
              </div>
              <p className="text-xs text-neutral-400">
                Latest activity: {latestActivityLabel}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <a className={buttonVariants({ size: "sm" })} href="#audit-evidence-workspace">
              Review evidence
            </a>
            <Link
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                "border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white",
              )}
              href="/admin/export-schema"
            >
              Open export proof
            </Link>
          </div>
        </div>
        <div className="grid border-t border-white/10 bg-white/[0.03] sm:grid-cols-2 xl:grid-cols-4">
          {auditEvidence.metrics.map((metric) => (
            <div
              key={metric.id}
              className="min-w-0 border-t border-white/10 px-5 py-4 first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0"
            >
              <p className="text-xs font-semibold uppercase tracking-normal text-neutral-400">
                {metric.label}
              </p>
              <p className="mt-1 break-words text-2xl font-semibold">{metric.value}</p>
              <p className="mt-1 break-words text-xs leading-5 text-neutral-400">
                {metric.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Audit evidence task queue" className="grid gap-3">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Next actions
            </p>
            <h2 className="text-xl font-semibold text-foreground">Audit evidence queue</h2>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Read-only evidence stays linked to source records for governance review.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {taskCards.map(({ Icon, ...task }) => (
            <Link
              key={task.id}
              href={task.href}
              className="min-w-0 rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm transition hover:bg-bg-muted/60"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <span
                  className={cn(
                    "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border",
                    getAdminToneClassName(task.tone),
                  )}
                  aria-hidden="true"
                >
                  <Icon className="size-4" />
                </span>
                <AdminStatusBadge tone={task.tone}>{task.stateLabel}</AdminStatusBadge>
              </div>
              <h3 className="mt-4 break-words text-base font-semibold text-foreground">
                {task.title}
              </h3>
              <p className="mt-2 break-words text-sm leading-5 text-muted-foreground">
                {task.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section id="audit-evidence-workspace" className="scroll-mt-24">
        <AuditEvidenceWorkspace viewModel={auditEvidence} />
      </section>
    </div>
  );
}
