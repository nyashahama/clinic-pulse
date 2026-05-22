import { TenantHealthBoard } from "@/components/product/tenant-health-board";
import {
  fetchAdminUsers,
  fetchOperationalClinics,
  fetchPendingReports,
  fetchPartnerReadiness,
  fetchSyncSummary,
} from "@/lib/demo/api-client";
import { buildTenantHealthViewModel } from "@/lib/product/tenant-health";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { getAdminLoaderOptions } from "../admin-loaders";

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  const options = await getAdminLoaderOptions();
  const [clinics, pendingReports, syncSummary, users, partnerReadiness] =
    await Promise.all([
      fetchOperationalClinics(options),
      fetchPendingReports(options),
      fetchSyncSummary(options),
      fetchAdminUsers(options),
      fetchPartnerReadiness(options),
    ]);
  const viewModel = buildTenantHealthViewModel({
    clinics,
    pendingReports,
    partnerReadiness,
    syncSummary,
    users,
  });

  return <TenantHealthBoard viewModel={viewModel} />;
}
