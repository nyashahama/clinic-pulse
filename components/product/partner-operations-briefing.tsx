import Link from "next/link";
import {
  ArrowRightIcon,
  BoxIcon,
  CheckCircle2Icon,
  FileJsonIcon,
  KeyRoundIcon,
  RadioTowerIcon,
  RouteIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type {
  PartnerLaunchCockpitModel,
  PartnerReadinessMetric,
} from "@/lib/demo/partner-readiness";
import { cn } from "@/lib/utils";

type PartnerOperationsTone =
  | PartnerReadinessMetric["tone"]
  | "blocked";

export type PartnerOperationsMetric = {
  id?: string;
  label: string;
  value: string;
  detail?: string;
  tone: PartnerOperationsTone;
};

type PartnerOperationsAction = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
};

type PartnerOperationsBriefingProps = {
  eyebrow: string;
  title: string;
  description: string;
  statusLabel: string;
  statusDetail: string;
  latestActivityLabel: string;
  cockpit: PartnerLaunchCockpitModel;
  metrics: PartnerOperationsMetric[];
  actions: PartnerOperationsAction[];
};

const gateIcons: Record<PartnerLaunchCockpitModel["gates"][number]["id"], typeof KeyRoundIcon> = {
  access: KeyRoundIcon,
  contract: RouteIcon,
  delivery: RadioTowerIcon,
  operations: FileJsonIcon,
};

const metricIcons = [ShieldCheckIcon, KeyRoundIcon, RadioTowerIcon, FileJsonIcon];

const partnerToneClassName: Record<PartnerOperationsTone, string> = {
  clear:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
  watch:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
  attention:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
  blocked:
    "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
  info: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
};

const partnerRailClassName: Record<PartnerOperationsTone, string> = {
  clear: "border-l-emerald-400",
  watch: "border-l-amber-400",
  attention: "border-l-amber-400",
  blocked: "border-l-rose-400",
  info: "border-l-sky-400",
};

export function getPartnerOperationsToneClassName(tone: PartnerOperationsTone) {
  return partnerToneClassName[tone];
}

export function PartnerOperationsBriefing({
  eyebrow,
  title,
  description,
  statusLabel,
  statusDetail,
  latestActivityLabel,
  cockpit,
  metrics,
  actions,
}: PartnerOperationsBriefingProps) {
  const latestDelivery = cockpit.deliveryRows[0];

  return (
    <section
      className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
      aria-label={title}
    >
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <div className="grid min-w-0 gap-5 p-4 sm:p-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              {eyebrow}
            </p>
            <h1 className="mt-2 break-words text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.72fr)]">
            <div
              className={cn(
                "min-w-0 rounded-lg border border-l-4 bg-bg-muted/35 p-3",
                partnerRailClassName[cockpit.handoffPacket.tone],
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Launch verdict
              </p>
              <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-lg font-semibold leading-tight text-foreground">
                    {statusLabel}
                  </p>
                  <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
                    {statusDetail}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex w-fit max-w-full shrink-0 items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                    getPartnerOperationsToneClassName(cockpit.handoffPacket.tone),
                  )}
                >
                  {cockpit.handoffPacket.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {actions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={cn(
                      buttonVariants({
                        size: "sm",
                        variant: action.variant === "secondary" ? "outline" : "default",
                      }),
                      action.variant === "secondary" ? "bg-bg-default" : "",
                    )}
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid min-w-0 gap-2 rounded-lg border border-border-subtle bg-bg-default p-3">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Receiver test lane
                </p>
                <RadioTowerIcon className="size-4 shrink-0 text-teal-700" aria-hidden="true" />
              </div>
              <p className="break-words text-sm font-medium text-foreground">
                {latestDelivery?.eventType ?? "No webhook event recorded"}
              </p>
              <p className="break-words text-xs leading-5 text-muted-foreground">
                {latestDelivery
                  ? `${latestDelivery.state} / ${latestDelivery.attempts} / ${latestDelivery.target}`
                  : "Create a receiver and send a preview event before partner go-live."}
              </p>
              <p className="text-xs text-muted-foreground">
                Latest activity: {latestActivityLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-border-subtle bg-bg-muted/35 p-4 sm:p-5 xl:border-l xl:border-t-0">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Handoff packet
              </p>
              <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
                {cockpit.handoffPacket.summary}
              </p>
            </div>
            <BoxIcon className="size-5 shrink-0 text-teal-700" aria-hidden="true" />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {cockpit.handoffPacket.items.map((item) => (
              <div
                key={item.label}
                className={cn(
                  "min-w-0 rounded-lg border bg-bg-default px-3 py-2",
                  getPartnerOperationsToneClassName(item.tone),
                )}
              >
                <p className="text-xs font-medium uppercase tracking-normal text-current/70">
                  {item.label}
                </p>
                <p className="mt-1 break-words font-mono text-sm font-semibold text-current">
                  {item.value}
                </p>
                <p className="mt-1 break-words text-xs leading-4 text-current/75">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid border-t border-border-subtle bg-bg-default lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 border-b border-border-subtle p-4 lg:border-b-0 lg:border-r">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Launch gate runway
            </p>
            <CheckCircle2Icon className="size-4 shrink-0 text-teal-700" aria-hidden="true" />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {cockpit.gates.map((gate) => {
              const GateIcon = gateIcons[gate.id];

              return (
                <div
                  key={gate.id}
                  className={cn(
                    "min-w-0 rounded-lg border border-l-4 bg-bg-muted/30 p-3",
                    partnerRailClassName[gate.tone],
                  )}
                >
                  <div className="flex min-w-0 items-start gap-2">
                    <span
                      className={cn(
                        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border",
                        getPartnerOperationsToneClassName(gate.tone),
                      )}
                      aria-hidden="true"
                    >
                      <GateIcon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-foreground">
                        {gate.label}
                      </p>
                      <p className="mt-1 break-words text-xs leading-4 text-muted-foreground">
                        {gate.summary}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 break-words font-mono text-xs text-muted-foreground">
                    {gate.status} / {gate.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 p-4">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Launch evidence map
            </p>
            <ArrowRightIcon className="size-4 shrink-0 text-teal-700" aria-hidden="true" />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {metrics.map((metric, index) => {
              const MetricIcon = metricIcons[index % metricIcons.length];

              return (
                <div
                  key={metric.id ?? metric.label}
                  className={cn(
                    "min-w-0 rounded-lg border px-3 py-2",
                    getPartnerOperationsToneClassName(metric.tone),
                  )}
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-xs font-medium uppercase tracking-normal text-current/70">
                        {metric.label}
                      </p>
                      <p className="mt-1 break-words text-2xl font-semibold leading-tight text-current">
                        {metric.value}
                      </p>
                    </div>
                    <MetricIcon className="size-4 shrink-0 text-current/70" aria-hidden="true" />
                  </div>
                  {metric.detail ? (
                    <p className="mt-1 break-words text-xs leading-4 text-current/75">
                      {metric.detail}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
