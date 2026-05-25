import { AdminModuleHeader } from "@/components/product/admin-module";
import Link from "next/link";
import { requireDashboardWorkflowAccess } from "../../workflow-guard";
import { loadAdminPartnerReadiness } from "../admin-loaders";
import { PartnerReadinessPageClient } from "./page-client";

export default async function Page() {
  await requireDashboardWorkflowAccess("admin");

  const partnerReadiness = await loadAdminPartnerReadiness();

  return (
    <div className="space-y-4">
      <AdminModuleHeader
        eyebrow="Organisation operations"
        title="Partner readiness"
        description="Partner handoff workspace for API keys, exports, webhooks, and integration check evidence."
      />
      <p className="rounded-lg border border-border-subtle bg-bg-default p-3 text-xs text-content-subtle shadow-sm">
        Pilot safety: exported data depends on source freshness, review state, and
        sync evidence.{" "}
        <Link href="/legal/safety" className="underline">
          Read safety notes
        </Link>
        .
      </p>
      <PartnerReadinessPageClient readiness={partnerReadiness} />
    </div>
  );
}
