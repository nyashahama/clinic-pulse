import {
  AdminMetricStrip,
  AdminModuleHeader,
  type AdminTone,
} from "@/components/product/admin-module";
import { AdminUserLifecycle } from "@/components/product/admin-user-lifecycle";
import type { AuthRole } from "@/lib/auth/api";
import type { AdminUserAccessApiResponse } from "@/lib/demo/api-types";
import { classifyAccessRisk } from "@/lib/product/admin-governance";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminUsers } from "../admin-loaders";
import {
  formatCount,
  toneForAttention,
} from "../governance-formatters";
import {
  createPilotUserAction,
  revokeUserSessionsAction,
  setUserDisabledAction,
  updateUserAccessAction,
} from "./actions";

const activeRoles = new Set<AuthRole>([
  "reporter",
  "district_manager",
  "org_admin",
  "system_admin",
]);
const returnSource = "admin-users-roles";

function isActiveRole(role: string): role is AuthRole {
  return activeRoles.has(role as AuthRole);
}

function getRisk(user: AdminUserAccessApiResponse) {
  if (!isActiveRole(user.role)) {
    return {
      tone: "attention" as AdminTone,
      label: "Review",
      reasons: ["Unrecognised role assignment"],
    };
  }

  return classifyAccessRisk({
    role: user.role,
    disabled: Boolean(user.disabledAt),
    district: user.district,
    lastSeenAt: user.lastSeenAt,
  });
}

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  const users = await loadAdminUsers();
  const rows = users.map((user) => ({ ...user, risk: getRisk(user) }));
  const privilegedUsers = users.filter((user) =>
    ["org_admin", "system_admin"].includes(user.role),
  ).length;
  const disabledUsers = users.filter((user) => Boolean(user.disabledAt)).length;
  const usersNeedingReview = rows.filter((row) => row.risk.reasons.length > 0).length;

  return (
    <div className="space-y-4">
      <AdminModuleHeader
        eyebrow="Administration"
        title="Users and roles"
        description="Pilot lifecycle management for user creation, access scopes, disabled accounts, and active sessions."
      />
      <AdminMetricStrip
        metrics={[
          { label: "Total users", value: formatCount(users.length), tone: "info" },
          {
            label: "Privileged users",
            value: formatCount(privilegedUsers),
            detail: "Organisation and system administrators",
            tone: toneForAttention(privilegedUsers),
          },
          {
            label: "Disabled users",
            value: formatCount(disabledUsers),
            tone: toneForAttention(disabledUsers),
          },
          {
            label: "Need review",
            value: formatCount(usersNeedingReview),
            detail: "Risk reasons from role, scope, account, and session data",
            tone: toneForAttention(usersNeedingReview),
          },
        ]}
      />
      <AdminUserLifecycle
        users={users}
        detailReturnSource={returnSource}
        createUserAction={createPilotUserAction}
        updateUserAction={setUserDisabledAction}
        updateAccessAction={updateUserAccessAction}
        revokeSessionsAction={revokeUserSessionsAction}
      />
    </div>
  );
}
