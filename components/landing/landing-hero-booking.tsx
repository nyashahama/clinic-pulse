import Image from "next/image";
import Link from "next/link";

import { HeroDistrictConsole } from "@/components/landing/hero-district-console";
import { landingPhotos } from "@/components/landing/photo-assets";
import { StatusPill } from "@/components/landing/sections/status-pill";

/**
 * Landing hero — editorial heading + clinic photo + real product UI.
 * Left column: two-tone serif heading, CTAs, stats on paper background.
 * Right column: clinic photo with HeroDistrictConsole overlaid (glass effect).
 */
export function LandingHeroBooking() {
  const heroPhoto = landingPhotos.heroClinic;

  return (
    <section id="hero" className="relative bg-clinics-paper">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-6 py-16 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-14 lg:py-0 lg:min-h-[85vh]">
        {/* Left — editorial heading */}
        <div className="max-w-2xl">
          <StatusPill label="LIVE — MP-001" className="mb-6" />

          <h1 className="font-serif text-5xl leading-[1.05] tracking-[-0.02em] text-clinics-ink sm:text-6xl md:text-7xl">
            <span className="block text-clinics-ink-mute">Know which clinics</span>
            <span className="block">can help before</span>
            <span className="block">
              patients <span className="text-clinics-canopy">travel.</span>
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-clinics-ink-mute">
            Clinic Pulse turns field reports, clinic availability, patient
            rerouting, and audit-ready operating records into one operating
            view for district teams.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/?booking=1"
              className="rounded-lg bg-clinics-ink px-5 py-2.5 text-sm font-medium text-clinics-paper transition-colors hover:bg-clinics-ink-mute"
            >
              Book walkthrough
            </Link>
            <Link
              href="#product"
              className="rounded-lg border border-clinics-stone px-5 py-2.5 text-sm text-clinics-ink-mute transition-colors hover:text-clinics-ink"
            >
              See the product
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-6 text-sm text-clinics-ink-mute">
            <div>
              <span className="font-serif text-2xl text-clinics-ink">42</span>
              <span className="ml-1 text-xs">clinics connected</span>
            </div>
            <div className="h-4 w-px bg-clinics-stone" />
            <div>
              <span className="font-serif text-2xl text-clinics-ink">18 min</span>
              <span className="ml-1 text-xs">saved per incident</span>
            </div>
            <div className="h-4 w-px bg-clinics-stone" />
            <div>
              <span className="font-serif text-2xl text-clinics-ink">99.9%</span>
              <span className="ml-1 text-xs">uptime SLA</span>
            </div>
          </div>
        </div>

        {/* Right — clinic photo with district console overlaid */}
        <div className="relative hidden min-h-[520px] overflow-hidden rounded-2xl border border-clinics-stone lg:block">
          <Image
            src={heroPhoto.src}
            alt={heroPhoto.alt}
            fill
            priority
            sizes="(min-width: 1024px) 48rem, 100vw"
            className="object-cover"
            style={{ objectPosition: heroPhoto.position }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-clinics-ink/70 via-clinics-ink/30 to-transparent" />
          <div className="absolute inset-4 overflow-hidden rounded-xl ring-1 ring-white/10">
            <HeroDistrictConsole className="w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
