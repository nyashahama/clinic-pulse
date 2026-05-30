import { CircleCheckBig, CircleHelp, Clock4, Rocket } from "lucide-react";

import { SectionHeader } from "@/components/workspace/section-header";

type RoadmapEntry = {
  module: string;
  status: "done" | "running" | "planned";
  description: string;
  value: string;
};

const roadmap: RoadmapEntry[] = [
  {
    module: "District console and map operations",
    status: "done",
    value: "Critical for command credibility",
    description:
      "Real-time status, alert triage, report stream, and reroute recommendations for district operators.",
  },
  {
    module: "Public clinic finder",
    status: "done",
    value: "Validates public-facing value",
    description:
      "Search, status filtering, and direct reroute guidance without login for patients and caregivers.",
  },
  {
    module: "Field worker offline reporting",
    status: "done",
    value: "Demonstrates resilience",
    description:
      "Mobile-first form with queueing and delayed sync once connectivity is restored.",
  },
  {
    module: "Lead ops + operations pipeline",
    status: "running",
    value: "Needs polished admin handoff",
    description:
      "Lead statuses, booking intake, and exportable operations packets.",
  },
  {
    module: "Partner API + webhook layer",
    status: "planned",
    value: "Partner growth requirement",
    description:
      "Documented API contracts for provincial dashboards, telecom push, and EMS routing integrations.",
  },
  {
    module: "District role audit analytics",
    status: "planned",
    value: "Trust for operators and ministries",
    description:
      "Explainability and audit event timeline that links report source to routing decisions.",
  },
];

const statusTone: Record<RoadmapEntry["status"], { label: string; icon: typeof CircleCheckBig }> = {
  done: { label: "Done", icon: CircleCheckBig },
  running: { label: "Running", icon: Clock4 },
  planned: { label: "Planned", icon: CircleHelp },
};

function toneClass(status: RoadmapEntry["status"]) {
  switch (status) {
    case "done":
      return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100";
    case "running":
      return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100";
    case "planned":
      return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200";
    default:
      return "";
  }
}

function iconClass(status: RoadmapEntry["status"]) {
  switch (status) {
    case "done":
      return "text-emerald-700 dark:text-emerald-300";
    case "running":
      return "text-amber-700 dark:text-amber-300";
    case "planned":
      return "text-slate-700 dark:text-slate-300";
    default:
      return "";
  }
}

export function RoadmapModules() {
  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
      <SectionHeader
        eyebrow="Build direction"
        title="Roadmap modules"
        description="What is in scope for release-ready growth before backend handoff."
      />

      <div className="mt-4 grid gap-3">
        {roadmap.map((entry) => {
          const tone = statusTone[entry.status];
          const Icon = tone.icon;

          return (
            <article
              key={entry.module}
              className="rounded-lg border border-border-subtle bg-bg-subtle p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`size-4 ${iconClass(entry.status)}`} />
                    <p className="text-sm font-semibold text-content-emphasis">{entry.module}</p>
                  </div>
                  <p className="text-sm leading-6 text-content-default">{entry.description}</p>
                  <p className="text-xs text-content-subtle">
                    <span className="font-medium text-content-emphasis">Operating signal:</span>{" "}
                    {entry.value}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${
                    toneClass(entry.status)
                  }`}
                >
                  <Rocket className="size-3.5" />
                  {tone.label}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
