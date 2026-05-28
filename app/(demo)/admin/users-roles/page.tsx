import Link from "next/link";

import {
  type AdminTone,
} from "@/components/product/admin-module";
import { AdminUserLifecycle } from "@/components/product/admin-user-lifecycle";
import { UsersRolesDataTable } from "@/components/product/users-roles-data-table";
import { buttonVariants } from "@/components/ui/button";
import type { AuthRole } from "@/lib/auth/api";
import type { AdminUserAccessApiResponse } from "@/lib/demo/api-types";
import { classifyAccessRisk } from "@/lib/product/admin-governance";
import { cn } from "@/lib/utils";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminUsers } from "../admin-loaders";
import {
  formatCount,
  formatDateTime,
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

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  const users = await loadAdminUsers();
  const rows = users.map((user) => ({ ...user, risk: getRisk(user) }));
  const activeUsers = users.filter((user) => !user.disabledAt).length;
  const privilegedUsers = users.filter((user) =>
    ["org_admin", "system_admin"].includes(user.role),
  ).length;
  const disabledUsers = users.filter((user) => Boolean(user.disabledAt)).length;
  const usersNeedingReview = rows.filter((row) => row.risk.reasons.length > 0).length;
  const activeBlocker =
    usersNeedingReview > 0
      ? `${plural(usersNeedingReview, "user")} need access review`
      : "User access evidence is ready";
  const latestActivityLabel = getLatestUserActivityLabel(users);

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-lg border border-neutral-900 bg-neutral-950 text-white shadow-sm">
        <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-neutral-400">
              Access lifecycle
            </p>
            <h1 className="mt-2 break-words text-2xl font-semibold leading-tight sm:text-3xl">
              Users and roles command centre
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-300">
              Create pilot users, confirm role scope, disable stale accounts, and revoke sessions before the organisation evidence is trusted.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-normal text-neutral-400">
                  Active blocker
                </p>
                <p className="mt-1 break-words text-xl font-semibold">
                  {activeBlocker}
                </p>
              </div>
              <p className="text-xs text-neutral-400">
                Latest activity: {latestActivityLabel}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <a className={buttonVariants({ size: "sm" })} href="#user-lifecycle-workspace">
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
        <div className="grid border-t border-white/10 bg-white/[0.03] sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total users",
              value: formatCount(users.length),
              detail: `${formatCount(activeUsers)} active accounts`,
              tone: "info" as AdminTone,
            },
            {
              label: "Privileged users",
              value: formatCount(privilegedUsers),
              detail: "Organisation and system administrators",
              tone: "info" as AdminTone,
            },
            {
              label: "Disabled accounts",
              value: formatCount(disabledUsers),
              detail: "Lifecycle state held in audit-visible admin records",
              tone: disabledUsers > 0 ? "attention" : "clear",
            },
            {
              label: "Need review",
              value: formatCount(usersNeedingReview),
              detail: "Role, scope, account, or session evidence needs follow-up",
              tone: usersNeedingReview > 0 ? "attention" : "clear",
            },
          ].map((metric) => (
            <div
              key={metric.label}
              className="min-w-0 border-t border-white/10 px-5 py-4 first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0"
            >
              <p className="text-xs font-semibold uppercase tracking-normal text-neutral-400">
                {metric.label}
              </p>
              <p className="mt-1 break-words text-2xl font-semibold">{metric.value}</p>
              <p className="mt-1 break-words text-xs leading-5 text-neutral-400">
                {metric.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="user-lifecycle-workspace" className="scroll-mt-24">
        <AdminUserLifecycle
          users={users}
          detailReturnSource={returnSource}
          createUserAction={createPilotUserAction}
          updateUserAction={setUserDisabledAction}
          updateAccessAction={updateUserAccessAction}
          revokeSessionsAction={revokeUserSessionsAction}
        />
      </section>

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
        <UsersRolesDataTable users={users} detailReturnSource={returnSource} />
      </section>
    </div>
  );
}
