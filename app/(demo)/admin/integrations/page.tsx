import Link from "next/link";
import {
  ArrowUpRightIcon,
  FileJsonIcon,
  KeyRoundIcon,
  RadioTowerIcon,
  TerminalSquareIcon,
} from "lucide-react";

import {
  AdminStatusBadge,
  getAdminToneClassName,
} from "@/components/product/admin-module";
import { IntegrationOperationsWorkspace } from "@/components/product/integration-operations-workspace";
import { buttonVariants } from "@/components/ui/button";
import {
  buildIntegrationOperationsModel,
  type IntegrationActionCard,
  type IntegrationTone,
} from "@/lib/product/integration-operations";
import { cn } from "@/lib/utils";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminPartnerReadiness } from "../admin-loaders";
import { formatDateTime } from "../governance-formatters";

const commandCardIcons: Record<string, typeof KeyRoundIcon> = {
  "credential-owner": KeyRoundIcon,
  "receiver-health": RadioTowerIcon,
  "package-proof": FileJsonIcon,
};

const commandCardAccentClassName: Record<IntegrationTone, string> = {
  clear: "border-l-emerald-400 text-emerald-700",
  attention: "border-l-amber-400 text-amber-700",
  blocked: "border-l-rose-400 text-rose-700",
  info: "border-l-sky-400 text-sky-700",
};

function getLatestIntegrationActivityLabel(
  readiness: Awaited<ReturnType<typeof loadAdminPartnerReadiness>>,
) {
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
  const model = buildIntegrationOperationsModel(partnerReadiness);
  const latestActivityLabel = getLatestIntegrationActivityLabel(partnerReadiness);

  return (
    <div className="space-y-4" data-admin-module="integrations">
      <section className="overflow-hidden rounded-lg border border-neutral-900 bg-neutral-950 text-white shadow-sm">
        <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-neutral-400">
              Partner operations
            </p>
            <h1 className="mt-2 break-words text-2xl font-semibold leading-tight sm:text-3xl">
              Integration operations command centre
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-300">
              Monitor partner credentials, endpoint coverage, webhook delivery, export proof, and integration checks from one operations console.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-normal text-neutral-400">
                  Active blocker
                </p>
                <p className="mt-1 break-words text-xl font-semibold">
                  {model.consoleState.summary}
                </p>
              </div>
              <p className="text-xs text-neutral-400">
                Latest activity: {latestActivityLabel}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <a className={buttonVariants({ size: "sm" })} href="#integration-evidence-workspace">
              Review evidence
            </a>
            <Link
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                "border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white",
              )}
              href="/admin/partner-readiness"
            >
              Open partner readiness
            </Link>
          </div>
        </div>
        <div className="grid border-t border-white/10 bg-white/[0.03] sm:grid-cols-2 xl:grid-cols-4">
          {model.summaryMetrics.map((metric) => (
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

      <section
        aria-label="Integration command center"
        className="grid gap-3"
      >
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Next actions
            </p>
            <h2 className="text-xl font-semibold text-foreground">Integration evidence queue</h2>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Track owner readiness, receiver health, and export proof before opening source evidence.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {model.actionCards.map((card) => (
            <IntegrationCommandCard key={card.id} card={card} />
          ))}
        </div>
      </section>

      <section id="integration-evidence-workspace" className="scroll-mt-24">
        <IntegrationOperationsWorkspace
          metrics={model.workspaceMetrics}
          rows={model.evidenceRows}
          consoleState={model.consoleState}
        />
      </section>

      <section
        aria-label="Developer handoff"
        className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
      >
        <div className="flex min-w-0 flex-col gap-2 border-b border-border-subtle px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Developer handoff
            </p>
            <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">
              Endpoint coverage and smoke commands for partner engineers validating the integration surface.
            </p>
          </div>
          <TerminalSquareIcon className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>

        <div>
          <table className="w-full table-fixed text-sm">
            <thead className="bg-bg-muted/60 text-left text-xs uppercase tracking-normal text-muted-foreground">
              <tr className="border-b border-border-subtle">
                <th className="w-[24%] px-3 py-3 font-medium">Partner API contract</th>
                <th className="w-[13%] px-3 py-3 font-medium">Scope</th>
                <th className="w-[12%] px-3 py-3 font-medium">Credential scope coverage</th>
                <th className="w-[51%] px-3 py-3 font-medium">Smoke test</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {model.endpointRows.map((row) => (
                <tr key={row.path} className="align-top">
                  <td className="whitespace-normal break-words px-3 py-3">
                    <p className="font-medium text-foreground">
                      {row.method} {row.path}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {row.purpose}
                    </p>
                  </td>
                  <td className="whitespace-normal break-words px-3 py-3">
                    <AdminStatusBadge tone="info">{row.scope}</AdminStatusBadge>
                  </td>
                  <td className="whitespace-normal break-words px-3 py-3">
                    <AdminStatusBadge tone={row.tone}>
                      {row.covered ? "Covered" : "Missing"}
                    </AdminStatusBadge>
                  </td>
                  <td className="whitespace-normal break-words px-3 py-3">
                    <SmokeCommand command={row.command} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        id="webhook-delivery-log"
        aria-label="Webhook delivery log"
        className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
      >
        <div className="border-b border-border-subtle px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            Webhook delivery log
          </p>
          <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">
            Receiver tests and preview events stay linked to source records for delivery debugging.
          </p>
        </div>

        {model.deliveryLogRows.length ? (
          <>
            <div className="hidden md:block">
              <table className="w-full table-fixed text-sm">
                <thead className="bg-bg-muted/60 text-left text-xs uppercase tracking-normal text-muted-foreground">
                  <tr className="border-b border-border-subtle">
                    <th className="w-[24%] px-3 py-3 font-medium">Event</th>
                    <th className="w-[14%] px-3 py-3 font-medium">State</th>
                    <th className="w-[28%] px-3 py-3 font-medium">Target</th>
                    <th className="w-[14%] px-3 py-3 font-medium">Attempts</th>
                    <th className="w-[20%] px-3 py-3 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {model.deliveryLogRows.map((row) => (
                    <tr key={row.id} className="align-top">
                      <td className="whitespace-normal break-words px-3 py-3">
                        <Link
                          href={row.sourceHref}
                          aria-label={row.ariaLabel}
                          className="inline-flex min-w-0 items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          <span className="min-w-0 break-words">{row.eventType}</span>
                          <ArrowUpRightIcon className="size-3.5 shrink-0" aria-hidden="true" />
                        </Link>
                      </td>
                      <td className="whitespace-normal break-words px-3 py-3">
                        <AdminStatusBadge tone={row.tone}>{row.stateLabel}</AdminStatusBadge>
                      </td>
                      <td className="whitespace-normal break-words px-3 py-3">
                        {row.target}
                      </td>
                      <td className="whitespace-normal break-words px-3 py-3">
                        {row.attempts}
                      </td>
                      <td className="whitespace-normal break-words px-3 py-3 text-xs text-muted-foreground">
                        {row.observedLabel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-2 p-3 md:hidden">
              {model.deliveryLogRows.map((row) => (
                <Link
                  key={row.id}
                  href={row.sourceHref}
                  aria-label={row.ariaLabel}
                  className="grid min-w-0 gap-2 rounded-lg border border-border-subtle bg-bg-default p-3 transition hover:bg-bg-muted/60"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium text-foreground">
                        {row.eventType}
                      </p>
                      <p className="mt-1 break-words text-xs text-muted-foreground">
                        {row.target}
                      </p>
                    </div>
                    <AdminStatusBadge tone={row.tone}>{row.stateLabel}</AdminStatusBadge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {row.attempts} / {row.observedLabel}
                  </p>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="p-4 text-sm text-muted-foreground">
            No webhook delivery records are linked to this integration yet.
          </div>
        )}
      </section>
    </div>
  );
}

function IntegrationCommandCard({ card }: { card: IntegrationActionCard }) {
  const Icon = commandCardIcons[card.id] ?? KeyRoundIcon;

  const body = (
    <>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            {card.eyebrow}
          </p>
          <h2 className="mt-1 break-words text-base font-semibold leading-tight text-foreground">
            {card.title}
          </h2>
        </div>
        <span
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border",
            getAdminToneClassName(card.tone),
          )}
          aria-hidden="true"
        >
          <Icon className="size-4" />
        </span>
      </div>

      <p className="text-sm leading-5 text-muted-foreground">{card.description}</p>
      <p className="break-words rounded-md border border-border-subtle bg-bg-muted/50 px-2 py-1 font-mono text-xs text-foreground">
        {card.detail}
      </p>

      {card.href && card.actionLabel ? (
        <Link
          href={card.href}
          className="inline-flex min-h-8 items-center justify-center gap-2 rounded-lg border border-border-subtle bg-bg-default px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-bg-muted"
        >
          {card.actionLabel}
          <ArrowUpRightIcon className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
    </>
  );

  return (
    <article
      className={cn(
        "grid min-w-0 gap-3 rounded-lg border border-l-4 border-border-subtle bg-bg-default p-3 shadow-sm",
        commandCardAccentClassName[card.tone],
      )}
    >
      {body}
    </article>
  );
}

function SmokeCommand({ command }: { command: string }) {
  return (
    <div className="rounded-md border border-border-subtle bg-bg-muted/70">
      <code className="block whitespace-pre-wrap break-words px-2 py-1 font-mono text-xs leading-5 text-content-default">
        {command}
      </code>
    </div>
  );
}
