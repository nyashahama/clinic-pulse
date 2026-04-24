"use client";

import { motion } from "framer-motion";
import { GridSection } from "@/components/ui/grid-section";
import Link from "next/link";
import { StatusMapGraphic } from "./graphics/status-map";
import { AnalyticsGraphic } from "./graphics/analytics";
import { FieldReportsGraphic } from "./graphics/field-reports";
import { APIDocumentationGraphic } from "./graphics/api-docs";
import { CollaborationGraphic } from "./graphics/collaboration";
import { QRCodeGraphic } from "./graphics/qr-code";
import { DomainsGraphic } from "./graphics/domains";
import { PersonalizationGraphic } from "./graphics/personalization";

const features = [
  {
    title: "Real-Time Status Board",
    description:
      "Interactive map with live clinic status across all 52 districts. Click markers to view details, filter by status, and see operational capacity at a glance.",
    link: "/platform",
    linkText: "Explore platform",
    graphic: <StatusMapGraphic />,
  },
  {
    title: "Offline-First Reports",
    description:
      "5-field quick report forms that work without internet. Submits optimistically, queues locally, and syncs automatically when connectivity returns.",
    link: "/features",
    linkText: "Learn more",
    graphic: <FieldReportsGraphic />,
  },
  {
    title: "QR Codes",
    description:
      "Every clinic gets a custom QR code. Patients scan to see real-time status. Customize colors, add logos, and download in any format.",
    link: "/features",
    linkText: "Try generator",
    graphic: <QRCodeGraphic />,
  },
  {
    title: "Custom Domains",
    description:
      "Use your own domain for clinic links. Improve trust and click-through rates by up to 30% with branded short URLs.",
    link: "/features",
    linkText: "Learn more",
    graphic: <DomainsGraphic />,
  },
  {
    title: "Team Collaboration",
    description:
      "Invite your team with role-based access. District managers, field leads, and admins — everyone gets the right permissions.",
    link: "/features",
    linkText: "Learn more",
    graphic: <CollaborationGraphic />,
  },
  {
    title: "Analytics",
    description:
      "Full attribution for every click. Device, geo, referrer — understand exactly how patients find your clinics.",
    link: "/analytics",
    linkText: "View analytics",
    graphic: <PersonalizationGraphic />,
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

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                delay: i * 0.08,
                duration: 0.5,
                ease: "easeOut",
              }}
              className="group relative flex flex-col rounded-2xl border border-neutral-200 bg-white p-4 transition-all hover:border-neutral-300 hover:shadow-lg"
            >
              <div className="relative mb-4 h-40 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50">
                {feature.graphic}
              </div>
              
              <h3 className="text-base font-medium text-neutral-900">
                {feature.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                {feature.description}
              </p>
              <Link
                href={feature.link}
                className="group/link mt-3 inline-flex w-fit items-center gap-1 text-sm font-medium text-neutral-600 transition-colors hover:text-[#0D7A6B]"
              >
                {feature.linkText}
                <svg
                  className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5"
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
