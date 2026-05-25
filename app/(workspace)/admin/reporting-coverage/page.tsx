import { ReportingCoverageLedger } from "@/components/product/reporting-coverage-ledger";
import {
  fetchOperationalClinics,
  fetchPendingReports,
  fetchSyncSummary,
} from "@/lib/demo/api-client";
import { buildReportingCoverageViewModel } from "@/lib/product/reporting-coverage";
import { requireDashboardWorkflowAccess } from "../../workflow-guard";
import { getAdminLoaderOptions } from "../admin-loaders";

export default async function Page() {
  await requireDashboardWorkflowAccess("admin");

  const options = await getAdminLoaderOptions();
  const [clinics, pendingReports, syncSummary] = await Promise.all([
    fetchOperationalClinics(options),
    fetchPendingReports(options),
    fetchSyncSummary(options),
  ]);
  const viewModel = buildReportingCoverageViewModel({
    clinics,
    pendingReports,
    syncSummary,
  });

  return <ReportingCoverageLedger viewModel={viewModel} />;
}
