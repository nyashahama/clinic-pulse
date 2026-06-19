"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  MapPin,
  Route,
  Send,
  Shield,
} from "lucide-react";

import { cn } from "@/lib/utils";

/* ─── Real-time API Visual ─── */
export function RealtimeApiVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border border-white/[0.08] bg-black/40 p-4 font-mono text-[11px] leading-relaxed text-white/80 shadow-2xl">
        <div className="mb-2 flex items-center gap-1.5 text-white/30">
          <span className="size-2 rounded-full bg-[#FF5F57]" />
          <span className="size-2 rounded-full bg-[#FEBC2E]" />
          <span className="size-2 rounded-full bg-[#28C840]" />
          <span className="ml-2 text-[10px]">api.clinicpulse.co</span>
        </div>
        <span className="text-blue-400">curl</span>{" "}
        <span className="text-white/50">/v1/clinics/mp-001</span>
        <div className="mt-2 text-white/30">{"{"}</div>
        <div className="pl-3"><span className="text-blue-400">&quot;name&quot;</span>: <span className="text-emerald-400">&quot;Mabopane Station&quot;</span>,</div>
        <div className="pl-3"><span className="text-blue-400">&quot;status&quot;</span>: <span className="text-red-400">&quot;non-functional&quot;</span>,</div>
        <div className="pl-3"><span className="text-blue-400">&quot;services&quot;</span>: {"{"} <span className="text-red-400">&quot;pharmacy&quot;</span>: <span className="text-red-400">&quot;closed&quot;</span>, <span className="text-amber-400">&quot;chronic&quot;</span>: <span className="text-amber-400">&quot;paused&quot;</span> {"}"},</div>
        <div className="pl-3"><span className="text-blue-400">&quot;reroute_to&quot;</span>: <span className="text-emerald-400">&quot;akasia-hills-001&quot;</span></div>
        <div className="text-white/30">{"}"}</div>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400/60">
          <CheckCircle2 className="size-3" />
          200 OK · 47ms
        </div>
      </div>
    </div>
  );
}

/* ─── Offline Sync Visual ─── */
export function OfflineSyncVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-full max-w-xs space-y-2">
        {[
          { name: "Mabopane Station", status: "Pharmacy closed", time: "07:12", kb: 2.1 },
          { name: "Soshanguve Block F", status: "Staff shortage", time: "07:08", kb: 1.8 },
          { name: "Akasia Hills", status: "Stock update", time: "06:55", kb: 1.2 },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[9px] font-bold text-white/30">
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-medium text-white/70">{item.name}</p>
              <p className="text-[8px] text-white/30">{item.status} · {item.time} · {item.kb} KB</p>
            </div>
            <Clock className="size-2.5 text-white/20" />
          </div>
        ))}
        <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/[0.06] bg-white/[0.02] py-2.5 text-[9px] text-white/30">
          Auto-sync on reconnect
          <span className="inline-flex items-center gap-1 text-amber-400/60">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400/50" />
              <span className="relative inline-flex size-1.5 rounded-full bg-amber-400" />
            </span>
            Waiting
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Predict Visual ─── */
export function PredictVisual() {
  const bars = [
    { h: 30, label: "06" },
    { h: 45, label: "08" },
    { h: 70, label: "10" },
    { h: 82, label: "12" },
    { h: 92, label: "14" },
    { h: 72, label: "16" },
    { h: 38, label: "18" },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="flex items-end gap-1.5">
          {bars.map((bar, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full overflow-hidden rounded-t-sm bg-white/[0.04]" style={{ height: "80px" }}>
                <div
                  className={cn(
                    "w-full rounded-t-sm transition-all",
                    i === 4 ? "bg-red-400/60" : i >= 3 ? "bg-amber-400/60" : "bg-emerald-400/60",
                  )}
                  style={{ height: `${bar.h}%`, marginTop: "auto" }}
                />
              </div>
              <span className="text-[7px] text-white/20">{bar.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-[9px] text-white/30">
          <span>Capacity forecast</span>
          <span className="text-emerald-400/60">14:00 peak</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Reroute Visual ─── */
export function RerouteVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-full max-w-xs space-y-3">
        <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.05] p-3">
          <div className="flex items-center gap-2">
            <Route className="size-4 text-emerald-400" />
            <div>
              <p className="text-[11px] font-semibold text-emerald-300">Patient rerouted</p>
              <p className="text-[9px] text-emerald-400/60">18 min trip saved</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3 text-[9px]">
            <span className="text-red-400">Mabopane Station</span>
            <ArrowRight className="size-3 text-white/20" />
            <span className="text-emerald-400">Akasia Hills</span>
          </div>
        </div>
        <div className="space-y-1">
          {[
            { name: "Akasia Hills", dist: "3.1 km", open: true },
            { name: "Wonderpark", dist: "4.8 km", open: true },
            { name: "Claudina", dist: "6.2 km", open: true },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-2 rounded border border-white/[0.04] px-3 py-2">
              <MapPin className="size-2.5 text-white/20" />
              <span className="flex-1 text-[10px] text-white/50">{c.name}</span>
              <span className="text-[9px] text-white/30">{c.dist}</span>
              <CheckCircle2 className="size-2.5 text-emerald-400/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Audit Visual ─── */
export function AuditVisual() {
  const entries = [
    { time: "07:16", action: "Audit record sealed", actor: "System", icon: Shield, tone: "emerald" },
    { time: "07:15", action: "Patient reroute triggered", actor: "System", icon: Route, tone: "emerald" },
    { time: "07:14", action: "Status changed", actor: "System", icon: AlertTriangle, tone: "red" },
    { time: "07:12", action: "Field report submitted", actor: "S. Ndaba", icon: Send, tone: "blue" },
  ];

  const toneMap: Record<string, string> = {
    emerald: "text-emerald-400",
    red: "text-red-400",
    blue: "text-blue-400",
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-full max-w-xs space-y-0 rounded-lg border border-white/[0.06] bg-white/[0.02]">
        {entries.map((entry, i) => {
          const Icon = entry.icon;
          return (
            <div key={i} className={cn("flex items-center gap-2 px-3 py-2.5", i < entries.length - 1 && "border-b border-white/[0.04]")}>
              <span className="w-10 shrink-0 font-mono text-[8px] tabular-nums text-white/20">{entry.time}</span>
              <Icon className={cn("size-2.5", toneMap[entry.tone])} />
              <span className="flex-1 text-[10px] text-white/60">{entry.action}</span>
              <span className="text-[8px] text-white/20">{entry.actor}</span>
              {i === 0 && <CheckCircle2 className="size-2.5 text-emerald-400/50" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
