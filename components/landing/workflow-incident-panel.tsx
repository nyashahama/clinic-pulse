import type { ComponentProps } from "react";

import { ArrowRight, ClipboardList } from "lucide-react";

import {
  ProductRow,
  StatusPill,
} from "@/components/landing/product-preview-primitives";
import { workflowIncidentStages } from "@/lib/landing/openpanel-refactor-content";

const toneMap: Record<
  (typeof workflowIncidentStages)[number]["tone"],
  NonNullable<ComponentProps<typeof StatusPill>["tone"]>
> = {
  critical: "critical",
  warning: "warning",
  healthy: "healthy",
  neutral: "neutral",
};

export function WorkflowIncidentPanel() {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="grid gap-2 border-b border-neutral-200 bg-neutral-50 px-4 py-3 sm:flex sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <ClipboardList className="size-4 shrink-0 text-primary" />
          <p className="truncate text-sm font-semibold text-neutral-950">
            Mamelodi East incident
          </p>
        </div>
        <p className="min-w-0 break-all font-mono text-xs text-neutral-400 sm:break-normal sm:text-right">
          LIVE_DEMO / AUD-2026-0504-017
        </p>
      </div>
      <div className="grid gap-3 p-4">
        {workflowIncidentStages.map((stage, index) => (
          <ProductRow
            key={stage.surface}
            active={index === 1}
            className="grid gap-3 sm:grid-cols-[2.5rem_1fr_auto] sm:items-center"
          >
            <span className="flex size-9 items-center justify-center rounded-md border border-neutral-200 bg-white font-mono text-xs font-semibold text-neutral-500">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                {stage.surface}
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-950">
                {stage.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                {stage.detail}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:justify-end">
              <StatusPill tone={toneMap[stage.tone]}>{stage.state}</StatusPill>
              {index < workflowIncidentStages.length - 1 ? (
                <ArrowRight className="hidden size-4 text-neutral-300 sm:block" />
              ) : null}
            </div>
          </ProductRow>
        ))}
      </div>
    </div>
  );
}
