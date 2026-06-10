"use client";

import { useEffect, useRef, useState } from "react";

export function TimelineRail({ stepCount = 5 }: { stepCount?: number }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const container = rail.closest("[data-journey-scroll]");
    if (!(container instanceof HTMLElement)) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const scrollable = scrollWidth - clientWidth;
      if (scrollable <= 0) {
        setProgress(1);
        return;
      }
      setProgress(scrollLeft / scrollable);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const activeDot = Math.round(progress * (stepCount - 1));

  return (
    <div
      ref={railRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-8 h-px bg-clinics-stone dark:bg-white/10"
    >
      <div
        className="absolute left-0 top-1/2 h-full rounded-full bg-clinics-canopy/60 transition-[width] duration-300 dark:bg-emerald-500/60"
        style={{ width: `${progress * 100}%` }}
      />
      {Array.from({ length: stepCount }).map((_, i) => (
        <span
          key={i}
          className={`absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full transition-colors duration-300 ${
            i <= activeDot
              ? "bg-clinics-canopy shadow-[0_0_8px_rgba(13,122,107,0.35)] dark:bg-emerald-400 dark:shadow-[0_0_8px_rgba(52,211,153,0.5)]"
              : "bg-clinics-stone dark:bg-white/20"
          }`}
          style={{ left: `${(i / (stepCount - 1)) * 100}%` }}
        />
      ))}
    </div>
  );
}
