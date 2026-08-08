"use client";

import { ArrowUpRight, Check, type LucideIcon, MonitorDot, Route, ScrollText, WifiOff } from "lucide-react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";

import { DistrictCanvas } from "@/components/landing/district-canvas";
import {
  operationalNarrative,
  type ProductSurfaceId,
} from "@/lib/landing/operational-narrative-content";
import { cn } from "@/lib/utils";

const surfaceIcons: Record<ProductSurfaceId, LucideIcon> = {
  "district-console": MonitorDot,
  "field-report": WifiOff,
  "public-routing": Route,
  "audit-record": ScrollText,
};

export function ProductExplorerTabs() {
  const [activeSurfaceId, setActiveSurfaceId] =
    useState<ProductSurfaceId>("district-console");
  const explorerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const surfaces = operationalNarrative.productSurfaces;
  const activeSurface =
    surfaces.find((surface) => surface.id === activeSurfaceId) ?? surfaces[0];

  useEffect(() => {
    const explorer = explorerRef.current;
    if (!explorer) return;
    explorer.dataset.productExplorerEnhanced = "true";
  }, []);

  const selectTab = (index: number) => {
    const nextSurface = surfaces[index];
    if (!nextSurface) return;
    setActiveSurfaceId(nextSurface.id);
    tabRefs.current[index]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % surfaces.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + surfaces.length) % surfaces.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = surfaces.length - 1;

    if (nextIndex == null) return;
    event.preventDefault();
    selectTab(nextIndex);
  };

  const ActiveIcon = surfaceIcons[activeSurface.id];

  return (
    <div
      ref={explorerRef}
      data-product-explorer-enhanced="false"
      className="mt-10 overflow-hidden rounded-[1.125rem] border border-landing-ink/14 bg-white shadow-[0_24px_70px_rgba(16,32,29,0.1)] dark:border-white/12 dark:bg-[#10221f]"
    >
      <div
        role="tablist"
        aria-label="Clinic Pulse product surfaces"
        className="grid grid-cols-2 border-b border-landing-ink/12 dark:border-white/10 lg:grid-cols-4"
      >
        {surfaces.map((surface, index) => {
          const Icon = surfaceIcons[surface.id];
          const isActive = activeSurface.id === surface.id;

          return (
            <button
              key={surface.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              id={`product-tab-${surface.id}`}
              type="button"
              role="tab"
              aria-controls="product-surface-panel"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveSurfaceId(surface.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "relative flex min-w-0 items-center gap-2.5 border-r border-b border-landing-ink/10 px-3 py-4 text-left text-xs font-semibold transition last:border-r-0 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-landing-route dark:border-white/10 sm:px-5 sm:text-sm lg:border-b-0",
                isActive
                  ? "bg-landing-ledger text-white"
                  : "bg-white text-landing-ink/72 hover:bg-landing-paper hover:text-landing-ink dark:bg-[#10221f] dark:text-white/72 dark:hover:bg-white/7 dark:hover:text-white",
              )}
            >
              <Icon
                className={cn("size-4 shrink-0", isActive ? "text-landing-mint" : "text-landing-green")}
                aria-hidden="true"
              />
              <span className="min-w-0 leading-5">{surface.label}</span>
            </button>
          );
        })}
      </div>

      <div
        id="product-surface-panel"
        role="tabpanel"
        aria-labelledby={`product-tab-${activeSurface.id}`}
        tabIndex={0}
        className="grid min-w-0 gap-8 p-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-landing-route sm:p-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)] lg:items-center lg:p-8"
      >
        <DistrictCanvas stageId={activeSurface.stageId} variant="story" />

        <div className="min-w-0 lg:px-3">
          <span className="grid size-10 place-items-center rounded-lg border border-landing-green/20 bg-landing-green/8 text-landing-green">
            <ActiveIcon className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-landing-green">
            {activeSurface.role}
          </p>
          <h3 className="mt-3 max-w-[16ch] font-display text-3xl leading-[1.04] tracking-[-0.03em] sm:text-4xl dark:text-white">
            {activeSurface.title}
          </h3>
          <p className="mt-4 text-sm leading-6 text-landing-ink/62 sm:text-base sm:leading-7 dark:text-white/60">
            {activeSurface.description}
          </p>

          <ul className="mt-6 divide-y divide-landing-ink/10 border-y border-landing-ink/12 dark:divide-white/10 dark:border-white/12">
            {activeSurface.capabilities.map((capability) => (
              <li key={capability} className="flex items-start gap-3 py-3 text-sm font-semibold leading-5">
                <Check className="mt-0.5 size-4 shrink-0 text-landing-green" aria-hidden="true" />
                <span>{capability}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-landing-ink/68 dark:text-white/70">
            Same incident / role-specific view
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
