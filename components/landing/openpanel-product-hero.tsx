"use client";

import { ArrowRight } from "lucide-react";

import { HeroDistrictConsole } from "@/components/landing/hero-district-console";
import { landingHero } from "@/lib/landing/openpanel-refactor-content";

type OpenPanelProductHeroProps = {
  onBookDemo: () => void;
};

export function OpenPanelProductHero({ onBookDemo }: OpenPanelProductHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-neutral-200 bg-white">
      <div className="mx-auto grid min-w-0 w-full max-w-screen-xl grid-cols-1 gap-7 px-4 py-8 sm:px-6 lg:min-h-[calc(100svh-7rem)] lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-8 lg:px-10 lg:py-8">
        <div className="min-w-0 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {landingHero.eyebrow}
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[0.98] text-neutral-950 sm:text-6xl lg:text-7xl">
            {landingHero.title}
          </h1>
          <p className="mt-5 text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8">
            {landingHero.description}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onBookDemo}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 sm:w-auto"
            >
              {landingHero.primaryCta.label}
              <ArrowRight className="size-4" />
            </button>
            <a
              href={landingHero.secondaryCta.href}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-950 transition hover:border-neutral-400 hover:bg-neutral-50 sm:w-auto"
            >
              {landingHero.secondaryCta.label}
            </a>
          </div>

          <div className="mt-6 hidden flex-wrap gap-2 sm:flex">
            {landingHero.perks.map((perk) => (
              <span
                key={perk}
                className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600"
              >
                {perk}
              </span>
            ))}
          </div>
        </div>

        <HeroDistrictConsole />
      </div>
    </section>
  );
}
