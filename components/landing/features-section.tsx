"use client";

import { motion } from "framer-motion";
import { GridSection } from "@/components/ui/grid-section";
import Link from "next/link";
import { StatusMapGraphic } from "./graphics/status-map";
import { AnalyticsGraphic } from "./graphics/analytics";
import { FieldReportsGraphic } from "./graphics/field-reports";
import { APIDocumentationGraphic } from "./graphics/api-docs";

const features = [
  {
    title: "Real-Time Status Board",
    description:
      "Interactive map with live clinic status. Click markers to view details, filter by district, and see operational capacity at a glance.",
    link: "/platform",
    linkText: "Explore platform",
    graphic: <StatusMapGraphic />,
    graphicKey: "status-map",
  },
  {
    title: "Offline-First Reports",
    description:
      "Quick 5-field forms that work without internet. Queues submissions locally and syncs when connectivity returns.",
    link: "/features",
    linkText: "Learn more",
    graphic: <FieldReportsGraphic />,
    graphicKey: "reports",
  },
  {
    title: "REST API",
    description:
      "Full programmatic access to clinic data, status updates, and analytics. Rate-limited at 1k/min with WebSocket support.",
    link: "/docs",
    linkText: "View docs",
    graphic: <APIDocumentationGraphic />,
    graphicKey: "api",
  },
  {
    title: "District Analytics",
    description:
      "Real-time dashboards with trend analysis, burden detection, and resource allocation insights powered by your data.",
    link: "/analytics",
    linkText: "View analytics",
    graphic: <AnalyticsGraphic />,
    graphicKey: "analytics",
  },
  {
    title: "Referral Routing",
    description:
      "Smart patient routing when a clinic is degraded. Finds nearest operational alternative with available capacity.",
    link: "/features",
    linkText: "Learn more",
    graphic: <StatusMapGraphic />,
    graphicKey: "routing",
  },
  {
    title: "NHI-Ready Data",
    description:
      "Facility-level data meeting National Health Insurance requirements. The operational layer DHIS2 was never designed to be.",
    link: "/nhi",
    linkText: "Learn more",
    graphic: <AnalyticsGraphic />,
    graphicKey: "nhi",
  },
];

export function FeaturesSection() {
  return (
    <GridSection className="bg-white" id="features">
      <div>
        <div className="mx-auto w-full max-w-xl px-4 text-center">
          <div className="mx-auto flex h-7 w-fit items-center rounded-full border border-neutral-200 bg-white px-4 text-xs text-neutral-800">
            Platform Features
          </div>
          <h2
            className="mt-6 font-display text-3xl font-medium leading-[1.15] tracking-tight text-neutral-900 sm:text-4xl"
            style={{ textWrap: "balance" }}
          >
            Built for the realities of South African healthcare
          </h2>
          <p className="mt-4 text-lg text-neutral-500">
            Real-time clinic intelligence that actually works in the field — 
            designed with healthcare workers, for healthcare workers.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 sm:grid-cols-2 sm:divide-x lg:grid-cols-3 lg:divide-y-0">
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
              className="group relative flex flex-col gap-4 bg-white p-4 transition-all hover:bg-neutral-50 lg:p-6"
            >
              <div
                className="absolute left-1/2 top-1/3 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-10 blur-[50px]"
                style={{
                  background: "conic-gradient(from 270deg, #0D7A6B, #22c55e, transparent)",
                }}
              />
              
              <div className="relative h-32 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50 sm:h-36">
                {feature.graphic}
              </div>
              
              <h3 className="relative text-base font-medium text-neutral-900">
                {feature.title}
              </h3>
              <p className="relative text-sm leading-relaxed text-neutral-500">
                {feature.description}
              </p>
              <Link
                href={feature.link}
                className="relative mt-auto inline-flex w-fit items-center gap-1 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
              >
                {feature.linkText}
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </GridSection>
  );
}
