"use client";

import { motion } from "motion/react";
import { Grid } from "@/components/ui/grid";
import { DotsPattern } from "@/components/ui/dots-pattern";
import { ShimmerDots } from "@/components/ui/shimmer-dots";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { ButtonLink } from "./button-link";

const mapDots = [
  { left: "32%", top: "20%", status: "operational" },
  { left: "40%", top: "26%", status: "operational" },
  { left: "52%", top: "22%", status: "operational" },
  { left: "44%", top: "34%", status: "operational" },
  { left: "58%", top: "28%", status: "degraded" },
  { left: "36%", top: "42%", status: "operational" },
  { left: "48%", top: "38%", status: "operational" },
  { left: "62%", top: "36%", status: "operational" },
  { left: "42%", top: "48%", status: "non-functional" },
  { left: "53%", top: "44%", status: "operational" },
  { left: "34%", top: "56%", status: "operational" },
  { left: "46%", top: "52%", status: "degraded" },
  { left: "56%", top: "58%", status: "operational" },
  { left: "40%", top: "64%", status: "operational" },
  { left: "50%", top: "70%", status: "operational" },
  { left: "60%", top: "50%", status: "operational" },
  { left: "38%", top: "74%", status: "unknown" },
  { left: "48%", top: "80%", status: "operational" },
  { left: "55%", top: "45%", status: "operational" },
  { left: "30%", top: "38%", status: "operational" },
] as const;

const alerts = [
  {
    clinic: "Alexandra PHC",
    status: "Non-Functional",
    time: "2m ago",
    detail: "Stockout — ARV medication",
  },
  {
    clinic: "Mamelodi Clinic",
    status: "Degraded",
    time: "8m ago",
    detail: "Staff shortage — 2/5 nurses",
  },
];

const reportStream = [
  { clinic: "Diepsloot CHC", status: "Operational", time: "Just now" },
  { clinic: "Soshanguve CHC", status: "Operational", time: "1m ago" },
  { clinic: "Alexandra PHC", status: "Non-Functional", time: "2m ago" },
  { clinic: "Mamelodi Clinic", status: "Degraded", time: "8m ago" },
  { clinic: "Tembisa CHC", status: "Operational", time: "12m ago" },
  { clinic: "Katlehong Clinic", status: "Operational", time: "15m ago" },
];

const statusColors: Record<string, string> = {
  operational: "bg-green-500",
  degraded: "bg-amber-500",
  "non-functional": "bg-red-500",
  unknown: "bg-slate-400",
};

const statusTextColors: Record<string, string> = {
  Operational: "text-green-600",
  Degraded: "text-amber-600",
  "Non-Functional": "text-red-600",
};

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 sm:pb-32 sm:pt-40 lg:px-8">
      <Grid
        cellSize={80}
        patternOffset={[1, -58]}
        className="inset-[unset] left-1/2 top-0 w-[1200px] -translate-x-1/2 text-neutral-200/30 [mask-image:linear-gradient(transparent,black_70%)]"
      />
      <DotsPattern
        dotSize={1}
        gapSize={8}
        className="text-neutral-300/20 [mask-image:radial-gradient(closest-side,black,transparent)]"
      />
      <ShimmerDots
        dotSize={1}
        cellSize={2}
        speed={3}
        color={[0.05, 0.2, 0.1]}
        className="opacity-15 [mask-image:radial-gradient(closest-side,black,transparent)]"
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-600 shadow-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
            </span>
            Live — 3,500+ clinics monitored across 52 districts
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
          className="mx-auto max-w-[800px] font-display text-4xl font-medium leading-[1.1] tracking-tight text-neutral-900 sm:text-5xl lg:text-[56px]"
          style={{ textWrap: "balance" }}
        >
          Every clinic visit should start with{" "}
          <span className="bg-gradient-to-r from-[#0D7A6B] to-[#0FA89A] bg-clip-text text-transparent">
            knowing what&apos;s available.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
          className="mx-auto mt-6 max-w-[540px] text-base leading-relaxed text-neutral-500 sm:text-lg"
        >
          Real-time visibility into 3,500+ clinics across South Africa. So
          no patient travels to a closed door.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
          className="mt-8 flex items-center justify-center gap-2.5"
        >
          <ButtonLink href="/demo" variant="primary">
            Request Demo
            <svg
              className="ml-1 size-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </ButtonLink>
          <ButtonLink href="#product" variant="secondary">
            Watch Live Flow
          </ButtonLink>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
        className="relative mx-auto mt-16 max-w-[1000px]"
      >
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg ring-1 ring-black/5">
          <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/50 px-4 py-2.5">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full border border-neutral-300" />
              <div className="h-2.5 w-2.5 rounded-full border border-neutral-300" />
              <div className="h-2.5 w-2.5 rounded-full border border-neutral-300" />
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
              </span>
              <span className="text-[11px] font-medium text-green-600">Live</span>
            </div>
            <span className="text-[11px] text-neutral-400 tabular-nums">
              District Console · Gauteng Province
            </span>
          </div>

          <div className="grid min-h-[300px] grid-cols-1 md:grid-cols-3">
            <div className="relative flex flex-col border-b border-neutral-100 p-4 md:border-b-0 md:border-r md:p-5">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Clinic Status Map
              </div>
              <div className="relative flex-1 overflow-hidden rounded-lg border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                />
                {mapDots.map((dot, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.8 + i * 0.04, duration: 0.3 }}
                    className={`absolute rounded-full ${statusColors[dot.status]} ${
                      i === 4 || i === 8 ? "h-2.5 w-2.5" : "h-1.5 w-1.5"
                    }`}
                    style={{ left: dot.left, top: dot.top }}
                  >
                    {(i === 4 || i === 8) && (
                      <span className="absolute inset-[-4px] animate-ring-pulse rounded-full border-[1.5px] border-green-400/40" />
                    )}
                  </motion.span>
                ))}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="absolute bottom-2 left-2 right-2 flex justify-between text-[9px] font-medium text-neutral-400"
                >
                  <span>254 active in view</span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Operational
                  </span>
                </motion.div>
              </div>
            </div>

            <div className="flex flex-col border-b border-neutral-100 p-4 md:border-b-0 md:border-r md:p-5">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Live Report Stream
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="animate-infinite-scroll-y space-y-1.5" style={{ "--scroll": "-100%" } as React.CSSProperties}>
                  {[...reportStream, ...reportStream].map((report, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-md border border-neutral-100 bg-white px-2.5 py-1.5"
                    >
                      <div>
                        <div className="text-[12px] font-medium text-neutral-800">
                          {report.clinic}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {report.time}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-medium ${statusTextColors[report.status as keyof typeof statusTextColors]}`}
                      >
                        {report.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col p-4 md:p-5">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Active Alerts
              </div>
              <div className="flex flex-col gap-2.5">
                {alerts.map((alert, i) => (
                  <motion.div
                    key={alert.clinic}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + i * 0.15 }}
                    className="rounded-lg border border-red-100 bg-red-50/50 p-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium text-neutral-900">{alert.clinic}</span>
                      <span className="text-[10px] font-medium text-red-600">{alert.status}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-neutral-500">{alert.detail}</div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400">{alert.time}</span>
                      <span className="text-[10px] font-medium text-[#0D7A6B] cursor-pointer hover:underline">
                        Reroute patients →
                      </span>
                    </div>
                  </motion.div>
                ))}

                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
                  <div className="text-[12px] font-medium text-neutral-800">
                    District Health Score
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200">
                      <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-green-400" />
                    </div>
                    <span className="text-[12px] font-semibold text-neutral-700">78%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-neutral-200 sm:grid-cols-4">
            {[
              { value: "2,847", label: "Operational", color: "text-green-700" },
              { value: "287", label: "Degraded", color: "text-amber-700" },
              { value: "107", label: "Non-Functional", color: "text-red-700" },
              { value: "259", label: "Unknown", color: "text-slate-600" },
            ].map((counter, i) => (
              <motion.div
                key={counter.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + i * 0.1 }}
                className="border-b border-neutral-100 border-r px-5 py-3 text-center last:border-r-0 sm:border-b-0"
              >
                <div className={`text-lg font-semibold tabular-nums tracking-tight sm:text-xl ${counter.color}`}>
                  {counter.value}
                </div>
                <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-400 sm:text-[11px]">
                  {counter.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <ProgressiveBlur
        className="absolute bottom-0 left-0 right-0 h-48"
        side="top"
        strength={20}
        steps={4}
      />
    </section>
  );
}
