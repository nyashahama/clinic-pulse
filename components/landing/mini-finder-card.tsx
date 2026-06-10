import { MapPin, Navigation, Clock } from "lucide-react";

import type { PatientJourneyStepData } from "@/lib/landing/patient-journey-data";

export function MiniFinderCard({ step }: { step: PatientJourneyStepData }) {
  return (
    <div className="rounded-lg border border-clinics-stone bg-clinics-canvas p-4 dark:border-white/10 dark:bg-neutral-900/80 dark:backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-clinics-canopy-soft text-clinics-canopy dark:bg-emerald-500/10 dark:text-emerald-400">
          <MapPin className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-clinics-ink dark:text-white">
            {step.headline}
          </p>
          <p className="mt-0.5 text-xs text-clinics-ink-mute dark:text-white/50">
            {step.location}
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5 border-t border-clinics-stone pt-3 dark:border-white/5">
        {step.details.map((detail, i) => (
          <p key={i} className="text-xs text-clinics-ink-mute dark:text-white/70">
            {detail}
          </p>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 text-[11px]">
        <span className="flex items-center gap-1 text-clinics-amber dark:text-amber-400">
          <Clock className="size-3" />
          {step.freshness}
        </span>
        {step.source && (
          <span className="text-clinics-ink-mute dark:text-white/40">{step.source}</span>
        )}
      </div>
      {step.metric && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-clinics-canopy-soft px-3 py-2 dark:bg-emerald-500/10">
          <Navigation className="size-3.5 text-clinics-canopy dark:text-emerald-400" />
          <span className="text-sm font-semibold text-clinics-canopy dark:text-emerald-400">
            {step.metric}
          </span>
          <span className="text-[11px] text-clinics-canopy/70 dark:text-emerald-400/70">
            {step.metricLabel}
          </span>
        </div>
      )}
    </div>
  );
}
