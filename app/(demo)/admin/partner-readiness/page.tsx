import { AdminModuleHeader } from "@/components/product/admin-module";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminPartnerReadiness } from "../admin-loaders";
import { PartnerReadinessPageClient } from "./page-client";

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  const partnerReadiness = await loadAdminPartnerReadiness();

  return (
    <div className="space-y-4">
      <AdminModuleHeader
        eyebrow="Organisation operations"
        title="Partner readiness"
        description="Partner handoff workspace for API keys, exports, webhooks, and integration check evidence."
      />
      <PartnerReadinessPageClient readiness={partnerReadiness} />
    </div>
  );
}
