"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-36 lg:px-8">
      {/* Grid background pattern */}
      <div
        className="absolute inset-0 mask-image-[linear-gradient(to_bottom,white_40%,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(13,122,107,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(13,122,107,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "linear-gradient(to bottom, white 40%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, white 40%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 shadow-sm"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
          </span>
          <span className="text-xs font-medium text-neutral-600">
            Live — 3,500+ clinics monitored across South Africa
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto mb-6 max-w-[800px] font-display text-4xl font-medium leading-[1.1] tracking-tight text-neutral-900 sm:text-5xl lg:text-[56px]"
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
          className="mx-auto mb-8 max-w-[540px] text-base leading-relaxed text-neutral-500 sm:text-lg"
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
          className="flex items-center justify-center gap-2.5"
        >
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-neutral-800 hover:ring-4 hover:ring-neutral-200"
          >
            Request Demo
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="#platform"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-600 shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
          >
            View Live Map
          </Link>
        </motion.div>
      </div>
    </section>
  );
}