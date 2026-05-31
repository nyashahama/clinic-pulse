import Link from "next/link";
import {
  ArrowRightIcon,
  FileSearchIcon,
  KeyRoundIcon,
} from "lucide-react";

import {
  getAdminToneClassName,
  type AdminTone,
} from "@/components/product/admin-module";
import { AccessReviewWorkspace } from "@/components/product/access-review-workspace";
import { buttonVariants } from "@/components/ui/button";
import {
  buildAdminAccessLifecycleModel,
  type AccessLifecycleUser,
} from "@/lib/product/admin-access-lifecycle";
import { cn } from "@/lib/utils";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminUsers } from "../admin-loaders";
import { formatCount, formatDateTime } from "../governance-formatters";

const returnSource = "admin-access-review";

function getLatestAccessActivityLabel(users: AccessLifecycleUser[]) {
  const latest = users
    .flatMap((user) => [user.lastSeenAt, user.createdAt, user.disabledAt])
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => right.getTime() - left.getTime())[0];

  return latest ? formatDateTime(latest.toISOString()) : "No access evidence";
}

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  const users = await loadAdminUsers();
  const model = buildAdminAccessLifecycleModel(users);
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
          aria-label="Access review basis"
          className="min-w-0 rounded-lg border border-border-subtle bg-bg-muted/55 p-3"
        >
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Review basis
          </p>
          <h2 className="mt-1 break-words text-base font-semibold text-foreground">
            Principal-first evidence workflow
          </h2>
          <p className="mt-2 break-words text-sm leading-5 text-muted-foreground">
            The workspace below keeps review decisions on this page until the reviewer
            deliberately opens the canonical user evidence record.
          </p>
          <dl className="mt-3 divide-y divide-border-subtle">
            {[
              ["Queue", `${formatCount(model.subjects.length)} principals`],
              ["Needs review", `${formatCount(model.summary.reviewSubjects)} flagged`],
              ["Conditional grants", `${formatCount(model.summary.conditionalActions)} open`],
              ["Denied actions", `${formatCount(model.summary.forbiddenActions)} blocked`],
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

      <AccessReviewWorkspace
        subjects={model.subjects}
        defaultSubjectId={model.defaultSubjectId}
        returnSource={returnSource}
      />

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
