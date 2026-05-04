import { LayoutDashboard, Navigation, WifiOff } from "lucide-react";

import { LandingFeatureCard } from "@/components/landing/landing-feature-card";
import {
  LandingSection,
  LandingSectionHeader,
} from "@/components/landing/landing-section";
import { featureCards } from "@/lib/landing/openpanel-refactor-content";
import { cn } from "@/lib/utils";

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  navigation: Navigation,
  "wifi-off": WifiOff,
} as const;

const miniatureToneStyles = {
  "district-console": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "field-report": "border-amber-200 bg-amber-50 text-amber-700",
  "patient-reroute": "border-violet-200 bg-violet-50 text-violet-700",
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
            className="min-h-72"
          >
            <ProductMiniature miniature={feature.miniature} />
          </LandingFeatureCard>
        ))}
      </div>
    </LandingSection>
  );
}

function ProductMiniature({
  miniature,
}: {
  miniature: (typeof featureCards)[number]["miniature"];
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          {miniature.label}
        </p>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
            miniatureToneStyles[miniature.type],
          )}
        >
          {miniature.badge}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {miniature.rows.map((row, index) => (
          <div
            key={row}
            className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-xs font-medium text-neutral-700"
          >
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                index === 0 ? "bg-primary" : "bg-neutral-300",
              )}
            />
            <span>{row}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
