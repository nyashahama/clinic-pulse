import { ModulePlaceholderPage } from "@/components/demo/module-placeholder-page";
import { requireDashboardWorkflowAccess } from "../../workflow-guard";

export default async function Page() {
  await requireDashboardWorkflowAccess("demo");

  return (
    <ModulePlaceholderPage
      description="Dedicated triage queue for the district clinics that need the fastest intervention decisions."
      eyebrow="District command"
      nextSteps={[
    "Move severity-ranked clinic cards into this focused page.",
    "Add queue filters for service, status, and freshness.",
    "Connect selected clinic actions to interventions and handover.",
      ]}
      title="Severity queue"
    />
  );
}
