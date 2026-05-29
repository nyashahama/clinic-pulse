import Link from "next/link";
import {
  ActivityIcon,
  ClockIcon,
  ShieldCheckIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";

import { AdminStatusBadge, type AdminTone } from "@/components/product/admin-module";
import { CreatePilotUserForm } from "./create-pilot-user-form";
import { UsersTableClient } from "./users-table-client";

import { buttonVariants } from "@/components/ui/button";
import type { AuthRole } from "@/lib/auth/api";
import type { AdminUserAccessApiResponse } from "@/lib/demo/api-types";
import { classifyAccessRisk } from "@/lib/product/admin-governance";
import { cn } from "@/lib/utils";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminUsers } from "../admin-loaders";
import { formatCount, formatDateTime, formatLabel } from "../governance-formatters";
import {
  createPilotUserAction,
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

function plural(value: number, singular: string, pluralLabel = `${singular}s`) {
  return `${formatCount(value)} ${value === 1 ? singular : pluralLabel}`;
}

function getLatestUserActivityLabel(users: AdminUserAccessApiResponse[]) {
  const latest = users
    .flatMap((user) => [user.lastSeenAt, user.createdAt])
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => right.getTime() - left.getTime())[0];

  return latest ? formatDateTime(latest.toISOString()) : "Unavailable";
}

function getRoleDistribution(users: AdminUserAccessApiResponse[]) {
  const distribution: Record<string, number> = {};
  users.forEach((user) => {
    const role = isActiveRole(user.role) ? user.role : "unknown";
    distribution[role] = (distribution[role] || 0) + 1;
  });
  return distribution;
}

function getRecentActivity(users: AdminUserAccessApiResponse[]) {
  return users
    .filter((user) => user.lastSeenAt)
    .sort((a, b) => (b.lastSeenAt || "").localeCompare(a.lastSeenAt || ""))
    .slice(0, 5);
}

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  const users = await loadAdminUsers();
  const rows = users.map((user) => ({ ...user, risk: getRisk(user) }));
  const activeUsers = users.filter((user) => !user.disabledAt).length;
  const privilegedUsers = users.filter((user) =>
    ["org_admin", "system_admin"].includes(user.role),
  ).length;
  const usersNeedingReview = rows.filter((row) => row.risk.reasons.length > 0).length;
  const staleSessions = users.filter((user) => !user.lastSeenAt).length;
  const latestActivityLabel = getLatestUserActivityLabel(users);
  const roleDistribution = getRoleDistribution(users);
  const recentActivity = getRecentActivity(users);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-neutral-900 bg-neutral-950 text-white shadow-sm">
        <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <UsersIcon className="size-5 text-neutral-400" />
              <p className="text-xs font-semibold uppercase tracking-normal text-neutral-400">
                Access lifecycle
              </p>
            </div>
            <h1 className="mt-2 break-words text-2xl font-semibold leading-tight sm:text-3xl">
              Users and roles
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-300">
              Manage pilot users, role assignments, and access lifecycle across the organisation.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-normal text-neutral-400">
                  Active blocker
                </p>
                <p className="mt-1 break-words text-xl font-semibold">
                  {usersNeedingReview > 0
                    ? `${plural(usersNeedingReview, "user")} need access review`
                    : "User access evidence is ready"}
                </p>
              </div>
              <p className="text-xs text-neutral-400">
                Latest activity: {latestActivityLabel}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <a
              className={buttonVariants({ size: "sm" })}
              href="#user-lifecycle-workspace"
            >
              Create pilot user
            </a>
            <Link
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                "border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white",
              )}
              href="/admin/access-review"
            >
              Open access review
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Total users
            </p>
            <UserIcon className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground">{formatCount(users.length)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatCount(activeUsers)} active accounts
          </p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Privileged access
            </p>
            <ShieldCheckIcon className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground">{formatCount(privilegedUsers)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Org and system admins
          </p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Need review
            </p>
            <ActivityIcon className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground">{formatCount(usersNeedingReview)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Role, scope, or session issues
          </p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Stale sessions
            </p>
            <ClockIcon className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground">{formatCount(staleSessions)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Users with no recent activity
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <section id="user-lifecycle-workspace" className="scroll-mt-24">
          <CreatePilotUserForm createUserAction={createPilotUserAction} />
        </section>

        <div className="space-y-4">
          <div className="rounded-lg border border-border-subtle bg-bg-default shadow-sm">
            <div className="border-b border-border-subtle px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Role distribution
              </p>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {Object.entries(roleDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([role, count]) => {
                    const percentage = Math.round((count / users.length) * 100);
                    return (
                      <div key={role}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">
                            {role === "system_admin"
                              ? "System admin"
                              : role === "org_admin"
                                ? "Org admin"
                                : role === "district_manager"
                                  ? "District manager"
                                  : role === "reporter"
                                    ? "Field reporter"
                                    : role}
                          </span>
                          <span className="text-muted-foreground">{formatCount(count)}</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-foreground/20"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border-subtle bg-bg-default shadow-sm">
            <div className="border-b border-border-subtle px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Recent activity
              </p>
            </div>
            <div className="divide-y divide-border-subtle">
              {recentActivity.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No recent activity</div>
              ) : (
                recentActivity.map((user) => (
                  <div key={user.userId} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{user.displayName}</p>
                      <AdminStatusBadge tone="info">{formatLabel(user.role)}</AdminStatusBadge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Last seen: {formatDateTime(user.lastSeenAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              User directory
            </p>
            <h2 className="text-xl font-semibold text-foreground">All users</h2>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Search, filter, and manage user access across the organisation.
          </p>
        </div>
        <UsersTableClient users={users} detailReturnSource={returnSource} />
      </section>
    </div>
  );
}
