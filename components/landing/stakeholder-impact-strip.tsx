import Image from "next/image";

import { LandingSection } from "@/components/landing/landing-section";
import { landingPhotos } from "@/components/landing/photo-assets";
import { stakeholderImpactItems } from "@/lib/landing/openpanel-refactor-content";

export function StakeholderImpactStrip() {
  return (
    <LandingSection
      className="border-b border-neutral-900 bg-neutral-950"
      contentClassName="border-x-transparent"
      spacing="compact"
    >
      <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
            Real-world stakes
          </p>
          <h2 className="mt-3 font-display text-3xl leading-[1.08] text-white sm:text-4xl">
            One status change affects everyone.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-white/62 sm:text-base sm:leading-7">
            The same clinic status update changes district decisions, field
            reporting, coordinator follow-up, and patient routing.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {stakeholderImpactItems.map((item, index) => {
            const photo = landingPhotos[item.photo];
            const isProminent = index === 0 || index === 3;

            return (
              <article
                key={item.role}
                className="relative min-h-44 overflow-hidden rounded-xl border border-white/10 bg-white p-4 shadow-sm"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 1024px) 18rem, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                  style={{ objectPosition: photo.position }}
                />
                <div
                  className={
                    isProminent
                      ? "absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/10"
                      : "absolute inset-0 bg-white/88 backdrop-blur-[1px]"
                  }
                />

                <div className="relative z-10 flex min-h-36 flex-col justify-end">
                  <p
                    className={
                      isProminent
                        ? "text-xs font-semibold uppercase tracking-[0.14em] text-primary-100"
                        : "text-xs font-semibold uppercase tracking-[0.14em] text-primary"
                    }
                  >
                    {item.signal}
                  </p>
                  <h3
                    className={
                      isProminent
                        ? "mt-2 text-lg font-semibold leading-6 text-white"
                        : "mt-2 text-lg font-semibold leading-6 text-neutral-950"
                    }
                  >
                    {item.role}
                  </h3>
                  <p
                    className={
                      isProminent
                        ? "mt-2 text-sm leading-6 text-neutral-100"
                        : "mt-2 text-sm leading-6 text-neutral-600"
                    }
                  >
                    {item.outcome}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </LandingSection>
  );
}
