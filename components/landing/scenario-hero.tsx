"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  ClipboardList,
  DatabaseZap,
  MapPinned,
  Play,
  Radio,
  RotateCcw,
  Route,
  WifiOff,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { FreshnessBadge } from "@/components/demo/freshness-badge";
import { SeverityBadge } from "@/components/demo/severity-badge";
import { StatusBadge } from "@/components/demo/status-badge";
import { Button } from "@/components/ui/button";
import { STOCKOUT_TRIGGER_CLINIC_ID } from "@/lib/demo/clinics";
import { useDemoStore } from "@/lib/demo/demo-store";
import { demoImages } from "@/lib/demo/images";
import {
  getActiveAlerts,
  getAlternativeClinics,
  getClinicAuditEvents,
  getClinicReports,
  getClinicRows,
  getRecentReportStream,
  getStatusCounts,
} from "@/lib/demo/selectors";
import type { ClinicRow } from "@/lib/demo/types";

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

function getMapPosition(clinic: ClinicRow) {
  const positions: Record<string, { left: string; top: string }> = {
    "clinic-mamelodi-east": { left: "68%", top: "62%" },
    "clinic-soshanguve-block-f": { left: "27%", top: "35%" },
    "clinic-ga-rankuwa-zone-1": { left: "18%", top: "48%" },
    "clinic-hammanskraal-unit-d": { left: "62%", top: "18%" },
    "clinic-mabopane-station": { left: "22%", top: "58%" },
    "clinic-winterveldt-west": { left: "12%", top: "72%" },
    "clinic-atteridgeville-extension": { left: "40%", top: "82%" },
    "clinic-akasia-hills": { left: "46%", top: "47%" },
  };

  return positions[clinic.id] ?? { left: "50%", top: "50%" };
}

function pinClass(status: ClinicRow["status"]) {
  switch (status) {
    case "non_functional":
      return "border-red-200 bg-red-600";
    case "degraded":
      return "border-amber-200 bg-amber-500";
    case "unknown":
      return "border-slate-200 bg-slate-400";
    case "operational":
    default:
      return "border-emerald-200 bg-emerald-500";
  }
}

export function ScenarioHero() {
  const {
    state,
    resetDemo,
    triggerStockout,
    syncOfflineReports,
    queueOfflineReport,
  } = useDemoStore();
  const [selectedClinicId, setSelectedClinicId] = useState(STOCKOUT_TRIGGER_CLINIC_ID);

  const clinicRows = useMemo(() => getClinicRows(state), [state]);
  const statusCounts = useMemo(() => getStatusCounts(state), [state]);
  const activeAlerts = useMemo(() => getActiveAlerts(state), [state]);
  const reportStream = useMemo(() => getRecentReportStream(state), [state]);
  const selectedClinic =
    clinicRows.find((clinic) => clinic.id === selectedClinicId) ??
    clinicRows.find((clinic) => clinic.id === STOCKOUT_TRIGGER_CLINIC_ID) ??
    clinicRows[0] ??
    null;
  const clinicReports = useMemo(
    () => (selectedClinic ? getClinicReports(state, selectedClinic.id) : []),
    [selectedClinic, state],
  );
  const auditEvents = useMemo(
    () => (selectedClinic ? getClinicAuditEvents(state, selectedClinic.id) : []),
    [selectedClinic, state],
  );
  const selectedService = selectedClinic?.services[0] ?? "";
  const alternatives = useMemo(
    () =>
      selectedClinic && selectedService
        ? getAlternativeClinics(state, selectedClinic.id, selectedService).slice(0, 2)
        : [],
    [selectedClinic, selectedService, state],
  );
  const selectedAlerts = selectedClinic
    ? activeAlerts.filter((alert) => alert.clinicId === selectedClinic.id)
    : [];
  const latestReport = clinicReports[0] ?? null;
  const latestAudit = auditEvents[0] ?? null;

  const runStockout = () => {
    setSelectedClinicId(STOCKOUT_TRIGGER_CLINIC_ID);
    triggerStockout(STOCKOUT_TRIGGER_CLINIC_ID);
  };

  const runOfflineSync = () => {
    const clinicId = selectedClinic?.id ?? STOCKOUT_TRIGGER_CLINIC_ID;

    if (state.offlineQueue.length === 0) {
      queueOfflineReport({
        clinicId,
        reporterName: "Sipho Nkosi",
        source: "field_worker",
        status: "degraded",
        reason: "Offline field report confirmed elevated queue pressure after connectivity returned.",
        staffPressure: "strained",
        stockPressure: "low",
        queuePressure: "high",
        notes: "Queued from the landing preview to demonstrate offline reporting.",
      });
      return;
    }

    syncOfflineReports();
  };

  return (
    <section className="relative overflow-hidden bg-[#f7f8f4] px-4 pb-12 pt-20 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(23,23,23,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(23,23,23,0.055)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="relative mx-auto grid min-h-[calc(100svh-3.5rem)] w-full max-w-7xl content-start gap-7">
        <div className="grid gap-5 pt-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase text-emerald-800">
              Demo data / Tshwane North Demo District
            </p>
            <h1 className="mt-3 font-display text-5xl font-medium leading-none text-neutral-950 sm:text-6xl lg:text-7xl">
              ClinicPulse
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg">
              Live clinic availability and patient rerouting for district health teams.
              The surface below uses the same seeded data and operating objects as the live demo.
            </p>
            <div className="mt-5 grid max-w-2xl grid-cols-3 gap-2">
              {[
                demoImages["district-operations-room"],
                demoImages["mobile-field-report"],
                demoImages["patient-routing-context"],
              ].map((image) => (
                <div
                  key={image.src}
                  className="relative aspect-[4/3] overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 shadow-sm"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    priority
                    sizes="(min-width: 1024px) 14rem, 30vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="line-clamp-2 text-[10px] font-medium leading-4 text-white">
                      {image.caption}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button type="button" onClick={runStockout}>
              <Play className="size-4" />
              Trigger stockout
            </Button>
            <Button type="button" variant="outline" onClick={runOfflineSync}>
              <WifiOff className="size-4" />
              {state.offlineQueue.length > 0 ? "Sync offline report" : "Queue offline report"}
            </Button>
            <Button type="button" variant="outline" onClick={resetDemo}>
              <RotateCcw className="size-4" />
              Reset
            </Button>
            <Link
              href="/demo"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-900 shadow-sm transition hover:bg-neutral-50"
            >
              Open live demo
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-neutral-300 bg-white shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-950 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-md bg-emerald-400 text-neutral-950">
                <DatabaseZap className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">District Console</p>
                <p className="font-mono text-xs text-white/50">
                  {state.province} / {state.district}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
              <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1">
                <Radio className="size-3" />
                Last sync {state.lastSyncAt ? formatTimestamp(state.lastSyncAt) : "Seeded"}
              </span>
              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1">
                {activeAlerts.length} active alerts
              </span>
              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1">
                {state.offlineQueue.length} queued offline
              </span>
            </div>
          </div>

          <div className="grid min-h-[560px] bg-neutral-100 lg:grid-cols-[210px_minmax(0,1fr)_360px]">
            <aside className="border-b border-neutral-200 bg-white p-3 lg:border-b-0 lg:border-r">
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                {[
                  ["Operational", statusCounts.operational, "text-emerald-700"],
                  ["Degraded", statusCounts.degraded, "text-amber-700"],
                  ["Non-functional", statusCounts.non_functional, "text-red-700"],
                  ["Unknown", statusCounts.unknown, "text-slate-700"],
                ].map(([label, count, color]) => (
                  <div key={label} className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
                    <p className={`font-mono text-3xl font-semibold leading-none ${color}`}>
                      {count}
                    </p>
                    <p className="mt-2 text-xs font-medium text-neutral-500">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-3">
                <p className="text-xs font-semibold uppercase text-neutral-500">
                  Product surfaces
                </p>
                <div className="mt-2 grid gap-2 text-sm text-neutral-700">
                  <Link className="hover:text-neutral-950" href="/demo">District console</Link>
                  <Link className="hover:text-neutral-950" href="/field">Field PWA</Link>
                  <Link className="hover:text-neutral-950" href="/finder">Clinic finder</Link>
                </div>
              </div>
            </aside>

            <div className="grid gap-3 p-3">
              <div className="grid gap-3 xl:grid-cols-[1fr_0.78fr]">
                <div className="relative min-h-[280px] overflow-hidden rounded-md border border-neutral-200 bg-[linear-gradient(180deg,#f7faf9_0%,#edf5f2_100%)]">
                  <div className="absolute inset-0">
                    <div className="absolute left-[8%] top-[16%] h-px w-[42%] rotate-[16deg] bg-teal-200" />
                    <div className="absolute left-[24%] top-[48%] h-px w-[55%] -rotate-[12deg] bg-teal-200" />
                    <div className="absolute left-[54%] top-[14%] h-[62%] w-px rotate-[12deg] bg-sky-200" />
                    <div className="absolute inset-x-[12%] top-[30%] h-24 rounded-full border border-dashed border-teal-200" />
                  </div>

                  {selectedClinic && alternatives[0] ? (
                    <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <motion.path
                        d="M 68 62 C 62 52, 55 48, 46 47"
                        fill="none"
                        stroke="rgb(14 165 233)"
                        strokeDasharray="4 3"
                        strokeLinecap="round"
                        strokeWidth="0.9"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.4, ease: "easeOut" }}
                      />
                      <motion.circle
                        cx="46"
                        cy="47"
                        r="1.5"
                        fill="rgb(14 165 233)"
                        initial={{ scale: 0.7, opacity: 0.45 }}
                        animate={{ scale: [0.7, 1.8, 0.7], opacity: [0.45, 0.9, 0.45] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </svg>
                  ) : null}

                  {clinicRows.map((clinic) => {
                    const position = getMapPosition(clinic);
                    const selected = clinic.id === selectedClinic?.id;

                    return (
                      <button
                        key={clinic.id}
                        type="button"
                        onClick={() => setSelectedClinicId(clinic.id)}
                        className="absolute -translate-x-1/2 -translate-y-1/2 text-left"
                        style={position}
                      >
                        <motion.span
                          animate={
                            selected
                              ? { scale: [1, 1.18, 1], boxShadow: "0 0 0 8px rgba(255,255,255,0.65)" }
                              : { scale: 1, boxShadow: "0 0 0 0 rgba(255,255,255,0)" }
                          }
                          transition={{ duration: 1.8, repeat: selected ? Infinity : 0, ease: "easeInOut" }}
                          className={`block size-4 rounded-full border-2 shadow-sm ${pinClass(clinic.status)}`}
                        />
                        <span className={`absolute left-1/2 top-6 hidden min-w-40 -translate-x-1/2 rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-[11px] shadow-md md:block ${selected ? "z-20" : ""}`}>
                          <span className="block font-semibold text-neutral-950">{clinic.name}</span>
                          <span className="mt-0.5 block text-neutral-500">{clinic.facilityCode}</span>
                        </span>
                      </button>
                    );
                  })}

                  <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white/90 px-3 py-2 text-xs text-neutral-700 shadow-sm">
                    <MapPinned className="size-3.5 text-primary" />
                    Fixture coordinates from the demo district
                  </div>

                  {latestReport ? (
                    <motion.div
                      key={latestReport.id}
                      initial={{ opacity: 0, y: 16, x: 12 }}
                      animate={{ opacity: 1, y: 0, x: 0 }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                      className="absolute right-3 top-3 z-20 max-w-[14rem] rounded-md border border-amber-200 bg-white/95 p-3 shadow-lg backdrop-blur"
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
                        <WifiOff className="size-3.5" />
                        Field report received
                      </div>
                      <p className="mt-2 line-clamp-3 text-xs leading-5 text-neutral-700">
                        {latestReport.reason}
                      </p>
                    </motion.div>
                  ) : null}
                </div>

                <div className="rounded-md border border-neutral-200 bg-white p-3">
                  {selectedClinic ? (
                    <div className="relative mb-3 aspect-[16/9] overflow-hidden rounded-md border border-neutral-200 bg-neutral-100">
                      <Image
                        src={selectedClinic.image.src}
                        alt={selectedClinic.image.alt}
                        fill
                        sizes="(min-width: 1024px) 24rem, 90vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="text-[10px] font-medium leading-4 text-white">
                          {selectedClinic.image.caption}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-neutral-500">
                        Selected clinic
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-neutral-950">
                        {selectedClinic?.name ?? "No clinic selected"}
                      </h2>
                      <p className="mt-1 font-mono text-xs text-neutral-500">
                        {selectedClinic?.facilityCode}
                      </p>
                    </div>
                    {selectedClinic ? <StatusBadge status={selectedClinic.status} /> : null}
                  </div>

                  {selectedClinic ? (
                    <div className="mt-4 grid gap-2">
                      <div className="flex flex-wrap gap-2">
                        <FreshnessBadge freshness={selectedClinic.freshness} />
                        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-medium capitalize text-neutral-600">
                          {selectedClinic.source.replaceAll("_", " ")}
                        </span>
                      </div>
                      <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
                        <p className="text-xs font-semibold uppercase text-neutral-500">Current reason</p>
                        <p className="mt-1 text-sm leading-6 text-neutral-700">
                          {selectedClinic.reason}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-2">
                          <p className="text-neutral-500">Staff</p>
                          <p className="mt-1 font-semibold capitalize text-neutral-950">
                            {formatStatus(selectedClinic.staffPressure)}
                          </p>
                        </div>
                        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-2">
                          <p className="text-neutral-500">Stock</p>
                          <p className="mt-1 font-semibold capitalize text-neutral-950">
                            {formatStatus(selectedClinic.stockPressure)}
                          </p>
                        </div>
                        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-2">
                          <p className="text-neutral-500">Queue</p>
                          <p className="mt-1 font-semibold capitalize text-neutral-950">
                            {formatStatus(selectedClinic.queuePressure)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
                <div className="grid grid-cols-[1.15fr_0.58fr_0.58fr_1.2fr] border-b border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold uppercase text-neutral-500">
                  <span>Clinic</span>
                  <span>Status</span>
                  <span>Freshness</span>
                  <span>Recommended action</span>
                </div>
                {clinicRows.slice(0, 5).map((clinic) => {
                  const primaryService = clinic.services[0];
                  const alternative = primaryService
                    ? getAlternativeClinics(state, clinic.id, primaryService)[0]
                    : undefined;
                  const action =
                    clinic.status === "non_functional" && alternative
                      ? `Reroute ${primaryService.toLowerCase()} to ${alternative.name}.`
                      : clinic.status === "degraded" && alternative
                        ? `Route overflow to ${alternative.name}.`
                        : "Keep routing open and monitor freshness.";

                  return (
                    <button
                      key={clinic.id}
                      type="button"
                      onClick={() => setSelectedClinicId(clinic.id)}
                      className="grid w-full grid-cols-[1.15fr_0.58fr_0.58fr_1.2fr] border-b border-neutral-100 px-3 py-2 text-left text-xs last:border-b-0 hover:bg-neutral-50"
                    >
                      <span>
                        <span className="block font-medium text-neutral-950">{clinic.name}</span>
                        <span className="mt-0.5 block font-mono text-neutral-500">{clinic.facilityCode}</span>
                      </span>
                      <span className="capitalize text-neutral-700">{formatStatus(clinic.status)}</span>
                      <span className="capitalize text-neutral-700">{formatStatus(clinic.freshness)}</span>
                      <span className="text-neutral-700">{action}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="border-t border-neutral-200 bg-white p-3 lg:border-l lg:border-t-0">
              <div className="mb-3 grid grid-cols-2 gap-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-neutral-200 bg-neutral-100">
                  <Image
                    src={demoImages["mobile-field-report"].src}
                    alt={demoImages["mobile-field-report"].alt}
                    fill
                    sizes="10rem"
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1">
                    <p className="text-[10px] font-medium text-white">Field PWA</p>
                  </div>
                </div>
                <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-neutral-200 bg-neutral-100">
                  <Image
                    src={demoImages["patient-routing-context"].src}
                    alt={demoImages["patient-routing-context"].alt}
                    fill
                    sizes="10rem"
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1">
                    <p className="text-[10px] font-medium text-white">Reroute context</p>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-neutral-950">Routing recommendation</p>
                  <Route className="size-4 text-primary" />
                </div>
                {selectedClinic && alternatives.length > 0 ? (
                  <motion.div
                    key={`${selectedClinic.id}-${alternatives[0]?.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="mt-3 grid gap-2"
                  >
                    {alternatives.map((clinic) => (
                      <div key={clinic.id} className="rounded-md border border-neutral-200 bg-white p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-neutral-950">{clinic.name}</p>
                            <p className="mt-1 font-mono text-xs text-neutral-500">{clinic.facilityCode}</p>
                          </div>
                          <StatusBadge status={clinic.status} />
                        </div>
                        <p className="mt-2 text-xs leading-5 text-neutral-600">
                          Compatible service: {selectedService}. Freshness: {formatStatus(clinic.freshness)}.
                        </p>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-neutral-600">
                    Select a clinic with constrained service to calculate alternatives.
                  </p>
                )}
              </div>

              <div className="mt-3 rounded-md border border-neutral-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-neutral-950">Active alert</p>
                  <AlertTriangle className="size-4 text-amber-600" />
                </div>
                {selectedAlerts[0] ? (
                  <motion.div
                    key={selectedAlerts[0].id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs capitalize text-neutral-600">
                        {selectedAlerts[0].type.replaceAll("_", " ")}
                      </p>
                      <SeverityBadge severity={selectedAlerts[0].severity} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-neutral-700">
                      {selectedAlerts[0].recommendedAction}
                    </p>
                  </motion.div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-neutral-600">
                    No active alert on the selected clinic.
                  </p>
                )}
              </div>

              <div className="mt-3 rounded-md border border-neutral-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-neutral-950">Latest field report</p>
                  <ClipboardList className="size-4 text-primary" />
                </div>
                {latestReport ? (
                  <motion.div
                    key={latestReport.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 text-sm leading-6 text-neutral-700"
                  >
                    <p className="font-medium text-neutral-950">{latestReport.reporterName}</p>
                    <p className="font-mono text-xs text-neutral-500">
                      {formatTimestamp(latestReport.receivedAt)}
                    </p>
                    <p className="mt-2">{latestReport.reason}</p>
                  </motion.div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-neutral-600">No reports yet.</p>
                )}
              </div>

              <div className="mt-3 rounded-md border border-neutral-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-neutral-950">Audit trail</p>
                  <Radio className="size-4 text-primary" />
                </div>
                {latestAudit ? (
                  <motion.div
                    key={latestAudit.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 text-sm leading-6 text-neutral-700"
                  >
                    <p>{latestAudit.summary}</p>
                    <p className="mt-2 font-mono text-xs text-neutral-500">
                      {latestAudit.actorName} / {formatTimestamp(latestAudit.createdAt)}
                    </p>
                  </motion.div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-neutral-600">
                    No audit events for this clinic yet.
                  </p>
                )}
              </div>
            </aside>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-neutral-200 bg-white/90 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-neutral-500">District console</p>
            <p className="mt-2 text-sm leading-6 text-neutral-700">
              Status counts, facility table, active alerts, and routing recommendations from the same demo state.
            </p>
          </div>
          <div className="rounded-md border border-neutral-200 bg-white/90 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-neutral-500">Field PWA</p>
            <p className="mt-2 text-sm leading-6 text-neutral-700">
              Offline reports queue locally, then sync into the district console when connectivity returns.
            </p>
          </div>
          <div className="rounded-md border border-neutral-200 bg-white/90 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-neutral-500">Public finder</p>
            <p className="mt-2 text-sm leading-6 text-neutral-700">
              Patients see fresh clinic status and compatible alternatives before making the trip.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
