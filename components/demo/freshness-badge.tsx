import { Clock3, HelpCircle, ShieldAlert, TimerReset, type LucideIcon } from "lucide-react";

import type { Freshness } from "@/lib/demo/types";
import { getFreshnessLabel } from "@/lib/demo/freshness";
import { cn } from "@/lib/utils";

type FreshnessTone = {
  icon: LucideIcon;
  description: string;
  className: string;
  iconClassName: string;
};

const freshnessTones: Record<Freshness, FreshnessTone> = {
  fresh: {
    icon: Clock3,
    description: "Reported recently and safe to use for routing decisions.",
    className:
      "border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-100",
    iconClassName: "text-teal-600 dark:text-teal-300",
  },
  needs_confirmation: {
    icon: ShieldAlert,
    description: "Signal is aging and should be confirmed before escalation.",
    className:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100",
    iconClassName: "text-amber-600 dark:text-amber-300",
  },
  stale: {
    icon: TimerReset,
    description: "Reported data is stale and should not be treated as current.",
    className:
      "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100",
    iconClassName: "text-rose-600 dark:text-rose-300",
  },
  unknown: {
    icon: HelpCircle,
    description: "Freshness could not be determined from the report timestamp.",
    className:
      "border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200",
    iconClassName: "text-slate-500 dark:text-slate-300",
  },
};

export type FreshnessBadgeProps = {
  freshness: Freshness;
  className?: string;
};

export function FreshnessBadge({
  freshness,
  className,
}: FreshnessBadgeProps) {
  const tone = freshnessTones[freshness];
  const Icon = tone.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-normal",
        tone.className,
        className,
      )}
      title={tone.description}
    >
      <Icon
        aria-hidden="true"
        className={cn("size-3.5 shrink-0", tone.iconClassName)}
      />
      <span>{getFreshnessLabel(freshness)}</span>
    </span>
  );
}

export function getFreshnessBadgeCopy(freshness: Freshness) {
  return {
    label: getFreshnessLabel(freshness),
    ...freshnessTones[freshness],
  };
}
