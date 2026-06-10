"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, User } from "lucide-react";

import { MiniFinderCard } from "@/components/landing/mini-finder-card";
import { MiniFieldReportCard } from "@/components/landing/mini-field-report-card";
import type { PatientJourneyStepData } from "@/lib/landing/patient-journey-data";
import { cn } from "@/lib/utils";

const toneStyles = {
  neutral: {
    stepBadge: "bg-neutral-700 text-neutral-200",
    momentBadge: "bg-neutral-800 text-neutral-300 border-neutral-700",
    border: "border-neutral-800",
  },
  warning: {
    stepBadge: "bg-amber-600 text-amber-100",
    momentBadge: "bg-amber-950 text-amber-200 border-amber-800",
    border: "border-amber-900/30",
  },
  critical: {
    stepBadge: "bg-red-600 text-red-100",
    momentBadge: "bg-red-950 text-red-200 border-red-800",
    border: "border-red-900/30",
  },
  healthy: {
    stepBadge: "bg-emerald-600 text-emerald-100",
    momentBadge: "bg-emerald-950 text-emerald-200 border-emerald-800",
    border: "border-emerald-900/30",
  },
} as const satisfies Record<PatientJourneyStepData["tone"], {
  stepBadge: string;
  momentBadge: string;
  border: string;
}>;

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
          <div className="rounded-lg border border-red-500/20 bg-red-950/40 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-400" />
              <span className="text-sm font-bold uppercase tracking-wide text-red-300">
                {step.headline}
              </span>
            </div>
            {step.details.map((detail, i) => (
              <p key={i} className="mt-2 text-xs text-red-200/70">
                {detail}
              </p>
            ))}
            <div className="mt-3 flex items-center gap-3 text-[11px] text-red-400">
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
          <div className="rounded-lg border border-red-500/30 bg-red-950/50 p-4 text-center backdrop-blur-sm">
            <p className="text-sm font-semibold text-red-200">
              {step.headline}
            </p>
            {step.details.map((detail, i) => (
              <p key={i} className="mt-1.5 text-xs text-red-300/70">
                {detail}
              </p>
            ))}
            {step.metric && (
              <p className="mt-3 font-mono text-2xl font-bold text-red-300">
                {step.metric}
                <span className="ml-1.5 text-xs font-normal text-red-400">
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
        "scroll-snap-align-start flex w-[320px] shrink-0 flex-col rounded-xl border bg-neutral-950/60 p-5 transition-all duration-700 sm:w-[360px]",
        styles.border,
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
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
        <span className="ml-auto font-mono text-[11px] text-white/30">
          {step.time}
        </span>
      </div>

      <div className="mt-4">{renderArtifact()}</div>
    </li>
  );
}
