import Link from "next/link";
import {
  ArrowUpRightIcon,
  FileJsonIcon,
  KeyRoundIcon,
  RadioTowerIcon,
  TerminalSquareIcon,
} from "lucide-react";

import {
  AdminModuleHeader,
  AdminStatusBadge,
} from "@/components/product/admin-module";
import { IntegrationOperationsWorkspace } from "@/components/product/integration-operations-workspace";
import {
  buildIntegrationOperationsModel,
  type IntegrationActionCard,
  type IntegrationSourceReference,
  type IntegrationSummaryMetric,
  type IntegrationTone,
} from "@/lib/product/integration-operations";
import { cn } from "@/lib/utils";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminPartnerReadiness } from "../admin-loaders";

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

const summaryMetricAccentClassName: Record<IntegrationTone, string> = {
  clear: "border-l-emerald-400",
  attention: "border-l-amber-400",
  blocked: "border-l-rose-400",
  info: "border-l-sky-400",
};

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  const partnerReadiness = await loadAdminPartnerReadiness();
  const model = buildIntegrationOperationsModel(partnerReadiness);

  return (
    <div className="space-y-4" data-admin-module="integrations">
      <AdminModuleHeader
        eyebrow="Partner operations"
        title="Integration operations"
        description="Monitor partner credentials, endpoint coverage, webhook delivery, export proof, and integration checks from one operations console."
      />

      <IntegrationOperationsSummary metrics={model.summaryMetrics} />

      <section
        aria-label="Integration command center"
        className="rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
      >
        <div className="flex min-w-0 flex-col gap-2 border-b border-border-subtle px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Integration command center
            </p>
            <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">
              Track owner readiness, receiver health, and export proof before opening source evidence.
            </p>
          </div>
          <AdminStatusBadge tone={model.consoleState.tone}>
            {model.consoleState.tone === "clear" ? "Operational" : "Review"}
          </AdminStatusBadge>
        </div>

        <div className="grid gap-3 p-3 lg:grid-cols-3">
          {model.actionCards.map((card) => (
            <IntegrationCommandCard key={card.id} card={card} />
          ))}
        </div>
      </section>

      <IntegrationOperationsWorkspace
        metrics={model.workspaceMetrics}
        rows={model.evidenceRows}
        consoleState={model.consoleState}
      />
      <IntegrationSourceReferences references={model.sourceReferences} />

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

function IntegrationSourceReferences({
  references,
}: {
  references: IntegrationSourceReference[];
}) {
  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm sm:p-5">
      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Research basis
          </p>
          <h2 className="break-words text-lg font-semibold text-foreground">
            Integration source references
          </h2>
        </div>
        <p className="max-w-2xl break-words text-sm text-muted-foreground">
          Integration operations combines connector setup, credential proof, webhook delivery
          debugging, and endpoint health patterns from source-available operator consoles.
        </p>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        {references.map((reference) => (
          <a
            key={reference.source}
            className="group grid min-w-0 gap-2 rounded-lg border border-border-subtle bg-bg-muted p-3 transition hover:bg-bg-default"
            href={reference.repositoryUrl}
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
            <span className="inline-flex w-fit rounded-md border border-border-subtle bg-bg-default px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {reference.license}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

function IntegrationOperationsSummary({
  metrics,
}: {
  metrics: IntegrationSummaryMetric[];
}) {
  return (
    <section
      aria-label="Integration operations summary"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {metrics.map((metric) => (
        <article
          key={metric.id}
          className={cn(
            "min-w-0 rounded-lg border border-l-4 border-border-subtle bg-bg-default px-4 py-3 text-content-default shadow-sm",
            summaryMetricAccentClassName[metric.tone],
          )}
        >
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words text-xs font-medium text-muted-foreground">
                {metric.label}
              </p>
              <p className="mt-1 break-words text-2xl font-semibold leading-tight text-foreground">
                {metric.value}
              </p>
            </div>
            <AdminStatusBadge tone={metric.tone}>
              {metric.tone === "clear" ? "Ready" : "Review"}
            </AdminStatusBadge>
          </div>
          <p className="mt-2 break-words text-xs leading-4 text-muted-foreground">
            {metric.detail}
          </p>
        </article>
      ))}
    </section>
  );
}

function IntegrationCommandCard({ card }: { card: IntegrationActionCard }) {
  const Icon = commandCardIcons[card.id] ?? KeyRoundIcon;

  return (
    <article
      className={cn(
        "grid min-w-0 gap-3 rounded-lg border border-l-4 border-border-subtle bg-bg-default p-3 shadow-sm",
        commandCardAccentClassName[card.tone],
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            {card.eyebrow}
          </p>
          <h2 className="mt-1 break-words text-base font-semibold leading-tight text-foreground">
            {card.title}
          </h2>
        </div>
        <Icon className="size-5 shrink-0" aria-hidden="true" />
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
