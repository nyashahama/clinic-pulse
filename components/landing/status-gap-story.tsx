import Image from "next/image";

import {
  LandingSection,
  LandingSectionHeader,
} from "@/components/landing/landing-section";
import { operationalLandingPhotos } from "@/components/landing/photo-assets";
import {
  operatingGap,
  statusGapTimeline,
} from "@/lib/landing/openpanel-refactor-content";
import { cn } from "@/lib/utils";

const toneClassNames = {
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  neutral: "border-neutral-200 bg-neutral-50 text-neutral-800",
  critical: "border-red-200 bg-red-50 text-red-950",
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-950",
} satisfies Record<(typeof statusGapTimeline)[number]["tone"], string>;

const dotClassNames = {
  warning: "bg-amber-500",
  neutral: "bg-neutral-500",
  critical: "bg-red-500",
  healthy: "bg-emerald-500",
} satisfies Record<(typeof statusGapTimeline)[number]["tone"], string>;

export function StatusGapStory() {
  const photo = operationalLandingPhotos.patientRoute;

  return (
    <LandingSection id="problem" className="bg-[#eef3f2]">
      <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-14">
        <LandingSectionHeader
          eyebrow={operatingGap.label}
          title={operatingGap.title}
          description={operatingGap.description}
        />

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_18px_50px_rgba(23,32,30,0.08)]">
          <div className="relative aspect-[16/6] min-h-36">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 44rem, 100vw"
              className="object-cover"
              style={{ objectPosition: photo.position }}
            />
            <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-between gap-2">
              <p className="rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-neutral-700 shadow-sm">
                {photo.caption}
              </p>
              <a
                href={photo.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-white/92 px-3 py-1 text-xs font-medium text-neutral-600 shadow-sm hover:text-[#0D7A6B]"
              >
                Photo: {photo.credit}
              </a>
            </div>
          </div>

          <div className="border-t border-neutral-200 p-4 sm:p-5">
            <div className="grid gap-2.5" data-motion-layer="true">
              {statusGapTimeline.map((item, index) => (
                <article
                  key={`${item.label}-${item.title}`}
                  className={cn(
                    "grid gap-2.5 rounded-lg border p-3 sm:grid-cols-[4.5rem_1fr] sm:items-start sm:p-3.5",
                    toneClassNames[item.tone],
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      data-motion-object="true"
                      className={cn(
                        "size-2.5 shrink-0 rounded-full [animation:clinic-soft-blink_3s_ease-in-out_infinite]",
                        dotClassNames[item.tone],
                      )}
                      style={{ animationDelay: `${index * 0.25}s` }}
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
