import { ModulePlaceholderPage } from "@/components/demo/module-placeholder-page";
import { requireDemoWorkflowAccess } from "../../workflow-guard";

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  return (
    <ModulePlaceholderPage
      description="Security operations surface for credentials, audit trails, and privileged platform activity."
      eyebrow="Platform operations"
      nextSteps={[
    "Summarize credentials, tokens, and webhook secrets.",
    "Add suspicious activity and privileged action views.",
    "Connect security evidence to platform audit exports.",
      ]}
      title="Security"
    />
  );
}
