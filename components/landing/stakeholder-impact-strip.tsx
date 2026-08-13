import { LandingSection } from "@/components/landing/landing-section";
import { stakeholderImpactItems } from "@/lib/landing/openpanel-refactor-content";

export function StakeholderImpactStrip() {
  return (
    <LandingSection
      className="border-b border-neutral-200 bg-white"
      contentClassName="border-x-transparent"
      spacing="compact"
    >
      <div className="grid gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0D7A6B]">
            One signal / four decisions
          </p>
          <h2 className="mt-3 max-w-md font-display text-3xl leading-[1.05] tracking-[-0.035em] text-[#17201e] sm:text-4xl">
            One status change affects everyone.
          </h2>
          <p className="mt-4 max-w-lg text-base leading-7 text-neutral-600">
            A single source record should change what every team sees—without
            forcing them to reconcile four versions of the truth.
          </p>
        </div>

        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-neutral-200 bg-[#f7faf9] shadow-sm sm:grid-cols-2">
          {stakeholderImpactItems.map((item, index) => (
            <article
              key={item.role}
              className="relative min-w-0 border-b border-neutral-200 p-5 sm:border-r sm:p-6 sm:even:border-r-0 sm:[&:nth-child(3)]:border-b-0 sm:[&:nth-child(4)]:border-b-0"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-neutral-600">
                  0{index + 1}
                </span>
                <span className="size-2 rounded-full bg-emerald-600" />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#0D7A6B]">
                {item.signal}
              </p>
              <h3 className="mt-2 text-base font-semibold leading-6 text-neutral-950">
                {item.role}
              </h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                {item.outcome}
              </p>
            </article>
          ))}
        </div>
      </div>
    </LandingSection>
  );
}
