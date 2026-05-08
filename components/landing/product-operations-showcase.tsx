import {
  LandingSection,
  LandingSectionHeader,
} from "@/components/landing/landing-section";
import { ScrollReveal } from "@/components/landing/motion/scroll-reveal";
import { ProductSurfacePreview } from "@/components/landing/product-surface-previews";
import { productOperationsModules } from "@/lib/landing/openpanel-refactor-content";
import { cn } from "@/lib/utils";

export function ProductOperationsShowcase() {
  return (
    <LandingSection id="product">
      <LandingSectionHeader
        align="center"
        eyebrow="Product surfaces"
        title="The operating surfaces behind the decision."
        description="Clinic Pulse gives each team the right surface for the same operating record: district visibility, offline reports, patient guidance, and audit-ready evidence."
      />
      <div className="mt-12 grid min-w-0 gap-5 lg:grid-cols-2 lg:items-stretch">
        {productOperationsModules.map((module, index) => (
          <ScrollReveal
            key={module.title}
            delay={index * 0.06}
            className="h-full"
          >
            <OperationModuleCard
              module={module}
              variant={index === 0 ? "primary" : "supporting"}
            />
          </ScrollReveal>
        ))}
      </div>
    </LandingSection>
  );
}

type ProductOperationsModule = (typeof productOperationsModules)[number];

function OperationModuleCard({
  module,
  variant = "supporting",
}: {
  module: ProductOperationsModule;
  variant?: "primary" | "supporting";
}) {
  return (
    <article
      className={cn(
        "grid h-full min-w-0 content-start overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-sm",
        variant === "primary" ? "gap-6 lg:p-6" : "gap-5",
      )}
    >
      <div className="min-w-0">
        <div className="inline-flex max-w-full items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-700">
          <span className="min-w-0 break-words">{module.metric}</span>
        </div>
        <h3
          className={cn(
            "mt-4 font-semibold leading-tight text-neutral-950",
            variant === "primary" ? "text-2xl sm:text-3xl" : "text-lg",
          )}
        >
          {module.title}
        </h3>
        <p
          className={cn(
            "mt-3 max-w-2xl text-sm leading-6 text-neutral-600",
            variant === "primary" ? "sm:text-base sm:leading-7" : null,
          )}
        >
          {module.description}
        </p>
      </div>
      <div className="min-w-0">
        <ProductSurfacePreview type={module.type} />
      </div>
    </article>
  );
}
