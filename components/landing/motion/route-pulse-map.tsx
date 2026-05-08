import {
  heroMapPulses,
  type LandingMotionTone,
} from "@/lib/landing/landing-motion-content";
import { cn } from "@/lib/utils";

type RoutePulseMapProps = {
  className?: string;
};

const pinToneClasses: Record<LandingMotionTone, string> = {
  critical: "border-red-300 bg-red-500 shadow-red-500/35",
  warning: "border-amber-300 bg-amber-400 shadow-amber-500/35",
  healthy: "border-emerald-300 bg-emerald-500 shadow-emerald-500/35",
  neutral: "border-slate-300 bg-slate-400 shadow-slate-500/30",
};

export function RoutePulseMap({ className }: RoutePulseMapProps) {
  return (
    <div
      aria-hidden="true"
      data-motion-layer="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          data-motion-object="true"
          d="M36 58 C44 44 52 66 61 24 S70 42 70 60"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeDasharray="7 8"
          className="text-emerald-400/70 [animation:clinic-route-dash_4.8s_ease-in-out_infinite]"
        />
      </svg>

      <span
        data-motion-object="true"
        className="absolute size-2 rounded-full bg-white shadow-[0_0_22px_rgba(16,185,129,0.75)] [animation:clinic-packet-travel_4.8s_linear_infinite] [offset-path:path('M_36_58_C_44_44_52_66_61_24_S_70_42_70_60')]"
      />

      {heroMapPulses.map((pulse, index) => (
        <span
          key={pulse.id}
          data-motion-object="true"
          className={cn(
            "absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-lg [animation:clinic-soft-blink_2.8s_ease-in-out_infinite]",
            pulse.active && "size-4",
            pinToneClasses[pulse.tone],
          )}
          style={{
            left: `${pulse.x}%`,
            top: `${pulse.y}%`,
            animationDelay: `${index * 0.35}s`,
          }}
        />
      ))}
    </div>
  );
}
