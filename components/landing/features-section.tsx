"use client";

import { ProductCard } from "@/components/landing/features/ProductCard";
import {
  AuditVisual,
  OfflineSyncVisual,
  PredictVisual,
  RealtimeApiVisual,
  RerouteVisual,
} from "@/components/landing/features/FeatureVisuals";
import type { FeatureData, FeatureVisual } from "@/lib/landing/features-data";
import { getIcon, getMainFeature, getSecondaryFeatures } from "@/lib/landing/features-data";
import type { ReactNode } from "react";

function getVisualComponent(visual: FeatureVisual): ReactNode {
  switch (visual) {
    case "realtime-api":
      return <RealtimeApiVisual />;
    case "offline-sync":
      return <OfflineSyncVisual />;
    case "predict":
      return <PredictVisual />;
    case "reroute":
      return <RerouteVisual />;
    case "audit":
      return <AuditVisual />;
  }
}

import type { LucideIcon } from "lucide-react";

function prepareFeature(f: FeatureData): {
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  highlights: string[];
  visual: ReactNode;
  href: string;
  isMain?: boolean;
  alignLeft: boolean;
} {
  return {
    title: f.title,
    subtitle: f.subtitle,
    description: f.description,
    icon: getIcon(f.iconKey),
    highlights: f.highlights,
    visual: getVisualComponent(f.visual),
    href: f.href,
    isMain: f.isMain,
    alignLeft: true,
  };
}

export function FeaturesSection() {
  const main = getMainFeature();
  const secondary = getSecondaryFeatures();

  if (!main) return null;

  const mainPrepared = prepareFeature(main);
  const secondaryPrepared = secondary.map(prepareFeature);

  return (
    <section className="relative overflow-hidden border-t border-white/[0.05] bg-neutral-950" id="features">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-emerald-500/[0.06] blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-emerald-500/[0.04] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:py-24">
        {/* Section header */}
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-400">
            Infrastructure
          </span>
          <h2 className="mt-6 font-display text-3xl font-medium leading-[1.15] tracking-tight text-white sm:text-4xl" style={{ textWrap: "balance" }}>
            Built to operate under pressure
          </h2>
          <p className="mt-4 text-base text-white/40 leading-relaxed">
            Intermittent connectivity. High load. Life-critical decisions. ClinicPulse is built for the realities of South African healthcare — not a San Francisco server room.
          </p>
        </div>

        {/* CSS Grid 12-col — Supabase pattern */}
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-12">
          {/* Main feature — spans 12 on mobile, 8 on desktop */}
          <ProductCard feature={mainPrepared} />

          {/* Secondary features — each spans 6 on mobile, 4 on desktop */}
          {secondaryPrepared.map((f, i) => (
            <ProductCard key={i} feature={f} />
          ))}
        </div>
      </div>
    </section>
  );
}
