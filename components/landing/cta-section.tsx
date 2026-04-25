"use client";

import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { MaxWidthWrapper } from "@/components/ui/max-width-wrapper";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { ButtonLink } from "./button-link";

const stats = [
  { value: 3500, suffix: "+", label: "Clinics monitored" },
  { value: 12000, suffix: "+", label: "Reports processed monthly" },
  { value: 45000, suffix: "+", label: "Patients rerouted" },
];

export function CTASection() {
  return (
    <section className="relative overflow-hidden border-t border-neutral-800 bg-neutral-950">
      <ProgressiveBlur className="absolute top-0 left-0 right-0 h-32" side="bottom" strength={16} steps={3} />

      <MaxWidthWrapper className="relative py-16 sm:py-20 lg:py-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="font-display text-2xl font-medium leading-[1.15] tracking-tight text-white sm:text-3xl" style={{ textWrap: "balance" }}>
            Built to operate at national scale
          </h2>
          <p className="mx-auto mt-3 max-w-[400px] text-sm text-white/50">
            Real-time data from thousands of clinics across all nine provinces, every day.
          </p>

          <div className="mt-10 grid gap-0 sm:grid-cols-3">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="border-r border-white/[0.08] px-8 py-6 last:border-r-0"
              >
                <div className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  <NumberFlow value={stat.value} />
                  {stat.suffix}
                </div>
                <div className="mt-1 text-xs text-white/40">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="mx-auto mt-16 max-w-[600px]">
            <h3 className="font-display text-2xl font-medium leading-[1.15] tracking-tight text-white sm:text-3xl" style={{ textWrap: "balance" }}>
              See the clinic network before the crisis reaches the queue.
            </h3>
            <p className="mx-auto mt-4 max-w-[400px] text-sm text-white/50">
              Trusted by district health teams, NGOs, and field workers across all nine provinces.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <ButtonLink href="/demo" variant="primary">
                Request Demo
                <svg className="ml-1 size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </ButtonLink>
              <a href="#product" className="flex h-8 items-center rounded-lg border border-white/20 px-4 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                Explore product flow
              </a>
            </div>
          </div>
        </motion.div>
      </MaxWidthWrapper>
    </section>
  );
}
