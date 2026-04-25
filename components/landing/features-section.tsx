"use client";

import { motion } from "motion/react";
import { MaxWidthWrapper } from "@/components/ui/max-width-wrapper";
import { Grid } from "@/components/ui/grid";
import Link from "next/link";

const capabilities = [
  {
    title: "Clinic Status API",
    description:
      "REST endpoint returning real-time status for any clinic by ID. Sub-100ms response, cached at edge.",
    href: "#",
    artifact: (
      <div className="rounded-md bg-neutral-900 p-2.5 font-mono text-[10px] text-green-400 leading-relaxed">
        <span className="text-blue-400">GET</span> /v1/clinics/{`{id}`}
        {"\n"}
        <span className="text-neutral-500">{`{`}</span>
        {"\n  "}<span className="text-amber-300">&quot;status&quot;</span>: <span className="text-green-300">&quot;operational&quot;</span>,
        {"\n  "}<span className="text-amber-300">&quot;staff&quot;</span>: <span className="text-purple-300">5</span>,
        {"\n  "}<span className="text-amber-300">&quot;stock&quot;</span>: <span className="text-purple-300">92</span>%
        {"\n"}<span className="text-neutral-500">{`}`}</span>
      </div>
    ),
  },
  {
    title: "Offline Sync Queue",
    description:
      "Reports queue locally in IndexedDB when offline. Auto-syncs with exponential backoff when connectivity returns.",
    href: "#",
    artifact: (
      <div className="flex items-center gap-3 rounded-md bg-neutral-50 px-2.5 py-2 ring-1 ring-neutral-200">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-100 text-[10px] font-bold text-amber-700">3</div>
        <div className="flex-1">
          <div className="text-[11px] font-medium text-neutral-700">Reports queued</div>
          <div className="h-1 mt-1 overflow-hidden rounded-full bg-neutral-200">
            <div className="h-full w-[65%] rounded-full bg-amber-400 animate-pulse" />
          </div>
        </div>
        <span className="text-[10px] text-neutral-400">Syncing...</span>
      </div>
    ),
  },
  {
    title: "Capacity Scoring",
    description:
      "Machine learning model predicts clinic load based on staff levels, stock data, time of day, and historical patterns.",
    href: "#",
    artifact: (
      <div className="flex items-center gap-2 rounded-md bg-neutral-50 px-2.5 py-2 ring-1 ring-neutral-200">
        <div className="text-[11px] font-medium text-neutral-600">Diepsloot CHC</div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-200">
            <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-green-400" />
          </div>
          <span className="text-[11px] font-semibold text-neutral-700">78%</span>
        </div>
      </div>
    ),
  },
  {
    title: "Routing Engine",
    description:
      "Patient referral logic: find nearest operational clinic by status, distance, and capacity. Integrates with Google Maps.",
    href: "#",
    artifact: (
      <div className="space-y-1 rounded-md bg-neutral-50 px-2.5 py-2 ring-1 ring-neutral-200">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-neutral-500">Patient: Sandton</span>
          <span className="text-green-600">Routed → Soweto CHC</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-neutral-400">
          <span>Clinic A: degraded (8.2km)</span>
          <span>→</span>
          <span className="font-medium text-green-600">Clinic B: operational (3.1km)</span>
        </div>
      </div>
    ),
  },
  {
    title: "Field Report Schema",
    description:
      "Standardized 5-field report: clinic ID, status, staff count, stock levels, notes. Validated at edge before queuing.",
    href: "#",
    artifact: (
      <div className="grid grid-cols-2 gap-1 rounded-md bg-neutral-50 p-2 ring-1 ring-neutral-200 text-[10px]">
        <span className="text-neutral-400">clinic_id</span>
        <span className="font-mono text-neutral-700">&quot;dsp-001&quot;</span>
        <span className="text-neutral-400">status</span>
        <span className="font-mono text-green-600">&quot;operational&quot;</span>
        <span className="text-neutral-400">staff_count</span>
        <span className="font-mono text-neutral-700">5</span>
        <span className="text-neutral-400">stock_level</span>
        <span className="font-mono text-neutral-700">92</span>
        <span className="text-neutral-400">notes</span>
        <span className="font-mono text-neutral-700">&quot;All clear&quot;</span>
      </div>
    ),
  },
  {
    title: "Audit Trail",
    description:
      "Every status change logged with timestamp and reporter. Immutable history for compliance and analysis.",
    href: "#",
    artifact: (
      <div className="space-y-1 rounded-md bg-neutral-50 p-2 ring-1 ring-neutral-200">
        {[
          { time: "14:32", event: "Status changed to operational", user: "S. Ndaba" },
          { time: "14:15", event: "Stock level updated: 92%", user: "S. Ndaba" },
          { time: "13:48", event: "Report submitted (offline queue)", user: "T. Mkhize" },
        ].map((row, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px]">
            <span className="font-mono text-neutral-400">{row.time}</span>
            <span className="text-neutral-600">{row.event}</span>
            <span className="ml-auto text-neutral-400">{row.user}</span>
          </div>
        ))}
      </div>
    ),
  },
];

export function FeaturesSection() {
  return (
    <section className="relative border-t border-neutral-200 bg-white" id="features">
      <Grid
        cellSize={60}
        patternOffset={[0, 0]}
        className="text-neutral-200/50 [mask-image:radial-gradient(closest-side,black,transparent)]"
      />
      <MaxWidthWrapper className="relative py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#0D7A6B]">
            Infrastructure
          </span>
          <h2 className="mt-6 font-display text-3xl font-medium leading-[1.15] tracking-tight text-neutral-900 sm:text-4xl" style={{ textWrap: "balance" }}>
            Built to operate under pressure
          </h2>
          <p className="mt-4 text-base text-neutral-500">
            Every component of ClinicPulse is designed for the realities of South African healthcare infrastructure — intermittent connectivity, high load, and life-critical decisions.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="group rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
            >
              <h3 className="text-sm font-semibold text-neutral-900">{cap.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">{cap.description}</p>
              <div className="mt-3 overflow-hidden rounded-lg">{cap.artifact}</div>
              <Link
                href={cap.href}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-neutral-400 transition-colors hover:text-[#0D7A6B]"
              >
                Learn more
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </motion.div>
          ))}
        </div>
      </MaxWidthWrapper>
    </section>
  );
}
