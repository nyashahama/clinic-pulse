import type { CSSProperties } from "react";
import Image from "next/image";

import {
  LandingSection,
  LandingSectionHeader,
} from "@/components/landing/landing-section";
import { landingPhotos } from "@/components/landing/photo-assets";
import { incidentFlowSteps } from "@/lib/landing/openpanel-refactor-content";
import { cn } from "@/lib/utils";

const toneClasses = {
  critical: {
    card: "border-red-200 bg-red-50/80 dark:border-red-900/60 dark:bg-red-950/30",
    marker: "border-red-300 bg-red-600 text-white",
    state: "border-red-200 bg-white text-red-700 dark:border-red-900/60 dark:bg-red-950/45 dark:text-red-200",
    rail: "bg-red-200 dark:bg-red-900/60",
  },
  warning: {
    card: "border-amber-200 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/30",
    marker: "border-amber-800 bg-amber-800 text-white",
    state: "border-amber-200 bg-white text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/45 dark:text-amber-200",
    rail: "bg-amber-200 dark:bg-amber-900/60",
  },
  healthy: {
    card: "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/30",
    marker: "border-emerald-800 bg-emerald-800 text-white",
    state: "border-emerald-200 bg-white text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/45 dark:text-emerald-200",
    rail: "bg-emerald-200 dark:bg-emerald-900/60",
  },
  neutral: {
    card: "border-neutral-200 bg-white dark:border-border dark:bg-card",
    marker: "border-neutral-300 bg-neutral-900 text-white",
    state: "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-border dark:bg-muted dark:text-muted-foreground",
    rail: "bg-neutral-200 dark:bg-border",
  },
} satisfies Record<
  (typeof incidentFlowSteps)[number]["tone"],
  {
    card: string;
    marker: string;
    state: string;
    rail: string;
  }
>;

export function IncidentFlowStoryboard() {
  const fieldWorkerPhoto = landingPhotos.fieldWorker;
  const auditReference =
    incidentFlowSteps[incidentFlowSteps.length - 1]?.state ?? "Traceable operating record";

  return (
    <LandingSection id="flow" className="border-y border-neutral-200 bg-neutral-50 dark:border-border dark:bg-background">
      <div className="grid gap-10">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <LandingSectionHeader
            eyebrow="Incident flow"
            title="From field signal to operating record."
            description="One availability incident moves from an offline field report to the district console, patient reroute, and sealed audit trail without splitting the source record."
          />
          <div className="relative min-h-64 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 shadow-sm dark:border-border dark:bg-muted lg:min-h-80">
            <Image
              src={fieldWorkerPhoto.src}
              alt={fieldWorkerPhoto.alt}
              fill
              sizes="(min-width: 1280px) 712px, (min-width: 1024px) 55vw, 100vw"
              className="object-cover"
              style={{ objectPosition: fieldWorkerPhoto.position }}
            />
            <div className="absolute inset-x-0 bottom-0 border-t border-white/30 bg-neutral-950/78 px-4 py-3 text-white backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/68">
                Field source
              </p>
              <p className="mt-1 text-sm font-semibold">
                Offline report keeps the incident source attached.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-border dark:bg-card">
          <div className="border-b border-neutral-200 px-4 py-4 dark:border-border sm:px-5">
            <div className="grid gap-2 sm:flex sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-neutral-950 dark:text-card-foreground">
                Connected incident path
              </p>
              <p className="font-mono text-xs text-neutral-500 dark:text-muted-foreground">
                LIVE_DEMO / {auditReference}
              </p>
            </div>
          </div>

          <div className="relative grid gap-4 overflow-hidden p-4 sm:p-5 lg:grid-cols-4 lg:gap-0">
            <div
              aria-hidden="true"
              data-motion-layer="true"
              className="pointer-events-none absolute inset-x-8 top-24 hidden h-px bg-neutral-200 dark:bg-border lg:block"
            >
              <span
                data-motion-object="true"
                className="absolute -top-1 size-2 rounded-full bg-primary shadow-[0_0_18px_rgba(13,122,107,0.75)] [animation:clinic-rail-scroll_7s_linear_infinite]"
                style={
                  {
                    "--clinic-rail-x": "calc(100vw - 16rem)",
                    "--clinic-rail-y": "0",
                  } as CSSProperties
                }
              />
            </div>
            {incidentFlowSteps.map((step, index) => {
              const tone = toneClasses[step.tone];
              const isLast = index === incidentFlowSteps.length - 1;

              return (
                <article
                  key={step.step}
                  className="relative z-10 min-w-0 lg:px-2"
                  aria-label={`${step.surface}: ${step.title}`}
                >
                  <div
                    className={cn(
                      "relative z-10 flex min-h-56 flex-col rounded-lg border p-4 shadow-sm lg:min-h-72",
                      tone.card,
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-md border font-mono text-xs font-semibold",
                          tone.marker,
                        )}
                      >
                        {step.step}
                      </span>
                      <span
                        className={cn(
                          "max-w-[11rem] rounded-full border px-2.5 py-1 text-right text-[11px] font-semibold leading-4",
                          tone.state,
                        )}
                      >
                        {step.state}
                      </span>
                    </div>

                    <div className="mt-8 min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-700 dark:text-muted-foreground">
                        {step.surface}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold leading-6 text-neutral-950 dark:text-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-muted-foreground">
                        {step.detail}
                      </p>
                    </div>
                  </div>

                  {!isLast ? (
                    <>
                      <span
                        className={cn(
                          "absolute left-5 top-full h-4 w-0.5 sm:left-6 lg:left-auto lg:right-[-0.5rem] lg:top-1/2 lg:h-0.5 lg:w-4",
                          tone.rail,
                        )}
                        aria-hidden="true"
                      />
                      <span
                        className="absolute left-[1.06rem] top-[calc(100%+0.75rem)] size-2 rotate-45 border-r border-t border-neutral-300 dark:border-border sm:left-[1.31rem] lg:left-auto lg:right-[-0.66rem] lg:top-[calc(50%-0.22rem)]"
                        aria-hidden="true"
                      />
                    </>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
