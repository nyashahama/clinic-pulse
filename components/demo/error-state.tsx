import { AlertTriangle, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { DemoSurface } from "./empty-state";

const errorStateCopy: Record<DemoSurface, { title: string; description: string }> =
  {
    "clinic-table": {
      title: "Clinic table unavailable",
      description:
        "Clinic rows could not be prepared for this district view. Refresh the demo surface and try again.",
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
  surface: DemoSurface;
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
    <div
      role="alert"
      className={cn(
        "flex min-h-56 flex-col items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full border border-rose-200/80 bg-bg-default text-rose-600 shadow-sm dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300">
        <AlertTriangle aria-hidden="true" className="size-5" />
      </div>
      <div className="mt-4 max-w-sm space-y-1">
        <h3 className="text-sm font-semibold">{copy.title}</h3>
        <p className="text-sm leading-6 text-rose-900/80 dark:text-rose-100/80">
          {copy.description}
        </p>
      </div>
      {onRetry ? (
        <Button className="mt-5" onClick={onRetry} size="sm" variant="outline">
          <RefreshCcw aria-hidden="true" className="size-3.5" />
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function getErrorStateCopy(surface: DemoSurface) {
  return errorStateCopy[surface];
}
