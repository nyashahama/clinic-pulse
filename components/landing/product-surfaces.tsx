import { SectionHeader } from "@/components/landing/sections/section-header";
import { ProductSurfaceCard } from "@/components/landing/product-surface-cards";

const SURFACES = [
  {
    type: "field-report" as const,
    title: "Field report",
    description: "Offline-capable mobile form. Five fields, one tap, syncs when signal returns.",
    span: "half" as const,
  },
  {
    type: "district-console" as const,
    title: "District console",
    description: "Every station, every active incident, every recommendation — one screen.",
    span: "half" as const,
  },
  {
    type: "patient-reroute" as const,
    title: "Patient reroute",
    description: "Show patients where to go before they start travelling.",
    span: "half" as const,
  },
  {
    type: "audit-ledger" as const,
    title: "Audit trail",
    description: "Every change timestamped, attributed, and immutable.",
    span: "half" as const,
  },
] as const;

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

        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2">
          {SURFACES.map((surface) => (
            <ProductSurfaceCard
              key={surface.type}
              type={surface.type}
              title={surface.title}
              description={surface.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
