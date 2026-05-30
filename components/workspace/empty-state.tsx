import type { ReactNode } from "react";
import {
  BellOff,
  ClipboardList,
  type LucideIcon,
  MapPinned,
  SearchX,
  SignalZero,
} from "lucide-react";

import { SurfaceState } from "@/components/product/surface-state";

export type WorkspaceSurface =
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

const emptyStateCopy: Record<WorkspaceSurface, EmptyStateCopy> = {
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
  surface: WorkspaceSurface;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ surface, action, className }: EmptyStateProps) {
  const copy = emptyStateCopy[surface];

  return (
    <SurfaceState
      variant="empty"
      title={copy.title}
      description={copy.description}
      icon={copy.icon}
      action={action}
      className={className}
    />
  );
}

export function getEmptyStateCopy(surface: WorkspaceSurface) {
  return emptyStateCopy[surface];
}
