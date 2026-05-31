import Link from "next/link";
import {
  ActivityIcon,
  ArrowRightIcon,
  CalendarClockIcon,
  DatabaseIcon,
  DownloadIcon,
  FileSearchIcon,
  FingerprintIcon,
  RadioTowerIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react";

import { AuditEvidenceWorkspace } from "@/components/product/audit-evidence-workspace";
import {
  buildAuditEvidenceViewModel,
  getDefaultAuditEvidenceRowId,
  type AuditEvidenceLane,
  type AuditEvidenceMetric,
  type AuditEvidencePacket,
  type AuditEvidenceTone,
  type AuditEvidenceViewModel,
} from "@/lib/product/audit-evidence";
import { cn } from "@/lib/utils";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminGovernanceData } from "../admin-loaders";
import { formatCount, formatDateTime } from "../governance-formatters";

type AuditActivityInput = {
  auditEvents: Awaited<ReturnType<typeof loadAdminGovernanceData>>["auditEvents"];
  exportRuns: Awaited<ReturnType<typeof loadAdminGovernanceData>>["partnerReadiness"]["exportRuns"];
  webhookEvents: Awaited<ReturnType<typeof loadAdminGovernanceData>>["partnerReadiness"]["webhookEvents"];
};

const toneBadgeClassName: Record<AuditEvidenceTone, string> = {
  clear:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
  attention:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
  blocked:
    "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
  info: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
};

const toneSurfaceClassName: Record<AuditEvidenceTone, string> = {
  clear:
    "border-emerald-200 bg-emerald-50/55 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-100",
  attention:
    "border-amber-200 bg-amber-50/60 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-100",
  blocked:
    "border-destructive/35 bg-destructive/10 text-destructive dark:border-destructive/50 dark:bg-destructive/20",
  info: "border-sky-200 bg-sky-50/55 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/25 dark:text-sky-100",
};

const toneRailClassName: Record<AuditEvidenceTone, string> = {
  clear: "bg-emerald-500",
  attention: "bg-amber-500",
  blocked: "bg-destructive",
  info: "bg-sky-500",
};

const auditLaneOrder: AuditEvidenceLane[] = [
  "access",
  "report",
  "sync",
  "export",
  "webhook",
  "operating",
];

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

function AuditMetricIcon({ metric }: { metric: AuditEvidenceMetric }) {
  const className = "size-4";

  if (metric.id === "review-load") {
    return metric.tone === "clear" ? (
      <ShieldCheckIcon className={className} />
    ) : (
      <FileSearchIcon className={className} />
    );
  }

  if (metric.id === "partner-handoffs") {
    return <DatabaseIcon className={className} />;
  }

  if (metric.id === "access-events") {
    return <UserRoundIcon className={className} />;
  }

  return <ActivityIcon className={className} />;
}

function PacketIcon({ packet }: { packet: AuditEvidencePacket }) {
  const className = "size-4";

  if (packet.id === "audit-trail") {
    return <FingerprintIcon className={className} />;
  }

  if (packet.id === "webhook-delivery") {
    return <RadioTowerIcon className={className} />;
  }

  return <DownloadIcon className={className} />;
}

function ToneBadge({
  children,
  tone,
}: {
  children: string;
  tone: AuditEvidenceTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-start rounded-md border px-2 py-0.5 text-left text-xs font-medium",
        toneBadgeClassName[tone],
      )}
    >
      <span className="min-w-0 break-words">{children}</span>
    </span>
  );
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
  const selectedRow = getSelectedAuditEvidenceRow(auditEvidence);
  const selectedTone = selectedRow?.stateTone ?? reviewMetric?.tone ?? "info";
  const laneSummaries = auditLaneOrder.map((lane) => ({
    lane,
    label: auditLaneLabel(lane),
    count: auditEvidence.rows.filter((row) => row.lane === lane).length,
  }));

  return (
    <div className="space-y-4" data-admin-module="audit-evidence">
      <section
        aria-label="Audit event ledger"
        className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
      >
        <div className="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
          <div className="grid min-w-0 gap-5 p-4 sm:p-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Organisation evidence
              </p>
              <h1 className="mt-2 break-words text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
                Audit event ledger
              </h1>
              <p className="mt-3 max-w-4xl break-words text-sm leading-6 text-muted-foreground">
                Search actor, source, lane, timestamp, and packet context before closing an
                administrative review.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ToneBadge tone={selectedTone}>{statusLabel}</ToneBadge>
                <ToneBadge tone="info">{`Latest activity ${latestActivityLabel}`}</ToneBadge>
                <ToneBadge tone={selectedTone}>
                  {selectedRow ? `${selectedRow.sourceLabel} selected` : "No row selected"}
                </ToneBadge>
              </div>
            </div>

            <section aria-label="Audit query builder" className="grid gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <FileSearchIcon className="size-4 shrink-0 text-muted-foreground" />
                <h2 className="break-words text-base font-semibold leading-tight text-foreground">
                  Audit query builder
                </h2>
              </div>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                {auditEvidence.metrics.map((metric) => (
                  <Link
                    className={cn(
                      "group min-w-0 rounded-lg border p-3 transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/45",
                      toneSurfaceClassName[metric.tone],
                    )}
                    href={auditMetricHref(metric)}
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
                        <AuditMetricIcon metric={metric} />
                      </span>
                    </div>
                    <p className="mt-2 break-words text-xs leading-4 text-current/75">
                      {metric.detail}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-current/75 transition group-hover:text-current">
                      {auditMetricActionLabel(metric)}
                      <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {laneSummaries.map((lane) => (
                  <div
                    className="min-w-0 rounded-lg border border-border-subtle bg-bg-muted/30 px-3 py-2"
                    key={lane.lane}
                  >
                    <p className="break-words text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                      {lane.label}
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold text-foreground">
                      {formatCount(lane.count)} rows
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside
            aria-label="Selected event record"
            className="border-t border-border-subtle bg-bg-muted/35 p-4 sm:p-5 xl:border-l xl:border-t-0"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Selected event record
                </p>
                <h2 className="mt-1 break-words text-lg font-semibold leading-tight text-foreground">
                  {selectedRow?.title ?? "No audit event selected"}
                </h2>
                <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
                  {selectedRow?.subtitle ??
                    "Select an audit row below to inspect its source, actor, entity, and raw facts."}
                </p>
              </div>
              <FingerprintIcon className="size-5 shrink-0 text-teal-700" aria-hidden="true" />
            </div>

            {selectedRow ? (
              <div className="mt-4 grid gap-3">
                <div
                  className={cn(
                    "rounded-lg border border-l-4 bg-bg-default p-3",
                    selectedRow.stateTone === "clear"
                      ? "border-l-emerald-500"
                      : selectedRow.stateTone === "blocked"
                        ? "border-l-destructive"
                        : "border-l-amber-500",
                  )}
                >
                  <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                    Review state
                  </p>
                  <p className="mt-2 break-words text-sm font-semibold text-foreground">
                    {selectedRow.reviewState}
                  </p>
                  <p className="mt-1 break-words text-xs leading-4 text-muted-foreground">
                    {selectedRow.nextStep}
                  </p>
                </div>

                <div className="grid gap-2">
                  {selectedRow.rawFacts.slice(0, 5).map((fact) => (
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
                  className="inline-flex min-w-0 items-center justify-between gap-2 rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={selectedRow.sourceHref}
                >
                  <span className="truncate">Open source evidence</span>
                  <ArrowRightIcon className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      <section
        aria-label="Evidence export and retention"
        className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
      >
        <div className="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
          <div className="grid min-w-0 gap-3 p-4 sm:p-5">
            <div className="flex min-w-0 items-center gap-2">
              <DatabaseIcon className="size-4 shrink-0 text-muted-foreground" />
              <h2 className="break-words text-base font-semibold leading-tight text-foreground">
                Evidence export and retention
              </h2>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              {auditEvidence.packets.map((packet) => (
                <div
                  className={cn(
                    "relative min-w-0 rounded-lg border p-3",
                    toneSurfaceClassName[packet.tone],
                  )}
                  key={packet.id}
                >
                  <span
                    className={cn("absolute inset-x-0 top-0 h-1", toneRailClassName[packet.tone])}
                    aria-hidden="true"
                  />
                  <div className="flex min-w-0 items-start justify-between gap-3 pt-1">
                    <div className="min-w-0">
                      <p className="break-words text-xs font-semibold uppercase tracking-normal text-current/70">
                        {packet.label}
                      </p>
                      <p className="mt-1 break-words text-xl font-semibold leading-tight">
                        {packet.value}
                      </p>
                    </div>
                    <span className="shrink-0 text-current/70" aria-hidden="true">
                      <PacketIcon packet={packet} />
                    </span>
                  </div>
                  <p className="mt-2 break-words text-xs leading-4 text-current/75">
                    {packet.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-border-subtle bg-bg-muted/35 p-4 sm:p-5 xl:border-l xl:border-t-0">
            <div className="flex min-w-0 items-center gap-2">
              <CalendarClockIcon className="size-4 shrink-0 text-muted-foreground" />
              <h2 className="break-words text-base font-semibold leading-tight text-foreground">
                Retention window
              </h2>
            </div>
            <p className="mt-2 break-words text-sm leading-5 text-muted-foreground">
              Recent audit, export, and webhook records stay queryable in the workspace below; use
              source links when a row needs full operational context.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                className="inline-flex min-w-0 items-center justify-between gap-2 rounded-md bg-teal-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href="#audit-evidence-workspace"
              >
                <span className="truncate">Review evidence</span>
                <ArrowRightIcon className="size-3.5" aria-hidden="true" />
              </Link>
              <Link
                className="inline-flex min-w-0 items-center justify-between gap-2 rounded-md border border-border-subtle bg-bg-default px-3 py-1.5 text-xs font-medium text-content-default transition hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href="/admin/security"
              >
                <span className="truncate">Open security posture</span>
                <ArrowRightIcon className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="audit-evidence-workspace" className="scroll-mt-24">
        <AuditEvidenceWorkspace viewModel={auditEvidence} />
      </section>
    </div>
  );
}
