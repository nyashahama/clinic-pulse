import { BentoGrid } from "@/components/landing/sections/bento-grid";
import { SectionHeader } from "@/components/landing/sections/section-header";
import { StatusPill } from "@/components/landing/sections/status-pill";

const SURFACES = [
  {
    eyebrow: "District",
    title: "The view your district manager actually needs.",
    body: "Not a KPI dashboard. A decision surface: every station, every active incident, every open recommendation — on one screen, updated in real time.",
    preview: (
      <div className="rounded-lg border border-clinics-stone bg-clinics-canvas p-4">
        <StatusPill label="LIVE — 3 STATIONS" />
        <div className="mt-3 grid grid-cols-3 gap-2">
          {["MP-001", "MP-002", "MP-003"].map((s) => (
            <div
              key={s}
              className="rounded-md border border-clinics-stone bg-clinics-paper p-2 text-center"
            >
              <p className="font-mono text-[10px] text-clinics-canopy">{s}</p>
              <p className="mt-1 font-serif text-sm text-clinics-ink">Active</p>
            </div>
          ))}
        </div>
      </div>
    ),
    caption: "District Command Center",
    span: "wide" as const,
  },
  {
    eyebrow: "Field",
    title: "One screen per officer. No training required.",
    body: "Touch-friendly, offline-capable, zero learning curve. The officer who struggled with three taps can now complete a handover in one.",
    preview: (
      <div className="rounded-lg border border-clinics-stone bg-clinics-canvas p-4">
        <StatusPill label="OFFICER VIEW" />
        <div className="mt-3 space-y-2">
          {["Morning check", "Incident report", "Handover"].map((task) => (
            <div
              key={task}
              className="flex items-center justify-between rounded-md border border-clinics-stone bg-clinics-paper p-2"
            >
              <span className="text-xs text-clinics-ink">{task}</span>
              <span className="font-mono text-[10px] text-clinics-canopy">
                2 min
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    caption: "Field Interface",
    span: "narrow" as const,
  },
  {
    eyebrow: "Audit",
    title: "Evidence, not screenshots.",
    body: "Every field entry is timestamped, attributed, and immutable. The auditor gets a structured trail they can verify in minutes.",
    preview: (
      <div className="rounded-lg border border-clinics-stone bg-clinics-canvas p-4">
        <StatusPill label="AUDIT TRAIL" />
        <div className="mt-3 space-y-1">
          {[
            { time: "07:12", event: "Reassignment recorded" },
            { time: "08:00", event: "Handover acknowledged" },
            { time: "14:30", event: "Gap flagged" },
          ].map((e) => (
            <div
              key={e.time}
              className="flex items-center gap-2 rounded border border-clinics-stone bg-clinics-paper px-2 py-1"
            >
              <span className="font-mono text-[10px] text-clinics-canopy">
                {e.time}
              </span>
              <span className="text-xs text-clinics-ink">{e.event}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    caption: "Audit Trail View",
    span: "narrow" as const,
  },
];

/**
 * ProductSurfaces — bento grid showing the three key product surfaces
 * (District, Field, Audit). Uses the BentoGrid primitive with embedded
 * product UI previews.
 */
export function ProductSurfaces() {
  return (
    <section id="product" className="bg-clinics-paper py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader
          fig="0.3"
          eyebrow="Product"
          heading="Three surfaces."
          mutedTail="One audit trail."
          subhead="Each screen is designed for a specific role — district manager, field officer, auditor — but every interaction feeds the same immutable record."
        />

        <div className="mt-16">
          <BentoGrid tiles={SURFACES} />
        </div>
      </div>
    </section>
  );
}
