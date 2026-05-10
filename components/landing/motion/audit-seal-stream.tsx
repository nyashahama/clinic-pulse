import type { CSSProperties } from "react";
import { ShieldCheck } from "lucide-react";
import {
  auditSealEvents,
  type LandingMotionEvent,
} from "@/lib/landing/landing-motion-content";
import { cn } from "@/lib/utils";

type AuditSealStreamProps = {
  className?: string;
  events?: readonly LandingMotionEvent[];
};

const duplicatedEvents = [...auditSealEvents, ...auditSealEvents];

export function AuditSealStream({
  className,
  events = auditSealEvents,
}: AuditSealStreamProps) {
  const streamEvents =
    events === auditSealEvents ? duplicatedEvents : [...events, ...events];

  return (
    <div
      aria-hidden="true"
      data-motion-layer="true"
      className={cn("overflow-hidden", className)}
      style={
        { "--clinic-rail-x": "-50%", "--clinic-rail-y": "0" } as CSSProperties
      }
    >
      <div className="flex w-max gap-3 [animation:clinic-rail-scroll_30s_linear_infinite]">
        {streamEvents.map((event, index) => (
          <div
            key={`${event.id}-${index}`}
            data-motion-object="true"
            className="flex min-w-48 shrink-0 items-center gap-2 rounded-lg border border-emerald-200 bg-white/90 px-3 py-2 text-xs text-slate-700 shadow-sm dark:border-emerald-900/50 dark:bg-card/90 dark:text-muted-foreground dark:shadow-black/20"
          >
            <ShieldCheck
              className="size-4 shrink-0 text-emerald-600 dark:text-emerald-300"
              aria-hidden="true"
            />
            <span className="min-w-0">
              <span className="block font-semibold text-slate-900 dark:text-foreground">
                {event.label}
              </span>
              <span className="block truncate text-[11px] text-slate-500 dark:text-muted-foreground">
                {event.detail}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
