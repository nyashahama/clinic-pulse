"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="px-6 pb-16 pt-32 sm:px-10 sm:pb-20 sm:pt-40 lg:px-0">
      <div className="mx-auto max-w-[1200px] text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-1.5"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
          </span>
          <span className="text-xs font-medium text-neutral-500">
            Live — 3,500+ clinics monitored
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto mb-6 max-w-[800px] font-display text-4xl font-medium leading-[1.1] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl"
          style={{ textWrap: "balance" }}
        >
          Know which clinics are{" "}
          <span className="bg-gradient-to-r from-[#0D7A6B] to-[#0FA89A] bg-clip-text text-transparent">
            working today.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
          className="mx-auto mb-10 max-w-[540px] text-lg leading-relaxed text-neutral-500"
        >
          Real-time visibility into South Africa&apos;s primary healthcare
          clinics. Status tracking, referral routing, and operational
          intelligence for NGOs, district managers, and patients.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
          className="flex items-center justify-center gap-3"
        >
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-900 bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-neutral-800 hover:ring-4 hover:ring-neutral-200"
          >
            Request Demo
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="#platform"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-500 transition-all hover:border-neutral-400 hover:text-neutral-900 hover:ring-4 hover:ring-neutral-200"
          >
            View Live Map
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
          className="mt-4 text-sm text-neutral-400"
        >
          Trusted by 120+ health organizations across 52 districts
        </motion.p>
      </div>
    </section>
  );
}
