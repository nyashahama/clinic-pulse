import { MapPin, Navigation, Clock } from "lucide-react";

import type { PatientJourneyStepData } from "@/lib/landing/patient-journey-data";

export function MiniFinderCard({ step }: { step: PatientJourneyStepData }) {
  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900/80 p-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400">
          <MapPin className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {step.headline}
          </p>
          <p className="mt-0.5 text-xs text-white/50">{step.location}</p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
        {step.details.map((detail, i) => (
          <p key={i} className="text-xs text-white/70">
            {detail}
          </p>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 text-[11px]">
        <span className="flex items-center gap-1 text-amber-400">
          <Clock className="size-3" />
          {step.freshness}
        </span>
        {step.source && (
          <span className="text-white/40">{step.source}</span>
        )}
      </div>
      {step.metric && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2">
          <Navigation className="size-3.5 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400">{step.metric}</span>
          <span className="text-[11px] text-emerald-400/70">{step.metricLabel}</span>
        </div>
      )}
    </div>
  );
}
