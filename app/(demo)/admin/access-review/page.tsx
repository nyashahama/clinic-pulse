import Link from "next/link";
import {
  ArrowRightIcon,
  FileSearchIcon,
  KeyRoundIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  UserRoundCheckIcon,
} from "lucide-react";

import {
  AdminStatusBadge,
  getAdminToneClassName,
  type AdminTone,
} from "@/components/product/admin-module";
import { buttonVariants } from "@/components/ui/button";
import {
  buildAdminUserDetailHref,
} from "@/lib/product/admin-detail-routes";
import {
  buildAdminAccessLifecycleModel,
  type AccessLifecycleSubject,
  type AccessPermissionState,
  type AccessLifecycleUser,
} from "@/lib/product/admin-access-lifecycle";
import { cn } from "@/lib/utils";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminUsers } from "../admin-loaders";
import { formatCount, formatDateTime } from "../governance-formatters";

const returnSource = "admin-access-review";

function permissionTone(state: AccessPermissionState): AdminTone {
  if (state === "allow") {
    return "clear";
  }

  return state === "conditional" ? "attention" : "blocked";
}

function getLatestAccessActivityLabel(users: AccessLifecycleUser[]) {
  const latest = users
    .flatMap((user) => [user.lastSeenAt, user.createdAt, user.disabledAt])
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => right.getTime() - left.getTime())[0];

  return latest ? formatDateTime(latest.toISOString()) : "No access evidence";
}

function subjectDetailHref(subject: AccessLifecycleSubject) {
  return buildAdminUserDetailHref(subject.userId, returnSource);
}

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  const users = await loadAdminUsers();
  const model = buildAdminAccessLifecycleModel(users);
  const selectedSubject = model.subjects.find((subject) => subject.id === model.defaultSubjectId);
  const reviewSubjects = model.subjects.filter((subject) => subject.reviewReasons.length > 0);
  const activeBlocker =
    reviewSubjects.length > 0
      ? `${formatCount(reviewSubjects.length)} principals need reviewer attention`
      : "Effective access evidence is ready";

  return (
    <div className="space-y-4" data-admin-module="access-review">
      <section
        aria-label="Effective access cockpit"
        className="grid gap-4 rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] lg:p-5"
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Access review
          </p>
          <h1 className="mt-1 max-w-4xl text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            Effective access cockpit
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Review what each principal can actually do across field reporting, district
            operations, organisation governance, partner handoff, and platform administration
            before recording access evidence.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a className={buttonVariants({ size: "sm" })} href="#effective-access-workspace">
              <FileSearchIcon aria-hidden="true" />
              <span>Review access matrix</span>
            </a>
            <Link
              className={buttonVariants({ size: "sm", variant: "outline" })}
              href="/admin/users-roles"
            >
              <KeyRoundIcon aria-hidden="true" />
              <span>Open lifecycle controls</span>
            </Link>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {[
              {
                label: "Active blocker",
                value: activeBlocker,
                tone: reviewSubjects.length ? "attention" : "clear",
              },
              {
                label: "Latest evidence",
                value: getLatestAccessActivityLabel(users),
                tone: "info",
              },
              {
                label: "Audit route",
                value: "Record decision in audit evidence",
                tone: "clear",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={cn(
                  "min-w-0 rounded-md border p-3",
                  getAdminToneClassName(item.tone as AdminTone),
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-normal opacity-75">
                  {item.label}
                </p>
                <p className="mt-1 break-words text-sm font-semibold leading-5">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside
          aria-label="Selected principal packet"
          className="min-w-0 rounded-lg border border-border-subtle bg-bg-muted/55 p-3"
        >
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Selected principal packet
              </p>
              <h2 className="mt-1 break-words text-base font-semibold text-foreground">
                {selectedSubject?.displayName ?? "No principal selected"}
              </h2>
              {selectedSubject ? (
                <p className="mt-1 break-all text-xs text-muted-foreground">
                  {selectedSubject.email}
                </p>
              ) : null}
            </div>
            {selectedSubject ? (
              <AdminStatusBadge tone={selectedSubject.stateTone as AdminTone}>
                {selectedSubject.stateLabel}
              </AdminStatusBadge>
            ) : null}
          </div>
          {selectedSubject ? (
            <dl className="mt-3 divide-y divide-border-subtle">
              {[
                ["Role", selectedSubject.roleLabel],
                ["Scope", selectedSubject.scopeLabel],
                [
                  "Review state",
                  selectedSubject.reviewReasons.length
                    ? selectedSubject.reviewReasons.join("; ")
                    : "No review flags",
                ],
                [
                  "Effective actions",
                  `${selectedSubject.allowedActions} allowed, ${selectedSubject.conditionalActions} conditional, ${selectedSubject.forbiddenActions} denied`,
                ],
              ].map(([label, value]) => (
                <div key={label} className="grid gap-1 py-3 first:pt-0 last:pb-0">
                  <dt className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="break-words text-sm font-medium text-foreground">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </aside>
      </section>

      <section
        aria-label="Access review metrics"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          {
            label: "Principals",
            value: model.summary.totalUsers,
            detail: `${model.summary.activeUsers} active accounts in scope`,
            tone: "info" as AdminTone,
          },
          {
            label: "Need review",
            value: model.summary.reviewSubjects,
            detail: "Role, district, lifecycle, or session flags",
            tone: model.summary.reviewSubjects ? "attention" : "clear",
          },
          {
            label: "Conditional grants",
            value: model.summary.conditionalActions,
            detail: "Permissions that need scope or lifecycle confirmation",
            tone: model.summary.conditionalActions ? "attention" : "clear",
          },
          {
            label: "Privileged users",
            value: model.summary.privilegedUsers,
            detail: "Organisation and system administrator roles",
            tone: model.summary.privilegedUsers ? "attention" : "clear",
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
        id="effective-access-workspace"
        aria-label="Effective access workspace"
        className="grid scroll-mt-24 gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]"
      >
        <aside className="min-w-0 rounded-lg border border-border-subtle bg-bg-default p-3 text-content-default shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Principals
          </p>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            Review queue
          </h2>
          <div className="mt-3 grid gap-2">
            {model.subjects.map((subject) => {
              const active = subject.id === model.defaultSubjectId;

              return (
                <Link
                  key={subject.id}
                  href={subjectDetailHref(subject)}
                  className={cn(
                    "group grid min-w-0 gap-2 rounded-md border border-border-subtle bg-bg-muted/45 p-3 transition hover:bg-bg-muted",
                    active && "border-primary/45 bg-primary/5",
                  )}
                >
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-foreground">
                        {subject.displayName}
                      </p>
                      <p className="break-words text-xs text-muted-foreground">
                        {subject.roleLabel}
                      </p>
                    </div>
                    <ArrowRightIcon className="mt-1 size-3.5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <AdminStatusBadge tone={subject.stateTone as AdminTone}>
                      {subject.stateLabel}
                    </AdminStatusBadge>
                    <AdminStatusBadge
                      tone={subject.reviewReasons.length ? "attention" : "clear"}
                    >
                      {subject.reviewReasons.length ? "Review" : "Clear"}
                    </AdminStatusBadge>
                  </div>
                </Link>
              );
            })}
          </div>
        </aside>

        <div className="grid min-w-0 gap-4">
          <section
            aria-label="Permission audit matrix"
            className="rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
          >
            <div className="grid gap-3 border-b border-border-subtle p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Permission audit matrix
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  {selectedSubject
                    ? `${selectedSubject.displayName} effective access`
                    : "Effective access"}
                </h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Permissions are grouped by the operational surfaces an org admin actually
                  governs, then marked allowed, conditional, or denied with source evidence.
                </p>
              </div>
              <Link
                href="/admin/audit-evidence"
                className={cn(buttonVariants({ size: "sm", variant: "outline" }), "w-fit")}
              >
                <ShieldCheckIcon aria-hidden="true" />
                <span>Open audit evidence</span>
              </Link>
            </div>

            {selectedSubject ? (
              <div className="divide-y divide-border-subtle">
                {selectedSubject.permissionResources.map((resource) => (
                  <article
                    key={resource.id}
                    className="grid gap-4 p-4 xl:grid-cols-[minmax(13rem,0.45fr)_minmax(0,1fr)]"
                  >
                    <div className="min-w-0">
                      <h3 className="break-words text-base font-semibold text-foreground">
                        {resource.label}
                      </h3>
                      <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
                        {resource.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <AdminStatusBadge tone="clear">
                          {resource.allowedCount} allowed
                        </AdminStatusBadge>
                        <AdminStatusBadge tone="attention">
                          {resource.conditionalCount} conditional
                        </AdminStatusBadge>
                        <AdminStatusBadge tone="blocked">
                          {resource.forbiddenCount} denied
                        </AdminStatusBadge>
                      </div>
                    </div>
                    <div className="grid min-w-0 gap-2">
                      {resource.actions.map((action) => (
                        <div
                          key={action.id}
                          className="grid gap-3 rounded-md border border-border-subtle bg-bg-muted/35 p-3 md:grid-cols-[minmax(0,1fr)_minmax(9rem,auto)]"
                        >
                          <div className="min-w-0">
                            <p className="break-words text-sm font-semibold text-foreground">
                              {action.label}
                            </p>
                            <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
                              {action.description}
                            </p>
                            <p className="mt-2 break-words text-xs leading-5 text-muted-foreground">
                              Granted by: {action.grantedBy.join(", ")}
                            </p>
                          </div>
                          <div className="min-w-0 md:text-right">
                            <AdminStatusBadge tone={permissionTone(action.state)}>
                              {action.state}
                            </AdminStatusBadge>
                            <p className="mt-2 break-words text-xs leading-5 text-muted-foreground">
                              {action.reviewNote}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </section>

          <section
            aria-label="Review decision queue"
            className="rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
          >
            <div className="border-b border-border-subtle p-4">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Review decision queue
              </p>
              <h2 className="mt-1 text-xl font-semibold text-foreground">
                Access decisions that need evidence
              </h2>
            </div>
            <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
              {(reviewSubjects.length ? reviewSubjects : model.subjects).map((subject) => (
                <Link
                  key={subject.id}
                  href={subjectDetailHref(subject)}
                  className="group min-w-0 rounded-lg border border-border-subtle bg-bg-muted/35 p-3 transition hover:bg-bg-muted"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <span
                      className={cn(
                        "inline-flex size-8 shrink-0 items-center justify-center rounded-md border",
                        getAdminToneClassName(
                          subject.reviewReasons.length ? "attention" : "clear",
                        ),
                      )}
                      aria-hidden="true"
                    >
                      {subject.reviewReasons.length ? (
                        <ShieldAlertIcon className="size-4" />
                      ) : (
                        <UserRoundCheckIcon className="size-4" />
                      )}
                    </span>
                    <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
                  </div>
                  <h3 className="mt-3 break-words text-sm font-semibold text-foreground">
                    {subject.displayName}
                  </h3>
                  <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
                    {subject.reviewReasons.length
                      ? subject.reviewReasons.join("; ")
                      : "No review flags in the current evidence."}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section
        aria-label="Access evidence handoff"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {model.evidenceLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="group min-w-0 rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm transition hover:bg-bg-muted/60"
          >
            <div className="flex min-w-0 items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Evidence handoff
              </p>
              <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
            </div>
            <h2 className="mt-2 break-words text-base font-semibold text-foreground">
              {link.label}
            </h2>
            <p className="mt-2 break-words text-sm leading-5 text-muted-foreground">
              {link.description}
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
