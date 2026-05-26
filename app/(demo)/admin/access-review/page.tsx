import { AccessReviewWorkspace } from "@/components/product/admin-access-governance-workspace";
import { buildAccessGovernanceViewModel } from "@/lib/product/admin-access-governance";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminUsers } from "../admin-loaders";

const returnSource = "admin-access-review";

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  const users = await loadAdminUsers();
  const viewModel = buildAccessGovernanceViewModel(users, {
    detailReturnSource: returnSource,
  });

  return <AccessReviewWorkspace viewModel={viewModel} />;
}
