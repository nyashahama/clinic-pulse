import { ModulePlaceholderPage } from "@/components/demo/module-placeholder-page";
import { requireDemoWorkflowAccess } from "../../workflow-guard";

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  return (
    <ModulePlaceholderPage
      description="Partner handoff workspace for API keys, exports, webhooks, and integration check evidence."
      eyebrow="Organisation operations"
      nextSteps={[
    "Move partner readiness actions into this dedicated module.",
    "Add API key and webhook lifecycle tables.",
    "Show export history and integration status checks together.",
      ]}
      title="Partner readiness"
    />
  );
}
