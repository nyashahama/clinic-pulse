import type { ReactNode } from "react";

import {
  BellOff,
  ClipboardList,
  type LucideIcon,
  MapPinned,
  SearchX,
  SignalZero,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type DemoSurface =
  | "clinic-table"
  | "report-stream"
  | "alert-list"
  | "finder-results"
  | "offline-queue";

type EmptyStateCopy = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const emptyStateCopy: Record<DemoSurface, EmptyStateCopy> = {
  "clinic-table": {
    title: "No clinics match this view",
    description:
      "Adjust district filters or clear the current search to bring clinics back into the table.",
    icon: MapPinned,
  },
  "report-stream": {
    title: "No reports in the stream",
    description:
      "New field and coordinator submissions will appear here as soon as they are received.",
    icon: ClipboardList,
  },
  "alert-list": {
    title: "No active alerts",
    description:
      "Critical incidents, stale data warnings, and staffing issues will populate this list automatically.",
    icon: BellOff,
  },
  "finder-results": {
    title: "No clinics found",
    description:
      "Try another suburb, service, or district name to find a nearby operational clinic.",
    icon: SearchX,
  },
  "offline-queue": {
    title: "Offline queue is clear",
    description:
      "Reports saved without connectivity will collect here until the next successful sync.",
    icon: SignalZero,
  },
};

export type EmptyStateProps = {
  surface: DemoSurface;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ surface, action, className }: EmptyStateProps) {
  const copy = emptyStateCopy[surface];
  const Icon = copy.icon;

  return (
    <div
      className={cn(
        "flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-border-default bg-bg-muted px-6 py-10 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full border border-border-subtle bg-bg-default text-content-subtle shadow-sm">
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <div className="mt-4 max-w-sm space-y-1">
        <h3 className="text-sm font-semibold text-content-emphasis">{copy.title}</h3>
        <p className="text-sm leading-6 text-content-default">{copy.description}</p>
      </div>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function getEmptyStateCopy(surface: DemoSurface) {
  return emptyStateCopy[surface];
}
