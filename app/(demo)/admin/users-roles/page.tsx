import Link from "next/link";
import {
  ClipboardCheckIcon,
  KeyRoundIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";

import {
  AdminStatusBadge,
  getAdminToneClassName,
  type AdminTone,
} from "@/components/product/admin-module";
import { buttonVariants } from "@/components/ui/button";
import {
  buildAdminAccessLifecycleModel,
  type AccessRoleSummary,
} from "@/lib/product/admin-access-lifecycle";
import { cn } from "@/lib/utils";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminUsers } from "../admin-loaders";
import { formatCount, formatDateTime } from "../governance-formatters";
import { createPilotUserAction } from "./actions";
import { CreatePilotUserForm } from "./create-pilot-user-form";
import { UsersTableClient } from "./users-table-client";

const returnSource = "admin-users-roles";

function roleTone(role: AccessRoleSummary): AdminTone {
  if (role.assignedCount === 0) {
    return "info";
  }

  return role.privileged ? "attention" : "clear";
}

function getRecentActivity(users: Awaited<ReturnType<typeof loadAdminUsers>>) {
  return users
    .filter((user) => user.lastSeenAt)
    .sort((a, b) => (b.lastSeenAt || "").localeCompare(a.lastSeenAt || ""))
    .slice(0, 4);
}

function getLatestUserActivityLabel(users: Awaited<ReturnType<typeof loadAdminUsers>>) {
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
  const model = buildAdminAccessLifecycleModel(users);
  const recentActivity = getRecentActivity(users);
  const latestActivityLabel = getLatestUserActivityLabel(users);
  const activeBlocker =
    model.summary.reviewSubjects > 0
      ? `${formatCount(model.summary.reviewSubjects)} principals need access review`
      : "User access evidence is ready";

  return (
    <div className="space-y-4" data-admin-module="users-roles">
      <section
        aria-label="Access lifecycle cockpit"
        className="grid gap-4 rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:p-5"
      >
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <UsersIcon className="size-5 text-muted-foreground" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Access lifecycle
            </p>
          </div>
          <h1 className="mt-1 max-w-4xl text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            Access lifecycle cockpit
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Manage pilot users, role assignment, session revocation, and the permission
            baseline that feeds access review.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a className={buttonVariants({ size: "sm" })} href="#lifecycle-controls">
              <UserPlusIcon aria-hidden="true" />
              <span>Create pilot user</span>
            </a>
            <Link
              className={buttonVariants({ size: "sm", variant: "outline" })}
              href="/admin/access-review"
            >
              <ShieldCheckIcon aria-hidden="true" />
              <span>Open access review</span>
            </Link>
          </div>
        </div>

        <aside className="min-w-0 rounded-lg border border-border-subtle bg-bg-muted/55 p-3">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Effective access baseline
              </p>
              <h2 className="mt-1 text-base font-semibold text-foreground">
                {activeBlocker}
              </h2>
              <p className="mt-2 break-words text-sm leading-5 text-muted-foreground">
                Latest lifecycle evidence: {latestActivityLabel}
              </p>
            </div>
            <AdminStatusBadge tone={model.summary.reviewSubjects ? "attention" : "clear"}>
              {model.summary.reviewSubjects ? "Review" : "Ready"}
            </AdminStatusBadge>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              ["Allowed", model.summary.allowedActions],
              ["Conditional", model.summary.conditionalActions],
              ["Denied", model.summary.forbiddenActions],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-border-subtle bg-bg-default p-2">
                <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section
        aria-label="Access lifecycle metrics"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          {
            label: "Total users",
            value: model.summary.totalUsers,
            detail: `${formatCount(model.summary.activeUsers)} active accounts`,
            tone: "info" as AdminTone,
          },
          {
            label: "Privileged access",
            value: model.summary.privilegedUsers,
            detail: "Org and system administrator grants",
            tone: model.summary.privilegedUsers ? "attention" : "clear",
          },
          {
            label: "Need review",
            value: model.summary.reviewSubjects,
            detail: "Role, scope, lifecycle, or session issues",
            tone: model.summary.reviewSubjects ? "attention" : "clear",
          },
          {
            label: "Stale sessions",
            value: model.summary.staleSessions,
            detail: "Users with no recent activity",
            tone: model.summary.staleSessions ? "attention" : "clear",
          },
        ].map((metric) => (
          <article
            key={metric.label}
            className={cn(
              "min-w-0 rounded-lg border p-4 shadow-sm",
              getAdminToneClassName(metric.tone as AdminTone),
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-normal opacity-75">
              {metric.label}
            </p>
            <p className="mt-1 break-words text-2xl font-semibold leading-tight">
              {metric.value}
            </p>
            <p className="mt-1 break-words text-xs leading-5 opacity-80">
              {metric.detail}
            </p>
          </article>
        ))}
      </section>

      <section
        aria-label="Role assignment map"
        className="rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
      >
        <div className="grid gap-3 border-b border-border-subtle p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Role assignment map
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              Permission baseline by role
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              Role cards show who carries each baseline and which assignments deserve review
              before evidence is trusted downstream.
            </p>
          </div>
          <Link
            href="/admin/access-review#effective-access-workspace"
            className={cn(buttonVariants({ size: "sm", variant: "outline" }), "w-fit")}
          >
            <ClipboardCheckIcon aria-hidden="true" />
            <span>Open permission matrix</span>
          </Link>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          {model.roleSummaries.map((role) => (
            <article
              key={role.role}
              className={cn(
                "min-w-0 rounded-lg border p-4",
                getAdminToneClassName(roleTone(role)),
              )}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-normal opacity-75">
                    {role.label}
                  </p>
                  <p className="mt-1 break-words text-2xl font-semibold leading-tight">
                    {formatCount(role.assignedCount)}
                  </p>
                </div>
                {role.privileged ? (
                  <KeyRoundIcon className="size-4 shrink-0" aria-hidden="true" />
                ) : (
                  <SparklesIcon className="size-4 shrink-0" aria-hidden="true" />
                )}
              </div>
              <p className="mt-3 break-words text-sm font-medium leading-5">
                {role.permissionBaseline}
              </p>
              <p className="mt-2 break-words text-xs leading-5 opacity-80">
                {role.reviewNote}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="lifecycle-controls"
        aria-label="Lifecycle controls"
        className="grid scroll-mt-24 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.45fr)]"
      >
        <div className="grid min-w-0 gap-3">
          <CreatePilotUserForm createUserAction={createPilotUserAction} />
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                label: "Create user",
                value: "Scoped invite",
                detail: "New pilot accounts receive a temporary password and role scope.",
                tone: "info" as AdminTone,
                Icon: UserPlusIcon,
              },
              {
                label: "Update access",
                value: `${formatCount(model.summary.totalUsers)} principals`,
                detail: "Role, organisation, and district edits stay tied to the user row.",
                tone: "clear" as AdminTone,
                Icon: ShieldCheckIcon,
              },
              {
                label: "Revoke sessions",
                value: `${formatCount(model.summary.staleSessions)} stale`,
                detail: "Session revocation is handled from the user directory controls.",
                tone: model.summary.staleSessions ? "attention" : "clear",
                Icon: KeyRoundIcon,
              },
            ].map(({ Icon, ...item }) => (
              <div
                key={item.label}
                className={cn(
                  "min-w-0 rounded-lg border p-3 shadow-sm",
                  getAdminToneClassName(item.tone as AdminTone),
                )}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-normal opacity-75">
                      {item.label}
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold leading-5">
                      {item.value}
                    </p>
                  </div>
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                </div>
                <p className="mt-2 break-words text-xs leading-5 opacity-80">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm">
          <div className="border-b border-border-subtle px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Recent session evidence
            </p>
          </div>
          <div className="divide-y divide-border-subtle">
            {recentActivity.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No recent activity</div>
            ) : (
              recentActivity.map((user) => (
                <div key={user.userId} className="px-4 py-3">
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-foreground">
                        {user.displayName}
                      </p>
                      <p className="mt-1 break-words text-xs text-muted-foreground">
                        Last seen: {formatDateTime(user.lastSeenAt)}
                      </p>
                    </div>
                    <AdminStatusBadge tone="info">{user.role.replaceAll("_", " ")}</AdminStatusBadge>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
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
            Search, filter, sort, and open user evidence without leaving the lifecycle surface.
          </p>
        </div>
        <UsersTableClient
          users={users}
          accessSubjects={model.subjects}
          defaultSubjectId={model.defaultSubjectId}
          evidenceLinks={model.evidenceLinks}
          detailReturnSource={returnSource}
        />
      </section>
    </div>
  );
}
