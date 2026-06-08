import { StatusPill } from "@/components/landing/sections/status-pill";
import { StickyScroll } from "@/components/landing/sections/sticky-scroll";

const GAP_STEPS = [
  {
    time: "07:00",
    title: "Service pressure starts locally",
    body: "A single officer calls in sick. The station manager has three options and fifteen minutes to decide.",
    caption: "field source",
    visual: (
      <div className="rounded-xl border border-clinics-stone bg-clinics-paper p-6">
        <StatusPill label="07:00 — STATION MANAGER" />
        <p className="mt-3 font-serif text-xl text-clinics-ink">
          Officer M. absent — sick leave
        </p>
        <p className="mt-2 text-sm text-clinics-ink-mute">
          Three options available. Decision window: 15 min.
        </p>
      </div>
    ),
  },
  {
    time: "07:12",
    title: "Decision is made, nowhere to record it",
    body: "The manager reassigns coverage. No form, no field, no audit trail. Just a WhatsApp message.",
    caption: "unrecorded decision",
    visual: (
      <div className="rounded-xl border border-clinics-stone bg-clinics-paper p-6">
        <StatusPill label="07:12 — UNRECORDED" />
        <p className="mt-3 font-serif text-xl text-clinics-ink">
          Reassignment via WhatsApp
        </p>
        <p className="mt-2 text-sm text-clinics-ink-mute">
          No structured record. Decision invisible to audit.
        </p>
      </div>
    ),
  },
  {
    time: "08:00",
    title: "Handover misses the gap",
    body: "The morning shift starts without knowing coverage was modified. The gap is now inherited.",
    caption: "3 reports queued",
    visual: (
      <div className="rounded-xl border border-clinics-stone bg-clinics-paper p-6">
        <StatusPill label="08:00 — HANDOVER" />
        <p className="mt-3 font-serif text-xl text-clinics-ink">
          Morning shift unaware of reassignment
        </p>
        <p className="mt-2 text-sm text-clinics-ink-mute">
          Gap inherited. No escalation path triggered.
        </p>
      </div>
    ),
  },
  {
    time: "14 days later",
    title: "The near-miss surfaces in an audit",
    body: "An auditor finds the coverage gap. Nobody at the station can reconstruct what happened or who decided.",
    caption: "post-facto discovery",
    visual: (
      <div className="rounded-xl border border-clinics-stone bg-clinics-paper p-6">
        <StatusPill label="AUDIT — 14 DAYS LATER" />
        <p className="mt-3 font-serif text-xl text-clinics-ink">
          Coverage gap flagged by external auditor
        </p>
        <p className="mt-2 text-sm text-clinics-ink-mute">
          No record of decision. Station cannot reconstruct timeline.
        </p>
      </div>
    ),
  },
];

/**
 * OperatingGap — rewritten as a StickyScroll. The old version had
 * motion, useInView, animated badges, and live incident simulation.
 * The new version uses the StickyScroll primitive to drive a
 * 280vh pinned scroll that cross-fades through the four gap stages.
 */
export function OperatingGap() {
  return (
    <section id="gap" className="bg-clinics-canvas py-0">
      <div className="mx-auto max-w-5xl px-6 pt-24 pb-12">
        <h2 className="font-serif text-4xl leading-[1.05] tracking-[-0.02em] text-clinics-ink sm:text-5xl">
          <span className="block text-clinics-ink-mute">
            The gap is not a dashboard problem.
          </span>
          <span className="block">It is a recording problem.</span>
        </h2>
        <p className="mt-6 max-w-xl text-clinics-ink-mute">
          Every critical decision at station level happens outside any system.
          The gap between what happened and what the audit trail shows is where
          risk accumulates.
        </p>
      </div>

      <StickyScroll
        id="operating-gap"
        steps={GAP_STEPS}
        trackHeight={2.8}
      />
    </section>
  );
}
