"use client";

import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { MaxWidthWrapper } from "@/components/ui/max-width-wrapper";

const stats = [
  { value: 3500, suffix: "+", label: "Clinics monitored" },
  { value: 12000, suffix: "+", label: "Reports processed monthly" },
  { value: 45000, suffix: "+", label: "Patients rerouted" },
];

export function ScaleSection() {
  return (
    <section className="relative overflow-hidden border-t border-neutral-800 bg-neutral-950">
      <MaxWidthWrapper className="relative py-14 sm:py-16 lg:py-20">
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
            Our infrastructure handles real-time data from thousands of clinics across all nine provinces, every day.
          </p>
          <div className="mt-10 grid gap-0 sm:grid-cols-3">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative border-r border-white/[0.08] px-8 py-6 last:border-r-0"
              >
                <div className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  <NumberFlow value={stat.value} />
                  {stat.suffix}
                </div>
                <div className="mt-1 text-xs text-white/40">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </MaxWidthWrapper>
    </section>
  );
}
