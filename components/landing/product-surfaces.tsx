import { ProductSurfacePreview } from "@/components/landing/product-surface-previews";
import { SectionHeader } from "@/components/landing/sections/section-header";

const SURFACES = [
  {
    type: "field-report" as const,
    title: "Field reports that reach the district in real time.",
    body: "Offline-capable, 5-field form. The officer who struggled with three taps can now complete a handover in one.",
  },
  {
    type: "district-console" as const,
    title: "The view your district manager actually needs.",
    body: "Not a KPI dashboard. A decision surface: every station, every active incident, every open recommendation — on one screen.",
  },
  {
    type: "patient-reroute" as const,
    title: "Reroute before the patient starts travelling.",
    body: "The finder shows the unavailable clinic, the best nearby compatible alternative, and wasted-travel time avoided.",
  },
  {
    type: "audit-ledger" as const,
    title: "Evidence, not screenshots.",
    body: "Every field entry is timestamped, attributed, and immutable. The auditor gets a structured trail they can verify in minutes.",
  },
];

/**
 * ProductSurfaces — rewritten to embed real ProductSurfacePreviews.
 * The old version had a BentoGrid with abstract placeholder cards.
 * The new version uses the actual product surface preview components.
 */
export function ProductSurfaces() {
  return (
    <section id="product" className="bg-clinics-paper py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader
          fig="0.3"
          eyebrow="Product"
          heading="The operating surfaces behind the decision."
          subhead="Each screen is designed for a specific role — field officer, district manager, auditor — but every interaction feeds the same immutable record."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {SURFACES.map((surface) => (
            <article
              key={surface.type}
              className="flex flex-col gap-4 rounded-2xl border border-clinics-stone bg-clinics-canvas p-6"
            >
              <div>
                <h3 className="font-serif text-xl text-clinics-ink">
                  {surface.title}
                </h3>
                <p className="mt-2 text-sm text-clinics-ink-mute">
                  {surface.body}
                </p>
              </div>
              <ProductSurfacePreview type={surface.type} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
