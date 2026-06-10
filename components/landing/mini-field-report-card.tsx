import { WifiOff, RefreshCw } from "lucide-react";

import type { PatientJourneyStepData } from "@/lib/landing/patient-journey-data";

export function MiniFieldReportCard({ step }: { step: PatientJourneyStepData }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-500/20 dark:bg-amber-950/30 dark:backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-100 text-clinics-amber dark:bg-amber-500/10 dark:text-amber-400">
          <WifiOff className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            {step.headline}
          </p>
          <p className="mt-0.5 text-xs text-amber-600/70 dark:text-amber-200/50">
            {step.source}
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5 border-t border-amber-200 pt-3 dark:border-amber-500/10">
        {step.details.map((detail, i) => (
          <p key={i} className="text-xs text-amber-700/80 dark:text-amber-200/70">
            {detail}
          </p>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px]">
        <span className="flex items-center gap-1 text-clinics-amber dark:text-amber-400">
          <RefreshCw className="size-3" />
          {step.freshness}
        </span>
      </div>
    </div>
  );
}
