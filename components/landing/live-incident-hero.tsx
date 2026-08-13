"use client";

import { ArrowRight, Radio } from "lucide-react";
import Image from "next/image";

import { HeroDistrictConsole } from "@/components/landing/hero-district-console";
import { LiveSignalField } from "@/components/landing/motion/live-signal-field";
import { ScrollReveal } from "@/components/landing/motion/scroll-reveal";
import { operationalLandingPhotos } from "@/components/landing/photo-assets";
import { liveIncidentHero } from "@/lib/landing/openpanel-refactor-content";

type LiveIncidentHeroProps = {
  onBookDemo: () => void;
};

export function LiveIncidentHero({ onBookDemo }: LiveIncidentHeroProps) {
  const heroPhoto = operationalLandingPhotos.heroWorker;

  return (
    <section
      data-public-surface="light"
      className="relative isolate overflow-hidden border-b border-neutral-200 bg-[#f7faf9] text-[#17201e]"
    >
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_12%_12%,rgba(13,122,107,0.10),transparent_28%),radial-gradient(circle_at_88%_30%,rgba(59,130,246,0.07),transparent_30%)]" />
      <LiveSignalField className="z-0 opacity-30" />

      <div className="relative z-10 mx-auto grid w-full max-w-screen-xl gap-12 px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-14 lg:px-10 lg:pb-24 lg:pt-24">
        <div className="max-w-2xl">
          <ScrollReveal delay={0.02}>
            <div className="flex flex-wrap items-center gap-2">
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
                <span className="size-2 rounded-full bg-emerald-600" />
                {liveIncidentHero.eyebrow}
              </p>
              <p className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600">
                Illustrative operational scenario
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <h1 className="mt-7 max-w-3xl font-display text-[2.8rem] leading-[0.98] tracking-[-0.052em] text-[#17201e] sm:text-6xl lg:text-[4.5rem]">
              {liveIncidentHero.title}
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.14}>
            <p className="mt-6 max-w-xl text-lg leading-8 text-neutral-600">
              {liveIncidentHero.description}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onBookDemo}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#0D7A6B] bg-[#0D7A6B] px-6 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(13,122,107,0.20)] transition hover:bg-[#09695d] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#0D7A6B]/25 sm:w-auto"
              >
                {liveIncidentHero.primaryCta.label}
                <ArrowRight className="size-4" />
              </button>
              <a
                href={liveIncidentHero.secondaryCta.href}
                className="inline-flex h-12 w-full items-center justify-center rounded-full border border-neutral-300 bg-white px-6 text-sm font-semibold text-neutral-800 transition hover:border-[#0D7A6B]/40 hover:bg-emerald-50 hover:text-[#0D7A6B] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#0D7A6B]/20 sm:w-auto"
              >
                {liveIncidentHero.secondaryCta.label}
              </a>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.24}>
            <div className="mt-7 flex max-w-lg items-start gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-6 text-neutral-600 shadow-sm">
              <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[#0D7A6B]">
                <Radio className="size-3.5" />
              </span>
              <span>
                <strong className="font-semibold text-neutral-900">Mabopane Station:</strong>{" "}
                pharmacy signal received, source attached, reroute ready for review.
              </span>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.28} className="relative min-w-0">
          <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(ellipse_at_center,rgba(13,122,107,0.12),transparent_68%)]" />
          <div className="relative rounded-[1.5rem] border border-neutral-200 bg-white p-2 shadow-[0_28px_80px_rgba(23,32,30,0.13)] sm:p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1 pt-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-700">
                Scenario workspace
              </p>
              <p className="text-xs font-medium text-neutral-500">
                Demonstration data · not live
              </p>
            </div>
            <div className="relative mb-3 aspect-[16/4] min-h-24 overflow-hidden rounded-xl bg-neutral-100">
              <Image
                src={heroPhoto.src}
                alt={heroPhoto.alt}
                fill
                priority
                sizes="(min-width: 1024px) 52vw, 100vw"
                className="object-cover"
                style={{ objectPosition: heroPhoto.position }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#17201e]/75 via-[#17201e]/20 to-transparent" />
              <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-between gap-2">
                <p className="rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-neutral-700 shadow-sm">
                  {heroPhoto.caption}
                </p>
                <a
                  href={heroPhoto.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-white/92 px-3 py-1 text-xs font-medium text-neutral-600 shadow-sm hover:text-[#0D7A6B]"
                >
                  Photo: {heroPhoto.credit}
                </a>
              </div>
            </div>
            <HeroDistrictConsole className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm" />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
