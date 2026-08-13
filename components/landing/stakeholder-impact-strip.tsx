import { LandingSection } from "@/components/landing/landing-section";
import { stakeholderImpactItems } from "@/lib/landing/openpanel-refactor-content";

export function StakeholderImpactStrip() {
  return (
    <LandingSection
      className="border-b border-white/[0.08] bg-[#090b0a]"
      contentClassName="border-x-transparent"
      spacing="compact"
    >
      <div className="grid gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <div className="max-w-xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300/72">
            One signal / four decisions
          </p>
          <h2 className="mt-3 max-w-md font-display text-3xl leading-[1.02] tracking-[-0.035em] text-white sm:text-4xl">
            One status change affects everyone.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-white/48">
            A single source record should change what every team sees—without
            forcing them to reconcile four versions of the truth.
          </p>
        </div>

        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.025]">
          {stakeholderImpactItems.map((item, index) => (
            <article
              key={item.role}
              className="relative min-w-0 border-white/[0.08] p-4 even:border-l odd:border-b sm:p-5 [&:nth-child(2)]:border-b [&:nth-child(3)]:border-b-0"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] text-white/50">
                  0{index + 1}
                </span>
                <span className="size-1.5 rounded-full bg-emerald-300/70 shadow-[0_0_12px_rgba(110,231,183,0.48)]" />
              </div>
              <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-emerald-200/58">
                {item.signal}
              </p>
              <h3 className="mt-2 text-sm font-semibold leading-5 text-white sm:text-base">
                {item.role}
              </h3>
              <p className="mt-2 text-xs leading-5 text-white/56 sm:text-sm sm:leading-6">
                {item.outcome}
              </p>
            </article>
          ))}
        </div>
      </div>
    </LandingSection>
  );
}
