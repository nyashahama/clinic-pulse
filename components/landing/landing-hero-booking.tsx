import Image from "next/image";
import Link from "next/link";

import { HeroDistrictConsole } from "@/components/landing/hero-district-console";
import { landingPhotos } from "@/components/landing/photo-assets";
import { StatusPill } from "@/components/landing/sections/status-pill";

/**
 * Landing hero — full-bleed clinic photo background with dark overlays,
 * editorial serif heading on the left, HeroDistrictConsole on the right.
 * Matches the production version's full-bleed image pattern.
 */
export function LandingHeroBooking() {
  const heroPhoto = landingPhotos.heroClinic;

  return (
    <section className="relative isolate overflow-hidden bg-clinics-ink text-white">
      {/* Full-bleed clinic photo */}
      <Image
        src={heroPhoto.src}
        alt={heroPhoto.alt}
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 object-cover"
        style={{ objectPosition: heroPhoto.position }}
      />
      {/* Dark overlays for text legibility */}
      <div className="absolute inset-0 -z-10 bg-clinics-ink/60" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-clinics-ink/90 via-clinics-ink/60 to-transparent" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-6 py-20 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-14 lg:py-28">
        {/* Left — editorial heading */}
        <div className="max-w-2xl">
          <StatusPill label="LIVE — MP-001" className="mb-6" />

          <h1 className="font-serif text-5xl leading-[1.05] tracking-[-0.02em] text-white sm:text-6xl md:text-7xl">
            <span className="block text-white/70">Know which clinics</span>
            <span className="block">can help before</span>
            <span className="block">
              patients <span className="text-clinics-canopy-soft">travel.</span>
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
            Clinic Pulse turns field reports, clinic availability, patient
            rerouting, and audit-ready operating records into one operating
            view for district teams.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/?booking=1"
              className="rounded-lg bg-clinics-canopy-soft px-5 py-2.5 text-sm font-medium text-clinics-ink transition-colors hover:bg-clinics-canopy"
            >
              Book walkthrough
            </Link>
            <Link
              href="#product"
              className="rounded-lg border border-white/25 bg-white/10 px-5 py-2.5 text-sm text-white transition-colors hover:bg-white/20"
            >
              See the product
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-6 text-sm text-white/60">
            <div>
              <span className="font-serif text-2xl text-white">42</span>
              <span className="ml-1 text-xs">clinics connected</span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <div>
              <span className="font-serif text-2xl text-white">18 min</span>
              <span className="ml-1 text-xs">saved per incident</span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <div>
              <span className="font-serif text-2xl text-white">99.9%</span>
              <span className="ml-1 text-xs">uptime SLA</span>
            </div>
          </div>
        </div>

        {/* Right — district console with glass effect */}
        <div className="hidden lg:block">
          <HeroDistrictConsole className="w-full rounded-xl bg-white/10 p-2 shadow-2xl shadow-black/30 ring-1 ring-white/10 backdrop-blur-md" />
        </div>
      </div>
    </section>
  );
}
