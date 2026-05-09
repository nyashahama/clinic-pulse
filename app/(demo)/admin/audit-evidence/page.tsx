import { ModulePlaceholderPage } from "@/components/demo/module-placeholder-page";
import { requireDemoWorkflowAccess } from "../../workflow-guard";

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  return (
    <ModulePlaceholderPage
      description="Governance evidence for status changes, access reviews, partner actions, and operator decisions."
      eyebrow="Organisation operations"
      nextSteps={[
    "Group audit events by clinic, user, and action type.",
    "Add filters for readiness, access, and partner activity.",
    "Make evidence exportable for implementation reviews.",
      ]}
      title="Audit evidence"
    />
  );
}
