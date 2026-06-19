import { RoutingMoment } from "@/components/landing/routing-moment";
import Link from "next/link";

/**
 * FinalCTA — rewritten with the real RoutingMoment product UI.
 * The old version had an abstract serif heading with no product preview.
 * The new version embeds the real patient reroute visualization
 * and adds a closing CTA below it.
 */
export function FinalCTA() {
  return (
    <>
      <RoutingMoment />
      <section
        id="final"
        className="relative flex min-h-[50vh] items-center bg-clinics-canvas"
      >
        <div className="mx-auto w-full max-w-6xl px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <h2 className="font-serif text-4xl leading-[1.05] tracking-[-0.02em] text-clinics-ink sm:text-5xl md:text-6xl">
              <span className="block text-clinics-ink-mute">
                Walk through the Mabopane
              </span>
              <span className="block">Station incident.</span>
            </h2>

            <p className="mt-6 max-w-xl text-lg text-clinics-ink-mute">
              Every recommendation is traceable through field confirmation,
              public reroute, admin review, and auditing. Every decision
              is on the record.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/?booking=1"
                className="rounded-lg bg-clinics-ink px-5 py-2.5 text-sm font-medium text-clinics-paper transition-colors hover:bg-clinics-ink-mute"
              >
                Book walkthrough
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-clinics-stone px-5 py-2.5 text-sm text-clinics-ink-mute transition-colors hover:text-clinics-ink"
              >
                Sign in to operations workspace
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
