"use client";

import Image from "next/image";
import { ArrowRight, MapPin, ShieldCheck } from "lucide-react";

import { HeroDistrictConsole } from "@/components/landing/hero-district-console";
import { landingPhotos } from "@/components/landing/photo-assets";
import { liveIncidentHero } from "@/lib/landing/openpanel-refactor-content";

type LiveIncidentHeroProps = {
  onBookDemo: () => void;
};

export function LiveIncidentHero({ onBookDemo }: LiveIncidentHeroProps) {
  const incident = liveIncidentHero.incident;

  return (
    <section className="relative isolate overflow-hidden border-b border-neutral-950 bg-neutral-950 text-white">
      <Image
        src={landingPhotos.heroClinic.src}
        alt={landingPhotos.heroClinic.alt}
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 object-cover"
        style={{ objectPosition: landingPhotos.heroClinic.position }}
      />
      <div className="absolute inset-0 -z-10 bg-neutral-950/68 sm:bg-neutral-950/62" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(10,10,10,0.94)_0%,rgba(10,10,10,0.84)_46%,rgba(10,10,10,0.62)_100%)] lg:bg-[linear-gradient(90deg,rgba(10,10,10,0.94)_0%,rgba(10,10,10,0.66)_46%,rgba(10,10,10,0.18)_100%)]" />

      <div className="mx-auto grid min-h-[calc(100svh-5rem)] w-full max-w-screen-xl grid-cols-1 gap-6 px-4 py-7 sm:px-6 sm:py-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:gap-8 lg:px-10 lg:py-10">
        <div className="min-w-0 max-w-2xl">
          <p className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/72 backdrop-blur">
            {liveIncidentHero.eyebrow}
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-[2.85rem] leading-[0.98] text-white sm:text-6xl lg:text-7xl">
            {liveIncidentHero.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/76 sm:text-lg sm:leading-8">
            {liveIncidentHero.description}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onBookDemo}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200 sm:w-auto"
            >
              {liveIncidentHero.primaryCta.label}
              <ArrowRight className="size-4" />
            </button>
            <a
              href={liveIncidentHero.secondaryCta.href}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-white/25 bg-white/10 px-5 text-sm font-semibold text-white transition hover:border-white/45 hover:bg-white/15 sm:w-auto"
            >
              {liveIncidentHero.secondaryCta.label}
            </a>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-3">
            {liveIncidentHero.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-lg border border-white/15 bg-white/10 p-2 backdrop-blur sm:p-3"
              >
                <p className="font-display text-xl text-white sm:text-2xl">{metric.value}</p>
                <p className="mt-1 text-[9px] font-semibold uppercase leading-4 tracking-[0.12em] text-white/60 sm:text-xs">
                  {metric.label}
                </p>
                <p className="mt-2 hidden text-xs leading-5 text-white/58 sm:block">
                  {metric.detail}
                </p>
              </div>
            ))}
          </div>

          <div
            data-incident-proof="true"
            data-route-proof="true"
            className="mt-4 rounded-lg border border-white/15 bg-white/10 p-3 text-xs leading-5 text-white/70 backdrop-blur sm:hidden"
          >
            <p className="font-semibold text-white">{incident.clinic}</p>
            <p className="mt-1">
              Reroute to{" "}
              <span className="font-semibold text-white">
                {incident.recommendedRoute}
              </span>
            </p>
            <p className="mt-1 font-mono text-white/60">{incident.auditId}</p>
          </div>

          <div className="mt-5 hidden gap-3 sm:grid sm:grid-cols-2">
            <div
              data-incident-proof="true"
              className="rounded-lg border border-red-300/25 bg-red-950/45 p-4 backdrop-blur"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-100/70">
                  Active incident
                </p>
                <span className="rounded-full bg-red-300 px-2.5 py-1 text-[11px] font-bold text-red-950">
                  {incident.status}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-white">{incident.clinic}</p>
              <p className="mt-1 text-sm leading-6 text-white/68">{incident.reason}</p>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-white/65">
                <ShieldCheck className="size-3.5" />
                {incident.auditId}
              </div>
            </div>

            <div
              data-route-proof="true"
              className="rounded-lg border border-emerald-300/25 bg-emerald-950/45 p-4 backdrop-blur"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100/70">
                Recommended route
              </p>
              <div className="mt-3 flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-200" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    {incident.recommendedRoute}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-white/68">
                    {incident.routeDetail} / {incident.service} accepting
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <HeroDistrictConsole className="self-center rounded-xl bg-white/8 p-2 shadow-2xl shadow-black/35 ring-1 ring-white/10 backdrop-blur-md" />
      </div>
    </section>
  );
}
