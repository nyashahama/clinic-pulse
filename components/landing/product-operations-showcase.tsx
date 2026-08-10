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
      <p className="mt-7 font-mono text-[9px] uppercase tracking-[0.14em] text-white/28 sm:hidden">
        Swipe to inspect each operating surface
      </p>
      <div
        aria-label="Product surfaces"
        className="mt-3 grid w-full min-w-0 snap-x snap-mandatory auto-cols-[90%] grid-flow-col gap-3 overflow-x-auto pb-4 sm:mt-10 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0 lg:items-stretch"
        role="region"
        tabIndex={0}
      >
        {productOperationsModules.map((module, index) => (
          <ScrollReveal
            key={module.title}
            delay={index * 0.06}
            className="h-full snap-start"
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
        "grid h-full min-w-0 content-start overflow-hidden rounded-xl border border-white/[0.09] bg-white/[0.025] p-4 shadow-2xl shadow-black/15 sm:p-5",
        variant === "primary" ? "gap-5 lg:p-6" : "gap-4",
      )}
    >
      <div className="min-w-0">
        <div className="inline-flex max-w-full items-center rounded-full border border-white/[0.09] bg-white/[0.035] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-white/42">
          <span className="min-w-0 break-words">{module.metric}</span>
        </div>
        <h3
          className={cn(
            "mt-4 font-semibold leading-tight tracking-[-0.02em] text-white",
            variant === "primary" ? "text-2xl sm:text-3xl" : "text-lg",
          )}
        >
          {module.title}
        </h3>
        <p
          className={cn(
            "mt-3 max-w-2xl text-sm leading-6 text-white/48",
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
