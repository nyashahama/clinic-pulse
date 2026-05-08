import { Radio } from "lucide-react";
import {
  heroSignalPackets,
  type LandingMotionTone,
} from "@/lib/landing/landing-motion-content";
import { cn } from "@/lib/utils";

type LiveSignalFieldProps = {
  className?: string;
};

const signalToneClasses: Record<LandingMotionTone, string> = {
  critical: "border-red-200 bg-red-50/90 text-red-800 shadow-red-500/10",
  warning: "border-amber-200 bg-amber-50/90 text-amber-800 shadow-amber-500/10",
  healthy:
    "border-emerald-200 bg-emerald-50/90 text-emerald-800 shadow-emerald-500/10",
  neutral: "border-slate-200 bg-white/90 text-slate-700 shadow-slate-500/10",
};

export function LiveSignalField({ className }: LiveSignalFieldProps) {
  return (
    <div
      aria-hidden="true"
      data-motion-layer="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {heroSignalPackets.map((packet) => (
        <span
          key={packet.id}
          data-motion-object="true"
          className={cn(
            "absolute hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs shadow-lg backdrop-blur-md lg:inline-flex [animation:clinic-signal-drift_8s_ease-in-out_infinite]",
            signalToneClasses[packet.tone],
          )}
          style={{
            left: packet.x,
            top: packet.y,
            animationDelay: packet.delay,
          }}
        >
          <Radio className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="font-semibold">{packet.label}</span>
          <span className="text-[11px] opacity-70">{packet.detail}</span>
        </span>
      ))}
    </div>
  );
}
