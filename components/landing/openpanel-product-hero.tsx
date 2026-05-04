"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  MapPin,
  Radio,
  Route,
  ShieldCheck,
} from "lucide-react";

import {
  heroClinicRows,
  heroStats,
  landingHero,
} from "@/lib/landing/openpanel-refactor-content";
import { cn } from "@/lib/utils";

type OpenPanelProductHeroProps = {
  onBookDemo: () => void;
};

const statusStyles = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-800",
} as const;

const heroStatIcons = {
  "demo clinics": Activity,
  "offline syncs": Radio,
  "freshness target": ShieldCheck,
} satisfies Record<(typeof heroStats)[number]["label"], LucideIcon>;

export function OpenPanelProductHero({ onBookDemo }: OpenPanelProductHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-neutral-200 bg-[#eef3f2]">
      <div className="mx-auto grid min-w-0 w-full max-w-screen-xl gap-7 px-4 py-8 sm:px-6 lg:min-h-[calc(100svh-7rem)] lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-8 lg:px-10 lg:py-8">
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

        <ProductPreview />
      </div>
    </section>
  );
}

function ProductPreview() {
  return (
    <div className="relative min-w-0 max-w-full">
      <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
        <div className="flex h-12 min-w-0 items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50 px-4">
          <div className="flex shrink-0 items-center gap-2">
            <span className="size-3 rounded-full bg-red-400" />
            <span className="size-3 rounded-full bg-amber-400" />
            <span className="size-3 rounded-full bg-emerald-400" />
          </div>
          <div className="min-w-0 flex-1 truncate rounded-md border border-neutral-200 bg-white px-3 py-1 font-mono text-xs text-neutral-500">
            clinicpulse.demo/district-console
          </div>
          <span className="hidden shrink-0 text-xs font-semibold text-neutral-500 sm:block">
            Live demo
          </span>
        </div>

        <div className="grid min-w-0 gap-0 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="hidden border-b border-neutral-200 bg-[#f8faf9] p-4 xl:block xl:border-b-0 xl:border-r">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">
                  Gauteng district
                </p>
                <h2 className="mt-1 text-lg font-semibold text-neutral-950">
                  Clinic availability
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                live
              </span>
            </div>

            <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-xl border border-neutral-200 bg-[#dfe7e3]">
              <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(255,255,255,0.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.55)_1px,transparent_1px)] [background-size:32px_32px]" />
              {[
                ["left-[22%] top-[26%]", "bg-emerald-500"],
                ["left-[45%] top-[32%]", "bg-emerald-500"],
                ["left-[58%] top-[22%]", "bg-amber-500"],
                ["left-[36%] top-[56%]", "bg-red-500"],
                ["left-[66%] top-[58%]", "bg-emerald-500"],
              ].map(([position, color]) => (
                <span
                  key={position}
                  className={cn(
                    "absolute size-4 rounded-full border-2 border-white shadow-lg",
                    position,
                    color,
                  )}
                />
              ))}
              <div className="absolute bottom-4 left-4 rounded-xl bg-neutral-950 px-4 py-3 text-white shadow-xl">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                  Capacity score
                </p>
                <p className="mt-1 text-2xl font-semibold">78%</p>
              </div>
            </div>
          </div>

          <div className="min-w-0 p-4">
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-3.5 shadow-sm">
              <div className="flex min-w-0 items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
                    Route alert
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-neutral-950">
                    Mamelodi East cannot accept ARV visits
                  </h3>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-primary">
                  fresh
                </span>
              </div>
            </div>

            <div className="mt-4 hidden space-y-2.5 xl:block [@media(max-height:760px)]:hidden">
              {heroClinicRows.map((row, index) => (
                <div
                  key={row.clinic}
                  className={cn(
                    "min-w-0 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm",
                    index > 1 && "max-sm:hidden",
                  )}
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-950">
                        {row.clinic}
                      </p>
                      <p className="mt-1 break-words text-xs text-neutral-500">
                        {row.reason}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                        statusStyles[row.tone],
                      )}
                    >
                      {row.status}
                    </span>
                  </div>
                  <div className="mt-3 flex min-w-0 items-center justify-between gap-3 text-xs font-semibold text-primary">
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <Route className="size-3.5" />
                      {row.action}
                    </span>
                    <span className="text-neutral-500">{row.freshness}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 hidden grid-cols-3 gap-2.5 xl:grid [@media(max-height:800px)]:hidden">
              {heroStats.map((stat) => {
                const Icon = heroStatIcons[stat.label];

                return (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-neutral-200 bg-neutral-50 p-2.5"
                  >
                    <Icon className="size-4 text-primary" />
                    <p className="mt-2 text-lg font-semibold text-neutral-950">
                      {stat.value}
                    </p>
                    <p className="text-xs font-medium text-neutral-500">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 right-6 hidden rounded-xl border border-neutral-200 bg-white p-3 shadow-xl lg:block">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-950">
          <MapPin className="size-4 text-primary" />
          Akasia Hills Clinic ready for reroutes
        </div>
      </div>
    </div>
  );
}
