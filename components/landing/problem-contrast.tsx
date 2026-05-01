"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { MessageCircleWarning, PhoneCall, Route, Table2, WifiOff } from "lucide-react";

import { MaxWidthWrapper } from "@/components/ui/max-width-wrapper";
import { demoImages } from "@/lib/demo/images";

const todayEvents = [
  { label: "Clinic calls district office", icon: PhoneCall },
  { label: "WhatsApp note says pharmacy stock is low", icon: MessageCircleWarning },
  { label: "Field report waits for signal", icon: WifiOff },
] as const;

const clinicPulseEvents = [
  { label: "Offline report queued", icon: WifiOff },
  { label: "District table changes status", icon: Table2 },
  { label: "Finder recommends alternative clinic", icon: Route },
] as const;

export function ProblemContrast() {
  return (
    <section id="problem" className="bg-[#f7f8f4]">
      <MaxWidthWrapper className="py-16 sm:py-20 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase text-[#0D7A6B]">
              The operating gap
            </p>
            <h2
              className="mt-4 font-display text-3xl font-medium leading-[1.12] text-neutral-950 sm:text-4xl"
              style={{ textWrap: "balance" }}
            >
              Clinic status changes in the real world before it changes in the system.
            </h2>
            <p className="mt-4 text-base leading-7 text-neutral-600">
              The landing page has to show the handoff: field signal, district visibility,
              public reroute, and audit record.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
              <div className="relative aspect-[16/10]">
                <Image
                  src={demoImages["mobile-field-report"].src}
                  alt={demoImages["mobile-field-report"].alt}
                  fill
                  sizes="(min-width: 1024px) 28rem, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-neutral-950">Before ClinicPulse</p>
                <div className="mt-3 grid gap-2">
                  {todayEvents.map((event, index) => {
                    const Icon = event.icon;

                    return (
                      <motion.div
                        key={event.label}
                        initial={{ opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ delay: index * 0.12, duration: 0.32 }}
                        className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700"
                      >
                        <Icon className="size-4 text-neutral-500" />
                        {event.label}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-emerald-200 bg-emerald-50 shadow-sm">
              <div className="relative aspect-[16/10]">
                <Image
                  src={demoImages["patient-routing-context"].src}
                  alt={demoImages["patient-routing-context"].alt}
                  fill
                  sizes="(min-width: 1024px) 28rem, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-emerald-950">With ClinicPulse</p>
                <div className="mt-3 grid gap-2">
                  {clinicPulseEvents.map((event, index) => {
                    const Icon = event.icon;

                    return (
                      <motion.div
                        key={event.label}
                        initial={{ opacity: 0, x: 12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ delay: index * 0.12, duration: 0.32 }}
                        className="flex items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs text-emerald-900"
                      >
                        <Icon className="size-4 text-emerald-700" />
                        {event.label}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </MaxWidthWrapper>
    </section>
  );
}

