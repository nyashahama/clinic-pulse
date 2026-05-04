import { ArrowRight, ClipboardList } from "lucide-react";

import {
  LandingSection,
  LandingSectionHeader,
} from "@/components/landing/landing-section";
import { workflowSteps } from "@/lib/landing/openpanel-refactor-content";

export function WorkflowTimeline() {
  return (
    <LandingSection
      id="flow"
      className="border-y border-neutral-200 bg-neutral-950 text-white"
    >
      <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
        <LandingSectionHeader
          eyebrow="Product flow"
          title="One operating record from field report to audit trail."
          description="Each Clinic Pulse event updates the next surface: field report, district console, public finder, and audit history."
          className="[&_h2]:text-white [&_p:first-child]:text-emerald-300 [&_p:last-child]:text-white/60"
        />

        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="size-4 text-emerald-300" />
              <p className="text-sm font-semibold">Clinic Pulse workflow</p>
            </div>
            <p className="font-mono text-xs text-white/40">
              LIVE_DEMO / SEEDED_DATA
            </p>
          </div>
          <div className="grid gap-0 p-4">
            {workflowSteps.map((step, index) => (
              <div
                key={step.title}
                className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-white/10 py-4 last:border-b-0"
              >
                <span className="flex size-9 items-center justify-center rounded-md border border-emerald-300/30 bg-neutral-950 font-mono text-xs text-emerald-300">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                  <p className="mt-1 text-xs leading-5 text-white/50">
                    {step.description}
                  </p>
                  <p className="mt-1 font-mono text-xs text-emerald-200/80">
                    {step.detail}
                  </p>
                </div>
                <ArrowRight className="size-4 text-white/30" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
