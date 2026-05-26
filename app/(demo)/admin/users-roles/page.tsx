import { AccessGovernanceWorkspace } from "@/components/product/admin-access-governance-workspace";
import { AdminUserLifecycle } from "@/components/product/admin-user-lifecycle";
import { buildAccessGovernanceViewModel } from "@/lib/product/admin-access-governance";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminUsers } from "../admin-loaders";
import {
  createPilotUserAction,
  revokeUserSessionsAction,
  setUserDisabledAction,
  updateUserAccessAction,
} from "./actions";

const returnSource = "admin-users-roles";

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  const users = await loadAdminUsers();
  const viewModel = buildAccessGovernanceViewModel(users, {
    detailReturnSource: returnSource,
  });

  return (
    <AccessGovernanceWorkspace viewModel={viewModel}>
      <AdminUserLifecycle
        users={users}
        detailReturnSource={returnSource}
        createUserAction={createPilotUserAction}
        updateUserAction={setUserDisabledAction}
        updateAccessAction={updateUserAccessAction}
        revokeSessionsAction={revokeUserSessionsAction}
      />
    </AccessGovernanceWorkspace>
  );
}
