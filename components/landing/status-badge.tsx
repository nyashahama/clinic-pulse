import {
  getClinicStatusCopy,
  normalizeClinicStatus,
  type ClinicOperatingStatus,
  type ClinicStatusInput,
} from "@/lib/product/clinic-status";
import { cn } from "@/lib/utils";

type StatusType = ClinicStatusInput;

type LandingStatusVisual = {
  dotClass: string;
  badgeClass: string;
};

const statusVisuals: Record<ClinicOperatingStatus, LandingStatusVisual> = {
  operational: {
    dotClass: "bg-green-500",
    badgeClass: "bg-green-100 text-green-800 border-green-200",
  },
  degraded: {
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  non_functional: {
    dotClass: "bg-red-500",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
  },
  unknown: {
    dotClass: "bg-slate-400",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
  },
};

function getLandingStatusConfig(status: StatusType) {
  const normalizedStatus = normalizeClinicStatus(status);

  return {
    ...getClinicStatusCopy(normalizedStatus),
    ...statusVisuals[normalizedStatus],
  };
}

const statusConfig: Record<StatusType, ReturnType<typeof getLandingStatusConfig>> = {
  operational: getLandingStatusConfig("operational"),
  degraded: getLandingStatusConfig("degraded"),
  non_functional: getLandingStatusConfig("non_functional"),
  "non-functional": getLandingStatusConfig("non-functional"),
  unknown: getLandingStatusConfig("unknown"),
};

interface StatusBadgeProps {
  status: StatusType;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  showDot = true,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        config.badgeClass,
        className,
      )}
      title={config.description}
    >
      {showDot ? (
        <span className={cn("h-1.5 w-1.5 rounded-full", config.dotClass)} />
      ) : null}
      {config.label}
    </span>
  );
}

export { getLandingStatusConfig, type StatusType, statusConfig };
