import { ModulePlaceholderPage } from "@/components/demo/module-placeholder-page";
import { requireDemoWorkflowAccess } from "../../workflow-guard";

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  return (
    <ModulePlaceholderPage
      description="Platform access review for stale users, elevated permissions, and cross-tenant role assignments."
      eyebrow="Platform operations"
      nextSteps={[
    "Summarize privileged users and stale accounts.",
    "Add role-change audit evidence.",
    "Provide review completion and export actions.",
      ]}
      title="Access review"
    />
  );
}
