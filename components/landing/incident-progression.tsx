"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { DistrictCanvas } from "@/components/landing/district-canvas";
import type { IncidentStageId } from "@/lib/landing/operational-narrative-content";

const incidentStageIds: readonly IncidentStageId[] = [
  "field-report",
  "district-response",
  "patient-route",
  "audit-record",
];

function isIncidentStageId(value: string | null): value is IncidentStageId {
  return incidentStageIds.some((stageId) => stageId === value);
}

export function IncidentProgression({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeStageId, setActiveStageId] = useState<IncidentStageId>("field-report");

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;

    const stageElements = Array.from(
      root.querySelectorAll<HTMLElement>("[data-incident-stage]"),
    );
    let isActive = true;
    const visibleEntries = new Map<Element, IntersectionObserverEntry>();

    const selectActiveStage = () => {
      const viewportTarget = window.innerHeight * 0.45;
      const closestEntry = Array.from(visibleEntries.values())
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => {
          const leftCenter = left.boundingClientRect.top + left.boundingClientRect.height / 2;
          const rightCenter = right.boundingClientRect.top + right.boundingClientRect.height / 2;
          return Math.abs(leftCenter - viewportTarget) - Math.abs(rightCenter - viewportTarget);
        })[0];

      const nextStageId = closestEntry?.target.getAttribute("data-incident-stage") ?? null;
      if (isActive && isIncidentStageId(nextStageId)) setActiveStageId(nextStageId);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visibleEntries.set(entry.target, entry);
        selectActiveStage();
      },
      { threshold: [0.35, 0.55, 0.75] },
    );

    for (const stageElement of stageElements) observer.observe(stageElement);
    return () => {
      isActive = false;
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] lg:gap-14"
    >
      <div className="hidden min-w-0 lg:block">
        <div className="sticky top-24">
          <DistrictCanvas stageId={activeStageId} progressive />
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
