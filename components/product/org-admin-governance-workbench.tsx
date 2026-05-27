"use client";

import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FileCheck2,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import {
  AdminStatusBadge,
  getAdminToneClassName,
  type AdminTone,
} from "@/components/product/admin-module";
import {
  ReportReviewQueue,
  type ReportReviewQueueActionInput,
} from "@/components/product/report-review-queue";
import { ReportReviewSummary } from "@/components/product/report-review-summary";
import { buttonVariants } from "@/components/ui/button";
import type {
  OrgAdminGovernanceWorkbenchModel,
  OrgAdminPartnerReadinessMetric,
} from "@/lib/product/org-admin-governance-workbench";
import type {
  PendingReportReview,
  PendingReportReviewSummary,
} from "@/lib/product/report-review";
import { cn } from "@/lib/utils";

export type OrgAdminStakeholderRow = {
  id: string;
  name: string;
  organization: string;
  role: string;
  focus: string;
  status: string;
  updatedLabel: string;
  href: string;
};

export type OrgAdminGovernanceWorkbenchProps = {
  model: OrgAdminGovernanceWorkbenchModel;
  pendingReportSummary: PendingReportReviewSummary;
  pendingReportReviews: PendingReportReview[];
  getReportDetailHref: (item: PendingReportReview) => string;
  onReview: (input: ReportReviewQueueActionInput) => Promise<unknown>;
  stakeholders: OrgAdminStakeholderRow[];
  partnerMetrics: OrgAdminPartnerReadinessMetric[];
};

function taskIcon(id: OrgAdminGovernanceWorkbenchModel["taskQueue"][number]["id"]) {
  const className = "size-4";

  if (id === "review-access") {
    return <UsersRound className={className} />;
  }

  if (id === "confirm-evidence") {
    return <ShieldCheck className={className} />;
  }

  if (id === "resolve-coverage") {
    return <FileCheck2 className={className} />;
  }

  return <ClipboardList className={className} />;
}

function partnerMetricTone(metric: OrgAdminPartnerReadinessMetric): AdminTone {
  if (metric.tone === "clear") {
    return "clear";
  }

  if (metric.tone === "info" || metric.tone === "watch") {
    return "info";
  }

  return "attention";
}

function actionLabelForEvidence(label: string) {
  if (label === "Export schema") {
    return "Open export schema";
  }

  if (label === "API contract") {
    return "Open API contract";
  }

  return `Open ${label.toLowerCase()}`;
}

export function OrgAdminGovernanceWorkbench({
  model,
  pendingReportSummary,
  pendingReportReviews,
  getReportDetailHref,
  onReview,
  stakeholders,
  partnerMetrics,
}: OrgAdminGovernanceWorkbenchProps) {
  return (
    <div className="grid min-w-0 gap-4 pb-4" data-role-dashboard="org_admin">
      <section className="overflow-hidden rounded-lg border border-neutral-900 bg-neutral-950 text-white shadow-sm">
        <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-neutral-400">
              {model.hero.scopeLabel}
            </p>
            <h1 className="mt-2 break-words text-2xl font-semibold leading-tight sm:text-3xl">
              Organisation Governance Workbench
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-300">
              {model.hero.description}
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-normal text-neutral-400">
                  Active blocker
                </p>
                <p className="mt-1 break-words text-xl font-semibold">
                  {model.hero.activeBlocker}
                </p>
              </div>
              <p className="text-xs text-neutral-400">
                Latest activity: {model.hero.latestActivityLabel}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <a className={buttonVariants({ size: "sm" })} href={model.hero.primaryActionHref}>
              {model.hero.primaryActionLabel}
            </a>
            <Link
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                "border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white",
              )}
              href={model.hero.secondaryActionHref}
            >
              {model.hero.secondaryActionLabel}
            </Link>
          </div>
        </div>
        <div className="grid border-t border-white/10 bg-white/[0.03] sm:grid-cols-2 xl:grid-cols-4">
          {model.readinessStrip.map((metric) => (
            <div
              key={metric.label}
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

      <section aria-label="Governance task queue" className="grid gap-3">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Next actions
            </p>
            <h2 className="text-xl font-semibold text-foreground">Governance task queue</h2>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Work readiness, review, coverage, access, and partner proof from one queue.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {model.taskQueue.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="min-w-0 rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm transition hover:bg-bg-muted/60"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <span
                  className={cn(
                    "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border",
                    getAdminToneClassName(item.tone),
                  )}
                  aria-hidden="true"
                >
                  {taskIcon(item.id)}
                </span>
                <AdminStatusBadge tone={item.tone}>{item.stateLabel}</AdminStatusBadge>
              </div>
              <h3 className="mt-4 break-words text-base font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 break-words text-sm leading-5 text-muted-foreground">
                {item.description}
              </p>
            </a>
          ))}
        </div>
      </section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">
        <section id="report-review-lane" aria-label="Report review lane" className="grid gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Field to governance
            </p>
            <h2 className="text-xl font-semibold text-foreground">Report review lane</h2>
            <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">
              Submitted field evidence stays here until the organisation accepts or rejects it.
            </p>
          </div>
          <div id="admin-review-pressure">
            <ReportReviewSummary
              summary={pendingReportSummary}
              title="Governance review pressure"
              description="Pending field reports block organisation readiness until reviewed."
            />
          </div>
          <ReportReviewQueue
            items={pendingReportReviews}
            getReportDetailHref={getReportDetailHref}
            onReview={onReview}
            title="Governance backstop queue"
            description="Accept or reject field evidence before organisation readiness moves forward."
          />
        </section>

        <div className="grid min-w-0 gap-4">
          <section
            id="coverage-ledger"
            aria-label="Coverage ledger"
            className="rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
          >
            <div className="border-b border-border-subtle px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Coverage ledger
              </p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">
                Readiness evidence map
              </h2>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Open the source module for the exact clinic, user, partner, or audit proof.
              </p>
            </div>
            <div className="divide-y divide-border-subtle">
              {model.evidenceLinks.map((link) => (
                <div
                  key={link.href}
                  className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words text-sm font-semibold text-foreground">
                        {link.label}
                      </h3>
                      <AdminStatusBadge tone={link.tone}>{link.stateLabel}</AdminStatusBadge>
                    </div>
                    <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
                      {link.detail}
                    </p>
                  </div>
                  <Link
                    href={link.href}
                    className="inline-flex w-fit items-center gap-1.5 rounded-md border border-border-subtle bg-bg-default px-3 py-2 text-sm font-medium text-foreground transition hover:bg-bg-muted"
                  >
                    {actionLabelForEvidence(link.label)}
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <section
            id="access-hygiene"
            aria-label="Stakeholder activity queue"
            className="rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
          >
            <div className="border-b border-border-subtle px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Access hygiene
              </p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">
                Stakeholder follow-up
              </h2>
            </div>
            <div className="divide-y divide-border-subtle">
              {stakeholders.map((stakeholder) => (
                <div
                  key={stakeholder.id}
                  className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-foreground">
                      {stakeholder.name}
                    </p>
                    <p className="mt-1 break-words text-sm text-muted-foreground">
                      {stakeholder.organization} · {stakeholder.role}
                    </p>
                    <p className="mt-1 break-words text-xs text-muted-foreground">
                      {stakeholder.focus} · Updated {stakeholder.updatedLabel}
                    </p>
                  </div>
                  <Link
                    href={stakeholder.href}
                    aria-label={`Open lead detail for ${stakeholder.name}`}
                    className={buttonVariants({ size: "sm", variant: "outline" })}
                  >
                    Open lead detail
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section
        id="evidence-strip"
        aria-label="Readiness evidence strip"
        className="rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
      >
        <div className="border-b border-border-subtle px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Evidence strip
          </p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            Partner and audit proof
          </h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            These checks keep the organisation handoff tied to export, webhook, API, audit records,
            and operating evidence.
          </p>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          {partnerMetrics.map((metric) => {
            const tone = partnerMetricTone(metric);

            return (
              <div
                key={metric.label}
                className={cn(
                  "min-w-0 rounded-lg border px-4 py-3",
                  getAdminToneClassName(tone),
                )}
              >
                <p className="break-words text-xs font-semibold uppercase tracking-normal text-current/70">
                  {metric.label}
                </p>
                <p className="mt-1 break-words text-2xl font-semibold leading-tight">
                  {metric.value}
                </p>
                {metric.detail ? (
                  <p className="mt-2 break-words text-xs leading-4 text-current/70">
                    {metric.detail}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
