"use client";

import { motion } from "framer-motion";
import { GridSection } from "@/components/ui/grid-section";

const problems = [
  {
    title: "DHIS2 reports. It doesn't operate.",
    description:
      "The existing system captures data for national reporting — but it's not built for the field worker who needs to know if a clinic has medicine today.",
  },
  {
    title: "Data lives in silos",
    description:
      "Field worker reports, NGO contributions, and government datasets are separate systems. No single source of truth for clinic status exists.",
  },
  {
    title: "NHI raises the stakes",
    description:
      "The National Health Insurance rollout makes facility-level data quality critical. Without operational visibility, NHI can't route patients or allocate resources effectively.",
  },
];

export function ProblemSection() {
  return (
    <GridSection className="bg-white" id="problem">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#0D7A6B]">
            The Problem
          </p>
          <h2
            className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-neutral-900 sm:text-4xl"
            style={{ textWrap: "balance" }}
          >
            Patients travel to closed clinics. Districts fly blind.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-neutral-500">
            On any given day, hundreds of South Africa&apos;s 3,500+ public
            clinics are understaffed, out of stock, or overwhelmed. The data
            exists in DHIS2, but it&apos;s a reporting tool — not an operational
            layer.
          </p>
        </motion.div>

        <div className="flex flex-col gap-4">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                delay: i * 0.1,
                duration: 0.4,
                ease: "easeOut",
              }}
              className="rounded-xl border border-neutral-200 bg-neutral-50 p-5"
            >
              <h3 className="text-[15px] font-medium text-neutral-900">
                {problem.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                {problem.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </GridSection>
  );
}
