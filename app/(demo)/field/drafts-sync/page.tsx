import { ModulePlaceholderPage } from "@/components/demo/module-placeholder-page";
import { requireDemoWorkflowAccess } from "../../workflow-guard";

export default async function Page() {
  await requireDemoWorkflowAccess("field");

  return (
    <ModulePlaceholderPage
      description="Offline draft recovery page for queued field reports and retry state."
      eyebrow="Field workflow"
      nextSteps={[
    "List local drafts and sync attempts.",
    "Add retry, remove, and conflict detail actions.",
    "Show which reports already reached district state.",
      ]}
      title="Drafts and sync"
    />
  );
}
