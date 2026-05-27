import Link from "next/link";
import {
  FileSearchIcon,
  KeyRoundIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
} from "lucide-react";

import {
  AdminEmptyState,
  AdminEvidenceTable,
  AdminStatusBadge,
  getAdminToneClassName,
  type AdminTone,
} from "@/components/product/admin-module";
import { buttonVariants } from "@/components/ui/button";
import type { AuthRole } from "@/lib/auth/api";
import type { AdminUserAccessApiResponse } from "@/lib/demo/api-types";
import { buildAdminUserDetailHref } from "@/lib/product/admin-detail-routes";
import { classifyAccessRisk } from "@/lib/product/admin-governance";
import { cn } from "@/lib/utils";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminUsers } from "../admin-loaders";
import {
  formatCount,
  formatDateTime,
  formatLabel,
  toneForAttention,
} from "../governance-formatters";

const activeRoles = new Set<AuthRole>([
  "reporter",
  "district_manager",
  "org_admin",
  "system_admin",
]);
const returnSource = "admin-access-review";

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

function getUserAccessRowKey(user: AdminUserAccessApiResponse) {
  return [
    user.userId,
    user.role,
    user.organisationId ?? "platform",
    user.district ?? "all-districts",
  ].join(":");
}

function plural(value: number, singular: string, pluralLabel = `${singular}s`) {
  return `${formatCount(value)} ${value === 1 ? singular : pluralLabel}`;
}

function getLatestAccessActivityLabel(users: AdminUserAccessApiResponse[]) {
  const latest = users
    .flatMap((user) => [user.lastSeenAt, user.createdAt, user.disabledAt])
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => right.getTime() - left.getTime())[0];

  return latest ? formatDateTime(latest.toISOString()) : "Unavailable";
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
  const activeBlocker =
    reviewRows.length > 0
      ? `${plural(reviewRows.length, "access record")} need review`
      : "Access evidence is ready";
  const latestActivityLabel = getLatestAccessActivityLabel(users);
  const taskCards = [
    {
      id: "queue",
      title: "Inspect access queue",
      description:
        "Open each flagged user and confirm why role, scope, lifecycle, or session evidence needs review.",
      href: "#access-review-queue",
      stateLabel: reviewRows.length ? `${formatCount(reviewRows.length)} follow-ups` : "Ready",
      tone: toneForAttention(reviewRows.length),
      Icon: FileSearchIcon,
    },
    {
      id: "privileged",
      title: "Confirm privileged access",
      description:
        "Review organisation and system administrator roles before readiness evidence is trusted.",
      href: "/admin/users-roles",
      stateLabel: plural(privilegedAccess, "privileged user"),
      tone: toneForAttention(privilegedAccess),
      Icon: ShieldCheckIcon,
    },
    {
      id: "sessions",
      title: "Clear stale sessions",
      description:
        "Find users with no recent session evidence and revoke or refresh access through the lifecycle workspace.",
      href: "/admin/users-roles#user-lifecycle-workspace",
      stateLabel: staleSessions ? `${formatCount(staleSessions)} stale` : "Current",
      tone: toneForAttention(staleSessions),
      Icon: KeyRoundIcon,
    },
    {
      id: "scope",
      title: "Resolve scope gaps",
      description:
        "Check district manager assignments and disabled account state before recording audit evidence.",
      href: "/admin/audit-evidence",
      stateLabel: missingDistrictScope ? `${formatCount(missingDistrictScope)} gaps` : "Scoped",
      tone: toneForAttention(missingDistrictScope + disabledAccounts),
      Icon: ShieldAlertIcon,
    },
  ];

  return (
    <div className="space-y-4" data-admin-module="access-review">
      <section className="overflow-hidden rounded-lg border border-neutral-900 bg-neutral-950 text-white shadow-sm">
        <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-neutral-400">
              Platform operations
            </p>
            <h1 className="mt-2 break-words text-2xl font-semibold leading-tight sm:text-3xl">
              Access review command centre
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-300">
              Triage privileged roles, stale sessions, disabled accounts, and district scope before access evidence is recorded in the audit trail.
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
            <a className={buttonVariants({ size: "sm" })} href="#access-review-queue">
              Review queue
            </a>
            <Link
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                "border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white",
              )}
              href="/admin/users-roles"
            >
              Open users and roles
            </Link>
          </div>
        </div>
        <div className="grid border-t border-white/10 bg-white/[0.03] sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Privileged access",
              value: formatCount(privilegedAccess),
              detail: "Organisation and system administrator roles",
            },
            {
              label: "Stale or no session",
              value: formatCount(staleSessions),
              detail: "Users missing recent session evidence",
            },
            {
              label: "Missing district scope",
              value: formatCount(missingDistrictScope),
              detail: "District manager access without district proof",
            },
            {
              label: "Disabled accounts",
              value: formatCount(disabledAccounts),
              detail: "Lifecycle records that need audit context",
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

      <section aria-label="Access review task queue" className="grid gap-3">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Next actions
            </p>
            <h2 className="text-xl font-semibold text-foreground">Access evidence queue</h2>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Use audit evidence as the review record path for access decisions.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {taskCards.map(({ Icon, ...task }) => (
            <Link
              key={task.id}
              href={task.href}
              className="min-w-0 rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm transition hover:bg-bg-muted/60"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <span
                  className={cn(
                    "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border",
                    getAdminToneClassName(task.tone as AdminTone),
                  )}
                  aria-hidden="true"
                >
                  <Icon className="size-4" />
                </span>
                <AdminStatusBadge tone={task.tone as AdminTone}>{task.stateLabel}</AdminStatusBadge>
              </div>
              <h3 className="mt-4 break-words text-base font-semibold text-foreground">
                {task.title}
              </h3>
              <p className="mt-2 break-words text-sm leading-5 text-muted-foreground">
                {task.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section id="access-review-queue" className="scroll-mt-24">
        <AdminEvidenceTable
          label="Access review queue"
          rows={reviewRows}
          getRowKey={getUserAccessRowKey}
          getRowAriaLabel={(row) => `Open ${row.displayName} user detail`}
          getRowHref={(row) => buildAdminUserDetailHref(row.userId, returnSource)}
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
              render: (row) => <AdminStatusBadge tone="info">{formatLabel(row.role)}</AdminStatusBadge>,
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
      </section>
    </div>
  );
}
