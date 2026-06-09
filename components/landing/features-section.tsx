"use client";

import { motion } from "motion/react";
import {
  Activity,
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
    <section className="relative border-t border-neutral-200 bg-white" id="features">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#0D7A6B]">
            Infrastructure
          </span>
          <h2 className="mt-6 font-display text-3xl font-medium leading-[1.15] tracking-tight text-neutral-900 sm:text-4xl" style={{ textWrap: "balance" }}>
            Built to operate under pressure
          </h2>
          <p className="mt-4 text-base text-neutral-500">
            Intermittent connectivity. High load. Life-critical decisions. ClinicPulse is built for the realities of South African healthcare — not a San Francisco server room.
          </p>
        </div>

        {/* Bento grid */}
        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-6 md:grid-rows-[auto_auto_auto]">
          {/* Row 1: API (wide) + Offline (narrow) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="md:col-span-4 overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm dark:border-border dark:bg-card"
          >
            <RealtimeCard />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.06 }}
            className="md:col-span-2 overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm dark:border-border dark:bg-card"
          >
            <OfflineCard />
          </motion.div>

          {/* Row 2: Prediction (tall left) + Reroute (wide right) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.12 }}
            className="md:col-span-3 md:row-span-2 overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm dark:border-border dark:bg-card"
          >
            <PredictCard />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.18 }}
            className="md:col-span-3 overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm dark:border-border dark:bg-card"
          >
            <RerouteCard />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.24 }}
            className="md:col-span-3 overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm dark:border-border dark:bg-card"
          >
            <AuditCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Real-time API (wide) ─── */
function RealtimeCard() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-neutral-200/60 px-5 py-3 dark:border-border">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-neutral-950 dark:text-card-foreground">Real-time, at any scale</span>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-3" />
          47ms avg response
        </span>
      </div>
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Terminal */}
        <div className="flex-1 font-mono text-[10px] border-r border-neutral-200/60 dark:border-border">
          <div className="flex items-center gap-2 bg-neutral-100 px-4 py-2 dark:bg-neutral-800">
            <div className="flex gap-1.5">
              <span className="size-2 rounded-full bg-red-400" />
              <span className="size-2 rounded-full bg-amber-400" />
              <span className="size-2 rounded-full bg-emerald-400" />
            </div>
            <span className="text-[9px] text-neutral-500">Terminal</span>
          </div>
          <div className="bg-white p-4 dark:bg-neutral-900">
            <div className="text-neutral-400">$ curl -H "Authorization: Bearer cp_live_..." \</div>
            <div className="text-neutral-400">  https://api.clinicpulse.co/v1/clinics/mp-001</div>
            <div className="mt-2 text-neutral-400">{"{"}</div>
            <div className="pl-3"><span className="text-amber-600 dark:text-amber-400">"id"</span>: <span className="text-emerald-600 dark:text-emerald-400">"mp-001"</span>,</div>
            <div className="pl-3"><span className="text-amber-600 dark:text-amber-400">"name"</span>: <span className="text-emerald-600 dark:text-emerald-400">"Mabopane Station"</span>,</div>
            <div className="pl-3"><span className="text-amber-600 dark:text-amber-400">"status"</span>: <span className="text-emerald-600 dark:text-emerald-400">"non-functional"</span>,</div>
            <div className="pl-3"><span className="text-amber-600 dark:text-amber-400">"services"</span>: {"{"}</div>
            <div className="pl-6"><span className="text-amber-600 dark:text-amber-400">"pharmacy"</span>: <span className="text-red-600 dark:text-red-400">"closed"</span>,</div>
            <div className="pl-6"><span className="text-amber-600 dark:text-amber-400">"chronic_care"</span>: <span className="text-amber-600 dark:text-amber-400">"paused"</span>,</div>
            <div className="pl-6"><span className="text-amber-600 dark:text-amber-400">"acute_care"</span>: <span className="text-emerald-600 dark:text-emerald-400">"operational"</span></div>
            <div className="pl-3">{"}"},</div>
            <div className="pl-3"><span className="text-amber-600 dark:text-amber-400">"staff"</span>: <span className="text-purple-600 dark:text-purple-400">0</span>,</div>
            <div className="pl-3"><span className="text-amber-600 dark:text-amber-400">"updated_at"</span>: <span className="text-emerald-600 dark:text-emerald-400">"2026-06-09T07:14:02Z"</span></div>
            <div>{"}"}</div>
          </div>
        </div>
        {/* Stats sidebar */}
        <div className="w-full lg:w-48 border-t lg:border-t-0 border-neutral-200/60 bg-neutral-50 p-4 dark:border-border dark:bg-muted">
          <p className="text-[9px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Performance</p>
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-2xl font-bold tabular-nums text-neutral-950 dark:text-card-foreground">3,500+</p>
              <p className="text-[10px] text-neutral-500">Clinics monitored</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-neutral-950 dark:text-card-foreground">47ms</p>
              <p className="text-[10px] text-neutral-500">Avg response time</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-neutral-950 dark:text-card-foreground">52</p>
              <p className="text-[10px] text-neutral-500">Districts live</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Offline Sync (narrow tall) ─── */
function OfflineCard() {
  const queue = [
    { clinic: "Mabopane Station", status: "Pharmacy closed", time: "07:12", size: "2.1 KB" },
    { clinic: "Soshanguve Block F", status: "Staff shortage", time: "07:08", size: "1.8 KB" },
    { clinic: "Akasia Hills", status: "Stock update", time: "06:55", size: "1.2 KB" },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-neutral-200/60 px-5 py-3 dark:border-border">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-neutral-950 dark:text-card-foreground">Works offline</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400">
          <WifiOff className="size-3" />
          3 queued
        </div>
      </div>
      <div className="flex-1 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[9px] font-medium uppercase tracking-wider text-neutral-500">Local queue</span>
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[8px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">5.1 KB</span>
        </div>
        <div className="space-y-1.5">
          {queue.map((item, i) => (
            <div key={i} className="rounded-lg border border-neutral-200 bg-white px-3 py-2 dark:border-border dark:bg-card">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-neutral-800 dark:text-neutral-200">{item.clinic}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[8px] text-neutral-400">
                <span>{item.status}</span>
                <span>·</span>
                <span>{item.time}</span>
                <span>·</span>
                <span>{item.size}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-3 text-center dark:border-neutral-600 dark:bg-neutral-800">
          <p className="text-[9px] text-neutral-500">Auto-sync on reconnect</p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
            <div className="h-full w-[20%] rounded-full bg-amber-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Prediction (tall left) ─── */
function PredictCard() {
  const clinics = [
    { name: "Diepsloot CHC", risk: 87, patients: 120, staff: 2 },
    { name: "Mabopane Station", risk: 95, patients: 83, staff: 0 },
    { name: "Soshanguve Block F", risk: 62, patients: 45, staff: 3 },
    { name: "Akasia Hills", risk: 18, patients: 20, staff: 4 },
    { name: "Wonderpark Medical", risk: 12, patients: 15, staff: 6 },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-neutral-200/60 px-5 py-3 dark:border-border">
        <span className="text-[13px] font-semibold text-neutral-950 dark:text-card-foreground">Predict before the queue</span>
        <span className="text-[9px] text-neutral-400">14:00 forecast</span>
      </div>
      <div className="flex-1 p-4">
        {/* Mini bar chart */}
        <div className="mb-4 flex items-end gap-1">
          {[
            { h: "30%", label: "06" },
            { h: "45%", label: "08" },
            { h: "72%", label: "10" },
            { h: "85%", label: "12" },
            { h: "95%", label: "14" },
            { h: "78%", label: "16" },
            { h: "40%", label: "18" },
          ].map((bar, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full overflow-hidden rounded-t-sm bg-neutral-100 dark:bg-neutral-800" style={{ height: "50px" }}>
                <div
                  className={cn("w-full rounded-t-sm", i === 4 ? "bg-red-400" : i === 3 ? "bg-amber-400" : "bg-emerald-400")}
                  style={{ height: bar.h, marginTop: "auto" }}
                />
              </div>
              <span className="text-[6px] text-neutral-400">{bar.label}</span>
            </div>
          ))}
        </div>

        {/* Risk list */}
        <div className="space-y-1.5">
          {clinics.map((clinic) => (
            <div key={clinic.name} className="flex items-center gap-2 rounded border border-neutral-100 px-2.5 py-2 dark:border-neutral-800">
              <span className="min-w-0 flex-1 truncate text-[10px] text-neutral-700 dark:text-neutral-300">{clinic.name}</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-14 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                  <div
                    className={cn("h-full rounded-full", clinic.risk >= 80 ? "bg-red-400" : clinic.risk >= 50 ? "bg-amber-400" : "bg-emerald-400")}
                    style={{ width: `${clinic.risk}%` }}
                  />
                </div>
                <span className={cn(
                  "w-7 text-right text-[9px] font-semibold tabular-nums",
                  clinic.risk >= 80 ? "text-red-600 dark:text-red-400" : clinic.risk >= 50 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400",
                )}>
                  {clinic.risk}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-neutral-200/60 px-4 py-2 text-[8px] text-neutral-400 dark:border-border">
        Model: 30-day rolling average + staff/stock signals
      </div>
    </div>
  );
}

/* ─── Reroute (wide) ─── */
function RerouteCard() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-neutral-200/60 px-5 py-3 dark:border-border">
        <span className="text-[13px] font-semibold text-neutral-950 dark:text-card-foreground">Automatic rerouting</span>
        <span className="flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-3" />
          Active
        </span>
      </div>
      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="flex-1 p-4">
          {/* Active reroute */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2">
              <Route className="size-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-200">Patient rerouted</p>
                <p className="text-[9px] text-emerald-600 dark:text-emerald-400">18 min trip saved</p>
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-[9px]">
                <span className="text-neutral-500">From:</span>
                <span className="font-medium text-red-600 dark:text-red-400">Mabopane Station (non-functional)</span>
              </div>
              <div className="flex items-center gap-2 text-[9px]">
                <span className="text-neutral-500">To:</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Akasia Hills (operational)</span>
              </div>
              <div className="flex items-center gap-2 text-[9px]">
                <span className="text-neutral-500">Distance:</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">3.1 km · 8 min drive</span>
              </div>
            </div>
          </div>
        </div>
        {/* Alternatives */}
        <div className="w-full lg:w-56 border-t lg:border-t-0 lg:border-l border-neutral-200/60 bg-neutral-50 p-4 dark:border-border dark:bg-muted">
          <p className="text-[9px] font-medium uppercase tracking-wider text-neutral-500">Nearest alternatives</p>
          <div className="mt-2 space-y-1.5">
            {[
              { name: "Akasia Hills", dist: "3.1 km", cap: 60 },
              { name: "Wonderpark", dist: "4.8 km", cap: 85 },
              { name: "Claudina", dist: "6.2 km", cap: 90 },
            ].map((c) => (
              <div key={c.name} className="flex items-center gap-2 text-[9px]">
                <MapPin className="size-2.5 text-neutral-400" />
                <span className="flex-1 text-neutral-700 dark:text-neutral-300">{c.name}</span>
                <span className="text-neutral-400">{c.dist}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Audit (wide) ─── */
function AuditCard() {
  const entries = [
    { time: "07:16:00", hash: "a3f8c2d1", action: "Audit record sealed", actor: "System", icon: Shield, color: "text-emerald-500" },
    { time: "07:15:11", hash: "7b2e9f4a", action: "Patient reroute triggered", actor: "System", icon: Route, color: "text-emerald-500" },
    { time: "07:14:02", hash: "9a6f3e2c", action: "Status changed to non-functional", actor: "System", icon: AlertTriangle, color: "text-red-500" },
    { time: "07:12:34", hash: "2e7f4b6d", action: "Offline field report submitted", actor: "S. Ndaba", icon: Send, color: "text-blue-500" },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-neutral-200/60 px-5 py-3 dark:border-border">
        <span className="text-[13px] font-semibold text-neutral-950 dark:text-card-foreground">Immutable audit trail</span>
        <div className="flex items-center gap-1.5">
          <Shield className="size-3 text-emerald-500" />
          <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">SHA-256 verified</span>
        </div>
      </div>
      <div className="flex-1 p-4">
        <div className="space-y-0 rounded-lg border border-neutral-200 dark:border-border">
          {entries.map((entry, i) => {
            const Icon = entry.icon;
            return (
              <div key={i} className={cn("flex items-center gap-3 px-3 py-2.5", i < entries.length - 1 && "border-b border-neutral-100 dark:border-neutral-800")}>
                <span className="w-12 shrink-0 font-mono text-[9px] tabular-nums text-neutral-400">{entry.time}</span>
                <div className={cn("flex size-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800")}>
                  <Icon className={cn("size-2.5", entry.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-medium text-neutral-800 dark:text-neutral-200">{entry.action}</span>
                  <div className="flex items-center gap-1.5 text-[7px] text-neutral-400">
                    <span>{entry.actor}</span>
                    <span>·</span>
                    <span className="font-mono">SHA:{entry.hash}</span>
                  </div>
                </div>
                {i === 0 && <CheckCircle2 className="size-3 shrink-0 text-emerald-500" />}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-neutral-200/60 px-4 py-2 text-[8px] text-neutral-400 dark:border-border">
        <span>4 events · Chain integrity: verified</span>
        <span className="font-mono">Export CSV · PDF</span>
      </div>
    </div>
  );
}
