"use client";

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
  { value: "2,847", label: "Operational", color: "text-green-700" },
  { value: "287", label: "Degraded", color: "text-amber-700" },
  { value: "107", label: "Non-Functional", color: "text-red-700" },
  { value: "259", label: "Unknown", color: "text-slate-600" },
];

const dotColorMap: Record<string, string> = {
  operational: "bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.3)]",
  degraded: "bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.3)]",
  "non-functional": "bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.3)]",
  unknown: "bg-slate-400",
};

export function DemoCard() {
  return (
    <div className="mx-auto mt-16 max-w-[1000px] px-6 sm:px-0">
      <div className="relative">
        <div
          className="absolute -inset-10 rounded-full opacity-[0.08]"
          style={{
            background:
              "conic-gradient(from 180deg, #0D7A6B, #22c55e, #f59e0b, #ef4444, #0D7A6B)",
            filter: "blur(80px)",
          }}
        />
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
              </span>
              <span className="text-xs font-medium text-green-600">
                Live
              </span>
            </div>
            <span className="text-xs text-neutral-400 tabular-nums">
              District Console · Gauteng Province
            </span>
          </div>

          <div className="grid min-h-[320px] grid-cols-1 md:grid-cols-2">
            <div className="flex flex-col border-b border-neutral-100 p-5 md:border-b-0 md:border-r">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
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
                  <span
                    key={i}
                    className={`absolute rounded-full ${dotColorMap[dot.status]} ${
                      dot.highlighted ? "h-2.5 w-2.5" : "h-1.5 w-1.5"
                    }`}
                    style={{ left: dot.left, top: dot.top }}
                  >
                    {dot.highlighted && (
                      <span className="absolute inset-[-4px] animate-ring-pulse rounded-full border-[1.5px] border-green-400/40" />
                    )}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col p-5">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Recent Reports
              </div>
              <div className="flex flex-col gap-0">
                {clinicData.map((clinic) => (
                  <div
                    key={clinic.name}
                    className="flex items-center justify-between border-b border-neutral-100 py-2.5 last:border-b-0"
                  >
                    <div>
                      <div className="text-[13px] font-medium text-neutral-900">
                        {clinic.name}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {clinic.district}
                      </div>
                    </div>
                    <StatusBadge status={clinic.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-neutral-200 sm:grid-cols-4">
            {statusCounters.map((counter) => (
              <div
                key={counter.label}
                className="border-b border-neutral-100 border-r px-5 py-4 text-center last:border-r-0 sm:border-b-0"
              >
                <div className={`text-2xl font-semibold tabular-nums tracking-tight ${counter.color}`}>
                  {counter.value}
                </div>
                <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                  {counter.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
