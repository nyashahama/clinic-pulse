import { ArrowRight } from "lucide-react";

import { ButtonLink } from "@/components/landing/button-link";
import { demoCta } from "@/lib/landing/openpanel-refactor-content";

export function DemoBookingCTA() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-screen-xl overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 px-6 py-14 text-white shadow-2xl sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-4xl gap-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
            {demoCta.label}
          </p>
          <h2 className="font-display text-3xl leading-[1.08] sm:text-4xl lg:text-5xl">
            {demoCta.title}
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-7 text-white/60">
            {demoCta.description}
          </p>
          <div className="flex justify-center">
            <ButtonLink
              href={demoCta.cta.href}
              variant="primary"
              className="h-11 bg-white text-neutral-950 hover:bg-neutral-100 hover:ring-white/10"
            >
              {demoCta.cta.label}
              <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
          <p className="text-xs text-white/40">{demoCta.note}</p>
        </div>
      </div>
    </section>
  );
}
