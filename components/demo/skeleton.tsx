import { cn } from "@/lib/utils";

import type { DemoSurface } from "./empty-state";

const surfaceSkeletonRows: Record<DemoSurface, number> = {
  "clinic-table": 6,
  "report-stream": 5,
  "alert-list": 4,
  "finder-results": 4,
  "offline-queue": 3,
};

export type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-bg-emphasis/70", className)}
    />
  );
}

export type SurfaceSkeletonProps = {
  surface: DemoSurface;
  className?: string;
};

export function SurfaceSkeleton({
  surface,
  className,
}: SurfaceSkeletonProps) {
  if (surface === "clinic-table") {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-border-subtle bg-bg-default",
          className,
        )}
      >
        <div className="grid grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-4 border-b border-border-subtle px-4 py-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="divide-y divide-border-subtle">
          {Array.from({ length: surfaceSkeletonRows[surface] }).map((_, index) => (
            <div
              key={`${surface}-${index}`}
              className="grid grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-4 px-4 py-4"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
              <Skeleton className="h-4 w-24 self-center" />
              <Skeleton className="h-4 w-16 self-center justify-self-end" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border-subtle bg-bg-default p-4",
        className,
      )}
    >
      <div className="space-y-3">
        {Array.from({ length: surfaceSkeletonRows[surface] }).map((_, index) => (
          <div
            key={`${surface}-${index}`}
            className="rounded-lg border border-border-subtle bg-bg-muted/60 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
