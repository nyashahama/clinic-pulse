import {
  LandingSection,
  LandingSectionHeader,
} from "@/components/landing/landing-section";
import { WorkflowIncidentPanel } from "@/components/landing/workflow-incident-panel";

export function WorkflowTimeline() {
  return (
    <LandingSection id="flow" className="border-y border-neutral-200">
      <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
        <LandingSectionHeader
          eyebrow="Product flow"
          title="One operating record from field report to audit trail."
          description="A single clinic incident moves through the field report queue, district alert, patient reroute, and audit ledger without losing source or freshness."
        />
        <WorkflowIncidentPanel />
      </div>
    </LandingSection>
  );
}
