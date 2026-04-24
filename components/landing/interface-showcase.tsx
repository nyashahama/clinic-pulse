"use client";

import { motion } from "framer-motion";
import { GridSection } from "@/components/ui/grid-section";
import { StatusBadge } from "./status-badge";

const interfaces = [
  {
    audience: "For District Officials",
    title: "District Console",
    description:
      "Data-dense, desktop-first interface with MapLibre GL maps, TanStack data tables, and real-time analytics. Bi-directional link between map markers and table rows.",
    headerGradient: "from-[#0D7A6B]/90 to-[#0FA89A]/90",
    mockContent: (
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-neutral-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Real-time · Last updated 5m ago
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <div className="rounded-md border border-emerald-200/60 bg-emerald-50/40 p-1.5 text-center">
            <div className="text-[11px] font-semibold text-emerald-700">2,847</div>
            <div className="text-[7px] uppercase tracking-wider text-emerald-600">Operational</div>
          </div>
          <div className="rounded-md border border-amber-200/60 bg-amber-50/40 p-1.5 text-center">
            <div className="text-[11px] font-semibold text-amber-700">287</div>
            <div className="text-[7px] uppercase tracking-wider text-amber-600">Degraded</div>
          </div>
          <div className="rounded-md border border-red-200/60 bg-red-50/40 p-1.5 text-center">
            <div className="text-[11px] font-semibold text-red-700">107</div>
            <div className="text-[7px] uppercase tracking-wider text-red-600">Down</div>
          </div>
        </div>
        <div className="space-y-1">
          {["Diepsloot CHC", "Mamelodi Clinic", "Alexandra PHC"].map(
            (name, i) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-md bg-white px-2 py-1.5 ring-1 ring-inset ring-neutral-200/60"
              >
                <span className="text-[10px] font-medium text-neutral-700">
                  {name}
                </span>
                <StatusBadge
                  status={
                    ["operational", "degraded", "non-functional"][
                      i
                    ] as "operational" | "degraded" | "non-functional"
                  }
                  showDot={false}
                  className="text-[8px] px-1.5 py-0"
                />
              </div>
            )
          )}
        </div>
      </div>
    ),
  },
  {
    audience: "For Field Workers",
    title: "Mobile Field Reports",
    description:
      "Offline-first PWA with optimistic updates. Three screens: clinic list, 5-field report form, confirmation. Queues with Zustand, syncs when online.",
    headerGradient: "from-[#059669]/90 to-[#34D399]/90",
    mockContent: (
      <div className="space-y-2.5">
        <div className="rounded-lg border border-emerald-200/60 bg-emerald-50/40 p-2">
          <div className="text-[10px] font-semibold text-emerald-800">
            Diepsloot CHC
          </div>
          <div className="text-[8px] text-emerald-600">1.2 km away · Operational</div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 rounded-md bg-white px-2 py-1.5 ring-1 ring-inset ring-neutral-200/60">
            <div className="flex h-3.5 w-3.5 items-center justify-center rounded border-2 border-emerald-400 bg-emerald-400">
              <svg className="h-2 w-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <span className="text-[9px] text-neutral-600">Clinic open today?</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-white px-2 py-1.5 ring-1 ring-inset ring-neutral-200/60">
            <div className="h-3.5 w-3.5 rounded border-2 border-amber-400 bg-amber-400" />
            <span className="text-[9px] text-neutral-600">Staff level?</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-white px-2 py-1.5 ring-1 ring-inset ring-neutral-200/60">
            <div className="h-3.5 w-3.5 rounded border-2 border-neutral-300" />
            <span className="text-[9px] text-neutral-600">Medicine stocked?</span>
          </div>
        </div>
        <div className="rounded-md bg-[#0D7A6B] px-2 py-1.5 text-center text-[9px] font-semibold text-white shadow-sm">
          Submit Report
        </div>
      </div>
    ),
  },
  {
    audience: "For Patients & Public",
    title: "Public Clinic Finder",
    description:
      "Lightweight, no-login-required clinic finder. Search by suburb or name, view status badges, get directions via Google Maps deep links. Loads in under 2 seconds on 3G.",
    headerGradient: "from-[#D97706]/90 to-[#FBBF24]/90",
    mockContent: (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2.5 py-2 ring-1 ring-inset ring-neutral-200/60 shadow-sm">
          <svg
            className="h-3.5 w-3.5 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span className="text-[10px] text-neutral-400">
            Search suburb or clinic name...
          </span>
        </div>
        <div className="space-y-1.5">
          {[
            { name: "Soweto CHC", dist: "2.1 km", status: "operational" as const },
            { name: "Sandton Clinic", dist: "4.8 km", status: "degraded" as const },
          ].map((clinic) => (
            <div
              key={clinic.name}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-2.5 py-2 ring-1 ring-inset ring-neutral-200/60"
            >
              <div>
                <div className="text-[10px] font-medium text-neutral-800">
                  {clinic.name}
                </div>
                <div className="text-[8px] text-neutral-400">{clinic.dist}</div>
              </div>
              <StatusBadge
                status={clinic.status}
                showDot={false}
                className="text-[8px] px-1.5 py-0"
              />
            </div>
          ))}
        </div>
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
    <GridSection className="bg-neutral-50" id="interfaces">
      <div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#0D7A6B]">
          Three Interfaces
        </p>
        <h2
          className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-neutral-900 sm:text-4xl"
          style={{ textWrap: "balance" }}
        >
          One system, built for every user
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-neutral-500">
          Each interface is purpose-built for its users — from district
          officials monitoring 3,500 clinics to patients finding the nearest
          open facility.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {interfaces.map((iface, i) => (
            <motion.div
              key={iface.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                delay: i * 0.1,
                duration: 0.4,
                ease: "easeOut",
              }}
              className="group overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"
            >
              <div className={`bg-gradient-to-r ${iface.headerGradient} px-5 py-3.5`}>
                <p className="text-[11px] font-medium text-white/70">
                  {iface.audience}
                </p>
                <h3 className="mt-0.5 text-[15px] font-semibold text-white">
                  {iface.title}
                </h3>
              </div>
              <div className="p-5">
                <p className="mb-4 text-sm leading-relaxed text-neutral-500">
                  {iface.description}
                </p>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 ring-1 ring-black/5">
                  {iface.mockContent}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </GridSection>
  );
}