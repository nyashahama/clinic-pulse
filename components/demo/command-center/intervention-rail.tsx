"use client";

import { buttonVariants } from "@/components/ui/button";
import type { DistrictCommandCenter } from "@/lib/demo/district-command-center";
import { cn } from "@/lib/utils";

import { CommandCard } from "./command-card";

type InterventionRailProps = {
  selectedItem: DistrictCommandCenter["selectedItem"];
  intervention: DistrictCommandCenter["intervention"];
  replayDisabled: boolean;
  onOpenClinic: (clinicId: string) => void;
  onTriggerReroute: () => void;
  onSyncOfflineReports: () => void;
  onStartIncidentReplay: () => void;
};

export function InterventionRail({
  selectedItem,
  intervention,
  replayDisabled,
  onOpenClinic,
  onTriggerReroute,
  onSyncOfflineReports,
  onStartIncidentReplay,
}: InterventionRailProps) {
  const replayActionDisabled = replayDisabled || !selectedItem;

  return (
    <CommandCard
      eyebrow="Intervention rail"
      title="Command actions"
      description="Keep the selected clinic, next move, and proof step visible while the district queue changes."
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Active priority</p>
          {selectedItem ? (
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold tracking-tight text-slate-950">{selectedItem.clinicName}</h3>
                <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white">
                  {selectedItem.severityLabel} {selectedItem.score}
                </span>
              </div>
              <p className="text-sm leading-6 text-slate-600">{selectedItem.patientImpact}</p>
            </div>
          ) : (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              No active priority is selected. Choose a clinic from the severity queue to arm intervention actions.
            </p>
          )}
        </div>

        <div className="grid gap-3">
          <ActionSummary label="Primary action" value={intervention.primaryAction.label} detail={intervention.primaryAction.description} />
          <ActionSummary label="Expected outcome" value={intervention.expectedOutcome} />
          <ActionSummary label="Verification step" value={intervention.verificationStep} />
        </div>

        {intervention.secondaryActions.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Supporting actions</p>
            <ul className="mt-3 space-y-3">
              {intervention.secondaryActions.map((action) => (
                <li key={action.label} className="text-sm leading-6 text-slate-600">
                  <span className="font-semibold text-slate-950">{action.label}:</span> {action.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        {replayDisabled && (
          <p id="intervention-replay-disabled" className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            Replay-sensitive actions are paused until the demo replay state is ready.
          </p>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          {selectedItem && (
            <button
              type="button"
              onClick={() => onOpenClinic(selectedItem.clinicId)}
              className={cn(buttonVariants({ size: "lg" }), "w-full")}
            >
              Open clinic detail
            </button>
          )}
          <button
            type="button"
            onClick={onTriggerReroute}
            disabled={replayActionDisabled}
            aria-describedby={replayDisabled ? "intervention-replay-disabled" : undefined}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
          >
            Trigger reroute
          </button>
          <button
            type="button"
            onClick={onSyncOfflineReports}
            className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "w-full")}
          >
            Sync offline reports
          </button>
          <button
            type="button"
            onClick={onStartIncidentReplay}
            disabled={replayActionDisabled}
            aria-describedby={replayDisabled ? "intervention-replay-disabled" : undefined}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
          >
            Run incident replay
          </button>
        </div>
      </div>
    </CommandCard>
  );
}

type ActionSummaryProps = {
  label: string;
  value: string;
  detail?: string;
};

function ActionSummary({ label, value, detail }: ActionSummaryProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">{value}</p>
      {detail && <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>}
    </div>
  );
}
