import { ArrowRight, Check, LogIn } from "lucide-react";
import Link from "next/link";

import { BookingTrigger } from "@/components/landing/booking-trigger";
import { operationalNarrative } from "@/lib/landing/operational-narrative-content";

export function WalkthroughCta() {
  return (
    <section
      data-landing-chapter="walkthrough-close"
      className="dark relative overflow-hidden bg-landing-ledger px-4 py-20 text-white sm:px-6 sm:py-24 lg:px-8 lg:py-28"
    >
      <div
        className="absolute inset-x-0 top-0 h-1 bg-landing-route"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,white_1px,transparent_1px)] [background-size:80px_100%]" />

      <div className="relative mx-auto grid max-w-[80rem] gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:items-end lg:gap-16">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-landing-mint">
            {operationalNarrative.cta.eyebrow}
          </p>
          <h2 className="mt-6 max-w-[15ch] font-display text-4xl leading-[0.98] tracking-[-0.04em] sm:text-5xl lg:text-[4rem]">
            {operationalNarrative.cta.title}
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/64 sm:text-lg sm:leading-8">
            {operationalNarrative.cta.description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <BookingTrigger className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-landing-mint px-5 text-sm font-semibold text-[#06251f] transition hover:bg-[#c2f3df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-route focus-visible:ring-offset-2 focus-visible:ring-offset-landing-ledger">
              {operationalNarrative.cta.primaryCta}
              <ArrowRight className="size-4" aria-hidden="true" />
            </BookingTrigger>
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/20 px-5 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-route"
            >
              <LogIn className="size-4" aria-hidden="true" />
              {operationalNarrative.cta.secondaryCta}
            </Link>
          </div>
        </div>

        <div className="border-y border-white/14 py-2">
          <p className="py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/42">
            Walkthrough coverage
          </p>
          <ul className="divide-y divide-white/10 border-t border-white/10">
            {operationalNarrative.cta.coverage.map((item, index) => (
              <li key={item} className="flex items-start gap-4 py-4">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-landing-mint/25 text-landing-mint">
                  <Check className="size-3.5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/35">
                    0{index + 1}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-5 text-white/84">{item}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
