import { WifiOff, RefreshCw } from "lucide-react";

import type { PatientJourneyStepData } from "@/lib/landing/patient-journey-data";

export function MiniFieldReportCard({ step }: { step: PatientJourneyStepData }) {
  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-950/30 p-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-400">
          <WifiOff className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-200">
            {step.headline}
          </p>
          <p className="mt-0.5 text-xs text-amber-200/50">
            {step.source}
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5 border-t border-amber-500/10 pt-3">
        {step.details.map((detail, i) => (
          <p key={i} className="text-xs text-amber-200/70">
            {detail}
          </p>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px]">
        <span className="flex items-center gap-1 text-amber-400">
          <RefreshCw className="size-3" />
          {step.freshness}
        </span>
      </div>
    </div>
  );
}
