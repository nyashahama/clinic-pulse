"use client";

import { useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useStickyProgress } from "@/lib/hooks/use-sticky-progress";

type StickyStep = {
  /** Optional timestamp label, rendered in mono on the left rail. */
  time?: string;
  /** The step's title (e.g. "Service pressure starts locally"). */
  title: string;
  /** The step's body copy. */
  body: string;
  /** A short mono label below the body (e.g. "field source" or "3 reports queued"). */
  caption?: string;
  /** The right-side visual: a real product UI card. */
  visual: ReactNode;
};

type StickyScrollProps = {
  id?: string;
  steps: StickyStep[];
  /** Number of viewports of scroll distance. Default 2.8. */
  trackHeight?: number;
  className?: string;
};

/**
 * Twenty's `Helped`-style sticky-scroll. The outer container is `trackHeight`
 * viewports tall; the inner container sticks to the top of the viewport while
 * the user scrolls past. As `useStickyProgress` advances 0 → 1, each step
 * cross-fades in based on its index in the array.
 *
 * When `prefers-reduced-motion: reduce` is set, falls back to a static
 * vertical list with no pinning.
 */
export function StickyScroll({
  id,
  steps,
  trackHeight = 2.8,
  className,
}: StickyScrollProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const progress = useStickyProgress(trackRef);
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <ol
        id={id}
        className={cn("mx-auto flex max-w-5xl flex-col gap-12", className)}
      >
        {steps.map((step, i) => (
          <li
            key={i}
            className="grid grid-cols-1 gap-6 border-t border-clinics-stone pt-8 md:grid-cols-2"
          >
            <div>
              {step.time && (
                <p className="mb-2 font-mono text-xs text-clinics-canopy">
                  {step.time}
                </p>
              )}
              <h3 className="font-serif text-2xl text-clinics-ink">
                {step.title}
              </h3>
              <p className="mt-3 text-clinics-ink-mute">{step.body}</p>
              {step.caption && (
                <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-clinics-ink-mute">
                  {step.caption}
                </p>
              )}
            </div>
            <div>{step.visual}</div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div
      ref={trackRef}
      id={id}
      className={cn("relative", className)}
      style={{ height: `${trackHeight * 100}vh` }}
    >
      <div
        className="sticky top-0 flex h-screen items-center"
        role="region"
        aria-label="Operating gap timeline"
      >
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-6 md:grid-cols-[12rem_minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-12">
          {/* Left rail — the time + title column with progress fill */}
          <div className="relative">
            <div className="absolute -left-3 top-0 h-full w-px bg-clinics-stone" />
            <div
              className="absolute -left-3 top-0 w-px bg-clinics-canopy transition-[height] duration-150"
              style={{ height: `${progress * 100}%` }}
            />
            <ol className="flex flex-col gap-8">
              {steps.map((step, i) => {
                const isActive =
                  progress >= i / steps.length &&
                  progress < (i + 1) / steps.length;
                return (
                  <li key={i} className="pl-4">
                    {step.time && (
                      <p
                        className={cn(
                          "font-mono text-xs transition-colors",
                          isActive ? "text-clinics-canopy" : "text-clinics-ink-mute",
                        )}
                      >
                        {step.time}
                      </p>
                    )}
                    <h3
                      className={cn(
                        "mt-1 font-serif text-xl transition-opacity md:text-2xl",
                        isActive
                          ? "text-clinics-ink opacity-100"
                          : "text-clinics-ink-mute opacity-60",
                      )}
                    >
                      {step.title}
                    </h3>
                    {isActive && (
                      <p className="mt-2 text-sm text-clinics-ink-mute">
                        {step.body}
                      </p>
                    )}
                    {isActive && step.caption && (
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-clinics-canopy">
                        {step.caption}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
            <progress
              className="sr-only"
              value={Math.round(progress * 100)}
              max={100}
              aria-label="Timeline progress"
            />
          </div>

          {/* Center — the title for the active step in serif */}
          <div className="hidden md:block">
            <h2
              className="font-serif text-5xl leading-[1.05] tracking-[-0.02em] text-clinics-ink"
              style={{ textWrap: "balance" }}
            >
              {steps[Math.min(Math.floor(progress * steps.length), steps.length - 1)].title}
            </h2>
            <p className="mt-4 max-w-md text-clinics-ink-mute">
              {steps[Math.min(Math.floor(progress * steps.length), steps.length - 1)].body}
            </p>
          </div>

          {/* Right — the active step's visual */}
          <div className="relative">
            {steps.map((step, i) => {
              const isActive =
                progress >= i / steps.length &&
                progress < (i + 1) / steps.length;
              return (
                <div
                  key={i}
                  className={cn(
                    "absolute inset-0 transition-opacity duration-500",
                    isActive ? "opacity-100" : "opacity-0",
                  )}
                  aria-hidden={!isActive}
                >
                  {step.visual}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
