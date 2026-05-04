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
      className={cn(
        "min-w-0 max-w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl",
        className,
      )}
    >
      <div className="flex h-12 min-w-0 items-center gap-3 border-b border-neutral-200 bg-neutral-50 px-4">
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="size-3 rounded-full bg-red-400" />
          <span className="size-3 rounded-full bg-amber-400" />
          <span className="size-3 rounded-full bg-emerald-400" />
        </div>
        <div className="min-w-0 flex-1 truncate rounded-md border border-neutral-200 bg-white px-3 py-1 font-mono text-xs text-neutral-500">
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}

const toneClasses = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-800",
  neutral: "border-neutral-200 bg-neutral-50 text-neutral-700",
} as const;

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
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
    <div className="rounded-lg border border-neutral-200 bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-neutral-950">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{detail}</p>
    </div>
  );
}

export function ProductRow({
  active,
  children,
  className,
}: {
  active?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-xs transition",
        active ? "border-emerald-200 bg-emerald-50/70" : "border-neutral-200 bg-white",
        className,
      )}
    >
      {children}
    </div>
  );
}
