import { ModulePlaceholderPage } from "@/components/demo/module-placeholder-page";
import { requireDemoWorkflowAccess } from "../../workflow-guard";

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  return (
    <ModulePlaceholderPage
      description="Integration control surface for partner credentials, webhook delivery, exports, and API health."
      eyebrow="Administration"
      nextSteps={[
    "Split API keys, webhooks, and export packages into tabs.",
    "Add delivery health and retry visibility.",
    "Connect integration checks to partner readiness scoring.",
      ]}
      title="Integrations"
    />
  );
}
