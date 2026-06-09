"use client";

import { motion } from "motion/react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Download,
  MapPin,
  Radio,
  Route,
  Send,
  Shield,
  Smartphone,
  WifiOff,
} from "lucide-react";

import { cn } from "@/lib/utils";

export function FeaturesSection() {
  return (
    <section className="relative border-t border-neutral-800 bg-neutral-950" id="features">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-400">
            Infrastructure
          </span>
          <h2 className="mt-6 font-display text-3xl font-medium leading-[1.15] tracking-tight text-white sm:text-4xl" style={{ textWrap: "balance" }}>
            Built to operate under pressure
          </h2>
          <p className="mt-4 text-base text-white/50">
            Intermittent connectivity. High load. Life-critical decisions. ClinicPulse is built for the realities of South African healthcare — not a San Francisco server room.
          </p>
        </div>

        {/* Immersive bento — dark theme */}
        <div className="mt-14 grid grid-cols-1 gap-3 md:grid-cols-12">
          {/* ─── Row 1: Full-width terminal ─── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="md:col-span-12 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm"
          >
            <FullWidthTerminal />
          </motion.div>

          {/* ─── Row 2: Offline (4 cols) + Prediction (8 cols) ─── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.06 }}
            className="md:col-span-4 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm"
          >
            <OfflinePanel />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.12 }}
            className="md:col-span-8 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm"
          >
            <PredictionPanel />
          </motion.div>

          {/* ─── Row 3: Reroute (6 cols) + Audit (6 cols) ─── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.18 }}
            className="md:col-span-6 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm"
          >
            <ReroutePanel />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.24 }}
            className="md:col-span-6 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm"
          >
            <AuditPanel />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Full-width terminal ─── */
function FullWidthTerminal() {
  return (
    <div className="flex flex-col lg:flex-row">
      {/* Terminal */}
      <div className="flex-1 font-mono text-[11px]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.03] px-5 py-2.5">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-[#FF5F57]" />
            <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="size-2.5 rounded-full bg-[#28C840]" />
          </div>
          <span className="text-[10px] text-white/30">api.clinicpulse.co</span>
          <span className="ml-auto flex items-center gap-1.5 text-[9px] text-emerald-400/70">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Connected
          </span>
        </div>
        <div className="p-5">
          <div className="text-white/30">$ curl -s -H "Authorization: Bearer cp_live_...k8x2" \</div>
          <div className="text-white/30">  https://api.clinicpulse.co/v1/districts/tshwane-north/clinics</div>
          <div className="mt-3 text-white/30">{"{"}</div>
          <div className="pl-4"><span className="text-blue-400">"district"</span>: <span className="text-emerald-400">"Tshwane North"</span>,</div>
          <div className="pl-4"><span className="text-blue-400">"clinic_count"</span>: <span className="text-amber-400">42</span>,</div>
          <div className="pl-4"><span className="text-blue-400">"operational"</span>: <span className="text-emerald-400">38</span>,</div>
          <div className="pl-4"><span className="text-blue-400">"degraded"</span>: <span className="text-amber-400">1</span>,</div>
          <div className="pl-4"><span className="text-blue-400">"non_functional"</span>: <span className="text-red-400">1</span>,</div>
          <div className="pl-4"><span className="text-blue-400">"clinics"</span>: [</div>
          <div className="pl-8">{"{"}</div>
          <div className="pl-12"><span className="text-blue-400">"id"</span>: <span className="text-emerald-400">"mp-001"</span>,</div>
          <div className="pl-12"><span className="text-blue-400">"name"</span>: <span className="text-emerald-400">"Mabopane Station"</span>,</div>
          <div className="pl-12"><span className="text-blue-400">"status"</span>: <span className="text-red-400">"non-functional"</span>,</div>
          <div className="pl-12"><span className="text-blue-400">"services"</span>: {"{"} <span className="text-red-400">"pharmacy"</span>: <span className="text-red-400">"closed"</span>, <span className="text-amber-400">"chronic"</span>: <span className="text-amber-400">"paused"</span> {"}"},</div>
          <div className="pl-12"><span className="text-blue-400">"reroute_to"</span>: <span className="text-emerald-400">"akasia-hills-001"</span>,</div>
          <div className="pl-12"><span className="text-blue-400">"last_updated"</span>: <span className="text-emerald-400">"2026-06-09T07:14:02Z"</span></div>
          <div className="pl-8">{"}"},</div>
          <div className="pl-8 text-white/20">... 41 more clinics</div>
          <div className="pl-4">]</div>
          <div>{"}"}</div>
        </div>
      </div>

      {/* Stats sidebar */}
      <div className="w-full shrink-0 border-t lg:border-t-0 lg:border-l border-white/[0.06] bg-white/[0.01] p-5 lg:w-56">
        <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-white/30">Performance</p>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-3xl font-bold tabular-nums tracking-tight text-white">47<span className="text-lg text-white/40">ms</span></p>
            <p className="mt-0.5 text-[10px] text-white/40">Avg response time</p>
          </div>
          <div>
            <p className="text-3xl font-bold tabular-nums tracking-tight text-white">3,500<span className="text-lg text-white/40">+</span></p>
            <p className="mt-0.5 text-[10px] text-white/40">Clinics monitored</p>
          </div>
          <div>
            <p className="text-3xl font-bold tabular-nums tracking-tight text-white">52</p>
            <p className="mt-0.5 text-[10px] text-white/40">Districts live</p>
          </div>
          <div className="pt-2 border-t border-white/[0.06]">
            <div className="flex items-center gap-1.5 text-[9px] text-emerald-400/70">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Edge: Johannesburg
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[9px] text-white/30">
              <span className="size-1.5 rounded-full bg-white/20" />
              Cache TTL: 30s
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Offline panel ─── */
function OfflinePanel() {
  const queue = [
    { clinic: "Mabopane Station", status: "Pharmacy closed", time: "07:12", size: "2.1 KB" },
    { clinic: "Soshanguve F", status: "Staff shortage", time: "07:08", size: "1.8 KB" },
    { clinic: "Akasia Hills", status: "Stock update", time: "06:55", size: "1.2 KB" },
  ];

  return (
    <div className="flex h-full flex-col p-5">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
          <WifiOff className="size-3.5 text-amber-400" />
        </div>
        <span className="text-[13px] font-semibold text-white">Works offline</span>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-white/40">
        Reports queue locally and sync when connectivity returns.
      </p>

      <div className="mt-4 flex-1 space-y-1.5">
        {queue.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
              <span className="text-[8px] font-bold text-white/50">{i + 1}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-medium text-white/80">{item.clinic}</p>
              <p className="text-[8px] text-white/30">{item.status} · {item.time} · {item.size}</p>
            </div>
            <Clock className="size-2.5 text-amber-400/50" />
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-lg border border-dashed border-white/[0.08] bg-white/[0.01] p-3 text-center">
        <p className="text-[9px] text-white/30">Auto-sync on reconnect</p>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full w-[20%] rounded-full bg-amber-400/60" />
        </div>
      </div>
    </div>
  );
}

/* ─── Prediction panel ─── */
function PredictionPanel() {
  const clinics = [
    { name: "Diepsloot CHC", risk: 87, patients: 120, staff: 2 },
    { name: "Mabopane Station", risk: 95, patients: 83, staff: 0 },
    { name: "Soshanguve Block F", risk: 62, patients: 45, staff: 3 },
    { name: "Akasia Hills", risk: 18, patients: 20, staff: 4 },
    { name: "Wonderpark Medical", risk: 12, patients: 15, staff: 6 },
  ];

  return (
    <div className="flex h-full flex-col p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10">
            <Radio className="size-3.5 text-blue-400" />
          </div>
          <span className="text-[13px] font-semibold text-white">Predict before the queue</span>
        </div>
        <span className="text-[9px] text-white/30">14:00 forecast</span>
      </div>

      <div className="mt-4 flex flex-1 gap-4">
        {/* Bar chart */}
        <div className="flex items-end gap-1">
          {[
            { h: "25%", label: "06" },
            { h: "40%", label: "08" },
            { h: "65%", label: "10" },
            { h: "80%", label: "12" },
            { h: "92%", label: "14" },
            { h: "70%", label: "16" },
            { h: "35%", label: "18" },
          ].map((bar, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full overflow-hidden rounded-t-sm bg-white/[0.04]" style={{ height: "60px" }}>
                <div
                  className={cn("w-full rounded-t-sm transition-all", i === 4 ? "bg-red-400/80" : i === 3 ? "bg-amber-400/80" : "bg-emerald-400/80")}
                  style={{ height: bar.h, marginTop: "auto" }}
                />
              </div>
              <span className="text-[6px] text-white/20">{bar.label}</span>
            </div>
          ))}
        </div>

        {/* Risk list */}
        <div className="flex-1 space-y-1">
          {clinics.map((clinic) => (
            <div key={clinic.name} className="flex items-center gap-2 rounded border border-white/[0.04] px-2 py-1.5">
              <span className="min-w-0 flex-1 truncate text-[9px] text-white/60">{clinic.name}</span>
              <div className="h-1 w-10 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={cn("h-full rounded-full", clinic.risk >= 80 ? "bg-red-400/80" : clinic.risk >= 50 ? "bg-amber-400/80" : "bg-emerald-400/80")}
                  style={{ width: `${clinic.risk}%` }}
                />
              </div>
              <span className={cn(
                "w-6 text-right text-[8px] font-semibold tabular-nums",
                clinic.risk >= 80 ? "text-red-400" : clinic.risk >= 50 ? "text-amber-400" : "text-emerald-400",
              )}>
                {clinic.risk}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 text-[8px] text-white/20">
        Model: 30-day rolling average + staff/stock signals
      </div>
    </div>
  );
}

/* ─── Reroute panel ─── */
function ReroutePanel() {
  return (
    <div className="flex h-full flex-col p-5">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
          <Route className="size-3.5 text-emerald-400" />
        </div>
        <span className="text-[13px] font-semibold text-white">Automatic rerouting</span>
      </div>

      <div className="mt-4 flex-1">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-400" />
            <div>
              <p className="text-[11px] font-semibold text-emerald-300">Patient rerouted</p>
              <p className="text-[9px] text-emerald-400/60">18 min trip saved</p>
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-[9px]">
              <span className="text-white/30">From:</span>
              <span className="font-medium text-red-400">Mabopane Station</span>
            </div>
            <div className="flex items-center gap-2 text-[9px]">
              <span className="text-white/30">To:</span>
              <span className="font-medium text-emerald-400">Akasia Hills Clinic</span>
            </div>
            <div className="flex items-center gap-2 text-[9px]">
              <span className="text-white/30">Distance:</span>
              <span className="text-white/60">3.1 km · 8 min drive</span>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <p className="text-[8px] font-medium uppercase tracking-[0.15em] text-white/30">Nearest alternatives</p>
          <div className="mt-2 space-y-1">
            {[
              { name: "Akasia Hills", dist: "3.1 km", cap: 60 },
              { name: "Wonderpark", dist: "4.8 km", cap: 85 },
              { name: "Claudina", dist: "6.2 km", cap: 90 },
            ].map((c) => (
              <div key={c.name} className="flex items-center gap-2 text-[9px]">
                <MapPin className="size-2.5 text-white/20" />
                <span className="flex-1 text-white/50">{c.name}</span>
                <span className="text-white/30">{c.dist}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Audit panel ─── */
function AuditPanel() {
  const entries = [
    { time: "07:16:00", hash: "a3f8c2d1", action: "Audit record sealed", actor: "System", icon: Shield, color: "text-emerald-400" },
    { time: "07:15:11", hash: "7b2e9f4a", action: "Patient reroute triggered", actor: "System", icon: Route, color: "text-emerald-400" },
    { time: "07:14:02", hash: "9a6f3e2c", action: "Status changed to non-functional", actor: "System", icon: AlertTriangle, color: "text-red-400" },
    { time: "07:12:34", hash: "2e7f4b6d", action: "Offline field report submitted", actor: "S. Ndaba", icon: Send, color: "text-blue-400" },
  ];

  return (
    <div className="flex h-full flex-col p-5">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10">
          <Database className="size-3.5 text-purple-400" />
        </div>
        <span className="text-[13px] font-semibold text-white">Immutable audit trail</span>
      </div>

      <div className="mt-4 flex-1 space-y-0 rounded-lg border border-white/[0.06]">
        {entries.map((entry, i) => {
          const Icon = entry.icon;
          return (
            <div key={i} className={cn("flex items-center gap-2.5 px-3 py-2.5", i < entries.length - 1 && "border-b border-white/[0.04]")}>
              <span className="w-12 shrink-0 font-mono text-[8px] tabular-nums text-white/30">{entry.time}</span>
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                <Icon className={cn("size-2.5", entry.color)} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-medium text-white/70">{entry.action}</span>
                <div className="flex items-center gap-1.5 text-[7px] text-white/20">
                  <span>{entry.actor}</span>
                  <span>·</span>
                  <span className="font-mono">SHA:{entry.hash}</span>
                </div>
              </div>
              {i === 0 && <CheckCircle2 className="size-3 shrink-0 text-emerald-400" />}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-[8px] text-white/20">
        <span>4 events · Chain integrity verified</span>
        <span className="font-mono">Export CSV · PDF</span>
      </div>
    </div>
  );
}
