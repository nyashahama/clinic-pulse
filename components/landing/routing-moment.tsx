"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { MapPinOff, Navigation, Route, SearchCheck } from "lucide-react";

import { MaxWidthWrapper } from "@/components/ui/max-width-wrapper";
import { demoImages } from "@/lib/demo/images";

export function RoutingMoment() {
  return (
    <section id="routing" className="bg-white">
      <MaxWidthWrapper className="py-16 sm:py-20 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase text-[#0D7A6B]">
              Public reroute
            </p>
            <h2
              className="mt-4 font-display text-3xl font-medium leading-[1.12] text-neutral-950 sm:text-4xl"
              style={{ textWrap: "balance" }}
            >
              The patient-facing moment has to look operational, not theoretical.
            </h2>
            <p className="mt-4 text-base leading-7 text-neutral-600">
              The finder should show unavailable clinic, compatible alternative,
              freshness, and reason in one glance.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 shadow-sm">
            <div className="relative min-h-[420px]">
              <Image
                src={demoImages["patient-routing-context"].src}
                alt={demoImages["patient-routing-context"].alt}
                fill
                sizes="(min-width: 1024px) 48rem, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />

              <motion.div
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.38 }}
                className="absolute left-4 top-4 w-[min(22rem,calc(100%-2rem))] rounded-lg border border-white/20 bg-white/95 p-4 shadow-xl backdrop-blur"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-red-800">
                  <MapPinOff className="size-4" />
                  Mamelodi East unavailable
                </div>
                <p className="mt-2 text-sm leading-6 text-neutral-700">
                  Pharmacy stockout reported by field worker. Status fresh - 2 min ago.
                </p>
              </motion.div>

              <motion.div
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: 0.25, duration: 1.2, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <motion.path
                    d="M 24 34 C 42 46, 50 58, 72 62"
                    fill="none"
                    stroke="white"
                    strokeDasharray="3 3"
                    strokeLinecap="round"
                    strokeWidth="0.8"
                  />
                </svg>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: 0.5, duration: 0.38 }}
                className="absolute bottom-4 right-4 w-[min(24rem,calc(100%-2rem))] rounded-lg border border-emerald-200 bg-emerald-50/95 p-4 shadow-xl backdrop-blur"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
                  <Navigation className="size-4" />
                  Route to Akasia Hills Clinic
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-md border border-emerald-200 bg-white p-2">
                    <p className="text-emerald-700">Freshness</p>
                    <p className="mt-1 font-mono font-semibold text-emerald-950">4 min</p>
                  </div>
                  <div className="rounded-md border border-emerald-200 bg-white p-2">
                    <p className="text-emerald-700">Service</p>
                    <p className="mt-1 font-semibold text-emerald-950">Primary care</p>
                  </div>
                  <div className="rounded-md border border-emerald-200 bg-white p-2">
                    <p className="text-emerald-700">Action</p>
                    <p className="mt-1 font-semibold text-emerald-950">Directions</p>
                  </div>
                </div>
                <div className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-emerald-900">
                  <SearchCheck className="size-4" />
                  Finder recommendation ready
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-[21%] top-[34%] flex size-9 items-center justify-center rounded-full border-2 border-red-100 bg-red-600 text-white shadow-lg"
              >
                <MapPinOff className="size-4" />
              </motion.div>
              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                className="absolute left-[70%] top-[60%] flex size-9 items-center justify-center rounded-full border-2 border-emerald-100 bg-emerald-600 text-white shadow-lg"
              >
                <Route className="size-4" />
              </motion.div>
            </div>
          </div>
        </div>
      </MaxWidthWrapper>
    </section>
  );
}

