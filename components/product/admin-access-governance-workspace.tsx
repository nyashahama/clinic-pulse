import Link from "next/link";
import {
  ArrowUpRightIcon,
  ClipboardCheckIcon,
  FileCheck2Icon,
  KeyRoundIcon,
  ShieldCheckIcon,
  UserCogIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  AdminEmptyState,
  AdminEvidenceTable,
  AdminFilterBar,
  AdminMetricStrip,
  AdminModuleHeader,
  AdminStatusBadge,
} from "@/components/product/admin-module";
import { buttonVariants } from "@/components/ui/button";
import type {
  AccessGovernanceAction,
  AccessGovernanceReviewRow,
  AccessGovernanceViewModel,
} from "@/lib/product/admin-access-governance";
import { cn } from "@/lib/utils";

type AccessGovernanceWorkspaceProps = {
  viewModel: AccessGovernanceViewModel;
  children: ReactNode;
};

type AccessReviewWorkspaceProps = {
  viewModel: AccessGovernanceViewModel;
};

const actionIcon = {
  "review-privileged": ShieldCheckIcon,
  "fix-scope": UserCogIcon,
  "revoke-sessions": KeyRoundIcon,
  "maintain-roster": ClipboardCheckIcon,
} satisfies Record<AccessGovernanceAction["id"], typeof ShieldCheckIcon>;

export function AccessGovernanceWorkspace({
  viewModel,
  children,
}: AccessGovernanceWorkspaceProps) {
  return (
    <div className="space-y-4" data-admin-module="access-governance">
      <AdminModuleHeader
        eyebrow="Access governance"
        title="Users and roles"
        description="Manage pilot users through the same loop an organisation admin needs for access hygiene: review privileged access, fix scope gaps, revoke stale sessions, and keep the roster current."
        actions={[
          {
            label: (
              <>
                <ShieldCheckIcon aria-hidden="true" />
                <span>Review access</span>
              </>
            ),
            buttonProps: {
              nativeButton: false,
              render: <Link href="/admin/access-review" />,
              variant: "outline",
            },
          },
          {
            label: (
              <>
                <FileCheck2Icon aria-hidden="true" />
                <span>Audit evidence</span>
              </>
            ),
            buttonProps: {
              nativeButton: false,
              render: <Link href="/admin/audit-evidence" />,
              variant: "outline",
            },
          },
        ]}
      />
      <AdminMetricStrip metrics={viewModel.metrics} />
      <AccessGovernanceTaskQueue actions={viewModel.actions} />
      {children}
    </div>
  );
}

export function AccessReviewWorkspace({ viewModel }: AccessReviewWorkspaceProps) {
  return (
    <div className="space-y-4" data-admin-module="access-review">
      <AdminModuleHeader
        eyebrow="Access governance"
        title="Access review"
        description="Decision queue for privileged access, missing scope, disabled accounts, and session gaps. Open a user evidence record, make the access change in users and roles, then keep the decision trace in audit evidence."
        actions={[
          {
            label: (
              <>
                <UserCogIcon aria-hidden="true" />
                <span>Manage users</span>
              </>
            ),
            buttonProps: {
              nativeButton: false,
              render: <Link href="/admin/users-roles" />,
              variant: "outline",
            },
          },
          {
            label: (
              <>
                <FileCheck2Icon aria-hidden="true" />
                <span>Audit evidence</span>
              </>
            ),
            buttonProps: {
              nativeButton: false,
              render: <Link href="/admin/audit-evidence" />,
              variant: "outline",
            },
          },
        ]}
      />
      <AdminMetricStrip metrics={viewModel.metrics} />
      <AdminFilterBar>
        <AdminStatusBadge tone="info">Read only</AdminStatusBadge>
        <span className="text-sm text-muted-foreground">
          The queue points to user evidence; lifecycle changes stay in users and roles.
        </span>
      </AdminFilterBar>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.38fr)]">
        <AccessReviewDecisionQueue rows={viewModel.reviewRows} />
        <AccessDecisionHandoff />
      </div>
    </div>
  );
}

function AccessGovernanceTaskQueue({
  actions,
}: {
  actions: AccessGovernanceAction[];
}) {
  return (
    <section
      aria-label="Access governance task queue"
      className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
    >
      <div className="border-b border-border-subtle bg-bg-muted/40 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
          Next actions
        </p>
        <h2 className="mt-1 text-base font-semibold text-foreground">
          Access governance task queue
        </h2>
      </div>
      <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = actionIcon[action.id];

          return (
            <Link
              key={action.id}
              href={action.href}
              className="group min-w-0 rounded-lg border border-border-subtle bg-bg-muted/45 p-3 text-content-default transition hover:border-border hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <span
                  className={cn(
                    "inline-flex size-8 shrink-0 items-center justify-center rounded-md border",
                    action.tone === "attention" &&
                      "border-amber-200 bg-amber-50 text-amber-900",
                    action.tone === "clear" &&
                      "border-emerald-200 bg-emerald-50 text-emerald-900",
                    action.tone === "info" &&
                      "border-sky-200 bg-sky-50 text-sky-900",
                    action.tone === "blocked" &&
                      "border-destructive/30 bg-destructive/10 text-destructive",
                  )}
                  aria-hidden="true"
                >
                  <Icon className="size-4" />
                </span>
                <span className="rounded-md border border-border-subtle bg-bg-default px-2 py-0.5 font-mono text-xs text-muted-foreground">
                  {action.count}
                </span>
              </div>
              <h3 className="mt-3 break-words text-sm font-semibold text-foreground">
                {action.title}
              </h3>
              <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function AccessReviewDecisionQueue({
  rows,
}: {
  rows: AccessGovernanceReviewRow[];
}) {
  return (
    <AdminEvidenceTable
      label="Access review decision queue"
      rows={rows}
      getRowKey={(row) => row.id}
      getRowAriaLabel={(row) => `Open user evidence for ${row.displayName}`}
      getRowHref={(row) => row.detailHref}
      emptyState={
        <AdminEmptyState
          title="No access decisions waiting"
          description="Current users have clear role, scope, lifecycle, and session evidence."
        />
      }
      columns={[
        {
          key: "user",
          header: "User evidence",
          render: (row) => (
            <div className="min-w-0">
              <p className="font-medium text-foreground">{row.displayName}</p>
              <p className="break-all text-xs text-muted-foreground">{row.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">Open user evidence</p>
            </div>
          ),
        },
        {
          key: "role",
          header: "Role and scope",
          render: (row) => (
            <div className="space-y-1">
              <AdminStatusBadge tone="info">{row.roleLabel}</AdminStatusBadge>
              <p className="text-xs text-muted-foreground">{row.scopeLabel}</p>
            </div>
          ),
        },
        {
          key: "risk",
          header: "Review basis",
          render: (row) => (
            <div className="max-w-sm space-y-1">
              <AdminStatusBadge tone={row.reviewTone}>{row.reviewState}</AdminStatusBadge>
              <p className="text-xs leading-5 text-muted-foreground">
                {row.reasons.join("; ")}
              </p>
            </div>
          ),
        },
        {
          key: "session",
          header: "Session evidence",
          render: (row) => (
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{row.sessionLabel}</p>
              <p className="text-xs text-muted-foreground">{row.lastSeenLabel}</p>
            </div>
          ),
        },
        {
          key: "handoff",
          header: "Decision handoff",
          render: (row) => (
            <p className="max-w-xs text-sm text-muted-foreground">
              {row.decisionHandoff}
            </p>
          ),
        },
      ]}
    />
  );
}

function AccessDecisionHandoff() {
  return (
    <aside
      aria-label="Access decision handoff"
      className="rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm"
    >
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        Decision handoff
      </p>
      <h2 className="mt-1 text-base font-semibold text-foreground">
        How to close the loop
      </h2>
      <ol className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
        <li className="rounded-md border border-border-subtle bg-bg-muted/45 p-3">
          <span className="font-medium text-foreground">1. Open user evidence</span>
          <br />
          Confirm role, scope, session state, and the review reason.
        </li>
        <li className="rounded-md border border-border-subtle bg-bg-muted/45 p-3">
          <span className="font-medium text-foreground">2. Update users and roles</span>
          <br />
          Change scope, revoke sessions, disable stale accounts, or keep access.
        </li>
        <li className="rounded-md border border-border-subtle bg-bg-muted/45 p-3">
          <span className="font-medium text-foreground">3. Preserve evidence</span>
          <br />
          Use the audit trail as the durable record for the access decision.
        </li>
      </ol>
      <div className="mt-4 grid gap-2">
        <Link
          href="/admin/users-roles"
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "justify-between",
          })}
        >
          <span>Open users and roles</span>
          <ArrowUpRightIcon aria-hidden="true" />
        </Link>
        <Link
          href="/admin/audit-evidence"
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "justify-between",
          })}
        >
          <span>Open audit evidence</span>
          <ArrowUpRightIcon aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
