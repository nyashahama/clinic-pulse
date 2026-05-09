import { ModulePlaceholderPage } from "@/components/demo/module-placeholder-page";
import { requireDemoWorkflowAccess } from "../../workflow-guard";

export default async function Page() {
  await requireDemoWorkflowAccess("field");

  return (
    <ModulePlaceholderPage
      description="Focused field report submission page for the selected route and clinic visit."
      eyebrow="Field workflow"
      nextSteps={[
    "Move the report form into this focused submission route.",
    "Preserve offline-safe draft handling.",
    "Show selected clinic context and last sync status.",
      ]}
      title="Submit report"
    />
  );
}
