"use client";

import type { ComponentType } from "react";
import {
  RefreshCw,
  Route,
  Syringe,
  TriangleAlert,
  UsersRound,
} from "lucide-react";

import { SectionHeader } from "@/components/demo/section-header";
import { Button } from "@/components/ui/button";

type DemoControlsProps = {
  stockoutClinicLabel: string;
  staffingClinicLabel: string;
  offlineQueueCount: number;
  onReset: () => void;
  onTriggerStockout: () => void;
  onTriggerStaffingShortage: () => void;
  onSyncOfflineReports: () => void;
  onTriggerReroute: () => void;
};

type ControlAction = {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: "outline" | "destructive";
};

export function DemoControls({
  stockoutClinicLabel,
  staffingClinicLabel,
  offlineQueueCount,
  onReset,
  onTriggerStockout,
  onTriggerStaffingShortage,
  onSyncOfflineReports,
  onTriggerReroute,
}: DemoControlsProps) {
  const actions: ControlAction[] = [
    {
      title: "Reset demo",
      description: "Restore the seeded district state and clear locally queued reports.",
      icon: RefreshCw,
      onClick: onReset,
      variant: "outline",
    },
    {
      title: "Trigger stockout",
      description: `Escalate ${stockoutClinicLabel} into a visible medicines incident.`,
      icon: Syringe,
      onClick: onTriggerStockout,
      variant: "destructive",
    },
    {
      title: "Trigger staffing shortage",
      description: `Push ${staffingClinicLabel} into a degraded throughput state.`,
      icon: UsersRound,
      onClick: onTriggerStaffingShortage,
      variant: "outline",
    },
    {
      title: "Sync offline reports",
      description:
        offlineQueueCount > 0
          ? `Flush ${offlineQueueCount} queued field report${offlineQueueCount === 1 ? "" : "s"} into the district feed.`
          : "Seed and sync an offline field report so the stream and sync state update in one action.",
      icon: TriangleAlert,
      onClick: onSyncOfflineReports,
      variant: "outline",
    },
    {
      title: "Trigger reroute scenario",
      description: "Focus the console on a clinic that needs an alternative routing recommendation.",
      icon: Route,
      onClick: onTriggerReroute,
      variant: "outline",
    },
  ];

  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default shadow-sm">
      <div className="px-4 pt-4">
        <SectionHeader
          eyebrow="Demo actions"
          title="Console controls"
          description="Each control is wired to the same mock state used across the district console surfaces."
        />
      </div>

      <div className="grid gap-3 p-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <div key={action.title} className="rounded-lg border border-border-subtle p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-content-emphasis">{action.title}</p>
                  <p className="mt-1 text-sm leading-6 text-content-default">
                    {action.description}
                  </p>
                </div>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-bg-subtle text-content-subtle">
                  <Icon className="size-4" />
                </div>
              </div>

              <div className="mt-3">
                <Button
                  variant={action.variant ?? "outline"}
                  size="sm"
                  onClick={action.onClick}
                >
                  {action.title}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
