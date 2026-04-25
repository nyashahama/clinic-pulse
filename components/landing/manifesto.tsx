"use client";

import { motion } from "motion/react";
import { MaxWidthWrapper } from "@/components/ui/max-width-wrapper";
import { StatusBadge } from "./status-badge";

const reportRows = [
  { clinic: "Mamelodi Clinic", status: "degraded" as const, time: "2m ago" },
  { clinic: "Soweto CHC", status: "operational" as const, time: "5m ago" },
  { clinic: "Alexandra PHC", status: "non-functional" as const, time: "8m ago" },
  { clinic: "Tembisa CHC", status: "operational" as const, time: "12m ago" },
  { clinic: "Diepsloot CHC", status: "operational" as const, time: "15m ago" },
];

export function Manifesto() {
  return (
    <section className="border-t border-neutral-200 bg-white">
      <MaxWidthWrapper className="py-16 sm:py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#0D7A6B]">
              The Problem
            </p>
            <h2 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-neutral-900 sm:text-4xl" style={{ textWrap: "balance" }}>
              Healthcare access is not just about facilities. It is about what is working today.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-neutral-500">
              On any given day, hundreds of South Africa&apos;s 3,500+ public clinics are understaffed, out of stock, or overwhelmed. The data exists — in DHIS2, in field reports, in WhatsApp groups — but it is spread across systems that were never designed to talk to each other.
            </p>
            <p className="mt-4 text-base leading-relaxed text-neutral-500">
              ClinicPulse connects these disconnected signals into a single operating layer. So district managers can redirect patients before they travel. So field workers can report from anywhere, even offline. So every clinic visit starts with knowing what&apos;s actually available.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col gap-3"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Live Clinic Reports
            </p>
            <div className="flex flex-col gap-2">
              {reportRows.map((row, i) => (
                <motion.div
                  key={row.clinic}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5"
                >
                  <div>
                    <div className="text-sm font-medium text-neutral-900">{row.clinic}</div>
                    <div className="text-xs text-neutral-400">{row.time}</div>
                  </div>
                  <StatusBadge status={row.status} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </MaxWidthWrapper>
    </section>
  );
}
