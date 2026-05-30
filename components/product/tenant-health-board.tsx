import Link from "next/link";
import {
  ActivityIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  PlugZapIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
} from "lucide-react";

import { EstateOperationsBriefing } from "@/components/product/estate-operations-briefing";
import type {
  TenantHealthSignal,
  TenantHealthTone,
  TenantHealthViewModel,
} from "@/lib/product/tenant-health";
import { cn } from "@/lib/utils";

type TenantHealthBoardProps = {
  viewModel: TenantHealthViewModel;
};

const toneRailClassName: Record<TenantHealthTone, string> = {
  clear: "bg-emerald-500",
  attention: "bg-amber-500",
  blocked: "bg-destructive",
  info: "bg-sky-500",
};

const toneBadgeClassName: Record<TenantHealthTone, string> = {
  clear:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
  attention:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
  blocked:
    "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
  info: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
};

function SignalIcon({ signal }: { signal: TenantHealthSignal }) {
  const iconClassName = "size-4";

  if (signal.tone === "clear") {
    return <CheckCircle2Icon className={iconClassName} />;
  }

  if (signal.id === "privileged-access") {
    return <ShieldCheckIcon className={iconClassName} />;
  }

  if (signal.id === "partner-readiness") {
    return <PlugZapIcon className={iconClassName} />;
  }

  return <ActivityIcon className={iconClassName} />;
}

function statusLabelForTone(tone: TenantHealthTone) {
  return tone === "clear" ? "Clear" : "Open";
}

function ToneBadge({
  children,
  tone,
}: {
  children: string;
  tone: TenantHealthTone;
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

export function TenantHealthBoard({ viewModel }: TenantHealthBoardProps) {
  return (
    <div className="grid min-w-0 gap-4 pb-6" data-admin-module="tenant-health">
      <EstateOperationsBriefing
        eyebrow={viewModel.header.eyebrow}
        title="Tenant health cockpit"
        description={viewModel.header.description}
        statusLabel={`${viewModel.header.score.value} estate readiness`}
        statusDetail={`${viewModel.header.score.detail}. Scope: ${viewModel.header.scope}.`}
        statusTone={viewModel.header.score.tone}
        railLabel="Estate scorecard rail"
        routingLabel="Health routing"
        metrics={viewModel.metrics}
        routes={viewModel.signalLedger.items.map((item) => ({
          id: item.id,
          label: item.label,
          value: item.value,
          detail: item.detail,
          href: item.href,
          tone: item.tone,
        }))}
        actions={viewModel.actions.map((action) => ({
          label: action.label,
          href: action.href,
          variant: action.priority === "primary" ? "primary" : "secondary",
        }))}
      />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] xl:items-start">
        <section className="min-w-0 rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm">
          <div className="border-b border-border-subtle p-4 sm:p-5">
            <div className="flex min-w-0 items-center gap-2">
              <SlidersHorizontalIcon className="size-4 shrink-0 text-muted-foreground" />
              <h2 className="break-words text-base font-semibold leading-tight text-foreground">
                {viewModel.districtStack.title}
              </h2>
            </div>
            <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
              {viewModel.districtStack.description}
            </p>
          </div>
          <div className="divide-y divide-border-subtle">
            {viewModel.districtStack.rows.map((row) => (
              <div
                className="grid min-w-0 gap-3 p-4 md:grid-cols-[minmax(12rem,1fr)_minmax(14rem,1.2fr)_auto] md:items-center"
                key={row.id}
              >
                <div className="min-w-0">
                  <p className="break-words font-medium text-foreground">{row.district}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.clinics} clinics / {row.pendingReports} pending reports
                  </p>
                </div>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <span className="text-xs font-medium text-muted-foreground">
                      {row.readinessPercent}% fresh
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {row.freshnessRisk} freshness risk
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-muted">
                    <div
                      className={cn("h-full rounded-full", toneRailClassName[row.tone])}
                      style={{ width: `${Math.max(4, row.readinessPercent)}%` }}
                    />
                  </div>
                  <p className="mt-2 break-words text-xs leading-4 text-muted-foreground">
                    {row.detail}
                  </p>
                </div>
                <div className="md:justify-self-end">
                  <ToneBadge tone={row.tone}>{row.statusLabel}</ToneBadge>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="min-w-0 rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm">
          <div className="border-b border-border-subtle p-4 sm:p-5">
            <h2 className="break-words text-base font-semibold leading-tight text-foreground">
              {viewModel.signalLedger.title}
            </h2>
            <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
              {viewModel.signalLedger.description}
            </p>
          </div>
          <div className="grid gap-3 p-3">
            {viewModel.signalLedger.items.map((item) => (
              <Link
                className="group relative grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden rounded-md border border-border-subtle bg-bg-default p-3 transition-colors hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                href={item.href}
                key={item.id}
              >
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 w-1",
                    toneRailClassName[item.tone],
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "ml-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md border",
                    toneBadgeClassName[item.tone],
                  )}
                  aria-hidden="true"
                >
                  <SignalIcon signal={item} />
                </span>
                <span className="min-w-0">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="break-words text-sm font-medium text-foreground">
                      {item.label}
                    </span>
                    <span className="rounded-md border border-border-subtle bg-bg-default px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
                      {item.value}
                    </span>
                    <ToneBadge tone={item.tone}>{statusLabelForTone(item.tone)}</ToneBadge>
                  </span>
                  <span className="mt-1 block break-words text-xs leading-4 text-muted-foreground">
                    {item.detail}
                  </span>
                </span>
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                  <span className="hidden sm:inline">{item.actionLabel}</span>
                  <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

    </div>
  );
}
