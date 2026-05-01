import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type SectionHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
};

export function SectionHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 border-b border-border-subtle pb-4 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        {eyebrow ? (
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-lg font-semibold tracking-normal text-content-emphasis">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-content-default">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
