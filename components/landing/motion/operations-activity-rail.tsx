import type { CSSProperties } from "react";
import {
  operationsTickerEvents,
  type LandingMotionTone,
} from "@/lib/landing/landing-motion-content";
import { cn } from "@/lib/utils";

type OperationsActivityRailProps = {
  direction?: "horizontal" | "vertical";
  className?: string;
};

const chipToneClasses: Record<LandingMotionTone, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-800",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
};

const duplicatedEvents = [...operationsTickerEvents, ...operationsTickerEvents];

export function OperationsActivityRail({
  direction = "horizontal",
  className,
}: OperationsActivityRailProps) {
  const isVertical = direction === "vertical";
  const railStyle = {
    "--clinic-rail-x": isVertical ? "0" : "-50%",
    "--clinic-rail-y": isVertical ? "-50%" : "0",
  } as CSSProperties;

  return (
    <div
      aria-hidden="true"
      data-motion-layer="true"
      className={cn("overflow-hidden", isVertical && "max-h-72", className)}
      style={railStyle}
    >
      <div
        className={cn(
          "flex gap-3 [animation:clinic-rail-scroll_26s_linear_infinite]",
          isVertical ? "w-full flex-col" : "w-max",
        )}
      >
        {duplicatedEvents.map((event, index) => (
          <div
            key={`${event.id}-${index}`}
            data-motion-object="true"
            className={cn(
              "flex min-w-56 shrink-0 flex-col rounded-lg border px-3 py-2 text-xs shadow-sm",
              chipToneClasses[event.tone],
            )}
          >
            <span className="font-semibold">{event.label}</span>
            <span className="mt-0.5 text-[11px] opacity-75">
              {event.detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
