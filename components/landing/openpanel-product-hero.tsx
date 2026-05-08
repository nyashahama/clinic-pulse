"use client";

import { LiveIncidentHero } from "@/components/landing/live-incident-hero";

type OpenPanelProductHeroProps = {
  onBookDemo: () => void;
};

export function OpenPanelProductHero({ onBookDemo }: OpenPanelProductHeroProps) {
  return <LiveIncidentHero onBookDemo={onBookDemo} />;
}
