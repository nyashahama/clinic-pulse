import {
  AdminEmptyState,
  AdminEvidenceTable,
  AdminFilterBar,
  AdminMetricStrip,
  AdminModuleHeader,
} from "@/components/product/admin-module";
import type { AuthRole } from "@/lib/auth/api";
import type { AdminUserAccessApiResponse } from "@/lib/demo/api-types";
import {
  accessReviewSourceReferences,
  type AccessReviewSourceReference,
} from "@/lib/product/access-review";
import { buildAdminUserDetailHref } from "@/lib/product/admin-detail-routes";
import { classifyAccessRisk } from "@/lib/product/admin-governance";
import { ArrowUpRight } from "lucide-react";
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

function AccessReviewSourceReferences({
  references,
}: {
  references: AccessReviewSourceReference[];
}) {
  return (
    <section
      data-admin-module
      className="rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm"
    >
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            Research basis
          </p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            Access-review source references
          </h2>
          <p className="mt-1 max-w-3xl break-words text-sm leading-5 text-muted-foreground">
            Source-available access audit, member roster, role assignment, and
            permission-count patterns used to shape this review queue.
          </p>
        </div>
        <StatusBadge tone="info">{formatCount(references.length)} references</StatusBadge>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {references.map((reference) => (
          <a
            key={reference.source}
            href={reference.href}
            target="_blank"
            rel="noreferrer"
            className="group grid min-w-0 gap-3 rounded-md border border-border-subtle bg-bg-muted/30 p-3 transition hover:bg-bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="flex min-w-0 items-start justify-between gap-2">
              <span className="min-w-0 break-words text-sm font-semibold text-foreground">
                {reference.source}
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-muted-foreground transition group-hover:text-foreground"
              />
            </span>
            <span className="break-words text-xs leading-5 text-content-default">
              {reference.role}
            </span>
            <code className="block break-all rounded bg-bg-default px-2 py-1 text-[0.68rem] leading-4 text-muted-foreground">
              {reference.sourcePath}
            </code>
            <span className="text-xs font-medium capitalize text-muted-foreground">
              {reference.licenseUse.replace("-", " ")}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
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
    <div className="space-y-4" data-admin-module="access-review">
      <AdminModuleHeader
        eyebrow="Platform operations"
        title="Access review"
        description="Read-only queue for access risks. Review records should be captured through audit evidence."
      />
      <AccessReviewSourceReferences references={accessReviewSourceReferences} />
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
