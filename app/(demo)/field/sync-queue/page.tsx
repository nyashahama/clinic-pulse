import { ModulePlaceholderPage } from "@/components/demo/module-placeholder-page";
import { requireDemoWorkflowAccess } from "../../workflow-guard";

export default async function Page() {
  await requireDemoWorkflowAccess("field");

  return (
    <ModulePlaceholderPage
      description="Offline-safe sync queue for reporters working across unreliable connectivity."
      eyebrow="Field workflow"
      nextSteps={[
    "Show queued, syncing, failed, and synced report states.",
    "Add manual retry and network status controls.",
    "Explain how district users receive synced reports.",
      ]}
      title="Sync queue"
    />
  );
}
