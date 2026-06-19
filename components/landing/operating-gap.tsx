import { IncidentFlowStoryboard } from "@/components/landing/incident-flow-storyboard";

/**
 * OperatingGap — rewritten to embed the real IncidentFlowStoryboard.
 * The old version had a StickyScroll with abstract placeholder cards.
 * The new version uses the real incident flow component that shows
 * the connected incident path from field signal to audit trail.
 */
export function OperatingGap() {
  return (
    <>
      <section id="gap" className="bg-clinics-paper py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
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
      </section>
      <IncidentFlowStoryboard />
    </>
  );
}
