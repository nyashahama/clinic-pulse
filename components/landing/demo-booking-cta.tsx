import { ButtonLink } from "./button-link";

export function DemoBookingCTA() {
  return (
    <section className="bg-neutral-950 px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
          Founder walkthrough
        </p>
        <h2
          className="mt-4 font-display text-3xl font-medium leading-[1.12] tracking-tight sm:text-4xl"
          style={{ textWrap: "balance" }}
        >
          Book a live ClinicPulse demo.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/60">
          The walkthrough covers district visibility, offline field reporting, patient rerouting, audit history, and the infrastructure roadmap.
        </p>
        <div className="mt-8 flex justify-center">
          <ButtonLink href="/book-demo" variant="primary">
            Book Demo
          </ButtonLink>
        </div>
        <p className="mt-5 text-xs text-white/40">
          Demo data is seeded to show the operating model clearly.
        </p>
      </div>
    </section>
  );
}

