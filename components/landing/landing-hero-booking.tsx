"use client";

import { StatusPill } from "@/components/landing/sections/status-pill";
import Link from "next/link";

/**
 * Landing hero — editorial two-tone. Instrument Serif h1 (black, large),
 * paper background, two-line problem statement, one-sentence positioning,
 * two CTAs. No badges, no animations, no TrustBar, no BookingOverlay.
 */
export function LandingHeroBooking() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[80vh] items-center bg-clinics-paper"
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-24 md:py-32">
        <div className="max-w-3xl">
          <StatusPill label="LIVE — MP-001" className="mb-6" />

          <h1 className="font-serif text-5xl leading-[1.05] tracking-[-0.02em] text-clinics-ink sm:text-6xl md:text-7xl">
            <span className="block text-clinics-ink-mute">Your station ran</span>
            <span className="block">
              a <span className="text-clinics-canopy">near-miss</span> for 14 days.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-clinics-ink-mute">
            One auditor should have caught it. The dashboard was buried under
            three clicks and a status report nobody reads. This is the
            anti-dashboard: an audit workspace that keeps every critical
            decision visible, on the record, and 18&nbsp;minutes ahead of
            your next inspection.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/?booking=1"
              className="rounded-lg bg-clinics-ink px-5 py-2.5 text-sm font-medium text-clinics-paper transition-colors hover:bg-clinics-ink-mute"
            >
              Book a walkthrough
            </Link>
            <Link
              href="#product"
              className="rounded-lg border border-clinics-stone px-5 py-2.5 text-sm text-clinics-ink-mute transition-colors hover:text-clinics-ink"
            >
              See the product
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
