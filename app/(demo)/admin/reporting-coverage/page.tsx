import { ModulePlaceholderPage } from "@/components/demo/module-placeholder-page";
import { requireDemoWorkflowAccess } from "../../workflow-guard";

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  return (
    <ModulePlaceholderPage
      description="Coverage review for district reports, offline queue confidence, stale clinics, and validation evidence."
      eyebrow="Organisation operations"
      nextSteps={[
    "Connect coverage metrics to report freshness by clinic.",
    "Expose unresolved validation failures and stale status records.",
    "Add exportable evidence for readiness review.",
      ]}
      title="Reporting coverage"
    />
  );
}
