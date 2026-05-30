import type { ReactNode } from "react";

import { CommandCard } from "./command-card";

type SupportingOperationsProps = {
  children: ReactNode;
};

export function SupportingOperations({ children }: SupportingOperationsProps) {
  return (
    <CommandCard
      eyebrow="Supporting operations"
      title="Map, reports, replay, controls, and raw clinic detail"
      description="Secondary tools stay available without competing with the command queue."
      className="bg-muted/80"
    >
      <div className="grid min-w-0 gap-4">{children}</div>
    </CommandCard>
  );
}
