"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GridSection } from "@/components/ui/grid-section";
import { ButtonLink } from "./button-link";
import { Star, StarHalf } from "lucide-react";

const RATINGS = [
  { name: "G2", stars: 5, href: "https://www.g2.com/products/clinicpulse" },
  { name: "Product Hunt", stars: 5, href: "https://www.producthunt.com/products/clinicpulse" },
  { name: "Trustpilot", stars: 4.5, href: "https://www.trustpilot.com/review/clinicpulse.co" },
];

const LOGOS = [
  { name: "WHO", initials: "W" },
  { name: "Right to Care", initials: "RC" },
  { name: "BroadReach", initials: "BR" },
  { name: "Jhpiego", initials: "JP" },
  { name: "moms2", initials: "M2" },
  { name: "PEPFAR", initials: "PF" },
];

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
            <div className="mx-auto mb-8 flex w-fit items-center justify-center gap-8">
              {RATINGS.map(({ href, name, stars }, idx) => (
                <a
                  key={idx}
                  href={href}
                  target="_blank"
                  className="group flex flex-col items-center"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-800 text-xs font-bold text-neutral-400 group-hover:bg-neutral-700">
                    {name.charAt(0)}
                  </div>
                  <div className="mt-2 flex items-center gap-0.5">
                    {[...Array(Math.floor(stars))].map((_, idx) => (
                      <Star
                        key={idx}
                        fill="currentColor"
                        strokeWidth={0}
                        className="size-3.5 text-amber-500"
                      />
                    ))}
                    {stars % 1 > 0 && (
                      <StarHalf
                        fill="currentColor"
                        strokeWidth={0}
                        className="size-3.5 text-amber-500"
                      />
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-neutral-500">
                    {stars} out of 5
                  </p>
                </a>
              ))}
            </div>

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
            <div className="flex items-center justify-center gap-3">
              <ButtonLink href="/demo" variant="primary">
                Request Demo <span aria-hidden="true">→</span>
              </ButtonLink>
              <ButtonLink href="/platform" variant="secondary">
                View Live Map
              </ButtonLink>
            </div>

            <div className="mx-auto mt-16 flex max-w-xl flex-wrap items-center justify-center gap-x-10 gap-y-6">
              {LOGOS.map((logo) => (
                <div
                  key={logo.name}
                  className="flex items-center gap-2 opacity-40 grayscale transition-all duration-200 hover:opacity-70 hover:grayscale-0"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-neutral-700 text-[9px] font-bold text-neutral-400">
                    {logo.initials}
                  </div>
                  <span className="text-xs font-medium text-neutral-500">
                    {logo.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </GridSection>
    </section>
  );
}
