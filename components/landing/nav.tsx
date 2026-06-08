"use client";

import { ClinicPulseLogo } from "@/components/brand/clinicpulse-logo";
import { StatusPill } from "@/components/landing/sections/status-pill";
import Link from "next/link";

const NAV_ITEMS = [
  { name: "Problem", href: "#problem" },
  { name: "Gap", href: "#gap" },
  { name: "Operating gap", href: "#operating-gap" },
  { name: "Product", href: "#product" },
  { name: "Trust", href: "#trust" },
  { name: "Final", href: "#final" },
];

export function Nav() {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-clinics-stone bg-clinics-paper/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <ClinicPulseLogo />
            <span className="font-display text-sm font-semibold tracking-tight text-clinics-ink">
              ClinicPulse
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map(({ name, href }) => (
              <Link
                key={name}
                href={href}
                className="rounded-md px-3 py-1.5 text-sm text-clinics-ink-mute transition-colors hover:text-clinics-ink"
              >
                {name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <StatusPill label="LIVE" className="hidden sm:inline-flex" />
            <Link
              href="/login"
              className="hidden rounded-lg border border-clinics-stone px-3 py-1.5 text-sm text-clinics-ink-mute transition-colors hover:text-clinics-ink md:inline-block"
            >
              Sign in
            </Link>
            <Link
              href="/?booking=1"
              className="rounded-lg bg-clinics-ink px-3.5 py-1.5 text-sm font-medium text-clinics-paper transition-colors hover:bg-clinics-ink-mute"
            >
              Book walkthrough
            </Link>
          </div>
        </div>
      </header>
      <div className="h-14" aria-hidden="true" />
    </>
  );
}
