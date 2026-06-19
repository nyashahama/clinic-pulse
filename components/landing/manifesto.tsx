import Image from "next/image";

import { landingPhotos } from "@/components/landing/photo-assets";
import { SectionHeader } from "@/components/landing/sections/section-header";

const STAKEHOLDERS = [
  {
    role: "District team",
    outcome:
      "Acts on source, reason, and freshness before making a public routing decision.",
    signal: "Live district view",
    photo: "clinicTeam" as const,
    prominent: true,
  },
  {
    role: "Field worker",
    outcome:
      "Submits the service update even when the report has to queue offline.",
    signal: "Queued field report",
    photo: "fieldWorker" as const,
    prominent: false,
  },
  {
    role: "Clinic coordinator",
    outcome:
      "Confirms the service impact without losing the original source record.",
    signal: "Traceable status change",
    photo: "clinicExterior" as const,
    prominent: false,
  },
  {
    role: "Patient",
    outcome:
      "Sees the safer nearby route before spending time travelling to a blocked service.",
    signal: "18 min avoided",
    photo: "patientCare" as const,
    prominent: true,
  },
];

/**
 * Manifesto — rewritten as a stakeholder impact section. Shows how
 * one status change affects four different roles, each with a real
 * photo background. Replaces the abstract three-pillar manifesto.
 */
export function Manifesto() {
  return (
    <section id="manifesto" className="bg-clinics-paper py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader
          eyebrow="Real-world stakes"
          heading="One status change affects everyone."
          subhead="The same clinic status update changes district decisions, field reporting, coordinator follow-up, and patient routing."
        />

        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {STAKEHOLDERS.map((s) => {
            const photo = landingPhotos[s.photo];
            return (
              <article
                key={s.role}
                className="relative min-h-48 overflow-hidden rounded-xl border border-clinics-stone"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                  style={{ objectPosition: photo.position }}
                />
                {s.prominent ? (
                  <div className="absolute inset-0 bg-gradient-to-t from-clinics-ink via-clinics-ink/70 to-clinics-ink/10" />
                ) : (
                  <div className="absolute inset-0 bg-clinics-paper/88 backdrop-blur-[1px]" />
                )}

                <div className="relative z-10 flex min-h-40 flex-col justify-end p-5">
                  <p
                    className={
                      s.prominent
                        ? "text-xs font-semibold uppercase tracking-[0.14em] text-clinics-canopy-soft"
                        : "text-xs font-semibold uppercase tracking-[0.14em] text-clinics-canopy"
                    }
                  >
                    {s.signal}
                  </p>
                  <h3
                    className={
                      s.prominent
                        ? "mt-2 text-lg font-semibold text-white"
                        : "mt-2 text-lg font-semibold text-clinics-ink"
                    }
                  >
                    {s.role}
                  </h3>
                  <p
                    className={
                      s.prominent
                        ? "mt-2 text-sm leading-6 text-white/80"
                        : "mt-2 text-sm leading-6 text-clinics-ink-mute"
                    }
                  >
                    {s.outcome}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
