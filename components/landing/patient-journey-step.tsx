"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, User } from "lucide-react";

import { MiniFinderCard } from "@/components/landing/mini-finder-card";
import { MiniFieldReportCard } from "@/components/landing/mini-field-report-card";
import type { PatientJourneyStepData } from "@/lib/landing/patient-journey-data";
import { cn } from "@/lib/utils";

const toneStyles = {
  neutral: {
    stepBadge: "bg-clinics-stone text-clinics-ink-mute",
    momentBadge: "bg-clinics-canvas text-clinics-ink-mute border-clinics-stone",
    border: "border-clinics-stone",
  },
  warning: {
    stepBadge: "bg-clinics-amber text-white",
    momentBadge: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800",
    border: "border-amber-200 dark:border-amber-900/30",
  },
  critical: {
    stepBadge: "bg-clinics-rose text-white",
    momentBadge: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800",
    border: "border-rose-200 dark:border-red-900/30",
  },
  healthy: {
    stepBadge: "bg-clinics-canopy text-white",
    momentBadge: "bg-clinics-canopy-soft text-clinics-canopy border-clinics-canopy/30 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800",
    border: "border-clinics-canopy/30 dark:border-emerald-900/30",
  },
} as const satisfies Record<
  PatientJourneyStepData["tone"],
  { stepBadge: string; momentBadge: string; border: string }
>;

export function PatientJourneyStep({ step }: { step: PatientJourneyStepData }) {
  const ref = useRef<HTMLLIElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const styles = toneStyles[step.tone];

  const renderArtifact = () => {
    switch (step.artifact) {
      case "finder-card":
        return <MiniFinderCard step={step} />;
      case "field-report":
        return <MiniFieldReportCard step={step} />;
      case "status-badge":
        return (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-red-500/20 dark:bg-red-950/40 dark:backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-clinics-rose dark:text-red-400" />
              <span className="text-sm font-bold uppercase tracking-wide text-rose-800 dark:text-red-300">
                {step.headline}
              </span>
            </div>
            {step.details.map((detail, i) => (
              <p key={i} className="mt-2 text-xs text-rose-700/80 dark:text-red-200/70">
                {detail}
              </p>
            ))}
            <div className="mt-3 flex items-center gap-3 text-[11px] text-rose-600 dark:text-red-400">
              <span>Fresh: {step.freshness}</span>
              {step.source && (
                <span className="flex items-center gap-1">
                  <User className="size-3" />
                  {step.source}
                </span>
              )}
            </div>
          </div>
        );
      case "impact-statement":
        return (
          <div className="rounded-lg border border-rose-300 bg-rose-50/80 p-4 text-center dark:border-red-500/30 dark:bg-red-950/50 dark:backdrop-blur-sm">
            <p className="text-sm font-semibold text-rose-800 dark:text-red-200">
              {step.headline}
            </p>
            {step.details.map((detail, i) => (
              <p key={i} className="mt-1.5 text-xs text-rose-600/80 dark:text-red-300/70">
                {detail}
              </p>
            ))}
            {step.metric && (
              <p className="mt-3 font-mono text-2xl font-bold text-clinics-rose dark:text-red-300">
                {step.metric}
                <span className="ml-1.5 text-xs font-normal text-rose-600 dark:text-red-400">
                  {step.metricLabel}
                </span>
              </p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <li
      ref={ref}
      id={`journey-step-${step.step}`}
      aria-labelledby={`journey-step-${step.step}-label`}
      className={cn(
        "snap-start flex w-[320px] shrink-0 flex-col rounded-xl border bg-clinics-canvas p-5 transition-all duration-700 sm:w-[360px] dark:bg-neutral-950/60",
        styles.border,
        visible
          ? "motion-safe:translate-y-0 motion-safe:opacity-100"
          : "motion-safe:translate-y-8 motion-safe:opacity-0"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-full font-mono text-xs font-bold",
            styles.stepBadge
          )}
        >
          {String(step.step).padStart(2, "0")}
        </span>
        <span
          id={`journey-step-${step.step}-label`}
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
            styles.momentBadge
          )}
        >
          {step.moment}
        </span>
        <span className="ml-auto font-mono text-[11px] text-clinics-ink-mute dark:text-white/30">
          {step.time}
        </span>
      </div>

      <div className="mt-4">{renderArtifact()}</div>
    </li>
  );
}
