import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ProductPanelProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  metadata?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function ProductPanel({
  title,
  description,
  action,
  metadata,
  children,
  className,
  contentClassName,
}: ProductPanelProps) {
  const hasHeader = title || description || action || metadata;

  return (
    <section
      className={cn(
        "min-w-0 rounded-lg border border-border-subtle bg-bg-default shadow-sm",
        className,
      )}
    >
      {hasHeader ? (
        <header className="flex min-w-0 flex-col gap-3 border-b border-border-subtle px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            {title ? (
              <h2 className="text-sm font-semibold text-content-emphasis">{title}</h2>
            ) : null}
            {description ? (
              <p className="text-sm leading-6 text-content-default">{description}</p>
            ) : null}
            {metadata ? <div className="text-xs text-content-subtle">{metadata}</div> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn("min-w-0 p-4", contentClassName)}>{children}</div>
    </section>
  );
}
