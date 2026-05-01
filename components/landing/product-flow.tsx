"use client";

import { motion } from "motion/react";
import { ArrowRight, ClipboardList, DatabaseZap, Radio, Route, ShieldCheck, WifiOff } from "lucide-react";

import { MaxWidthWrapper } from "@/components/ui/max-width-wrapper";

const timeline = [
  { title: "Offline report", detail: "Mamelodi East / pharmacy stockout", icon: WifiOff },
  { title: "Status update", detail: "Operational -> non-functional", icon: Radio },
  { title: "District console", detail: "Alert opened / table refreshed", icon: DatabaseZap },
  { title: "Reroute", detail: "Akasia Hills Clinic recommended", icon: Route },
  { title: "Audit", detail: "Report source and timestamp recorded", icon: ShieldCheck },
] as const;

export function ProductFlow() {
  return (
    <section id="flow" className="border-y border-neutral-200 bg-neutral-950 text-white">
      <MaxWidthWrapper className="py-16 sm:py-20 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase text-emerald-300">
              Product flow
            </p>
            <h2
              className="mt-4 font-display text-3xl font-medium leading-[1.12] sm:text-4xl"
              style={{ textWrap: "balance" }}
            >
              The demo is one moving operating record.
            </h2>
            <p className="mt-4 text-base leading-7 text-white/60">
              Each event changes the next surface: field report, district console,
              public finder, audit trail.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="size-4 text-emerald-300" />
                <p className="text-sm font-semibold">Incident timeline</p>
              </div>
              <p className="font-mono text-xs text-white/40">YC_DEMO / LIVE_WALKTHROUGH</p>
            </div>

            <div className="relative grid gap-0 p-4">
              <motion.div
                className="absolute left-[2.15rem] top-8 h-[calc(100%-4rem)] w-px bg-emerald-300/30"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.4, ease: "easeOut" }}
                style={{ transformOrigin: "top" }}
              />

              {timeline.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ delay: index * 0.14, duration: 0.35 }}
                    className="relative grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 border-b border-white/10 py-4 last:border-b-0"
                  >
                    <span className="z-10 flex size-9 items-center justify-center rounded-md border border-emerald-300/30 bg-neutral-950 text-emerald-300">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-xs text-white/50">{item.detail}</p>
                    </div>
                    <ArrowRight className="size-4 text-white/30" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </MaxWidthWrapper>
    </section>
  );
}

