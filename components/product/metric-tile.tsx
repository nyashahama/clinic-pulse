import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type MetricTrendDirection = "up" | "down" | "flat";

type MetricTrend = {
  value: string;
  direction: MetricTrendDirection;
  context?: string;
};

type MetricTone = {
  wrapperClassName: string;
  trendClassName: string;
};

const trendIcons: Record<MetricTrendDirection, LucideIcon> = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: ArrowRight,
};

const trendTones: Record<MetricTrendDirection, MetricTone> = {
  up: {
    wrapperClassName:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200",
    trendClassName: "text-emerald-600 dark:text-emerald-300",
  },
  down: {
    wrapperClassName:
      "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200",
    trendClassName: "text-rose-600 dark:text-rose-300",
  },
  flat: {
    wrapperClassName:
      "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200",
    trendClassName: "text-slate-500 dark:text-slate-300",
  },
};

export type MetricTileProps = {
  label: string;
  count: string | number;
  description?: string;
  trend?: MetricTrend;
  className?: string;
};

export function MetricTile({
  label,
  count,
  description,
  trend,
  className,
}: MetricTileProps) {
  const trendTone = trend ? trendTones[trend.direction] : null;
  const TrendIcon = trend ? trendIcons[trend.direction] : null;

  return (
    <section
      className={cn(
        "grid min-h-32 min-w-0 gap-3 rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
            {label}
          </p>
          {description ? (
            <p className="max-w-[28ch] text-sm leading-5 text-content-default">
              {description}
            </p>
          ) : null}
        </div>
        {trend && TrendIcon ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold",
              trendTone?.wrapperClassName,
            )}
          >
            <TrendIcon
              aria-hidden="true"
              className={cn("size-3.5 shrink-0", trendTone?.trendClassName)}
            />
            <span>{trend.value}</span>
          </span>
        ) : (
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-bg-subtle text-content-muted">
            <Minus aria-hidden="true" className="size-3.5" />
          </span>
        )}
      </header>

      <div className="mt-auto flex items-end justify-between gap-3">
        <p className="min-w-[7ch] tabular-nums text-4xl font-semibold leading-none text-content-emphasis sm:text-[2.5rem]">
          {count}
        </p>
        {trend?.context ? (
          <p className="max-w-[18ch] text-right text-xs leading-5 text-content-subtle">
            {trend.context}
          </p>
        ) : null}
      </div>
    </section>
  );
}
