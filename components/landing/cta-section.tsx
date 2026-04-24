"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GridSection } from "@/components/ui/grid-section";

export function CTASection() {
  return (
    <section className="relative border-b border-neutral-800 bg-neutral-900">
      <GridSection className="border-neutral-800" innerClassName="border-neutral-800">
        <div className="relative overflow-hidden py-8 text-center">
          <div
            className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                "conic-gradient(from 180deg, #0D7A6B, #22c55e, #f59e0b, #ef4444, #0D7A6B)",
              filter: "blur(120px)",
              opacity: 0.08,
              borderRadius: "50%",
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h2
              className="mx-auto mb-5 max-w-[600px] font-display text-3xl font-medium leading-[1.15] tracking-tight text-white sm:text-4xl"
              style={{ textWrap: "balance" }}
            >
              Start seeing what&apos;s really happening.
            </h2>
            <p className="mx-auto mb-8 max-w-[480px] text-base text-white/50">
              Join 120+ health organizations using ClinicPulse for real-time
              clinic intelligence across South Africa.
            </p>
            <Link
              href="/demo"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-neutral-900 transition-all hover:bg-neutral-50 hover:ring-4 hover:ring-white/10"
            >
              Request Demo
              <span aria-hidden="true">→</span>
            </Link>
          </motion.div>
        </div>
      </GridSection>
    </section>
  );
}
