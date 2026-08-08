import type { LucideIcon } from "lucide-react";
import { FileCheck2, MapPinned, RadioTower, Route, WifiOff } from "lucide-react";
import { useId } from "react";

import { OperationalStatus } from "@/components/landing/operational-status";
import {
  getClinicPoint,
  getIncidentStage,
  operationalNarrative,
  type IncidentStageId,
} from "@/lib/landing/operational-narrative-content";
import { cn } from "@/lib/utils";

type DistrictCanvasProps = {
  stageId: IncidentStageId;
  variant?: "hero" | "story" | "compact";
  className?: string;
  progressive?: boolean;
};

const stageIcons: Record<IncidentStageId, LucideIcon> = {
  "field-report": WifiOff,
  "district-response": RadioTower,
  "patient-route": Route,
  "audit-record": FileCheck2,
};

export function DistrictCanvas({
  stageId,
  variant = "story",
  className,
  progressive = false,
}: DistrictCanvasProps) {
  const descriptionId = useId();
  const titleId = useId();
  const stage = getIncidentStage(stageId);
  const affectedClinic = getClinicPoint(operationalNarrative.incident.affectedClinicId);
  const alternativeClinic = getClinicPoint(operationalNarrative.route.toClinicId);
  const routeActive = stage.routeState === "confirmed" || stage.routeState === "recorded";
  const StageIcon = stageIcons[stageId];
  const isCompact = variant === "compact";

  return (
    <article
      data-active-stage={stageId}
      data-canvas-variant={variant}
      data-district-canvas="true"
      data-progressive-canvas={progressive ? "true" : undefined}
      data-route-active={routeActive ? "true" : "false"}
      className={cn(
        "min-w-0 overflow-hidden rounded-[1.125rem] border border-landing-ink/14 bg-white text-landing-ink shadow-[0_24px_70px_rgba(16,32,29,0.13)] dark:border-white/12 dark:bg-[#10221f] dark:text-white",
        isCompact ? "rounded-2xl shadow-[0_18px_48px_rgba(16,32,29,0.1)]" : null,
        className,
      )}
    >
      <header className="flex min-w-0 items-center justify-between gap-3 border-b border-landing-ink/10 px-3 py-3 dark:border-white/10 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-landing-ledger text-landing-mint dark:bg-landing-mint dark:text-[#06251f]">
            <MapPinned className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">Tshwane North operating view</h3>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-landing-ink/70 dark:text-white/70">
              {operationalNarrative.disclosure}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-md border border-landing-ink/12 bg-landing-paper px-2 py-1 font-mono text-[11px] font-semibold dark:border-white/12 dark:bg-white/7">
          {stage.time}
        </span>
      </header>

      <div
        className={cn(
          "grid min-w-0",
          isCompact ? "gap-0" : "xl:grid-cols-[minmax(0,1.18fr)_minmax(15rem,0.82fr)]",
        )}
      >
        <div className="min-w-0 border-landing-ink/10 p-3 dark:border-white/10 sm:p-4 xl:border-r">
          <div className="relative aspect-[16/10] min-h-52 overflow-hidden rounded-xl border border-landing-ink/12 bg-[#e6eeea] dark:border-white/10 dark:bg-[#132b27]">
            <svg
              viewBox="0 0 600 360"
              className="absolute inset-0 size-full"
              role="img"
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
            >
              <title id={titleId}>District clinic route and status map</title>
              <defs>
                <pattern id={`${titleId}-grid`} width="32" height="32" patternUnits="userSpaceOnUse">
                  <path
                    d="M 32 0 L 0 0 0 32"
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity="0.08"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="600" height="360" fill={`url(#${titleId}-grid)`} />
              <path
                d="M-20 302C70 271 121 278 181 228C237 181 232 114 319 103C410 91 452 44 632 50"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.12"
                strokeWidth="18"
              />
              <path
                d="M20 65C117 115 172 87 244 134C321 184 350 238 448 248C507 254 552 283 620 324"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeWidth="11"
              />
              <path
                d="M186 238C240 214 280 211 326 181C368 154 397 133 438 126"
                pathLength="1"
                className="landing-route-path"
                fill="none"
                stroke="var(--landing-route)"
                strokeDasharray="1"
                strokeDashoffset={routeActive ? 1 : 0}
                strokeLinecap="round"
                strokeWidth={routeActive ? 5 : 3}
                opacity={routeActive ? 1 : 0.22}
              />
            </svg>

            <div className="absolute left-3 top-3 rounded-lg border border-landing-ink/12 bg-white/92 px-2.5 py-2 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-[#10221f]/92">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-landing-ink/70 dark:text-white/70">
                Active service
              </p>
              <p className="mt-1 text-xs font-semibold">{operationalNarrative.incident.service}</p>
            </div>

            {operationalNarrative.clinics.map((clinic) => {
              const isAffected = clinic.id === affectedClinic.id;
              const isAlternative = clinic.id === alternativeClinic.id;
              const showLabel = isAffected || isAlternative || !isCompact;

              return (
                <div
                  key={clinic.id}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${clinic.x}%`, top: `${clinic.y}%` }}
                  aria-hidden="true"
                >
                  <span
                    className={cn(
                      "block size-3.5 rotate-45 border-2 border-white shadow-md",
                      clinic.tone === "critical" ? "rounded-[3px] bg-landing-critical" : null,
                      clinic.tone === "warning" ? "rounded-full bg-landing-warning" : null,
                      clinic.tone === "healthy" ? "rounded-full bg-landing-green" : null,
                      isAlternative && routeActive ? "ring-4 ring-landing-route/25" : null,
                    )}
                  />
                  {showLabel ? (
                    <span
                      className={cn(
                        "absolute left-1/2 top-5 w-max max-w-32 -translate-x-1/2 rounded-md border border-landing-ink/12 bg-white/94 px-2 py-1 text-center text-[10px] font-semibold leading-3.5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-[#10221f]/94",
                        isAffected ? "text-red-800 dark:text-landing-critical" : null,
                        isAlternative && routeActive ? "text-landing-route" : null,
                        isCompact && !isAffected && !isAlternative ? "hidden" : null,
                      )}
                    >
                      {clinic.shortName}
                    </span>
                  ) : null}
                </div>
              );
            })}

            <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
              <span className="rounded-md border border-landing-critical/25 bg-white/94 px-2 py-1 text-[10px] font-semibold text-red-800 shadow-sm dark:bg-[#10221f]/94 dark:text-landing-critical">
                ◆ Unavailable
              </span>
              <span className="rounded-md border border-landing-route/25 bg-white/94 px-2 py-1 text-right text-[10px] font-semibold text-landing-route shadow-sm dark:bg-[#10221f]/94">
                {routeActive ? `→ ${operationalNarrative.route.estimate}` : "Route review pending"}
              </span>
            </div>
          </div>

          <p
            id={descriptionId}
            className="mt-3 text-xs leading-5 text-landing-ink/65 dark:text-white/62"
          >
            {affectedClinic.name} is marked {affectedClinic.statusLabel.toLowerCase()}. {" "}
            {routeActive
              ? `${alternativeClinic.name} is the ${operationalNarrative.route.statusLabel.toLowerCase()}, ${operationalNarrative.route.estimate}.`
              : `The district team is checking a compatible pharmacy route to ${alternativeClinic.name}.`}
          </p>
        </div>

        {!isCompact ? (
          <div className="min-w-0 p-3 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-landing-ink/12 bg-landing-paper dark:border-white/12 dark:bg-white/7">
                  <StageIcon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-landing-ink/70 dark:text-white/70">
                    Stage {stage.step} / {stage.eyebrow}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-5">{stage.title}</p>
                </div>
              </div>
              <OperationalStatus tone={stage.tone} className="shrink-0">
                {stage.statusLabel}
              </OperationalStatus>
            </div>

            <div className="mt-4 grid gap-2">
              {stage.events.map((event) => (
                <div
                  key={event.label}
                  className="grid min-w-0 grid-cols-[5.25rem_minmax(0,1fr)] items-start gap-2 border-t border-landing-ink/8 pt-2 text-xs dark:border-white/8"
                >
                  <span className="font-mono uppercase tracking-[0.08em] text-landing-ink/68 dark:text-white/70">
                    {event.label}
                  </span>
                  <span className="min-w-0 break-words font-semibold leading-5">
                    {event.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
