import { notFound } from "next/navigation";

import {
  AdminDetailFieldGrid,
  AdminDetailShell,
} from "@/components/product/admin-detail";
import type { AuthRole } from "@/lib/auth/api";
import type { AdminUserAccessApiResponse } from "@/lib/demo/api-types";
import {
  getAdminReturnSource,
  getAdminReturnTarget,
  parseAdminNumericId,
  type AdminSearchParams,
} from "@/lib/product/admin-detail-routes";
import { classifyAccessRisk } from "@/lib/product/admin-governance";
import { requireDashboardWorkflowAccess } from "../../../workflow-guard";
import { loadAdminUsers } from "../../admin-loaders";
import {
  formatDateTime,
  formatLabel,
  StatusBadge,
} from "../../governance-formatters";

type UserDetailPageProps = {
  params: Promise<{
    userId: string;
  }>;
  searchParams: Promise<AdminSearchParams>;
};

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
      tone: "attention" as const,
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

function accountState(user: AdminUserAccessApiResponse) {
  return user.disabledAt ? "Disabled" : "Active";
}

export default async function Page({
  params,
  searchParams,
}: UserDetailPageProps) {
  await requireDashboardWorkflowAccess("admin");

  const [{ userId }, query, users] = await Promise.all([
    params,
    searchParams,
    loadAdminUsers(),
  ]);
  const parsedUserId = parseAdminNumericId(userId);

  if (!parsedUserId) {
    notFound();
  }

  const user = users.find((row) => row.userId === parsedUserId);

  if (!user) {
    notFound();
  }

  const risk = getRisk(user);
  const returnTarget = getAdminReturnTarget(getAdminReturnSource(query));

  return (
    <AdminDetailShell
      eyebrow="Administration"
      title="User detail"
      description={`${user.displayName} / ${user.email}`}
      returnHref={returnTarget.href}
      returnLabel={returnTarget.label}
    >
      <AdminDetailFieldGrid
        fields={[
          {
            label: "User",
            value: (
              <div>
                <p>{user.displayName}</p>
                <p className="break-all text-xs text-muted-foreground">{user.email}</p>
              </div>
            ),
          },
          {
            label: "Role",
            value: <StatusBadge tone="info">{formatLabel(user.role)}</StatusBadge>,
          },
          {
            label: "Account state",
            value: (
              <StatusBadge tone={user.disabledAt ? "blocked" : "clear"}>
                {accountState(user)}
              </StatusBadge>
            ),
          },
          {
            label: "Organisation",
            value: user.organisationId ? `Organisation ${user.organisationId}` : "Platform",
          },
          {
            label: "District",
            value: user.district ?? "All districts",
          },
          {
            label: "Last seen",
            value: formatDateTime(user.lastSeenAt),
          },
          {
            label: "Created",
            value: formatDateTime(user.createdAt),
          },
          {
            label: "Risk status",
            value: <StatusBadge tone={risk.tone}>{risk.label}</StatusBadge>,
          },
          {
            label: "Risk reasons",
            value: risk.reasons.length ? risk.reasons.join("; ") : "No review flags",
            className: "xl:col-span-2",
          },
        ]}
      />
    </AdminDetailShell>
  );
}
