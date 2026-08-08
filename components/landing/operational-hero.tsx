import { ArrowDownRight, ArrowRight, Clock3, FileCheck2, WifiOff } from "lucide-react";

import { BookingTrigger } from "@/components/landing/booking-trigger";
import { DistrictCanvas } from "@/components/landing/district-canvas";
import { operationalNarrative } from "@/lib/landing/operational-narrative-content";

const proofIcons = [Clock3, WifiOff, FileCheck2] as const;

export function OperationalHero() {
  return (
    <section
      data-landing-chapter="hero"
      data-landing-hero="true"
      className="relative overflow-hidden border-b border-landing-ink/12 bg-landing-paper px-4 text-landing-ink dark:border-white/10 sm:px-6 lg:px-8"
    >
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(to_right,var(--landing-ink)_1px,transparent_1px)] [background-size:80px_100%] [mask-image:linear-gradient(to_bottom,black,transparent_72%)] dark:opacity-[0.06]" />

      <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-[80rem] gap-12 py-12 sm:py-16 lg:grid-cols-[minmax(0,0.82fr)_minmax(35rem,1.18fr)] lg:items-center lg:gap-10 lg:py-14">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-landing-green">
              {operationalNarrative.hero.eyebrow}
            </p>
            <span className="h-3 w-px bg-landing-ink/18" aria-hidden="true" />
            <p className="text-xs font-medium text-landing-ink/58 dark:text-white/58">
              {operationalNarrative.disclosure}
            </p>
          </div>

          <h1 className="mt-7 max-w-[11ch] font-display text-[3.25rem] leading-[0.96] tracking-[-0.04em] text-landing-ink sm:text-[4.4rem] lg:text-[4.8rem] dark:text-white">
            {operationalNarrative.hero.title}
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-landing-ink/68 sm:text-lg sm:leading-8 dark:text-white/65">
            {operationalNarrative.hero.description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <BookingTrigger className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-landing-green px-5 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(8,117,104,0.2)] transition hover:bg-[#06685d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-route focus-visible:ring-offset-2 focus-visible:ring-offset-landing-paper dark:text-[#06251f]">
              {operationalNarrative.hero.primaryCta}
              <ArrowRight className="size-4" aria-hidden="true" />
            </BookingTrigger>
            <a
              href="#how-it-works"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-landing-ink/20 bg-white/55 px-5 text-sm font-semibold text-landing-ink transition hover:border-landing-ink/40 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-route dark:border-white/20 dark:bg-white/6 dark:text-white dark:hover:bg-white/10"
            >
              {operationalNarrative.hero.secondaryCta}
              <ArrowDownRight className="size-4" aria-hidden="true" />
            </a>
          </div>

          <div className="mt-10 grid gap-3 border-t border-landing-ink/12 pt-5 sm:grid-cols-3 dark:border-white/10">
            {operationalNarrative.hero.proofLines.map((proof, index) => {
              const Icon = proofIcons[index];
              return (
                <div key={proof.label} className="min-w-0">
                  <div className="flex items-center gap-2 text-xs font-semibold text-landing-ink dark:text-white">
                    <Icon className="size-3.5 text-landing-green" aria-hidden="true" />
                    {proof.label}
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-landing-ink/58 dark:text-white/55">
                    {proof.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <DistrictCanvas stageId="field-report" variant="hero" className="self-center" />
      </div>
    </section>
  );
}
