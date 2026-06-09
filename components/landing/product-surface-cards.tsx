"use client";

import { motion } from "motion/react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Radio,
  Route,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Star,
  User,
  Webhook,
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
      {/* Preview area */}
      <div className="relative min-h-[320px] overflow-hidden bg-neutral-50 dark:bg-muted">
        {type === "field-report" && <FieldReportCard />}
        {type === "district-console" && <DistrictConsoleCard />}
        {type === "patient-reroute" && <PatientRerouteCard />}
        {type === "audit-ledger" && <AuditLedgerCard />}
      </div>

      {/* Text area */}
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
  return (
    <div className="flex h-full flex-col bg-white dark:bg-neutral-900">
      {/* App top bar */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
            <Smartphone className="size-3 text-neutral-500" />
            <span className="text-[10px] font-medium text-neutral-700 dark:text-neutral-300">Field Report</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[9px] text-amber-600 dark:text-amber-400">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-amber-500" />
            </span>
            offline · 3 queued
          </div>
        </div>
      </div>

      {/* Form content */}
      <div className="flex-1 overflow-hidden p-3">
        <div className="space-y-2.5">
          {/* Clinic field */}
          <div>
            <label className="mb-1 block text-[9px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Clinic</label>
            <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
              <MapPin className="size-3 text-neutral-400" />
              <span className="text-[11px] text-neutral-900 dark:text-white">Mabopane Station Clinic</span>
            </div>
          </div>

          {/* Service + Status row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[9px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Service</label>
              <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
                <Database className="size-3 text-neutral-400" />
                <span className="text-[11px] text-neutral-900 dark:text-white">Pharmacy</span>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[9px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Status</label>
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900/60 dark:bg-red-950/30">
                <AlertTriangle className="size-3 text-red-500" />
                <span className="text-[11px] font-medium text-red-700 dark:text-red-300">Non-functional</span>
              </div>
            </div>
          </div>

          {/* Staff count */}
          <div>
            <label className="mb-1 block text-[9px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Staff visible</label>
            <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
              <User className="size-3 text-neutral-400" />
              <span className="text-[11px] text-neutral-900 dark:text-white">0 of 4</span>
            </div>
          </div>

          {/* Notes — active field with cursor */}
          <div>
            <label className="mb-1 block text-[9px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Notes</label>
            <div className="rounded-lg border border-primary/30 bg-white px-3 py-2 ring-1 ring-primary/20 dark:border-primary/40 dark:bg-neutral-800 dark:ring-primary/30">
              <span className="text-[11px] text-neutral-900 dark:text-white">Generator failure. Patients turned away. </span>
              <span className="inline-block h-3.5 w-px animate-pulse bg-primary align-middle" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action + sync bar */}
      <div className="border-t border-neutral-200 p-3 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-neutral-900 py-2 dark:bg-white">
            <Send className="size-3 text-white dark:text-neutral-900" />
            <span className="text-[10px] font-semibold text-white dark:text-neutral-900">Submit report</span>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-[8px] text-neutral-400 dark:text-neutral-500">
          <span>Saving to local storage...</span>
          <span className="font-mono">3 reports · 12 KB queued</span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
          <div className="h-full w-[45%] rounded-full bg-amber-400 transition-all" />
        </div>
      </div>
    </div>
  );
}

/* ─── District Console Card ─── */
function DistrictConsoleCard() {
  const clinics = [
    { name: "Mabopane Station", div: "Tshwane North", status: "Non-functional", tone: "critical", staff: "0 / 4", capacity: 0, patients: "83 skipped", updated: "2 min ago", freshness: 2 },
    { name: "Soshanguve Block F", div: "Tshwane North", status: "Degraded", tone: "warning", staff: "2 / 5", capacity: 40, patients: "31 redirected", updated: "7 min ago", freshness: 7 },
    { name: "Akasia Hills Clinic", div: "Tshwane West", status: "Operational", tone: "healthy", staff: "4 / 4", capacity: 100, patients: "12 received", updated: "Now", freshness: 0 },
    { name: "Wonderpark Medical", div: "Tshwane East", status: "Operational", tone: "healthy", staff: "6 / 6", capacity: 100, patients: "—", updated: "Now", freshness: 0 },
    { name: "Claudina Private", div: "Tshwane West", status: "Operational", tone: "healthy", staff: "8 / 8", capacity: 100, patients: "5 received", updated: "1 min ago", freshness: 1 },
    { name: "Churchill Clinic", div: "Tshwane East", status: "Operational", tone: "healthy", staff: "3 / 4", capacity: 75, patients: "—", updated: "3 min ago", freshness: 3 },
  ];

  const toneDot = { critical: "bg-red-500", warning: "bg-amber-500", healthy: "bg-emerald-500" };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-neutral-900">
      {/* Console header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2.5 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <Radio className="size-3.5 text-emerald-600" />
          <span className="text-[11px] font-semibold text-neutral-900 dark:text-white">District console</span>
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[8px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">LIVE</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-neutral-400">42 clinics</span>
          <div className="flex items-center gap-1 rounded border border-neutral-200 px-1.5 py-0.5 dark:border-neutral-700">
            <Search className="size-2.5 text-neutral-400" />
            <span className="text-[8px] text-neutral-400">Search</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1.2fr_0.6fr_0.5fr_0.5fr_0.5fr_0.5fr] gap-2 border-b border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[7px] font-semibold uppercase tracking-wider text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
          <span>Clinic</span>
          <span>Division</span>
          <span>Staff</span>
          <span>Capacity</span>
          <span>Patients</span>
          <span className="text-right">Updated</span>
        </div>

        {/* Rows */}
        {clinics.map((clinic, i) => (
          <div
            key={clinic.name}
            className={cn(
              "grid grid-cols-[1.2fr_0.6fr_0.5fr_0.5fr_0.5fr_0.5fr] gap-2 border-b border-neutral-100 px-3 py-2 transition-colors last:border-b-0 dark:border-neutral-800",
              i === 0 ? "bg-red-50/50 dark:bg-red-950/20" : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
            )}
          >
            <div className="flex items-center gap-1.5">
              <span className={cn("size-1.5 rounded-full", toneDot[clinic.tone as keyof typeof toneDot])} />
              <span className="truncate text-[9px] font-medium text-neutral-900 dark:text-white">{clinic.name}</span>
            </div>
            <span className="text-[8px] text-neutral-500 dark:text-neutral-400">{clinic.div}</span>
            <span className="text-[8px] tabular-nums text-neutral-600 dark:text-neutral-400">{clinic.staff}</span>
            <div className="flex items-center gap-1">
              <div className="h-1 w-8 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div
                  className={cn(
                    "h-full rounded-full",
                    clinic.capacity === 0 ? "bg-red-400" : clinic.capacity < 50 ? "bg-amber-400" : "bg-emerald-400",
                  )}
                  style={{ width: `${clinic.capacity}%` }}
                />
              </div>
              <span className="text-[7px] tabular-nums text-neutral-400">{clinic.capacity}%</span>
            </div>
            <span className="text-[8px] tabular-nums text-neutral-600 dark:text-neutral-400">{clinic.patients}</span>
            <span className="text-right text-[8px] tabular-nums text-neutral-400 dark:text-neutral-500">{clinic.updated}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-neutral-200 px-3 py-1.5 text-[7px] text-neutral-400 dark:border-neutral-700 dark:text-neutral-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="size-1 rounded-full bg-emerald-500" /> 38 operational</span>
          <span className="flex items-center gap-1"><span className="size-1 rounded-full bg-amber-500" /> 1 degraded</span>
          <span className="flex items-center gap-1"><span className="size-1 rounded-full bg-red-500" /> 1 non-functional</span>
        </div>
        <span className="font-mono">Sync: 42/42 · 12s ago</span>
      </div>
    </div>
  );
}

/* ─── Patient Reroute Card ─── */
function PatientRerouteCard() {
  return (
    <div className="flex h-full flex-col bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2.5 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <Globe className="size-3.5 text-blue-600" />
          <span className="text-[11px] font-semibold text-neutral-900 dark:text-white">Public clinic finder</span>
        </div>
        <StatusPill tone="healthy">live</StatusPill>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-2 dark:border-neutral-700">
        <Search className="size-3 text-neutral-400" />
        <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Mabopane pharmacy pickup</span>
        <span className="ml-auto text-[8px] text-neutral-400">Clear</span>
      </div>

      {/* Map */}
      <div className="relative h-36 bg-[#e8f0e8] dark:bg-neutral-800">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 140" preserveAspectRatio="xMidYMid slice">
          {/* Background roads */}
          <defs>
            <pattern id="roads" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 0 20 L 40 20 M 20 0 L 20 40" fill="none" stroke="#c8d8c8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="300" height="140" fill="url(#roads)" />

          {/* Major roads */}
          <path d="M 0 70 L 300 70" stroke="#b8c8b8" strokeWidth="2" />
          <path d="M 150 0 L 150 140" stroke="#b8c8b8" strokeWidth="2" />
          <path d="M 0 35 L 300 35" stroke="#c8d8c8" strokeWidth="1" />
          <path d="M 0 105 L 300 105" stroke="#c8d8c8" strokeWidth="1" />
          <path d="M 75 0 L 75 140" stroke="#c8d8c8" strokeWidth="1" />
          <path d="M 225 0 L 225 140" stroke="#c8d8c8" strokeWidth="1" />

          {/* Route path (animated dashed) */}
          <path
            d="M 100 85 Q 120 65, 140 55 Q 160 45, 185 40"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity="0.8"
          >
            <animate attributeName="stroke-dashoffset" values="0;-20" dur="1.5s" repeatCount="indefinite" />
          </path>

          {/* Origin pin (red - closed clinic) */}
          <g transform="translate(100, 85)">
            <circle r="12" fill="#EF4444" opacity="0.12">
              <animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r="5" fill="#EF4444" stroke="white" strokeWidth="1.5" />
            <text y="20" textAnchor="middle" fill="#991B1B" fontSize="7" fontWeight="600">Mabopane Station</text>
            <text y="28" textAnchor="middle" fill="#991B1B" fontSize="5">Closed</text>
          </g>

          {/* Destination pin (green - open clinic) */}
          <g transform="translate(185, 40)">
            <circle r="12" fill="#10B981" opacity="0.12">
              <animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r="5" fill="#10B981" stroke="white" strokeWidth="1.5" />
            <text y="20" textAnchor="middle" fill="#065F46" fontSize="7" fontWeight="600">Akasia Hills</text>
            <text y="28" textAnchor="middle" fill="#065F46" fontSize="5">Open · 3.1 km</text>
          </g>

          {/* Distance badge */}
          <rect x="120" y="48" width="30" height="12" rx="4" fill="white" stroke="#e5e7eb" strokeWidth="0.5" />
          <text x="135" y="56" textAnchor="middle" fill="#374151" fontSize="6" fontWeight="600">3.1 km</text>

          {/* Area labels */}
          <text x="50" y="20" fill="#94a3b8" fontSize="6" fontWeight="500" letterSpacing="0.1em">SOSHANGUVE</text>
          <text x="200" y="120" fill="#94a3b8" fontSize="6" fontWeight="500" letterSpacing="0.1em">AKASIA</text>
        </svg>
      </div>

      {/* Reroute details */}
      <div className="flex-1 overflow-hidden p-3">
        <div className="space-y-0 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
            <span className="text-[9px] text-neutral-500 dark:text-neutral-400">Best alternative</span>
            <span className="text-[9px] font-medium text-neutral-800 dark:text-neutral-200">Akasia Hills Clinic</span>
          </div>
          <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
            <span className="text-[9px] text-neutral-500 dark:text-neutral-400">Services</span>
            <span className="text-[9px] font-medium text-neutral-800 dark:text-neutral-200">Pharmacy, Chronic care</span>
          </div>
          <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
            <span className="text-[9px] text-neutral-500 dark:text-neutral-400">Capacity</span>
            <div className="flex items-center gap-1.5">
              <div className="h-1 w-12 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div className="h-full w-[60%] rounded-full bg-emerald-400" />
              </div>
              <span className="text-[8px] tabular-nums text-neutral-500">60%</span>
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[9px] text-neutral-500 dark:text-neutral-400">Trip time saved</span>
            <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">18 min avg</span>
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="border-t border-neutral-200 p-3 dark:border-neutral-700">
        <div className="flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 py-2 dark:bg-white">
          <Route className="size-3 text-white dark:text-neutral-900" />
          <span className="text-[10px] font-semibold text-white dark:text-neutral-900">Open in maps</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Audit Ledger Card ─── */
function AuditLedgerCard() {
  const entries = [
    { time: "07:12:34", actor: "Sipho Ndaba", initials: "SN", role: "Field officer", action: "submitted offline field report", source: "Mobile app", sourceIcon: Smartphone, color: "blue" },
    { time: "07:12:36", actor: "System", initials: "SY", role: "Automated", action: "synced report from local queue", source: "Sync engine", sourceIcon: Webhook, color: "neutral" },
    { time: "07:14:02", actor: "System", initials: "SY", role: "Automated", action: "changed status to non-functional", source: "District console", sourceIcon: Radio, color: "red" },
    { time: "07:14:03", actor: "System", initials: "SY", role: "Automated", action: "updated service availability", source: "District console", sourceIcon: Radio, color: "red" },
    { time: "07:15:11", actor: "System", initials: "SY", role: "Automated", action: "triggered patient reroute", source: "Routing engine", sourceIcon: Route, color: "green" },
    { time: "07:16:00", actor: "System", initials: "SY", role: "Automated", action: "sealed audit record", source: "Audit ledger", sourceIcon: ShieldCheck, color: "neutral" },
    { time: "08:01:15", actor: "Thandi Mkhize", initials: "TM", role: "District manager", action: "added follow-up note", source: "Web console", sourceIcon: Globe, color: "blue" },
  ];

  const colorMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400" },
    red: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400" },
    green: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400" },
    neutral: { bg: "bg-neutral-100 dark:bg-neutral-800", text: "text-neutral-500 dark:text-neutral-400" },
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2.5 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <Database className="size-3.5 text-primary" />
          <span className="text-[11px] font-semibold text-neutral-900 dark:text-white">Audit trail</span>
          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[8px] font-mono text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">AUD-OPS-MAB-001</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="size-3 text-emerald-500" />
          <span className="text-[8px] font-medium text-emerald-600 dark:text-emerald-400">Immutable</span>
        </div>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-hidden">
        {entries.map((entry, i) => {
          const SourceIcon = entry.sourceIcon;
          const colors = colorMap[entry.color];
          return (
            <div
              key={i}
              className={cn(
                "flex items-start gap-2.5 border-b border-neutral-100 px-3 py-2 transition-colors last:border-b-0 dark:border-neutral-800",
                "hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
              )}
            >
              {/* Timestamp */}
              <span className="w-12 shrink-0 pt-0.5 font-mono text-[8px] tabular-nums text-neutral-400 dark:text-neutral-500">
                {entry.time}
              </span>

              {/* Actor avatar */}
              <div className={cn("flex size-5 shrink-0 items-center justify-center rounded-full", colors.bg)}>
                {entry.actor === "System" ? (
                  <SourceIcon className={cn("size-2.5", colors.text)} />
                ) : (
                  <span className={cn("text-[7px] font-bold", colors.text)}>{entry.initials}</span>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-1">
                  <span className="text-[9px] font-medium text-neutral-900 dark:text-white">{entry.actor}</span>
                  <span className="text-[8px] text-neutral-500 dark:text-neutral-400">{entry.action}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <SourceIcon className="size-2 text-neutral-300 dark:text-neutral-600" />
                  <span className="text-[7px] text-neutral-400 dark:text-neutral-500">{entry.source}</span>
                </div>
              </div>

              {/* Verified */}
              {i === entries.length - 1 && (
                <CheckCircle2 className="size-3 shrink-0 text-emerald-500" />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-neutral-200 px-3 py-1.5 text-[7px] text-neutral-400 dark:border-neutral-700 dark:text-neutral-500">
        <span>7 events · 48 min · SHA256 verified</span>
        <span className="font-mono">Export CSV</span>
      </div>
    </div>
  );
}
