import { ArrowDown, Clock3 } from "lucide-react";

import { DistrictCanvas } from "@/components/landing/district-canvas";
import { IncidentProgression } from "@/components/landing/incident-progression";
import { OperationalStatus } from "@/components/landing/operational-status";
import { operationalNarrative } from "@/lib/landing/operational-narrative-content";

export function IncidentNarrative() {
  return (
    <section
      id="how-it-works"
      data-landing-chapter="incident-narrative"
      className="scroll-mt-20 border-b border-landing-ink/12 bg-landing-paper px-4 py-20 text-landing-ink dark:border-white/10 sm:px-6 sm:py-24 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-[80rem]">
        <header className="grid gap-6 border-b border-landing-ink/12 pb-12 dark:border-white/10 lg:grid-cols-[minmax(0,0.72fr)_minmax(28rem,1.28fr)] lg:items-end lg:pb-16">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-landing-green">
              {operationalNarrative.narrative.eyebrow}
            </p>
            <p className="mt-3 max-w-sm text-xs leading-5 text-landing-ink/70 dark:text-white/70">
              {operationalNarrative.disclosure}
            </p>
          </div>
          <div>
            <h2 className="max-w-[18ch] font-display text-4xl leading-[1.02] tracking-[-0.035em] sm:text-5xl lg:text-[3.5rem] dark:text-white">
              {operationalNarrative.narrative.title}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-landing-ink/64 dark:text-white/62">
              {operationalNarrative.narrative.description}
            </p>
          </div>
        </header>

        <div className="mt-12 lg:mt-16">
          <IncidentProgression>
            {operationalNarrative.stages.map((stage, index) => (
              <article
                key={stage.id}
                data-incident-stage={stage.id}
                className="relative min-w-0 border-t border-landing-ink/14 py-10 first:border-t-0 first:pt-0 dark:border-white/12 lg:flex lg:min-h-[72vh] lg:flex-col lg:justify-center lg:py-16"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full border border-landing-ink/16 bg-white font-mono text-xs font-semibold text-landing-green shadow-sm dark:border-white/14 dark:bg-white/7">
                      {stage.step}
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-landing-ink/68 dark:text-white/70">
                        {stage.eyebrow}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 font-mono text-xs font-semibold text-landing-ink/68 dark:text-white/68">
                        <Clock3 className="size-3.5" aria-hidden="true" />
                        {stage.time}
                      </p>
                    </div>
                  </div>
                  <OperationalStatus tone={stage.tone}>{stage.statusLabel}</OperationalStatus>
                </div>

                <h3 className="mt-7 max-w-[17ch] font-display text-3xl leading-[1.04] tracking-[-0.03em] sm:text-[2.5rem] dark:text-white">
                  {stage.title}
                </h3>
                <p className="mt-4 max-w-xl text-sm leading-6 text-landing-ink/65 sm:text-base sm:leading-7 dark:text-white/62">
                  {stage.summary}
                </p>

                <div className="mt-7 lg:hidden">
                  <DistrictCanvas stageId={stage.id} variant="compact" />
                </div>

                <dl className="mt-7 divide-y divide-landing-ink/10 border-y border-landing-ink/12 dark:divide-white/10 dark:border-white/12">
                  {stage.events.map((event) => (
                    <div
                      key={event.label}
                      className="grid min-w-0 grid-cols-[6.5rem_minmax(0,1fr)] gap-4 py-3 text-sm"
                    >
                      <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-landing-ink/68 dark:text-white/70">
                        {event.label}
                      </dt>
                      <dd className="min-w-0 break-words font-semibold leading-5">{event.value}</dd>
                    </div>
                  ))}
                </dl>

                {index < operationalNarrative.stages.length - 1 ? (
                  <ArrowDown
                    className="absolute -bottom-3 right-0 hidden size-5 text-landing-green lg:block"
                    aria-hidden="true"
                  />
                ) : null}
              </article>
            ))}
          </IncidentProgression>
        </div>
      </div>
    </section>
  );
}
