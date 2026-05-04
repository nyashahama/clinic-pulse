import { ClipboardCheck, Landmark, Radio, Route } from "lucide-react";

import { LandingFeatureCard } from "@/components/landing/landing-feature-card";
import { LandingSection } from "@/components/landing/landing-section";
import { stakeholderProofItems } from "@/lib/landing/openpanel-refactor-content";

const iconMap = {
  "clipboard-check": ClipboardCheck,
  landmark: Landmark,
  radio: Radio,
  route: Route,
} as const;

export function StakeholderProof() {
  return (
    <LandingSection className="border-b border-neutral-200" spacing="compact">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stakeholderProofItems.map((item) => (
          <LandingFeatureCard
            key={item.title}
            title={item.title}
            description={item.description}
            icon={iconMap[item.icon]}
            className="min-h-44"
          />
        ))}
      </div>
    </LandingSection>
  );
}
