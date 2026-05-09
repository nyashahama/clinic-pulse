import type { DistrictCommandCenter } from "@/lib/demo/district-command-center";
import { cn } from "@/lib/utils";

import { CommandCard } from "./command-card";

type DistrictCommandBriefProps = {
  brief: DistrictCommandCenter["brief"];
};

const POSTURE_STYLES: Record<DistrictCommandCenter["brief"]["posture"], string> = {
  critical: "border-red-200 bg-red-50 text-red-950 ring-red-100",
  active: "border-amber-200 bg-amber-50 text-amber-950 ring-amber-100",
  watch: "border-sky-200 bg-sky-50 text-sky-950 ring-sky-100",
  stable: "border-emerald-200 bg-emerald-50 text-emerald-950 ring-emerald-100",
};

const POSTURE_DOT_STYLES: Record<DistrictCommandCenter["brief"]["posture"], string> = {
  critical: "bg-red-600",
  active: "bg-amber-500",
  watch: "bg-sky-500",
  stable: "bg-emerald-500",
};

export function DistrictCommandBrief({ brief }: DistrictCommandBriefProps) {
  return (
    <CommandCard
      eyebrow="Severity Command Center"
      title="District command brief"
      description="Risk-first command posture for district operations, synchronized around the clinics needing immediate attention."
      className={cn("overflow-hidden ring-1", POSTURE_STYLES[brief.posture])}
    >
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border border-current/15 bg-white/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]",
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", POSTURE_DOT_STYLES[brief.posture])} />
              {brief.riskLabel}
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
              {brief.lastSyncLabel}
            </span>
          </div>

          <p className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            {brief.summary}
          </p>

          <div className="rounded-2xl border border-current/10 bg-white/55 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-65">Immediate focus</p>
            <p className="mt-2 text-sm font-medium leading-6">{brief.immediateFocus}</p>
          </div>
        </div>

        <dl className="grid gap-3 rounded-2xl border border-current/10 bg-white/55 p-4 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] opacity-65">Operator</dt>
            <dd className="mt-1 font-semibold">{brief.operatorName}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] opacity-65">District scope</dt>
            <dd className="mt-1 font-semibold">{brief.districtLabel}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] opacity-65">Last sync</dt>
            <dd className="mt-1 font-semibold">{brief.lastSyncLabel}</dd>
          </div>
        </dl>
      </div>
    </CommandCard>
  );
}
