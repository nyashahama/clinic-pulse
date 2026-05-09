import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

type CommandCardProps = ComponentPropsWithoutRef<"section"> & {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
};

export function CommandCard({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  ...props
}: CommandCardProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-sm shadow-slate-200/70",
        "supports-[backdrop-filter]:bg-white/85 supports-[backdrop-filter]:backdrop-blur",
        className,
      )}
      {...props}
    >
      {(eyebrow || title || description || action) && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {eyebrow}
              </p>
            )}
            {title && <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>}
            {description && <p className="max-w-2xl text-sm leading-6 text-slate-600">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
