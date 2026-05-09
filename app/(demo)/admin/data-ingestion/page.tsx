import { ModulePlaceholderPage } from "@/components/demo/module-placeholder-page";
import { requireDemoWorkflowAccess } from "../../workflow-guard";

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  return (
    <ModulePlaceholderPage
      description="Ingestion monitoring for API sync, offline report merge status, validation failures, and stale queues."
      eyebrow="Platform operations"
      nextSteps={[
    "Show ingestion jobs and recent merge attempts.",
    "Surface queued reports and validation failures.",
    "Add retry and incident handoff controls.",
      ]}
      title="Data ingestion"
    />
  );
}
