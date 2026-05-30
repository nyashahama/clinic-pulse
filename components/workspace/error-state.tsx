import { SurfaceState } from "@/components/product/surface-state";

import type { WorkspaceSurface } from "./empty-state";

const errorStateCopy: Record<WorkspaceSurface, { title: string; description: string }> =
  {
    "clinic-table": {
      title: "Clinic table unavailable",
      description:
        "Clinic rows could not be prepared for this district view. Refresh the district surface and try again.",
    },
    "report-stream": {
      title: "Report stream unavailable",
      description:
        "Recent submissions could not be loaded into the timeline. Retry to rebuild the stream.",
    },
    "alert-list": {
      title: "Alert list unavailable",
      description:
        "The alert feed could not be generated. Refresh before reviewing escalations.",
    },
    "finder-results": {
      title: "Finder results unavailable",
      description:
        "Nearby clinic matches could not be prepared. Run the search again to restore routing options.",
    },
    "offline-queue": {
      title: "Offline queue unavailable",
      description:
        "Queued report sync state could not be read. Retry before resolving pending submissions.",
    },
  };

export type ErrorStateProps = {
  surface: WorkspaceSurface;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  surface,
  onRetry,
  className,
}: ErrorStateProps) {
  const copy = errorStateCopy[surface];

  return (
    <SurfaceState
      variant="error"
      title={copy.title}
      description={copy.description}
      onRetry={onRetry}
      className={className}
    />
  );
}

export function getErrorStateCopy(surface: WorkspaceSurface) {
  return errorStateCopy[surface];
}
