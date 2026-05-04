import { LayoutDashboard, Navigation, WifiOff } from "lucide-react";

import { LandingFeatureCard } from "@/components/landing/landing-feature-card";
import {
  LandingSection,
  LandingSectionHeader,
} from "@/components/landing/landing-section";
import { featureCards } from "@/lib/landing/openpanel-refactor-content";

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  navigation: Navigation,
  "wifi-off": WifiOff,
} as const;

export function ProductFeatureCards() {
  return (
    <LandingSection id="product">
      <LandingSectionHeader
        align="center"
        eyebrow="Product surfaces"
        title="Built around the work clinic teams already do."
        description="Clinic Pulse turns field signal into district decisions, patient guidance, and audit records without making weak connectivity a blocker."
      />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {featureCards.map((feature) => (
          <LandingFeatureCard
            key={feature.title}
            title={feature.title}
            description={feature.description}
            icon={iconMap[feature.icon]}
            className="min-h-64"
          />
        ))}
      </div>
    </LandingSection>
  );
}
