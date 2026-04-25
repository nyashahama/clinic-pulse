"use client";

import { motion } from "motion/react";
import { MaxWidthWrapper } from "@/components/ui/max-width-wrapper";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { ButtonLink } from "./button-link";

export function CTASection() {
  return (
    <section className="relative border-t border-neutral-800 bg-neutral-900">
      <ProgressiveBlur className="absolute top-0 left-0 right-0 h-32" side="bottom" strength={16} steps={3} />
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "conic-gradient(from 180deg, #0D7A6B, #22c55e, #f59e0b, #ef4444, #0D7A6B)", filter: "blur(120px)", opacity: 0.04 }} />
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      </div>
      <MaxWidthWrapper className="relative py-20 text-center sm:py-24 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mx-auto max-w-[600px] font-display text-3xl font-medium leading-[1.15] tracking-tight text-white sm:text-4xl" style={{ textWrap: "balance" }}>
            See the clinic network before the crisis reaches the queue.
          </h2>
          <p className="mx-auto mt-5 max-w-[480px] text-base text-white/50">
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
        </motion.div>
      </MaxWidthWrapper>
    </section>
  );
}
