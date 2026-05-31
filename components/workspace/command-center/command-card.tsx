import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

type CommandCardProps = ComponentPropsWithoutRef<"section"> & {
  eyebrow?: ReactNode;
  eyebrowClassName?: string;
  title?: ReactNode;
  titleClassName?: string;
  description?: ReactNode;
  descriptionClassName?: string;
  action?: ReactNode;
  children?: ReactNode;
};

export function CommandCard({
  eyebrow,
  eyebrowClassName,
  title,
  titleClassName,
  description,
  descriptionClassName,
  action,
  children,
  className,
  ...props
}: CommandCardProps) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-3xl border border-border bg-card/95 p-5 shadow-sm",
        "supports-[backdrop-filter]:bg-card/85 supports-[backdrop-filter]:backdrop-blur",
        className,
      )}
      {...props}
    >
      {(eyebrow || title || description || action) && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            {eyebrow && (
              <p className={cn("text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground", eyebrowClassName)}>
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className={cn("text-xl font-semibold tracking-tight text-card-foreground", titleClassName)}>
                {title}
              </h2>
            )}
            {description && (
              <p className={cn("max-w-2xl text-sm leading-6 text-muted-foreground", descriptionClassName)}>
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
