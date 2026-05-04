import { LandingFeatureCard } from "@/components/landing/landing-feature-card";
import {
  LandingSection,
  LandingSectionHeader,
} from "@/components/landing/landing-section";
import { TrustSystemPanels } from "@/components/landing/trust-system-panels";
import { trustObjects } from "@/lib/landing/openpanel-refactor-content";

export function TrustInfrastructure() {
  return (
    <LandingSection id="trust" className="border-y border-neutral-200">
      <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
        <div>
          <LandingSectionHeader
            eyebrow="Trust and infrastructure"
            title="Public-sector trust comes from records, not claims."
            description="Clinic Pulse keeps source, freshness, permissions, exports, partner handoffs, and audit history attached to the operating decision."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {trustObjects.map((object) => (
              <LandingFeatureCard
                key={object.label}
                title={object.label}
                description={object.description}
                className="min-h-40"
              >
                <p className="font-mono text-sm font-semibold text-neutral-950">
                  {object.value}
                </p>
              </LandingFeatureCard>
            ))}
          </div>
        </div>

        <TrustSystemPanels />
      </div>
    </LandingSection>
  );
}
