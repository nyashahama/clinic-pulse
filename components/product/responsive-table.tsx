import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ProductResponsiveTableProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function ProductResponsiveTable({
  label,
  children,
  className,
}: ProductResponsiveTableProps) {
  return (
    <div
      aria-label={label}
      className={cn("min-w-0 overflow-x-auto overscroll-x-contain", className)}
    >
      {children}
    </div>
  );
}
