import { ModulePlaceholderPage } from "@/components/demo/module-placeholder-page";
import { requireDashboardWorkflowAccess } from "../../workflow-guard";

export default async function Page() {
  await requireDashboardWorkflowAccess("demo");

  return (
    <ModulePlaceholderPage
      description="Intervention planning area for reroutes, field verification, escalation owners, and follow-up evidence."
      eyebrow="District command"
      nextSteps={[
    "List active intervention plans by clinic.",
    "Add owner, next action, and expected outcome tracking.",
    "Tie intervention completion to audit evidence.",
      ]}
      title="Interventions"
    />
  );
}
