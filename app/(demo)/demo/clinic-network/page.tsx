import { ModulePlaceholderPage } from "@/components/demo/module-placeholder-page";
import { requireDemoWorkflowAccess } from "../../workflow-guard";

export default async function Page() {
  await requireDemoWorkflowAccess("demo");

  return (
    <ModulePlaceholderPage
      description="Network-level view for facility availability, reroute options, and district service coverage."
      eyebrow="District command"
      nextSteps={[
    "Expand the map into a dedicated network workspace.",
    "Add service availability and reroute filters.",
    "Show patient impact context by clinic and service.",
      ]}
      title="Clinic network"
    />
  );
}
