import Image from "next/image";

import {
  LandingSection,
  LandingSectionHeader,
} from "@/components/landing/landing-section";
import { landingPhotos } from "@/components/landing/photo-assets";
import {
  operatingGap,
  statusGapTimeline,
} from "@/lib/landing/openpanel-refactor-content";
import { cn } from "@/lib/utils";

const toneClassNames = {
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  neutral: "border-neutral-200 bg-neutral-50 text-neutral-800",
  critical: "border-red-200 bg-red-50 text-red-900",
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-900",
} satisfies Record<(typeof statusGapTimeline)[number]["tone"], string>;

const dotClassNames = {
  warning: "bg-amber-500",
  neutral: "bg-neutral-500",
  critical: "bg-red-500",
  healthy: "bg-emerald-500",
} satisfies Record<(typeof statusGapTimeline)[number]["tone"], string>;

export function StatusGapStory() {
  const photo = landingPhotos.clinicExterior;

  return (
    <LandingSection id="problem">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <LandingSectionHeader
          eyebrow={operatingGap.label}
          title={operatingGap.title}
          description={operatingGap.description}
        />

        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="relative aspect-[16/8]">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 44rem, 100vw"
              className="object-cover"
              style={{ objectPosition: photo.position }}
            />
          </div>

          <div className="border-t border-neutral-200 p-4 sm:p-5">
            <div className="grid gap-3">
              {statusGapTimeline.map((item) => (
                <article
                  key={`${item.label}-${item.title}`}
                  className={cn(
                    "grid gap-3 rounded-lg border p-4 sm:grid-cols-[4.5rem_1fr] sm:items-start",
                    toneClassNames[item.tone],
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn("size-2.5 shrink-0 rounded-full", dotClassNames[item.tone])}
                    />
                    <p className="text-sm font-semibold tabular-nums">{item.label}</p>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold leading-6">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 opacity-80">{item.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
