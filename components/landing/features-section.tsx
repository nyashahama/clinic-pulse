"use client";

import { motion } from "framer-motion";
import { GridSection } from "@/components/ui/grid-section";

const features = [
  {
    title: "Real-Time Status Board",
    description:
      "MapLibre GL + TanStack data tables with bi-directional linking. Click a row, fly the map. Click a marker, highlight the row. Updates every 5 minutes.",
    detail: "bi-directional map-table linking",
  },
  {
    title: "Offline-First Field Reports",
    description:
      "5-field quick report form. Submits optimistically, queues with Zustand if offline. Syncs when connectivity returns.",
    detail: "Zustand offline queue",
  },
  {
    title: "Public API",
    description:
      "Open data access for researchers, apps, and services building on clinic status data. Real-time endpoints and historical data.",
    detail: "REST + WebSocket",
  },
  {
    title: "Referral Routing",
    description:
      "When a patient's first-choice clinic is degraded, smart routing finds the nearest operational alternative with available capacity.",
    detail: "proximity + capacity scoring",
  },
  {
    title: "District Analytics",
    description:
      "Trend analysis, burden spike detection, and resource allocation insights powered by Tremor charts and real-time data.",
    detail: "Tremor + React Query",
  },
  {
    title: "NHI-Ready Data",
    description:
      "Facility-level data quality that meets National Health Insurance requirements. The operational layer DHIS2 was never built to be.",
    detail: "DHIS2-compatible export",
  },
];

export function FeaturesSection() {
  return (
    <GridSection className="bg-white" id="features">
      <div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#0D7A6B]">
          Under the Hood
        </p>
        <h2
          className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-neutral-900 sm:text-4xl"
          style={{ textWrap: "balance" }}
        >
          Built for the realities of<br className="hidden sm:block" /> South
          African healthcare
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-neutral-500">
          Every technical decision — offline-first, bi-directional maps,
          5-field reports — comes from watching how healthcare actually works on
          the ground.
        </p>

        <div className="mt-12 grid grid-cols-1 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 shadow-sm ring-1 ring-black/5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                delay: i * 0.05,
                duration: 0.4,
                ease: "easeOut",
              }}
              className="group bg-white p-6 transition-shadow hover:shadow-md lg:p-7"
            >
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 text-white">
                <span className="text-[13px] font-semibold tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="text-[15px] font-medium text-neutral-900">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
                {feature.description}
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
                <span className="h-1 w-1 rounded-full bg-neutral-300" />
                {feature.detail}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </GridSection>
  );
}