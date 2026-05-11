import {
  AdminEmptyState,
  AdminEvidenceTable,
  AdminFilterBar,
  AdminMetricStrip,
  AdminModuleHeader,
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

function getReviewReasons(user: AdminUserAccessApiResponse) {
  if (!isActiveRole(user.role)) {
    return ["Unrecognised role assignment"];
  }

  return classifyAccessRisk({
    role: user.role,
    disabled: Boolean(user.disabledAt),
    district: user.district,
    lastSeenAt: user.lastSeenAt,
  }).reasons;
}

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  const users = await loadAdminUsers();
  const reviewRows = users
    .map((user) => ({ ...user, reasons: getReviewReasons(user) }))
    .filter((user) => user.reasons.length > 0);
  const privilegedAccess = users.filter((user) =>
    ["org_admin", "system_admin"].includes(user.role),
  ).length;
  const staleSessions = users.filter((user) => !user.lastSeenAt).length;
  const missingDistrictScope = users.filter(
    (user) => user.role === "district_manager" && !user.district,
  ).length;
  const disabledAccounts = users.filter((user) => Boolean(user.disabledAt)).length;

  return (
    <div className="space-y-4">
      <AdminModuleHeader
        eyebrow="Platform operations"
        title="Access review"
        description="Read-only queue for access risks. Review records should be captured through audit evidence."
      />
      <AdminMetricStrip
        metrics={[
          {
            label: "Privileged access",
            value: formatCount(privilegedAccess),
            detail: "Organisation and system administrator roles",
            tone: toneForAttention(privilegedAccess),
          },
          {
            label: "Stale or no session",
            value: formatCount(staleSessions),
            tone: toneForAttention(staleSessions),
          },
          {
            label: "Missing district scope",
            value: formatCount(missingDistrictScope),
            tone: toneForAttention(missingDistrictScope),
          },
          {
            label: "Disabled accounts",
            value: formatCount(disabledAccounts),
            tone: toneForAttention(disabledAccounts),
          },
        ]}
      />
      <AdminFilterBar>
        <StatusBadge tone="info">Read only</StatusBadge>
        <span className="text-sm text-muted-foreground">
          Use audit evidence as the review record path for access decisions.
        </span>
      </AdminFilterBar>
      <AdminEvidenceTable
        label="Access review queue"
        rows={reviewRows}
        getRowKey={(row) => String(row.userId)}
        emptyState={
          <AdminEmptyState
            title="No access risks in the current operating evidence"
            description="Active users have recognised roles, scoped district access where required, recent session evidence, and no disabled account flags."
          />
        }
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
            render: (row) => row.district ?? row.organisationId ?? "Unavailable",
          },
          {
            key: "reasons",
            header: "Risk reasons",
            render: (row) => (
              <p className="max-w-sm text-sm text-muted-foreground">
                {row.reasons.join("; ")}
              </p>
            ),
          },
          {
            key: "lastSeen",
            header: "Last seen",
            render: (row) => formatDateTime(row.lastSeenAt),
          },
          {
            key: "record",
            header: "Review record",
            render: () => "Record decision in audit evidence",
          },
        ]}
      />
    </div>
  );
}
