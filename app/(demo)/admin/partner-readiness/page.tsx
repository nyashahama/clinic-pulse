import Link from "next/link";
import {
  FileJsonIcon,
  KeyRoundIcon,
  RadioTowerIcon,
  ShieldCheckIcon,
} from "lucide-react";

import {
  AdminStatusBadge,
  getAdminToneClassName,
  type AdminTone,
} from "@/components/product/admin-module";
import { buttonVariants } from "@/components/ui/button";
import { buildPartnerReadinessModel } from "@/lib/demo/partner-readiness";
import { cn } from "@/lib/utils";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminPartnerReadiness } from "../admin-loaders";
import {
  formatCount,
  formatDateTime,
} from "../governance-formatters";
import { PartnerReadinessPageClient } from "./page-client";

function getLatestPartnerActivityLabel(readiness: Awaited<ReturnType<typeof loadAdminPartnerReadiness>>) {
  const latest = [
    ...readiness.apiKeys.flatMap((apiKey) => [
      apiKey.updatedAt,
      apiKey.lastUsedAt,
      apiKey.revokedAt,
      apiKey.createdAt,
    ]),
    ...readiness.webhookSubscriptions.flatMap((subscription) => [
      subscription.updatedAt,
      subscription.lastTestedAt,
      subscription.createdAt,
    ]),
    ...readiness.webhookEvents.flatMap((event) => [
      event.deliveredAt,
      event.createdAt,
    ]),
    ...readiness.exportRuns.map((exportRun) => exportRun.createdAt),
    ...readiness.integrationChecks.map((check) => check.checkedAt),
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => right.getTime() - left.getTime())[0];

  return latest ? formatDateTime(latest.toISOString()) : "Unavailable";
}

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  const partnerReadiness = await loadAdminPartnerReadiness();
  const model = buildPartnerReadinessModel(partnerReadiness);
  const activeApiKeys = partnerReadiness.apiKeys.filter((apiKey) => !apiKey.revokedAt).length;
  const exportPackages = partnerReadiness.exportRuns.length;
  const webhookPreviews = partnerReadiness.webhookEvents.length;
  const failingChecks = partnerReadiness.integrationChecks.filter(
    (check) => check.status.toLowerCase() === "failing",
  ).length;
  const latestActivityLabel = getLatestPartnerActivityLabel(partnerReadiness);
  const activeBlocker =
    model.severity === "clear"
      ? "Partner handoff evidence is ready"
      : model.title;
  const taskCards = [
    {
      id: "api-keys",
      title: "Confirm API access",
      description:
        "Check active keys, required scopes, allowed districts, and owner evidence before partner handoff.",
      href: "#partner-readiness-workspace",
      stateLabel: activeApiKeys ? `${formatCount(activeApiKeys)} active` : "Create key",
      tone: activeApiKeys ? "clear" : "attention",
      Icon: KeyRoundIcon,
    },
    {
      id: "exports",
      title: "Generate export proof",
      description:
        "Keep a current JSON or CSV package attached to the evidence trail for external review.",
      href: "#partner-readiness-workspace",
      stateLabel: exportPackages ? `${formatCount(exportPackages)} packages` : "Missing",
      tone: exportPackages ? "clear" : "attention",
      Icon: FileJsonIcon,
    },
    {
      id: "webhooks",
      title: "Test webhook delivery",
      description:
        "Record receiver tests and preview events before treating integration evidence as ready.",
      href: "#partner-readiness-workspace",
      stateLabel: webhookPreviews ? `${formatCount(webhookPreviews)} previews` : "Test needed",
      tone: webhookPreviews ? "clear" : "info",
      Icon: RadioTowerIcon,
    },
    {
      id: "checks",
      title: "Clear integration checks",
      description:
        "Resolve failing or attention checks before opening the partner integration workspace.",
      href: "/admin/integrations",
      stateLabel: failingChecks ? `${formatCount(failingChecks)} failing` : "Ready",
      tone: failingChecks ? "attention" : "clear",
      Icon: ShieldCheckIcon,
    },
  ] satisfies Array<{
    id: string;
    title: string;
    description: string;
    href: string;
    stateLabel: string;
    tone: AdminTone;
    Icon: typeof KeyRoundIcon;
  }>;

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-lg border border-neutral-900 bg-neutral-950 text-white shadow-sm">
        <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-neutral-400">
              Organisation operations
            </p>
            <h1 className="mt-2 break-words text-2xl font-semibold leading-tight sm:text-3xl">
              Partner readiness command centre
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-300">
              Prepare API keys, export packages, webhook previews, and integration checks before sharing partner handoff evidence.
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
            <a className={buttonVariants({ size: "sm" })} href="#partner-readiness-workspace">
              Open handoff workspace
            </a>
            <Link
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                "border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white",
              )}
              href="/admin/integrations"
            >
              Open integrations
            </Link>
          </div>
        </div>
        <div className="grid border-t border-white/10 bg-white/[0.03] sm:grid-cols-2 xl:grid-cols-4">
          {model.metrics.map((metric) => (
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

      <section aria-label="Partner readiness task queue" className="grid gap-3">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Next actions
            </p>
            <h2 className="text-xl font-semibold text-foreground">Partner handoff queue</h2>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Exported data depends on source freshness, review state, and sync evidence.{" "}
            <Link href="/legal/safety" className="underline underline-offset-4">
              Read safety notes
            </Link>
            .
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

      <section id="partner-readiness-workspace" className="scroll-mt-24">
        <PartnerReadinessPageClient readiness={partnerReadiness} />
      </section>
    </div>
  );
}
