"use client";

import { ArrowRight, Radio } from "lucide-react";
import Image from "next/image";

import { HeroDistrictConsole } from "@/components/landing/hero-district-console";
import { LiveSignalField } from "@/components/landing/motion/live-signal-field";
import { ScrollReveal } from "@/components/landing/motion/scroll-reveal";
import { landingPhotos } from "@/components/landing/photo-assets";
import { liveIncidentHero } from "@/lib/landing/openpanel-refactor-content";

type LiveIncidentHeroProps = {
  onBookDemo: () => void;
};

export function LiveIncidentHero({ onBookDemo }: LiveIncidentHeroProps) {
  return (
    <section className="relative isolate overflow-hidden border-b border-white/[0.08] bg-[#070908] text-white">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_4%,rgba(31,73,63,0.34),transparent_38%),radial-gradient(circle_at_86%_48%,rgba(30,48,104,0.18),transparent_28%)]" />
      <div className="absolute inset-0 -z-10 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
      <LiveSignalField className="z-0 opacity-45" />

      <div className="relative z-10 mx-auto w-full max-w-screen-xl px-4 pb-14 pt-16 sm:px-6 sm:pb-18 sm:pt-20 lg:px-10 lg:pb-24 lg:pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <ScrollReveal delay={0.02}>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/18 bg-emerald-300/[0.06] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-200/76">
                <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" />
                {liveIncidentHero.eyebrow}
              </p>
              <p className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/56">
                Illustrative operational scenario
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <h1 className="mx-auto mt-6 max-w-4xl font-display text-[2.9rem] leading-[0.94] tracking-[-0.055em] text-white sm:text-6xl lg:text-[5.35rem]">
              {liveIncidentHero.title}
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.14}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/58 sm:text-lg sm:leading-8">
              {liveIncidentHero.description}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onBookDemo}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white bg-white px-5 text-sm font-semibold text-neutral-950 shadow-[0_12px_42px_rgba(0,0,0,0.32)] transition hover:bg-white/88 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/25 sm:w-auto"
              >
                {liveIncidentHero.primaryCta.label}
                <ArrowRight className="size-4" />
              </button>
              <a
                href={liveIncidentHero.secondaryCta.href}
                className="inline-flex h-11 w-full items-center justify-center rounded-full border border-white/14 bg-white/[0.04] px-5 text-sm font-semibold text-white/72 transition hover:border-white/28 hover:bg-white/[0.08] hover:text-white sm:w-auto"
              >
                {liveIncidentHero.secondaryCta.label}
              </a>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.24}>
            <div className="mx-auto mt-6 flex max-w-max items-center gap-2 rounded-full border border-white/[0.08] bg-black/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/56">
              <Radio className="size-3 text-emerald-300/80" />
              Mabopane Station · pharmacy signal · source attached
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.28} className="relative mt-10 sm:mt-14 lg:mt-16">
          <div className="absolute -inset-x-8 -inset-y-10 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(24,78,64,0.22),transparent_66%)]" />

          <div className="relative mx-auto max-w-[1080px]">
            <div className="relative mb-3 aspect-[16/5] min-h-24 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] sm:mb-4 xl:hidden">
              <Image
                src={landingPhotos.heroClinic.src}
                alt={landingPhotos.heroClinic.alt}
                fill
                priority
                sizes="(min-width: 640px) 90vw, 100vw"
                className="object-cover saturate-[0.72]"
                style={{ objectPosition: landingPhotos.heroClinic.position }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/76 via-black/28 to-transparent" />
              <p className="absolute bottom-3 left-3 font-mono text-[9px] uppercase tracking-[0.14em] text-white/64">
                Illustrative clinic context
              </p>
            </div>

            <div className="absolute -left-10 top-20 z-20 hidden w-44 overflow-hidden rounded-xl border border-white/12 bg-[#0b0d0c] p-2 shadow-2xl shadow-black/50 xl:block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
                <Image
                  src={landingPhotos.heroClinic.src}
                  alt={landingPhotos.heroClinic.alt}
                  fill
                  priority
                  sizes="176px"
                  className="object-cover saturate-[0.78]"
                  style={{ objectPosition: landingPhotos.heroClinic.position }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <p className="absolute inset-x-3 bottom-3 font-mono text-[9px] uppercase leading-4 tracking-[0.14em] text-white/66">
                  Illustrative clinic context
                </p>
              </div>
            </div>

            <HeroDistrictConsole className="rounded-2xl bg-white/[0.035] p-1.5 shadow-[0_32px_100px_rgba(0,0,0,0.55)] ring-1 ring-white/10 sm:p-2" />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
