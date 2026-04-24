"use client";

import { motion } from "framer-motion";
import { GridSection } from "@/components/ui/grid-section";
import { Activity, Smartphone, Search } from "lucide-react";
import { StatusBadge } from "./status-badge";

const interfaces = [
  {
    icon: Activity,
    accent: "bg-[#0D7A6B]",
    accentLight: "bg-[#0D7A6B]/10 text-[#0D7A6B]",
    audience: "For District Officials",
    title: "District Console",
    description:
      "Data-dense, desktop-first interface with MapLibre GL maps, TanStack data tables, and real-time analytics. Bi-directional link between map markers and table rows.",
    mockContent: (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-medium text-neutral-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
          </span>
          Real-time · Last updated 5m ago
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md bg-green-100/50 p-2 text-center">
            <div className="text-xs font-semibold text-green-700">2,847</div>
            <div className="text-[8px] text-green-600">Operational</div>
          </div>
          <div className="rounded-md bg-amber-100/50 p-2 text-center">
            <div className="text-xs font-semibold text-amber-700">287</div>
            <div className="text-[8px] text-amber-600">Degraded</div>
          </div>
          <div className="rounded-md bg-red-100/50 p-2 text-center">
            <div className="text-xs font-semibold text-red-700">107</div>
            <div className="text-[8px] text-red-600">Down</div>
          </div>
        </div>
        <div className="space-y-1">
          {["Diepsloot CHC", "Mamelodi Clinic", "Alexandra PHC"].map(
            (name, i) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-md bg-neutral-50 px-2 py-1"
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
    icon: Smartphone,
    accent: "bg-green-600",
    accentLight: "bg-green-600/10 text-green-600",
    audience: "For Field Workers",
    title: "Mobile Field Reports",
    description:
      "Offline-first PWA with optimistic updates. Three screens: clinic list, 5-field report form, confirmation. Queues with Zustand, syncs when online.",
    mockContent: (
      <div className="space-y-2">
        <div className="rounded-lg bg-green-50 p-2">
          <div className="text-[10px] font-medium text-green-700">
            Diepsloot CHC
          </div>
          <div className="text-[8px] text-green-600">1.2 km away · Operational</div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 rounded-md bg-neutral-50 px-2 py-1.5">
            <div className="h-3 w-3 rounded border border-green-400 bg-green-400" />
            <span className="text-[9px] text-neutral-600">Clinic open today?</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-neutral-50 px-2 py-1.5">
            <div className="h-3 w-3 rounded border border-neutral-300 bg-amber-400" />
            <span className="text-[9px] text-neutral-600">Staff level?</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-neutral-50 px-2 py-1.5">
            <div className="h-3 w-3 rounded border border-neutral-300" />
            <span className="text-[9px] text-neutral-600">Medicine stocked?</span>
          </div>
        </div>
        <div className="rounded-md bg-green-600 px-2 py-1.5 text-center text-[9px] font-medium text-white">
          Submit Report
        </div>
      </div>
    ),
  },
  {
    icon: Search,
    accent: "bg-amber-600",
    accentLight: "bg-amber-600/10 text-amber-600",
    audience: "For Patients",
    title: "Public Clinic Finder",
    description:
      "Lightweight, no-login-required clinic finder. Search by suburb or name, view status badges, get directions via Google Maps deep links. ISR revalidated every 10 minutes.",
    mockContent: (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2 py-1.5">
          <svg
            className="h-3 w-3 text-neutral-400"
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
        <div className="space-y-1">
          {[
            { name: "Soweto CHC", status: "operational" as const },
            { name: "Sandton Clinic", status: "degraded" as const },
          ].map((clinic) => (
            <div
              key={clinic.name}
              className="flex items-center justify-between rounded-md border border-neutral-100 px-2 py-1.5"
            >
              <div>
                <div className="text-[10px] font-medium text-neutral-700">
                  {clinic.name}
                </div>
                <div className="text-[8px] text-neutral-400">2.1 km</div>
              </div>
              <StatusBadge
                status={clinic.status}
                showDot={false}
                className="text-[8px] px-1.5 py-0"
              />
            </div>
          ))}
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

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {interfaces.map((iface, i) => {
            const Icon = iface.icon;
            return (
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
                <div className={`${iface.accent} px-5 py-3`}>
                  <p className="text-[11px] font-medium text-white/70">
                    {iface.audience}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Icon className="h-4 w-4 text-white" />
                    <h3 className="text-base font-semibold text-white">
                      {iface.title}
                    </h3>
                  </div>
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
            );
          })}
        </div>
      </div>
    </GridSection>
  );
}