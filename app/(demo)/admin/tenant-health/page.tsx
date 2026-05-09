import { ModulePlaceholderPage } from "@/components/demo/module-placeholder-page";
import { requireDemoWorkflowAccess } from "../../workflow-guard";

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  return (
    <ModulePlaceholderPage
      description="Platform tenant health overview for system admins reviewing ingestion, readiness, and account state."
      eyebrow="Platform operations"
      nextSteps={[
    "List tenant workspaces with health status.",
    "Show ingestion freshness and alert counts per tenant.",
    "Add tenant drill-down and support handoff actions.",
      ]}
      title="Tenant health"
    />
  );
}
