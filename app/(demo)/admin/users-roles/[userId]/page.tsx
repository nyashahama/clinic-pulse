import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
} from "lucide-react";

import {
  AdminDetailFieldGrid,
  AdminDetailShell,
  AdminDetailSignalBar,
  AdminDetailEvidenceList,
  AdminDetailTimeline,
} from "@/components/product/admin-detail";
import { type AdminTone } from "@/components/product/admin-module";
import type { AuthRole } from "@/lib/auth/api";
import type { AdminUserAccessApiResponse } from "@/lib/demo/api-types";
import {
  getAdminReturnSource,
  getAdminReturnTarget,
  parseAdminNumericId,
  type AdminSearchParams,
} from "@/lib/product/admin-detail-routes";
import { classifyAccessRisk } from "@/lib/product/admin-governance";
import { cn } from "@/lib/utils";
import { requireDemoWorkflowAccess } from "../../../workflow-guard";
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

function accountState(user: AdminUserAccessApiResponse) {
  return user.disabledAt ? "Disabled" : "Active";
}

export default async function Page({
  params,
  searchParams,
}: UserDetailPageProps) {
  await requireDemoWorkflowAccess("admin");

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
      <AdminDetailSignalBar
        signals={[
          {
            label: "Account state",
            value: accountState(user),
            detail: user.disabledAt
              ? `Disabled ${formatDateTime(user.disabledAt)}`
              : "Account is active and accessible",
            tone: user.disabledAt ? "blocked" : "clear",
          },
          {
            label: "Role",
            value: formatLabel(user.role),
            detail: user.organisationId
              ? `Organisation ${user.organisationId}`
              : "Platform-wide access",
            tone: "info",
          },
          {
            label: "District scope",
            value: user.district ?? "All districts",
            detail: user.district
              ? "Scoped to specific district"
              : "No district restriction",
            tone: user.district ? "clear" : "info",
          },
          {
            label: "Risk status",
            value: risk.label,
            detail: risk.reasons.length
              ? risk.reasons.join("; ")
              : "No review flags",
            tone: risk.tone,
          },
        ]}
      />

      <AdminDetailFieldGrid
        fields={[
          {
            label: "User",
            value: (
              <div>
                <p className="font-medium">{user.displayName}</p>
                <p className="break-all text-xs text-muted-foreground">{user.email}</p>
              </div>
            ),
          },
          {
            label: "User ID",
            value: (
              <code className="rounded-md bg-bg-muted px-2 py-1 text-xs font-mono">
                {user.userId}
              </code>
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
        ]}
      />

      <AdminDetailEvidenceList
        title="Risk assessment"
        description="Access risk classification based on role, scope, and session evidence"
        items={[
          {
            label: "Risk level",
            value: (
              <StatusBadge tone={risk.tone}>{risk.label}</StatusBadge>
            ),
            emphasis: true,
          },
          {
            label: "Risk reasons",
            value: risk.reasons.length ? risk.reasons.join("; ") : "No review flags",
          },
          {
            label: "Role assignment",
            value: isActiveRole(user.role)
              ? "Recognised role"
              : "Unrecognised role assignment",
          },
          {
            label: "Session freshness",
            value: user.lastSeenAt
              ? `Last active ${formatDateTime(user.lastSeenAt)}`
              : "No session evidence",
          },
        ]}
      />

      <AdminDetailTimeline
        title="User lifecycle"
        description="Key events in this user's access history"
        items={[
          {
            label: "Account created",
            title: "User account provisioned",
            description: `Account created for ${user.email}`,
            timestamp: formatDateTime(user.createdAt),
            tone: "info",
          },
          ...(user.lastSeenAt
            ? [
                {
                  label: "Last activity",
                  title: "Most recent session",
                  description: "User last accessed the system",
                  timestamp: formatDateTime(user.lastSeenAt),
                  tone: "clear" as AdminTone,
                },
              ]
            : []),
          ...(user.disabledAt
            ? [
                {
                  label: "Account disabled",
                  title: "Access revoked",
                  description: "Account was disabled by an administrator",
                  timestamp: formatDateTime(user.disabledAt),
                  tone: "blocked" as AdminTone,
                },
              ]
            : []),
          ...(risk.reasons.length > 0
            ? [
                {
                  label: "Risk flagged",
                  title: "Access review required",
                  description: risk.reasons.join("; "),
                  timestamp: undefined,
                  tone: risk.tone,
                },
              ]
            : []),
        ]}
      />

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/users-roles"
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-default px-3 py-2 text-sm font-medium text-foreground transition hover:bg-bg-muted"
          )}
        >
          <ArrowLeftIcon className="size-4" />
          Back to users
        </Link>
        <Link
          href="/admin/access-review"
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-default px-3 py-2 text-sm font-medium text-foreground transition hover:bg-bg-muted"
          )}
        >
          <ShieldCheckIcon className="size-4" />
          Access review
        </Link>
      </div>
    </AdminDetailShell>
  );
}
