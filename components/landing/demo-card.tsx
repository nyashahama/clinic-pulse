"use client";

import { motion } from "framer-motion";
import { StatusBadge } from "./status-badge";

const clinicData = [
  { name: "Diepsloot CHC", district: "City of Johannesburg", status: "operational" as const },
  { name: "Mamelodi Clinic", district: "City of Tshwane", status: "degraded" as const },
  { name: "Alexandra PHC", district: "City of Johannesburg", status: "non-functional" as const },
  { name: "Soshanguve CHC", district: "City of Tshwane", status: "operational" as const },
];

const mapDots = [
  { left: "32%", top: "20%", status: "operational", highlighted: false },
  { left: "40%", top: "26%", status: "operational", highlighted: true },
  { left: "52%", top: "22%", status: "operational", highlighted: false },
  { left: "44%", top: "34%", status: "operational", highlighted: false },
  { left: "58%", top: "28%", status: "degraded", highlighted: true },
  { left: "36%", top: "42%", status: "operational", highlighted: false },
  { left: "48%", top: "38%", status: "operational", highlighted: false },
  { left: "62%", top: "36%", status: "operational", highlighted: false },
  { left: "42%", top: "48%", status: "non-functional", highlighted: true },
  { left: "53%", top: "44%", status: "operational", highlighted: false },
  { left: "34%", top: "56%", status: "operational", highlighted: false },
  { left: "46%", top: "52%", status: "degraded", highlighted: false },
  { left: "56%", top: "58%", status: "operational", highlighted: false },
  { left: "40%", top: "64%", status: "operational", highlighted: false },
  { left: "50%", top: "70%", status: "operational", highlighted: false },
  { left: "60%", top: "50%", status: "operational", highlighted: false },
  { left: "38%", top: "74%", status: "unknown", highlighted: false },
  { left: "48%", top: "80%", status: "operational", highlighted: false },
  { left: "55%", top: "45%", status: "operational", highlighted: false },
  { left: "30%", top: "38%", status: "operational", highlighted: false },
] as const;

const statusCounters = [
  { value: "2,847", label: "Operational", color: "text-green-700", change: "+12" },
  { value: "287", label: "Degraded", color: "text-amber-700", change: "+3" },
  { value: "107", label: "Non-Functional", color: "text-red-700", change: "-5" },
  { value: "259", label: "Unknown", color: "text-slate-600", change: "0" },
];

const dotColorMap: Record<string, string> = {
  operational: "bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.3)]",
  degraded: "bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.3)]",
  "non-functional": "bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.3)]",
  unknown: "bg-slate-400",
};

export function DemoCard() {
  return (
    <div className="mx-auto mt-12 max-w-[1000px] px-4 sm:px-6 lg:px-8">
      <div className="relative">
        <div
          className="absolute -left-20 -right-20 -top-20 -bottom-8 rounded-full opacity-[0.07]"
          style={{
            background:
              "conic-gradient(from 180deg, #0D7A6B, #22c55e, #f59e0b, #ef4444, #0D7A6B)",
            filter: "blur(100px)",
          }}
        />
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
          {/* Window chrome */}
          <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="h-2 w-2 rounded-full border border-neutral-300" />
                <div className="h-2 w-2 rounded-full border border-neutral-300" />
                <div className="h-2 w-2 rounded-full border border-neutral-300" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
              </span>
              <span className="text-[11px] font-medium text-green-600">
                Live
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 tabular-nums">
              District Console · Gauteng Province
            </span>
          </div>

          <div className="grid min-h-[320px] grid-cols-1 md:grid-cols-2">
            <div className="flex flex-col border-b border-neutral-100 p-4 md:border-b-0 md:border-r md:p-5">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Clinic Status Map
              </div>
              <div className="relative flex-1 overflow-hidden rounded-lg border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)",
                    backgroundSize: "30px 30px",
                  }}
                />
                {mapDots.map((dot, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: Math.random() * 0.5,
                      duration: 0.3,
                    }}
                    className={`absolute rounded-full ${dotColorMap[dot.status]} ${
                      dot.highlighted ? "h-2.5 w-2.5" : "h-1.5 w-1.5"
                    }`}
                    style={{ left: dot.left, top: dot.top }}
                  >
                    {dot.highlighted && (
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
                  <span>254 active</span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Operational
                  </span>
                </motion.div>
              </div>
            </div>

            <div className="flex flex-col p-4 md:p-5">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Recent Reports
              </div>
              <div className="flex flex-col gap-0">
                {clinicData.map((clinic, i) => (
                  <motion.div
                    key={clinic.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="flex items-center justify-between border-b border-neutral-100 py-2 last:border-b-0 md:py-2.5"
                  >
                    <div>
                      <div className="text-[13px] font-medium text-neutral-900">
                        {clinic.name}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {clinic.district}
                      </div>
                    </div>
                    <StatusBadge status={clinic.status} />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-neutral-200 sm:grid-cols-4">
            {statusCounters.map((counter, i) => (
              <motion.div
                key={counter.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + i * 0.1 }}
                className="border-b border-neutral-100 border-r px-4 py-3.5 text-center last:border-r-0 sm:border-b-0 sm:px-5 sm:py-4"
              >
                <div className={`text-lg font-semibold tabular-nums tracking-tight sm:text-2xl ${counter.color}`}>
                  {counter.value}
                  <span className="ml-1 text-[10px] text-neutral-400">
                    {counter.change !== "0" && (
                      <span className={counter.change.startsWith("+") ? "text-green-500" : "text-red-500"}>
                        {counter.change}
                      </span>
                    )}
                  </span>
                </div>
                <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-400 sm:text-[11px]">
                  {counter.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}