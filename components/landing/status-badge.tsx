import { cn } from "@/lib/utils";

type StatusType = "operational" | "degraded" | "non-functional" | "unknown";

const statusConfig: Record<
  StatusType,
  { label: string; dotClass: string; badgeClass: string }
> = {
  operational: {
    label: "Operational",
    dotClass: "bg-green-500",
    badgeClass:
      "bg-green-100 text-green-800 border-green-200",
  },
  degraded: {
    label: "Degraded",
    dotClass: "bg-amber-500",
    badgeClass:
      "bg-amber-100 text-amber-800 border-amber-200",
  },
  "non-functional": {
    label: "Non-Functional",
    dotClass: "bg-red-500",
    badgeClass:
      "bg-red-100 text-red-800 border-red-200",
  },
  unknown: {
    label: "Unknown",
    dotClass: "bg-slate-400",
    badgeClass:
      "bg-slate-100 text-slate-800 border-slate-200",
  },
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
        className
      )}
    >
      {showDot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", config.dotClass)} />
      )}
      {config.label}
    </span>
  );
}

export { type StatusType, statusConfig };
