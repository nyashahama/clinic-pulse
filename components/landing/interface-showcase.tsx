"use client";

import { motion } from "motion/react";
import { MaxWidthWrapper } from "@/components/ui/max-width-wrapper";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { StatusBadge } from "./status-badge";

const interfaces = [
  {
    audience: "For District Officials",
    title: "District Console",
    description:
      "Data-dense desktop interface with live maps, drill-down tables, and real-time analytics. Every clinic visible at a glance.",
    offset: "lg:mt-0",
    visual: (
      <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-neutral-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Real-time · Last updated 2m ago
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { val: "2,847", label: "Operational", color: "text-emerald-700" },
            { val: "287", label: "Degraded", color: "text-amber-700" },
            { val: "107", label: "Down", color: "text-red-700" },
          ].map((s) => (
            <div key={s.label} className={`rounded-md border border-neutral-200 bg-neutral-100/50 p-1.5 text-center ${s.color}`}>
              <div className="text-[11px] font-semibold">{s.val}</div>
              <div className="text-[7px] uppercase tracking-wider opacity-70">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          {["Diepsloot CHC", "Mamelodi Clinic", "Alexandra PHC"].map((name, i) => (
            <div key={name} className="flex items-center justify-between rounded-md bg-white px-2 py-1.5 ring-1 ring-neutral-200">
              <span className="text-[10px] font-medium text-neutral-700">{name}</span>
              <StatusBadge status={["operational", "degraded", "non-functional"][i] as "operational" | "degraded" | "non-functional"} showDot={false} className="text-[8px] px-1.5 py-0" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    audience: "For Field Workers",
    title: "Mobile Field Reports",
    description:
      "Offline-first PWA. Three screens: clinic list → 5-field report form → confirmation. Queues locally, syncs when online.",
    offset: "lg:mt-8",
    visual: (
      <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2">
          <div className="text-[10px] font-semibold text-emerald-800">Diepsloot CHC</div>
          <div className="text-[8px] text-emerald-600">1.2 km · Operational</div>
        </div>
        <div className="space-y-1.5">
          {["Clinic open?", "Staff level?", "Medicine stocked?", "Queue length?", "Notes"].map((field, i) => (
            <div key={field} className="flex items-center gap-2 rounded-md bg-white px-2 py-1.5 ring-1 ring-neutral-200">
              <div className={`h-3 w-3 rounded border-2 ${i === 0 ? "border-emerald-400 bg-emerald-400" : "border-neutral-300"}`}>
                {i === 0 && <svg className="h-2 w-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <span className="text-[9px] text-neutral-500">{field}</span>
            </div>
          ))}
        </div>
        <div className="rounded-md bg-[#0D7A6B] px-2 py-1.5 text-center text-[9px] font-semibold text-white">Submit Report</div>
      </div>
    ),
  },
  {
    audience: "For Patients & Public",
    title: "Public Clinic Finder",
    description:
      "No login. No app install. Search by suburb, see status badges, get directions. Loads in under 2 seconds on 3G.",
    offset: "lg:mt-16",
    visual: (
      <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <div className="flex items-center gap-2 rounded-lg border bg-white px-2.5 py-2 ring-1 ring-neutral-200">
          <svg className="h-3.5 w-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <span className="text-[10px] text-neutral-400">Search suburb or clinic...</span>
        </div>
        {[
          { name: "Soweto CHC", dist: "2.1 km", status: "operational" as const },
          { name: "Sandton Clinic", dist: "4.8 km", status: "degraded" as const },
        ].map((clinic) => (
          <div key={clinic.name} className="flex items-center justify-between rounded-lg bg-white px-2.5 py-2 ring-1 ring-neutral-200">
            <div>
              <div className="text-[10px] font-medium text-neutral-800">{clinic.name}</div>
              <div className="text-[8px] text-neutral-400">{clinic.dist}</div>
            </div>
            <StatusBadge status={clinic.status} showDot={false} className="text-[8px] px-1.5 py-0" />
          </div>
        ))}
        <div className="flex items-center justify-center gap-1 text-[8px] text-neutral-400">
          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Get directions on Google Maps
        </div>
      </div>
    ),
  },
];

export function InterfaceShowcase() {
  return (
    <section className="relative border-t border-neutral-200 bg-neutral-50">
      <MaxWidthWrapper className="py-16 sm:py-20 lg:py-24">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#0D7A6B]">
          Three Interfaces
        </p>
        <h2 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-neutral-900 sm:text-4xl" style={{ textWrap: "balance" }}>
          One system, built for every user
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-neutral-500">
          Each interface is purpose-built for its users — from district officials monitoring 3,500 clinics to patients finding the nearest open facility.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {interfaces.map((iface, i) => (
            <motion.div
              key={iface.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.12, duration: 0.4 }}
              className={`group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm ring-1 ring-black/5 transition-all hover:shadow-md ${iface.offset}`}
            >
              <div className="border-b border-neutral-100 bg-gradient-to-r from-[#0D7A6B]/5 to-transparent px-5 py-4">
                <p className="text-[11px] font-medium text-[#0D7A6B]">{iface.audience}</p>
                <h3 className="mt-0.5 text-base font-semibold text-neutral-900">{iface.title}</h3>
              </div>
              <div className="p-5">
                <p className="mb-4 text-sm leading-relaxed text-neutral-500">{iface.description}</p>
                {iface.visual}
              </div>
            </motion.div>
          ))}
        </div>
      </MaxWidthWrapper>
      <ProgressiveBlur className="absolute bottom-0 left-0 right-0 h-32" side="top" strength={16} steps={3} />
    </section>
  );
}
