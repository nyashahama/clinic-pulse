import type { ReactNode } from "react";
import { AlertTriangle, BoxSelect, RefreshCcw, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SurfaceStateVariant = "empty" | "error";
type SurfaceStateSize = "compact" | "full";

export type SurfaceStateProps = {
  variant: SurfaceStateVariant;
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
  retryLabel?: string;
  onRetry?: () => void;
  size?: SurfaceStateSize;
  className?: string;
};

export function SurfaceState({
  variant,
  title,
  description,
  icon,
  action,
  retryLabel = "Retry",
  onRetry,
  size = "full",
  className,
}: SurfaceStateProps) {
  const Icon = icon ?? (variant === "error" ? AlertTriangle : BoxSelect);
  const isError = variant === "error";

  return (
    <div
      role={isError ? "alert" : undefined}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border px-6 text-center",
        size === "full" ? "min-h-56 py-10" : "min-h-36 py-6",
        isError
          ? "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100"
          : "border-dashed border-border-default bg-bg-muted text-content-default",
        className,
      )}
    >
      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-full border bg-bg-default shadow-sm",
          isError
            ? "border-rose-200/80 text-rose-600 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300"
            : "border-border-subtle text-content-subtle",
        )}
      >
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <div className="mt-4 max-w-sm space-y-1">
        <h3 className="text-sm font-semibold text-content-emphasis">{title}</h3>
        <p
          className={cn(
            "text-sm leading-6",
            isError
              ? "text-rose-900/80 dark:text-rose-100/80"
              : "text-content-default",
          )}
        >
          {description}
        </p>
      </div>
      {onRetry ? (
        <Button className="mt-5" onClick={onRetry} size="sm" variant="outline">
          <RefreshCcw aria-hidden="true" className="size-3.5" />
          {retryLabel}
        </Button>
      ) : action ? (
        <div className="mt-5 flex justify-center">{action}</div>
      ) : null}
    </div>
  );
}
