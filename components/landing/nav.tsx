import Link from "next/link";

import { ClinicPulseLogo } from "@/components/brand/clinicpulse-logo";
import { BookingTrigger } from "@/components/landing/booking-trigger";
import { operationalNarrative } from "@/lib/landing/operational-narrative-content";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 h-16 border-b border-landing-ink/12 bg-landing-paper/94 text-landing-ink backdrop-blur-xl dark:border-white/10 dark:text-white">
      <div className="mx-auto flex h-full max-w-[80rem] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="ClinicPulse home"
          className="inline-flex min-h-11 shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-route"
        >
          <ClinicPulseLogo
            iconClassName="size-8 rounded-lg"
            wordmarkClassName="text-sm text-landing-ink dark:text-white"
          />
        </Link>

        <nav aria-label="Landing page" className="hidden items-center gap-1 lg:flex">
          {operationalNarrative.navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-landing-ink/62 transition hover:bg-landing-ink/6 hover:text-landing-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-route dark:text-white/62 dark:hover:bg-white/8 dark:hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-md px-2.5 text-xs font-semibold text-landing-ink/72 transition hover:bg-landing-ink/6 hover:text-landing-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-route dark:text-white/72 dark:hover:bg-white/8 dark:hover:text-white sm:px-3 sm:text-sm"
          >
            Sign in
          </Link>
          <BookingTrigger className="hidden h-11 items-center rounded-md bg-landing-green px-4 text-sm font-semibold text-white transition hover:bg-[#06685d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-route focus-visible:ring-offset-2 focus-visible:ring-offset-landing-paper dark:text-[#06251f] sm:inline-flex">
            Book a walkthrough
          </BookingTrigger>
          <BookingTrigger className="inline-flex h-11 items-center rounded-md bg-landing-green px-3 text-xs font-semibold text-white transition hover:bg-[#06685d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-route focus-visible:ring-offset-2 focus-visible:ring-offset-landing-paper dark:text-[#06251f] sm:hidden">
            Walkthrough
          </BookingTrigger>
        </div>
      </div>
    </header>
  );
}
