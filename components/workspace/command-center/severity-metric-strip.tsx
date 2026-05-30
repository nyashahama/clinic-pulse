import { ActivityIcon, AlertTriangleIcon, CheckCircle2Icon, Clock3Icon } from "lucide-react";

import type {
  DistrictSeverityMetric,
  DistrictSeverityQueueViewModel,
} from "@/lib/workspace/district-severity-queue-view-model";
import { cn } from "@/lib/utils";

type SeverityMetricStripProps = {
  metrics: DistrictSeverityQueueViewModel["metrics"];
};

const toneClassName: Record<DistrictSeverityMetric["tone"], string> = {
  clear:
    "border-emerald-200/80 bg-emerald-50/45 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-100",
  attention:
    "border-amber-200/80 bg-amber-50/45 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100",
  blocked:
    "border-destructive/25 bg-destructive/5 text-destructive dark:border-destructive/40 dark:bg-destructive/15",
  info: "border-sky-200/80 bg-sky-50/45 text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-100",
};

const railClassName: Record<DistrictSeverityMetric["tone"], string> = {
  clear: "bg-emerald-500",
  attention: "bg-amber-500",
  blocked: "bg-destructive",
  info: "bg-sky-500",
};

function MetricIcon({ metric }: { metric: DistrictSeverityMetric }) {
  const iconClassName = "size-4";

  if (metric.label === "Last sync") {
    return <Clock3Icon className={iconClassName} />;
  }

  if (metric.tone === "blocked" || metric.tone === "attention") {
    return <AlertTriangleIcon className={iconClassName} />;
  }

  if (metric.tone === "clear") {
    return <CheckCircle2Icon className={iconClassName} />;
  }

  return <ActivityIcon className={iconClassName} />;
}

export function SeverityMetricStrip({ metrics }: SeverityMetricStripProps) {
  return (
    <section
      aria-label="Severity queue metrics"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      data-district-severity-metrics
    >
      {metrics.map((metric) => (
        <article
          key={metric.label}
          className="min-w-0 overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
        >
          <div className={cn("h-1", railClassName[metric.tone])} aria-hidden="true" />
          <div className="grid min-h-[6.25rem] gap-3 p-4">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <p className="min-w-0 break-words text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                {metric.label}
              </p>
              <span
                className={cn(
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-md border",
                  toneClassName[metric.tone],
                )}
                aria-hidden="true"
              >
                <MetricIcon metric={metric} />
              </span>
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "break-words font-mono font-semibold text-foreground",
                  metric.label === "Last sync"
                    ? "text-xl leading-tight"
                    : "text-[1.65rem] leading-none",
                )}
              >
                {metric.value}
              </p>
              <p className="mt-2 break-words text-xs leading-4 text-muted-foreground">
                {metric.detail}
              </p>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
