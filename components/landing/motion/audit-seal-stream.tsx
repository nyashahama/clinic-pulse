import type { CSSProperties } from "react";
import { ShieldCheck } from "lucide-react";
import { auditSealEvents } from "@/lib/landing/landing-motion-content";
import { cn } from "@/lib/utils";

type AuditSealStreamProps = {
  className?: string;
};

export function AuditSealStream({ className }: AuditSealStreamProps) {
  const events = [...auditSealEvents, ...auditSealEvents];

  return (
    <div
      data-motion-layer="true"
      className={cn("overflow-hidden", className)}
      style={
        { "--clinic-rail-x": "-50%", "--clinic-rail-y": "0" } as CSSProperties
      }
    >
      <div className="flex w-max gap-3 [animation:clinic-rail-scroll_30s_linear_infinite]">
        {events.map((event, index) => (
          <div
            key={`${event.id}-${index}`}
            data-motion-object="true"
            className="flex min-w-48 shrink-0 items-center gap-2 rounded-lg border border-emerald-200 bg-white/90 px-3 py-2 text-xs text-slate-700 shadow-sm"
          >
            <ShieldCheck
              className="size-4 shrink-0 text-emerald-600"
              aria-hidden="true"
            />
            <span className="min-w-0">
              <span className="block font-semibold text-slate-900">
                {event.label}
              </span>
              <span className="block truncate text-[11px] text-slate-500">
                {event.detail}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
