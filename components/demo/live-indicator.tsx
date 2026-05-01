"use client";

import { Activity, RefreshCw, WifiOff } from "lucide-react";

import { useDemoStore } from "@/lib/demo/demo-store";
import { getActiveAlerts } from "@/lib/demo/selectors";

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Seed data";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function LiveIndicator() {
  const { state } = useDemoStore();
  const activeAlerts = getActiveAlerts(state);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm">
      <span className="relative flex size-2.5">
        <span className="animate-ring-pulse absolute inset-0 rounded-full bg-emerald-500/40" />
        <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
      </span>

      <div className="min-w-0 leading-tight">
        <div className="flex items-center gap-2 text-neutral-900">
          <Activity className="size-4 text-emerald-600" />
          <span className="font-medium">Live demo</span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1">
            <RefreshCw className="size-3.5" />
            Last sync {formatTimestamp(state.lastSyncAt)}
          </span>
          <span>{activeAlerts.length} active alerts</span>
          {state.offlineQueue.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <WifiOff className="size-3.5" />
              {state.offlineQueue.length} offline queued
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
