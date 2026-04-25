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
    <section className="relative overflow-hidden border-t border-neutral-800 bg-neutral-900">
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-0 h-full w-full -translate-x-1/2" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(13,122,107,0.15) 0%, transparent 60%)" }} />
        <div className="absolute left-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-[#0D7A6B] opacity-[0.08] blur-[100px]" />
        <div className="absolute right-1/4 top-2/3 h-[300px] w-[300px] rounded-full bg-[#22c55e] opacity-[0.06] blur-[100px]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>
      <MaxWidthWrapper className="relative py-14 sm:py-16 lg:py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="font-display text-2xl font-medium leading-[1.15] tracking-tight text-white sm:text-3xl" style={{ textWrap: "balance" }}>
            Built to operate at <span className="bg-gradient-to-r from-[#22c55e] to-[#0FA89A] bg-clip-text text-transparent">national scale</span>
          </h2>
          <p className="mx-auto mt-3 max-w-[400px] text-sm text-white/50">
            Our infrastructure handles real-time data from thousands of clinics across all nine provinces, every day.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative"
              >
                <div className="mx-auto h-14 w-14">
                  <span className="absolute inset-0 animate-pulse-scale rounded-full bg-[#0D7A6B]/20" />
                </div>
                <div className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  <NumberFlow value={stat.value} />
                  <span className="bg-gradient-to-r from-[#22c55e] to-[#0FA89A] bg-clip-text text-transparent">{stat.suffix}</span>
                </div>
                <div className="mt-1.5 text-xs text-white/50">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </MaxWidthWrapper>
    </section>
  );
}
