"use client";

import { motion } from "motion/react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  MapPin,
  Radio,
  Route,
  Search,
  Send,
  ShieldCheck,
  Signal,
  Smartphone,
  Star,
  User,
} from "lucide-react";

import { StatusPill } from "@/components/landing/product-preview-primitives";
import { cn } from "@/lib/utils";

type SurfaceType = "field-report" | "district-console" | "patient-reroute" | "audit-ledger";

export function ProductSurfaceCard({
  type,
  title,
  description,
}: {
  type: SurfaceType;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg hover:shadow-black/[0.06] dark:border-border dark:bg-card"
    >
      {/* Preview area — 70% of card */}
      <div className="relative min-h-[280px] overflow-hidden bg-neutral-50 dark:bg-muted">
        {type === "field-report" && <FieldReportCard />}
        {type === "district-console" && <DistrictConsoleCard />}
        {type === "patient-reroute" && <PatientRerouteCard />}
        {type === "audit-ledger" && <AuditLedgerCard />}
      </div>

      {/* Text area — minimal */}
      <div className="px-5 py-4">
        <h3 className="text-[15px] font-semibold text-neutral-950 dark:text-card-foreground">
          {title}
        </h3>
        <p className="mt-1 text-[13px] leading-relaxed text-neutral-500 dark:text-muted-foreground">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Field Report Card ─── */
function FieldReportCard() {
  const fields = [
    { label: "Clinic", value: "Mabopane Station", icon: MapPin },
    { label: "Service", value: "Pharmacy", icon: Database },
    { label: "Status", value: "Non-functional", icon: AlertTriangle, status: "critical" as const },
    { label: "Staff visible", value: "0 of 4", icon: User },
    { label: "Notes", value: "Generator failure. Patients turned away.", icon: null },
  ];

  return (
    <div className="flex h-full flex-col p-4">
      {/* Phone frame */}
      <div className="mx-auto w-full max-w-[220px] flex-1">
        <div className="overflow-hidden rounded-[20px] border border-neutral-300 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          {/* Phone status bar */}
          <div className="flex items-center justify-between bg-neutral-100 px-4 py-1.5 dark:bg-neutral-800">
            <span className="text-[9px] font-semibold text-neutral-600 dark:text-neutral-400">9:41</span>
            <div className="flex items-center gap-1">
              <Signal className="size-2.5 text-neutral-400" />
              <span className="text-[8px] text-neutral-400">offline</span>
            </div>
          </div>

          {/* App header */}
          <div className="border-b border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-900 dark:text-white">New field report</span>
              <StatusPill tone="warning">offline</StatusPill>
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-0 bg-white p-2 dark:bg-neutral-900">
            {fields.map((field) => (
              <div key={field.label} className="flex items-center justify-between border-b border-neutral-100 px-2 py-1.5 last:border-b-0 dark:border-neutral-800">
                <div className="flex items-center gap-1.5">
                  {field.icon && <field.icon className="size-2.5 text-neutral-400" />}
                  <span className="text-[9px] text-neutral-500 dark:text-neutral-400">{field.label}</span>
                </div>
                {field.status ? (
                  <span className="text-[9px] font-medium text-red-600 dark:text-red-400">{field.value}</span>
                ) : (
                  <span className="text-[9px] font-medium text-neutral-800 dark:text-neutral-200">{field.value}</span>
                )}
              </div>
            ))}
          </div>

          {/* Submit button */}
          <div className="bg-white px-3 py-2 dark:bg-neutral-900">
            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 dark:bg-white">
              <Send className="size-2.5 text-white dark:text-neutral-900" />
              <span className="text-[9px] font-semibold text-white dark:text-neutral-900">Submit report</span>
            </div>
          </div>

          {/* Queue status */}
          <div className="border-t border-neutral-200 bg-neutral-50 px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-[8px] text-neutral-500 dark:text-neutral-400">3 reports queued</span>
              <span className="text-[8px] text-amber-600 dark:text-amber-400">Syncing...</span>
            </div>
            <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
              <div className="h-full w-[65%] rounded-full bg-amber-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── District Console Card ─── */
function DistrictConsoleCard() {
  const clinics = [
    { name: "Mabopane Station", status: "Non-functional", tone: "critical", staff: "—", patients: "83 skipped", updated: "2 min ago" },
    { name: "Soshanguve Block F", status: "Degraded", tone: "warning", staff: "2 of 5", patients: "31 redirected", updated: "7 min ago" },
    { name: "Akasia Hills", status: "Operational", tone: "healthy", staff: "4 of 4", patients: "12 received", updated: "Now" },
    { name: "Wonderpark Medical", status: "Operational", tone: "healthy", staff: "6 of 6", patients: "—", updated: "Now" },
  ];

  const toneDot = {
    critical: "bg-red-500",
    warning: "bg-amber-500",
    healthy: "bg-emerald-500",
  };

  return (
    <div className="flex h-full flex-col">
      {/* Console header */}
      <div className="flex items-center justify-between border-b border-neutral-200/60 px-4 py-2.5 dark:border-border">
        <div className="flex items-center gap-2">
          <Radio className="size-3.5 text-primary" />
          <span className="text-[11px] font-semibold text-neutral-900 dark:text-white">District console</span>
        </div>
        <StatusPill tone="healthy">live</StatusPill>
      </div>

      {/* Clinic table */}
      <div className="flex-1 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-neutral-200/60 bg-neutral-50 px-4 py-1.5 text-[8px] font-semibold uppercase tracking-wider text-neutral-500 dark:border-border dark:bg-neutral-800 dark:text-neutral-400">
          <span>Clinic</span>
          <span>Staff</span>
          <span>Patients</span>
          <span>Updated</span>
        </div>

        {/* Table rows */}
        {clinics.map((clinic, i) => (
          <div
            key={clinic.name}
            className={cn(
              "grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-neutral-100 px-4 py-2.5 transition-colors last:border-b-0 dark:border-neutral-800",
              i === 0 ? "bg-red-50/50 dark:bg-red-950/20" : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
            )}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={cn("size-1.5 rounded-full", toneDot[clinic.tone as keyof typeof toneDot])} />
                <span className="truncate text-[10px] font-medium text-neutral-900 dark:text-white">{clinic.name}</span>
              </div>
            </div>
            <span className="text-[9px] tabular-nums text-neutral-600 dark:text-neutral-400">{clinic.staff}</span>
            <span className="text-[9px] tabular-nums text-neutral-600 dark:text-neutral-400">{clinic.patients}</span>
            <span className="text-[9px] tabular-nums text-neutral-400 dark:text-neutral-500">{clinic.updated}</span>
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-neutral-200/60 px-4 py-1.5 text-[8px] text-neutral-400 dark:border-border dark:text-neutral-500">
        <span>42 clinics monitored</span>
        <span>Sync: OK</span>
      </div>
    </div>
  );
}

/* ─── Patient Reroute Card ─── */
function PatientRerouteCard() {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex-1 rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-border dark:bg-neutral-900">
        {/* Search bar */}
        <div className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2 dark:border-neutral-700">
          <Search className="size-3 text-neutral-400" />
          <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Mabopane pharmacy pickup</span>
        </div>

        {/* Map area */}
        <div className="relative h-32 bg-neutral-100 dark:bg-neutral-800">
          {/* Simplified map with route */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 100">
            {/* Road grid */}
            <line x1="20" y1="30" x2="180" y2="30" stroke="#e5e7eb" strokeWidth="0.5" />
            <line x1="20" y1="60" x2="180" y2="60" stroke="#e5e7eb" strokeWidth="0.5" />
            <line x1="60" y1="10" x2="60" y2="90" stroke="#e5e7eb" strokeWidth="0.5" />
            <line x1="120" y1="10" x2="120" y2="90" stroke="#e5e7eb" strokeWidth="0.5" />

            {/* Route line */}
            <path d="M 70 55 Q 85 40, 100 35 Q 115 30, 130 25" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4 3" />

            {/* Origin pin (red - unavailable) */}
            <circle cx="70" cy="55" r="4" fill="#EF4444" />
            <circle cx="70" cy="55" r="6" fill="#EF4444" opacity="0.2" />

            {/* Destination pin (green - available) */}
            <circle cx="130" cy="25" r="4" fill="#10B981" />
            <circle cx="130" cy="25" r="6" fill="#10B981" opacity="0.2" />

            {/* Distance label */}
            <rect x="88" y="32" width="24" height="10" rx="3" fill="white" stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="100" y="39" textAnchor="middle" fill="#6b7280" fontSize="5" fontWeight="500">3.1 km</text>
          </svg>

          {/* Map overlay labels */}
          <div className="absolute bottom-2 left-2 rounded bg-red-50 px-1.5 py-0.5 text-[7px] font-medium text-red-700">
            Mabopane Station — Closed
          </div>
          <div className="absolute right-2 top-2 rounded bg-emerald-50 px-1.5 py-0.5 text-[7px] font-medium text-emerald-700">
            Akasia Hills — Open
          </div>
        </div>

        {/* Reroute details */}
        <div className="space-y-0 p-3">
          <div className="flex items-center justify-between border-b border-neutral-100 py-1.5 dark:border-neutral-800">
            <span className="text-[9px] text-neutral-500 dark:text-neutral-400">Best alternative</span>
            <span className="text-[9px] font-medium text-neutral-800 dark:text-neutral-200">Akasia Hills Clinic</span>
          </div>
          <div className="flex items-center justify-between border-b border-neutral-100 py-1.5 dark:border-neutral-800">
            <span className="text-[9px] text-neutral-500 dark:text-neutral-400">Services available</span>
            <span className="text-[9px] font-medium text-neutral-800 dark:text-neutral-200">Pharmacy, Chronic care</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-[9px] text-neutral-500 dark:text-neutral-400">Trip time saved</span>
            <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">18 min avg</span>
          </div>
        </div>

        {/* Action button */}
        <div className="px-3 pb-3">
          <div className="flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 dark:bg-white">
            <Route className="size-2.5 text-white dark:text-neutral-900" />
            <span className="text-[9px] font-semibold text-white dark:text-neutral-900">Open route</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Audit Ledger Card ─── */
function AuditLedgerCard() {
  const entries = [
    { time: "07:12", actor: "S. Ndaba", action: "submitted field report", type: "field", icon: Radio },
    { time: "07:14", actor: "System", action: "changed status to non-functional", type: "system", icon: AlertTriangle },
    { time: "07:15", actor: "System", action: "triggered patient reroute", type: "system", icon: Route },
    { time: "07:16", actor: "System", action: "sealed audit record", type: "system", icon: ShieldCheck },
    { time: "08:01", actor: "T. Mkhize", action: "added follow-up note", type: "field", icon: Star },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200/60 px-4 py-2.5 dark:border-border">
        <div className="flex items-center gap-2">
          <Database className="size-3.5 text-primary" />
          <span className="text-[11px] font-semibold text-neutral-900 dark:text-white">Audit trail</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[8px] text-neutral-400 dark:text-neutral-500">AUD-OPS-MAB-001</span>
          <StatusPill tone="neutral">recording</StatusPill>
        </div>
      </div>

      {/* Audit entries */}
      <div className="flex-1 overflow-hidden">
        {entries.map((entry, i) => {
          const Icon = entry.icon;
          return (
            <div
              key={i}
              className="flex items-start gap-3 border-b border-neutral-100 px-4 py-2.5 last:border-b-0 dark:border-neutral-800"
            >
              {/* Timestamp */}
              <span className="w-8 shrink-0 font-mono text-[9px] tabular-nums text-neutral-400 dark:text-neutral-500">
                {entry.time}
              </span>

              {/* Icon */}
              <div className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full",
                entry.type === "field" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-neutral-100 dark:bg-neutral-800",
              )}>
                <Icon className={cn(
                  "size-2.5",
                  entry.type === "field" ? "text-blue-600 dark:text-blue-400" : "text-neutral-500 dark:text-neutral-400",
                )} />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-1">
                  <span className="text-[10px] font-medium text-neutral-900 dark:text-white">{entry.actor}</span>
                  <span className="text-[9px] text-neutral-500 dark:text-neutral-400">{entry.action}</span>
                </div>
              </div>

              {/* Verified indicator */}
              {i === entries.length - 1 && (
                <CheckCircle2 className="size-3 shrink-0 text-emerald-500" />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-neutral-200/60 px-4 py-1.5 text-[8px] text-neutral-400 dark:border-border dark:text-neutral-500">
        <span>Immutable record</span>
        <span>5 events · 48 min</span>
      </div>
    </div>
  );
}
