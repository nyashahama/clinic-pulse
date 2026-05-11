import {
  AdminEvidenceTable,
  AdminFilterBar,
  AdminMetricStrip,
  AdminModuleHeader,
  type AdminTone,
} from "@/components/product/admin-module";
import type { AuthRole } from "@/lib/auth/api";
import type { AdminUserAccessApiResponse } from "@/lib/demo/api-types";
import { classifyAccessRisk } from "@/lib/product/admin-governance";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminUsers } from "../admin-loaders";
import {
  formatCount,
  formatDateTime,
  formatLabel,
  StatusBadge,
  toneForAttention,
} from "../governance-formatters";

const activeRoles = new Set<AuthRole>([
  "reporter",
  "district_manager",
  "org_admin",
  "system_admin",
]);

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

function getUserAccessRowKey(user: AdminUserAccessApiResponse) {
  return [
    user.userId,
    user.role,
    user.organisationId ?? "platform",
    user.district ?? "all-districts",
  ].join(":");
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
        description="Read-only operating view of user access, scopes, disabled accounts, and review posture."
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
      <AdminFilterBar>
        <StatusBadge tone="info">Read only</StatusBadge>
        <span className="text-sm text-muted-foreground">
          Role and scope changes are recorded through audit evidence, not this module.
        </span>
      </AdminFilterBar>
      <AdminEvidenceTable
        label="User role review"
        rows={rows}
        getRowKey={getUserAccessRowKey}
        columns={[
          {
            key: "user",
            header: "User",
            render: (row) => (
              <div className="min-w-0">
                <p className="font-medium text-foreground">{row.displayName}</p>
                <p className="break-all text-xs text-muted-foreground">{row.email}</p>
              </div>
            ),
          },
          {
            key: "role",
            header: "Role",
            render: (row) => <StatusBadge tone="info">{formatLabel(row.role)}</StatusBadge>,
          },
          {
            key: "scope",
            header: "Scope",
            render: (row) => row.district ?? row.organisationId ?? "Organisation",
          },
          {
            key: "state",
            header: "State",
            render: (row) => (
              <StatusBadge tone={row.disabledAt ? "blocked" : "clear"}>
                {row.disabledAt ? "Disabled" : "Active"}
              </StatusBadge>
            ),
          },
          {
            key: "lastSeen",
            header: "Last seen",
            render: (row) => formatDateTime(row.lastSeenAt),
          },
          {
            key: "review",
            header: "Review status",
            render: (row) => (
              <div className="space-y-1">
                <StatusBadge tone={row.risk.tone}>{row.risk.label}</StatusBadge>
                <p className="max-w-xs text-xs text-muted-foreground">
                  {row.risk.reasons.length ? row.risk.reasons.join("; ") : "No review flags"}
                </p>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
