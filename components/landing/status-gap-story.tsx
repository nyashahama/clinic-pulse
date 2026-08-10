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
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-200",
  neutral: "border-neutral-200 bg-neutral-50 text-neutral-800 dark:border-border dark:bg-muted dark:text-muted-foreground",
  critical: "border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-200",
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-200",
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
      <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-14">
        <LandingSectionHeader
          eyebrow={operatingGap.label}
          title={operatingGap.title}
          description={operatingGap.description}
        />

        <div className="overflow-hidden rounded-xl border border-white/[0.09] bg-white/[0.025] shadow-2xl shadow-black/20">
          <div className="relative aspect-[16/6] min-h-36">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 44rem, 100vw"
              className="object-cover"
              style={{ objectPosition: photo.position }}
            />
          </div>

          <div className="border-t border-neutral-200 p-4 dark:border-border sm:p-5">
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
