"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Grid } from "@/components/ui/grid";
import { ButtonLink } from "./button-link";

const HERO_GRADIENT = `radial-gradient(77% 116% at 37% 67%, #EEA5BA, rgba(238, 165, 186, 0) 50%),
  radial-gradient(56% 84% at 34% 56%, #3A8BFD, rgba(58, 139, 253, 0) 50%),
  radial-gradient(85% 127% at 100% 100%, #E4C795, rgba(228, 199, 149, 0) 50%),
  radial-gradient(82% 122% at 3% 29%, #855AFC, rgba(133, 90, 252, 0) 50%),
  radial-gradient(90% 136% at 52% 100%, #FD3A4E, rgba(253, 58, 78, 0) 50%),
  radial-gradient(102% 143% at 92% 7%, #72FE7D, rgba(114, 254, 125, 0) 50%)`;

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-36 lg:px-8">
      <Grid
        cellSize={80}
        patternOffset={[1, -58]}
        className="inset-[unset] left-1/2 top-0 w-[1200px] -translate-x-1/2 text-neutral-200 [mask-image:linear-gradient(transparent,black_70%)]"
      />
      <div className="absolute -inset-x-10 bottom-0 h-[60%] opacity-30 blur-[100px] [transform:translate3d(0,0,0)]">
        <div
          className="size-full -scale-y-100 [mask-image:radial-gradient(closest-side,black_100%,transparent_100%)]"
          style={{ backgroundImage: HERO_GRADIENT }}
        />
      </div>

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
          <ButtonLink href="/demo" variant="primary">
            Request Demo <span aria-hidden="true">→</span>
          </ButtonLink>
          <ButtonLink href="#platform" variant="secondary">
            View Live Map
          </ButtonLink>
        </motion.div>
      </div>
    </section>
  );
}