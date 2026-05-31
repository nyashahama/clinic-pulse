import Link from "next/link";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  DatabaseZapIcon,
  GaugeIcon,
  RadioTowerIcon,
  ShieldCheckIcon,
} from "lucide-react";

import type { AdminTone } from "@/components/product/admin-module";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EstateOperationsMetric = {
  id?: string;
  label: string;
  value: string;
  detail: string;
  tone: AdminTone;
};

export type EstateOperationsRoute = {
  id?: string;
  label: string;
  value?: string;
  detail: string;
  href: string;
  tone: AdminTone;
};

type EstateOperationsAction = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
};

type EstateOperationsBriefingProps = {
  eyebrow: string;
  title: string;
  description: string;
  statusLabel: string;
  statusDetail: string;
  statusTone: AdminTone;
  railLabel?: string;
  routingLabel?: string;
  metrics: EstateOperationsMetric[];
  routes: EstateOperationsRoute[];
  actions: EstateOperationsAction[];
};

const toneClassName: Record<AdminTone, string> = {
  clear:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
  attention:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
  blocked:
    "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
  info: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
};

const railClassName: Record<AdminTone, string> = {
  clear: "border-l-emerald-400",
  attention: "border-l-amber-400",
  blocked: "border-l-rose-400",
  info: "border-l-sky-400",
};

const metricIcons = [
  GaugeIcon,
  DatabaseZapIcon,
  RadioTowerIcon,
  ShieldCheckIcon,
  CheckCircle2Icon,
];

const routeIcons = [
  ActivityIcon,
  DatabaseZapIcon,
  ShieldCheckIcon,
  RadioTowerIcon,
  AlertTriangleIcon,
];

export function getEstateOperationsToneClassName(tone: AdminTone) {
  return toneClassName[tone];
}

export function EstateOperationsBriefing({
  eyebrow,
  title,
  description,
  statusLabel,
  statusDetail,
  statusTone,
  railLabel = "Estate scorecard rail",
  routingLabel = "Health routing",
  metrics,
  routes,
  actions,
}: EstateOperationsBriefingProps) {
  return (
    <section
      aria-label={title}
      className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
    >
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <div className="grid min-w-0 content-start gap-5 p-4 sm:p-5">
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

          <div
            className={cn(
              "min-w-0 rounded-lg border border-l-4 bg-bg-muted/35 p-3",
              railClassName[statusTone],
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Operating verdict
            </p>
            <p className="mt-2 break-words text-lg font-semibold leading-tight text-foreground">
              {statusLabel}
            </p>
            <p className="mt-1 max-w-3xl break-words text-sm leading-5 text-muted-foreground">
              {statusDetail}
            </p>
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
        </div>

        <div className="border-t border-border-subtle bg-bg-muted/35 p-4 sm:p-5 xl:border-l xl:border-t-0">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                {railLabel}
              </p>
              <p className="mt-1 max-w-2xl break-words text-sm leading-5 text-muted-foreground">
                Readiness, pressure, and review load stay visible before opening the source ledger.
              </p>
            </div>
            <GaugeIcon className="size-5 shrink-0 text-teal-700" aria-hidden="true" />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {metrics.map((metric, index) => {
              const MetricIcon = metricIcons[index % metricIcons.length];

              return (
                <div
                  key={metric.id ?? metric.label}
                  className={cn(
                    "min-w-0 rounded-lg border px-3 py-2",
                    getEstateOperationsToneClassName(metric.tone),
                  )}
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-xs font-medium uppercase tracking-normal text-current/70">
                        {metric.label}
                      </p>
                      <p className="mt-1 break-words font-mono text-xl font-semibold leading-tight text-current">
                        {metric.value}
                      </p>
                    </div>
                    <MetricIcon className="size-4 shrink-0 text-current/70" aria-hidden="true" />
                  </div>
                  <p className="mt-1 break-words text-xs leading-4 text-current/75">
                    {metric.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-border-subtle bg-bg-default p-4">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            {routingLabel}
          </p>
          <ArrowRightIcon className="size-4 shrink-0 text-teal-700" aria-hidden="true" />
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {routes.map((route, index) => {
            const RouteIcon = routeIcons[index % routeIcons.length];

            return (
              <Link
                key={route.id ?? route.href}
                href={route.href}
                className={cn(
                  "grid min-w-0 gap-2 rounded-lg border border-l-4 bg-bg-muted/25 px-3 py-2 transition hover:bg-bg-muted/60",
                  railClassName[route.tone],
                )}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-foreground">
                      {route.label}
                    </p>
                    {route.value ? (
                      <p className="mt-1 break-words font-mono text-sm font-semibold text-muted-foreground">
                        {route.value}
                      </p>
                    ) : null}
                  </div>
                  <RouteIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="break-words text-xs leading-4 text-muted-foreground">
                  {route.detail}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
