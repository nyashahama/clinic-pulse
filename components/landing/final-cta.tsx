import Link from "next/link";

/**
 * FinalCTA — the closing section before the footer. Instrument Serif
 * display heading, paper background, two CTAs. No BookingOverlay,
 * no motion, no badge animations.
 */
export function FinalCTA() {
  return (
    <section
      id="final"
      className="relative flex min-h-[60vh] items-center bg-clinics-canvas"
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-24 md:py-32">
        <div className="max-w-3xl">
          <h2 className="font-serif text-4xl leading-[1.05] tracking-[-0.02em] text-clinics-ink sm:text-5xl md:text-6xl">
            <span className="block text-clinics-ink-mute">
              Built for the people who
            </span>
            <span className="block">run the stations.</span>
          </h2>

          <p className="mt-6 max-w-xl text-lg text-clinics-ink-mute">
            Stop building dashboards nobody reads. Start building the audit
            workspace your officers and auditors actually need.
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
