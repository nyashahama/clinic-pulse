import { AlertCircle, AlertTriangle, BellRing, Siren, type LucideIcon } from "lucide-react";

import type { AlertSeverity } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

type SeverityTone = {
  label: string;
  icon: LucideIcon;
  className: string;
  iconClassName: string;
};

const severityTones: Record<AlertSeverity, SeverityTone> = {
  critical: {
    label: "Critical",
    icon: Siren,
    className:
      "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100",
    iconClassName: "text-rose-600 dark:text-rose-300",
  },
  high: {
    label: "High",
    icon: AlertTriangle,
    className:
      "border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-100",
    iconClassName: "text-orange-600 dark:text-orange-300",
  },
  medium: {
    label: "Medium",
    icon: AlertCircle,
    className:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100",
    iconClassName: "text-amber-600 dark:text-amber-300",
  },
  low: {
    label: "Low",
    icon: BellRing,
    className:
      "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100",
    iconClassName: "text-sky-600 dark:text-sky-300",
  },
};

export type SeverityBadgeProps = {
  severity: AlertSeverity;
  className?: string;
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const tone = severityTones[severity];
  const Icon = tone.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-normal",
        tone.className,
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn("size-3.5 shrink-0", tone.iconClassName)}
      />
      <span>{tone.label}</span>
    </span>
  );
}

export function getSeverityBadgeCopy(severity: AlertSeverity) {
  return severityTones[severity];
}
