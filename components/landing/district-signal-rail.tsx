import { ArrowRight } from "lucide-react";

import { operationalNarrative } from "@/lib/landing/operational-narrative-content";

export function DistrictSignalRail() {
  return (
    <section
      data-landing-chapter="signal-rail"
      aria-label="Incident signal sequence"
      className="border-b border-landing-ink/12 bg-white px-4 text-landing-ink dark:border-white/10 dark:bg-[#10221f] dark:text-white sm:px-6 lg:px-8"
    >
      <ol className="mx-auto grid max-w-[80rem] grid-cols-2 border-x border-landing-ink/10 dark:border-white/10 lg:grid-cols-4">
        {operationalNarrative.signalRail.map((item, index) => (
          <li
            key={item.stageId}
            className="relative min-w-0 border-b border-r border-landing-ink/10 p-4 last:border-r-0 dark:border-white/10 sm:p-5 lg:border-b-0"
          >
            <div className="flex items-start gap-3">
              <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-landing-green">
                {item.step}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.09em] text-landing-ink/68 dark:text-white/70">
                  {item.label}
                </p>
                <p className="mt-1.5 text-sm font-semibold leading-5">{item.value}</p>
              </div>
            </div>
            {index < operationalNarrative.signalRail.length - 1 ? (
              <span
                className="absolute -right-2.5 top-1/2 z-10 hidden size-5 -translate-y-1/2 place-items-center rounded-full border border-landing-ink/12 bg-white text-landing-green dark:border-white/12 dark:bg-[#10221f] lg:grid"
                aria-hidden="true"
              >
                <ArrowRight className="size-3" />
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
