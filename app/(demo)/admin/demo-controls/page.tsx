import { ModulePlaceholderPage } from "@/components/demo/module-placeholder-page";
import { requireDemoWorkflowAccess } from "../../workflow-guard";

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  return (
    <ModulePlaceholderPage
      description="Controlled demo reset and scenario management area separated from operational review flows."
      eyebrow="Platform operations"
      nextSteps={[
    "Move reset and scenario controls out of the admin overview.",
    "Add seeded scenario presets for demos.",
    "Record every reset and scenario action in audit evidence.",
      ]}
      title="Demo controls"
    />
  );
}
