"use client";

import { motion } from "framer-motion";
import { GridSection } from "@/components/ui/grid-section";
import {
  Activity,
  Smartphone,
  Code2,
  MapPin,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: Activity,
    color: "bg-green-100 text-green-600",
    title: "Real-Time Status Board",
    description:
      "MapLibre GL + TanStack data tables with bi-directional linking. Click a row, fly the map. Click a marker, highlight the row.",
  },
  {
    icon: Smartphone,
    color: "bg-amber-100 text-amber-600",
    title: "Offline-First Field Reports",
    description:
      "5-field quick report form. Submits optimistically, queues with Zustand if offline. Syncs when connectivity returns.",
  },
  {
    icon: Code2,
    color: "bg-blue-100 text-blue-600",
    title: "Public API",
    description:
      "Open data access for researchers, apps, and services building on clinic status data. Real-time endpoints and historical data.",
  },
  {
    icon: MapPin,
    color: "bg-purple-100 text-purple-600",
    title: "Referral Routing",
    description:
      "When a patient's first-choice clinic is degraded, smart routing finds the nearest operational alternative with available capacity.",
  },
  {
    icon: BarChart3,
    color: "bg-orange-100 text-orange-600",
    title: "District Analytics",
    description:
      "Trend analysis, burden spike detection, and resource allocation insights powered by Tremor charts and real-time data.",
  },
  {
    icon: ShieldCheck,
    color: "bg-cyan-100 text-cyan-600",
    title: "NHI-Ready Data",
    description:
      "Facility-level data quality that meets National Health Insurance requirements. The operational layer DHIS2 was never built to be.",
  },
];

export function FeaturesSection() {
  return (
    <GridSection className="bg-neutral-50" id="platform">
      <div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#0D7A6B]">
          The Platform
        </p>
        <h2
          className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-neutral-900 sm:text-4xl"
          style={{ textWrap: "balance" }}
        >
          One system. Three interfaces.
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-neutral-500">
          Citizen-report-enriched, NGO-contributed, government-data-fused. Built
          for the people who need it — and the data they produce.
        </p>

        <div className="mt-12 grid grid-cols-1 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
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
                className="bg-white p-7"
              >
                <div
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] ${feature.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-[15px] font-medium text-neutral-900">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </GridSection>
  );
}
