import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  OctagonX,
  type LucideIcon,
} from "lucide-react";

import type { ClinicStatus } from "@/lib/workspace/types";
import { getClinicStatusCopy } from "@/lib/product/clinic-status";
import { cn } from "@/lib/utils";

type StatusTone = {
  icon: LucideIcon;
  className: string;
  iconClassName: string;
};

const statusTones: Record<ClinicStatus, StatusTone> = {
  operational: {
    icon: CheckCircle2,
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100",
    iconClassName: "text-emerald-600 dark:text-emerald-300",
  },
  degraded: {
    icon: AlertTriangle,
    className:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100",
    iconClassName: "text-amber-600 dark:text-amber-300",
  },
  non_functional: {
    icon: OctagonX,
    className:
      "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100",
    iconClassName: "text-rose-600 dark:text-rose-300",
  },
  unknown: {
    icon: HelpCircle,
    className:
      "border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200",
    iconClassName: "text-slate-500 dark:text-slate-300",
  },
};

export type StatusBadgeProps = {
  status: ClinicStatus;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const copy = getClinicStatusCopy(status);
  const tone = statusTones[status];
  const Icon = tone.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-normal",
        tone.className,
        className,
      )}
      title={copy.description}
    >
      <Icon
        aria-hidden="true"
        className={cn("size-3.5 shrink-0", tone.iconClassName)}
      />
      <span>{copy.label}</span>
    </span>
  );
}

export function getStatusBadgeCopy(status: ClinicStatus) {
  return {
    ...getClinicStatusCopy(status),
    ...statusTones[status],
  };
}
