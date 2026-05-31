import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ReferencePanelProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  eyebrow?: string;
};

// Adapted from TailAdmin React's MIT-licensed ComponentCard panel pattern.
// Source: reference-projects/tailadmin-react/src/components/common/ComponentCard.tsx
export function ReferencePanel({
  actions,
  children,
  className,
  description,
  eyebrow,
  title,
}: ReferencePanelProps) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-2xl border border-border bg-card text-card-foreground shadow-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-5 sm:px-6">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-base font-semibold text-card-foreground">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions}
      </div>
      <div className="min-w-0 border-t border-border p-4 sm:p-6">{children}</div>
    </section>
  );
}
