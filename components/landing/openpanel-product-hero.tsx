"use client";

import { LiveIncidentHero } from "@/components/landing/live-incident-hero";

type OpenPanelProductHeroProps = {
  onBookWalkthrough: () => void;
};

export function OpenPanelProductHero({ onBookWalkthrough }: OpenPanelProductHeroProps) {
  return <LiveIncidentHero onBookWalkthrough={onBookWalkthrough} />;
}
