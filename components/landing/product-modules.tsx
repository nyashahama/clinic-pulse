"use client";

import { motion, useReducedMotion } from "motion/react";
import { MaxWidthWrapper } from "@/components/ui/max-width-wrapper";
import { DotsPattern } from "@/components/ui/dots-pattern";
import Link from "next/link";
import { StatusMapGraphic } from "./graphics/status-map";
import { FieldReportsGraphic } from "./graphics/field-reports";
import { AnalyticsGraphic } from "./graphics/analytics";
import { PhotoPanel } from "./photo-panel";
import { landingPhotos } from "./photo-assets";

const modules = [
  {
    label: "Product",
    title: "Stop losing patients to closed doors",
    description:
      "Patients travel to clinics that are out of stock, understaffed, or closed. Know before they go — live status across all 52 districts.",
    href: "/platform",
    linkText: "Explore District Console",
    photo: landingPhotos.clinicTeam,
    graphic: <StatusMapGraphic />,
  },
  {
    label: "Product",
    title: "Field reports that actually reach headquarters",
    description:
      "Community health workers should not wait weeks for paper forms to arrive. Submit from anywhere — online or off — and sync when connected.",
    href: "/features",
    linkText: "Explore Field Reports",
    photo: landingPhotos.fieldWorker,
    graphic: <FieldReportsGraphic />,
  },
  {
    label: "Product",
    title: "The right clinic. The first time.",
    description:
      "When a clinic is closed, patients need to know where else to go. Instant routing to the nearest operational alternative — no login required.",
    href: "/features",
    linkText: "Explore Clinic Finder",
    photo: landingPhotos.patientCare,
    graphic: <AnalyticsGraphic />,
  },
];

export function ProductModules() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative border-t border-neutral-200 bg-white">
      <DotsPattern
        dotSize={1.5}
        gapSize={12}
        className="text-neutral-300/25 [mask-image:radial-gradient(closest-side,black,transparent)]"
      />
      <MaxWidthWrapper className="relative py-16 sm:py-20 lg:py-24">
        <div className="grid gap-6 lg:grid-cols-3">
          {modules.map((mod, i) => (
            <motion.div
              key={mod.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="group relative flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-neutral-300"
            >
              <div className="mb-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#0D7A6B]">
                  {mod.label}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">
                {mod.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                {mod.description}
              </p>
              <div className="relative mt-5 h-80 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50">
                <PhotoPanel
                  photo={mod.photo}
                  sizes="(min-width: 1024px) 28vw, (min-width: 768px) 45vw, 92vw"
                  className="absolute inset-0 rounded-xl border-0 shadow-none ring-0"
                  imageClassName="scale-105"
                />
                <motion.div
                  animate={shouldReduceMotion ? { y: 0 } : { y: [0, -6, 0] }}
                  transition={
                    shouldReduceMotion
                      ? undefined
                      : {
                          duration: 4.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.4,
                        }
                  }
                  className="absolute bottom-3 left-3 right-3 overflow-hidden rounded-lg border border-white/60 bg-white/90 shadow-lg backdrop-blur-md"
                >
                  <div className="h-72 bg-white/85">{mod.graphic}</div>
                </motion.div>
              </div>
              <Link
                href={mod.href}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-neutral-600 transition-colors hover:text-[#0D7A6B]"
              >
                {mod.linkText}
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </motion.div>
          ))}
        </div>
      </MaxWidthWrapper>
    </section>
  );
}
