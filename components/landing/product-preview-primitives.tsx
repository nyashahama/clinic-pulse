import { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BrowserFrameProps = {
  children: ReactNode;
  className?: string;
  title: string;
};

export function BrowserFrame({
  children,
  className,
  title,
}: BrowserFrameProps) {
  return (
    <div
      data-public-light-preview="browser-frame"
      className={cn(
        "min-w-0 max-w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-border dark:bg-card",
        className,
      )}
    >
      <div className="flex h-12 min-w-0 items-center gap-3 border-b border-neutral-200 bg-neutral-50 px-4 dark:border-border dark:bg-muted">
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="size-3 rounded-full bg-red-400" />
          <span className="size-3 rounded-full bg-amber-400" />
          <span className="size-3 rounded-full bg-emerald-400" />
        </div>
        <div className="min-w-0 flex-1 truncate rounded-md border border-neutral-200 bg-white px-3 py-1 font-mono text-xs text-neutral-500 dark:border-border dark:bg-card dark:text-muted-foreground">
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}

const toneClasses = {
  critical: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-200",
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-200",
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-200",
  neutral: "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-border dark:bg-muted dark:text-muted-foreground",
} as const;

const activeRowToneClasses = {
  critical: "border-red-200 bg-red-50/70 dark:border-red-900/60 dark:bg-red-950/30",
  warning: "border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/30",
  healthy: "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/30",
  neutral: "border-neutral-300 bg-neutral-50 dark:border-border dark:bg-muted",
} satisfies Record<keyof typeof toneClasses, string>;

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <span
      data-public-light-preview="status-pill"
      className={cn(
        "inline-flex max-w-full items-center whitespace-normal break-words rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}

export function MetricTile({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div
      data-public-light-preview="metric-tile"
      className="rounded-lg border border-neutral-200 bg-white p-2 dark:border-border dark:bg-card sm:p-3"
    >
      <p className="text-[9px] font-semibold uppercase leading-4 tracking-[0.12em] text-neutral-600 dark:text-muted-foreground sm:text-[11px]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-neutral-950 dark:text-card-foreground sm:text-xl">{value}</p>
      <p className="mt-1 hidden text-xs text-neutral-500 dark:text-muted-foreground sm:block">{detail}</p>
    </div>
  );
}

export function ProductRow({
  active,
  activeTone = "neutral",
  children,
  className,
}: {
  active?: boolean;
  activeTone?: keyof typeof activeRowToneClasses;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-public-light-preview="product-row"
      className={cn(
        "rounded-lg border px-3 py-2 text-xs transition",
        active ? activeRowToneClasses[activeTone] : "border-neutral-200 bg-white dark:border-border dark:bg-card",
        className,
      )}
    >
      {children}
    </div>
  );
}
