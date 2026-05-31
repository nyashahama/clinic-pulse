"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  FileSearchIcon,
  SearchIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  UserRoundCheckIcon,
} from "lucide-react";

import {
  AdminStatusBadge,
  getAdminToneClassName,
  type AdminTone,
} from "@/components/product/admin-module";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  filterAccessPermissionResources,
  filterAccessReviewSubjects,
  type AccessLifecycleSubject,
  type AccessPermissionState,
  type AccessPermissionStateFilter,
} from "@/lib/product/admin-access-lifecycle";
import {
  buildAdminUserDetailHref,
  type AdminReturnSource,
} from "@/lib/product/admin-detail-routes";
import { cn } from "@/lib/utils";

type AccessReviewWorkspaceProps = {
  subjects: AccessLifecycleSubject[];
  defaultSubjectId: string | null;
  returnSource: AdminReturnSource;
};

const stateFilters: Array<{
  id: AccessPermissionStateFilter;
  label: string;
  tone: AdminTone;
}> = [
  { id: "all", label: "All", tone: "info" },
  { id: "allow", label: "Allowed", tone: "clear" },
  { id: "conditional", label: "Conditional", tone: "attention" },
  { id: "forbid", label: "Denied", tone: "blocked" },
];

function permissionTone(state: AccessPermissionState): AdminTone {
  if (state === "allow") {
    return "clear";
  }

  return state === "conditional" ? "attention" : "blocked";
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function subjectDetailHref(subject: AccessLifecycleSubject, returnSource: AdminReturnSource) {
  return buildAdminUserDetailHref(subject.userId, returnSource);
}

function stateFilterCount(subject: AccessLifecycleSubject | null, filter: AccessPermissionStateFilter) {
  if (!subject) {
    return 0;
  }

  if (filter === "allow") {
    return subject.allowedActions;
  }

  if (filter === "conditional") {
    return subject.conditionalActions;
  }

  if (filter === "forbid") {
    return subject.forbiddenActions;
  }

  return subject.allowedActions + subject.conditionalActions + subject.forbiddenActions;
}

function sourceTone(source: string): AdminTone {
  if (source === "No matching role grant") {
    return "blocked";
  }

  if (source.startsWith("Lifecycle")) {
    return "attention";
  }

  return "info";
}

function sourceBasis(source: string) {
  if (source.startsWith("Role:")) {
    return "Role baseline";
  }

  if (source.startsWith("Lifecycle")) {
    return "Lifecycle state";
  }

  if (source === "No matching role grant") {
    return "No grant";
  }

  return "Effective rule";
}

export function AccessReviewWorkspace({
  subjects,
  defaultSubjectId,
  returnSource,
}: AccessReviewWorkspaceProps) {
  const [principalQuery, setPrincipalQuery] = useState("");
  const [permissionQuery, setPermissionQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<AccessPermissionStateFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(defaultSubjectId);
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const filteredSubjects = useMemo(
    () => filterAccessReviewSubjects(subjects, principalQuery),
    [principalQuery, subjects],
  );
  const selectedSubject =
    subjects.find((subject) => subject.id === selectedId) ??
    subjects.find((subject) => subject.id === defaultSubjectId) ??
    subjects[0] ??
    null;
  const selectedReviewed = selectedSubject ? reviewedIds.includes(selectedSubject.id) : false;
  const permissionResources = selectedSubject
    ? filterAccessPermissionResources(selectedSubject, { query: permissionQuery, state: stateFilter })
    : [];
  const selectedVisible = selectedSubject
    ? filteredSubjects.some((subject) => subject.id === selectedSubject.id)
    : false;
  const hasActiveFilters =
    principalQuery.trim().length > 0 ||
    permissionQuery.trim().length > 0 ||
    stateFilter !== "all";
  const hasActivePermissionFilters = permissionQuery.trim().length > 0 || stateFilter !== "all";

  function selectSubject(subjectId: string) {
    setSelectedId(subjectId);
  }

  function clearFilters() {
    setPrincipalQuery("");
    setPermissionQuery("");
    setStateFilter("all");
  }

  function clearPermissionFilters() {
    setPermissionQuery("");
    setStateFilter("all");
  }

  function markReviewed() {
    if (!selectedSubject || selectedReviewed) {
      return;
    }

    setReviewedIds((current) => [...current, selectedSubject.id]);
  }

  return (
    <section
      id="effective-access-workspace"
      aria-label="Effective access workspace"
      className="scroll-mt-24 overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
    >
      <div className="grid gap-3 border-b border-border-subtle bg-bg-default p-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,auto)] lg:items-center">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Effective access workspace
          </p>
          <h2 className="mt-1 break-words text-xl font-semibold text-foreground">
            Inspect principals before opening evidence
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            Search the principal queue, select the access packet in-place, then use the
            matrix controls to inspect actions by source and state before opening evidence.
          </p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-bg-muted/40 px-3 py-2 text-xs leading-5 text-muted-foreground">
          <AdminStatusBadge tone="info">Read-only</AdminStatusBadge>{" "}
          <span>{formatCount(subjects.length)} principals in the access baseline</span>
        </div>
      </div>

      <div
        aria-label="Access review controls"
        className="grid gap-3 border-b border-border-subtle bg-bg-default p-3 lg:grid-cols-[minmax(260px,1fr)_auto]"
      >
        <label className="relative min-w-0">
          <span className="sr-only">Search principals</span>
          <SearchIcon
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            role="searchbox"
            aria-label="Search principals"
            className="pl-8"
            placeholder="Search names, roles, scopes, or review reasons..."
            value={principalQuery}
            onChange={(event) => setPrincipalQuery(event.target.value)}
          />
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
        >
          <SlidersHorizontalIcon aria-hidden="true" />
          <span>Reset filters</span>
        </Button>
      </div>

      <div className="grid items-start lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
        <aside
          aria-label="Principal review queue"
          className="min-w-0 border-b border-border-subtle bg-bg-muted/20 p-3 lg:border-b-0 lg:border-r"
        >
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Principals
              </p>
              <h3 className="mt-1 text-base font-semibold text-foreground">
                Review queue
              </h3>
            </div>
            <AdminStatusBadge tone={filteredSubjects.length ? "info" : "attention"}>
              {formatCount(filteredSubjects.length)} shown
            </AdminStatusBadge>
          </div>

          <div className="mt-3 grid max-h-[42rem] gap-2 overflow-y-auto pr-1">
            {selectedSubject && !selectedVisible && principalQuery.trim().length > 0 ? (
              <div className="rounded-lg border border-border-subtle bg-bg-default p-3 text-xs leading-5 text-muted-foreground">
                Selected packet stays pinned while principal search filters the queue.
              </div>
            ) : null}
            {filteredSubjects.length ? (
              filteredSubjects.map((subject) => {
                const active = subject.id === selectedSubject?.id;
                const reviewed = reviewedIds.includes(subject.id);

                return (
                  <button
                    key={subject.id}
                    type="button"
                    aria-pressed={active}
                    aria-label={`Select ${subject.displayName} principal`}
                    className={cn(
                      "group grid min-w-0 gap-2 rounded-lg border border-border-subtle bg-bg-default p-3 text-left transition hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      active && "border-primary/45 bg-primary/5",
                    )}
                    onClick={() => selectSubject(subject.id)}
                  >
                    <div className="flex min-w-0 items-start justify-between gap-2">
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
                      <ArrowRightIcon className="mt-1 size-3.5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
                    </div>
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-semibold text-foreground">
                        {subject.displayName}
                      </span>
                      <span className="mt-0.5 block break-words text-xs text-muted-foreground">
                        {subject.roleLabel} / {subject.scopeLabel}
                      </span>
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      <AdminStatusBadge tone={subject.stateTone as AdminTone}>
                        {subject.stateLabel}
                      </AdminStatusBadge>
                      <AdminStatusBadge
                        tone={subject.reviewReasons.length ? "attention" : "clear"}
                      >
                        {subject.reviewReasons.length ? "Review" : "Clear"}
                      </AdminStatusBadge>
                      {reviewed ? (
                        <AdminStatusBadge tone="clear">Reviewed</AdminStatusBadge>
                      ) : null}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="rounded-lg border border-border-subtle bg-bg-default p-3 text-sm text-muted-foreground">
                No principals match the current search.
              </div>
            )}
          </div>
        </aside>

        <div className="grid min-w-0 gap-4 p-3 sm:p-4">
          <SelectedPrincipalPacket
            reviewed={selectedReviewed}
            returnSource={returnSource}
            subject={selectedSubject}
            onMarkReviewed={markReviewed}
          />
          <PermissionAuditMatrix
            hasActiveFilters={hasActivePermissionFilters}
            permissionQuery={permissionQuery}
            resources={permissionResources}
            selectedSubject={selectedSubject}
            stateFilter={stateFilter}
            onClearFilters={clearPermissionFilters}
            onPermissionQueryChange={setPermissionQuery}
            onStateFilterChange={setStateFilter}
          />
        </div>
      </div>
    </section>
  );
}

function SelectedPrincipalPacket({
  reviewed,
  returnSource,
  subject,
  onMarkReviewed,
}: {
  reviewed: boolean;
  returnSource: AdminReturnSource;
  subject: AccessLifecycleSubject | null;
  onMarkReviewed: () => void;
}) {
  return (
    <section
      aria-label="Selected principal packet"
      className={cn(
        "grid min-w-0 gap-4 rounded-lg border p-4",
        getAdminToneClassName(subject?.reviewReasons.length ? "attention" : "clear"),
      )}
    >
      {subject ? (
        <>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal opacity-75">
                Selected principal packet
              </p>
              <h3 className="mt-1 break-words text-xl font-semibold leading-tight">
                {subject.displayName}
              </h3>
              <p className="mt-1 break-all text-xs opacity-80">{subject.email}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 md:justify-end">
              <AdminStatusBadge tone={subject.stateTone as AdminTone}>
                {subject.stateLabel}
              </AdminStatusBadge>
              <AdminStatusBadge tone={subject.reviewReasons.length ? "attention" : "clear"}>
                {subject.riskLabel}
              </AdminStatusBadge>
            </div>
          </div>

          <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Role baseline", subject.roleLabel],
              ["Scope", subject.scopeLabel],
              [
                "Review reason",
                subject.reviewReasons.length
                  ? subject.reviewReasons.join("; ")
                  : "No review flags",
              ],
              [
                "Effective actions",
                `${subject.allowedActions} allowed / ${subject.conditionalActions} conditional / ${subject.forbiddenActions} denied`,
              ],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-md border border-current/15 bg-white/45 p-3 dark:bg-black/10">
                <dt className="text-xs font-semibold uppercase tracking-normal opacity-70">
                  {label}
                </dt>
                <dd className="mt-1 break-words text-sm font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap gap-2">
            <Link
              href={subjectDetailHref(subject, returnSource)}
              className={cn(buttonVariants({ size: "sm" }), "w-fit")}
            >
              <FileSearchIcon aria-hidden="true" />
              <span>Open user evidence</span>
            </Link>
            <Button
              type="button"
              variant={reviewed ? "secondary" : "outline"}
              size="sm"
              onClick={onMarkReviewed}
              disabled={reviewed}
            >
              <CheckCircle2Icon aria-hidden="true" />
              <span>{reviewed ? "Reviewed this session" : "Mark reviewed"}</span>
            </Button>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-border-subtle bg-bg-default p-4 text-sm text-muted-foreground">
          No principal is available for access review.
        </div>
      )}
    </section>
  );
}

function PermissionAuditMatrix({
  hasActiveFilters,
  permissionQuery,
  resources,
  selectedSubject,
  stateFilter,
  onClearFilters,
  onPermissionQueryChange,
  onStateFilterChange,
}: {
  hasActiveFilters: boolean;
  permissionQuery: string;
  resources: ReturnType<typeof filterAccessPermissionResources>;
  selectedSubject: AccessLifecycleSubject | null;
  stateFilter: AccessPermissionStateFilter;
  onClearFilters: () => void;
  onPermissionQueryChange: (query: string) => void;
  onStateFilterChange: (filter: AccessPermissionStateFilter) => void;
}) {
  return (
    <section
      aria-label="Permission audit matrix"
      className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
    >
      <div className="grid gap-3 border-b border-border-subtle p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Permission audit matrix
          </p>
          <h3 className="mt-1 break-words text-xl font-semibold text-foreground">
            {selectedSubject
              ? `${selectedSubject.displayName} effective access`
              : "Effective access"}
          </h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            Actions stay grouped by operational resource, with source pills that separate
            role baseline grants from lifecycle, scope, and denied effective-access rules.
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

      <div
        aria-label="Permission evidence controls"
        className="border-b border-border-subtle bg-bg-default p-3"
      >
        <label className="relative block min-w-0">
          <span className="sr-only">Search actions and grant sources</span>
          <SearchIcon
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            role="searchbox"
            aria-label="Search actions and grant sources"
            className="pl-8"
            placeholder="Search actions or sources..."
            value={permissionQuery}
            onChange={(event) => onPermissionQueryChange(event.target.value)}
          />
        </label>
      </div>

      <div
        aria-label="Permission state filters"
        role="group"
        className="flex gap-0 overflow-x-auto border-b border-border-subtle bg-bg-muted/30 px-2 pt-2"
      >
        {stateFilters.map((filter) => {
          const active = filter.id === stateFilter;
          const count = stateFilterCount(selectedSubject, filter.id);

          return (
            <button
              key={filter.id}
              type="button"
              aria-pressed={active}
              className={cn(
                "inline-flex min-h-10 min-w-fit items-center gap-2 border-b-2 px-3 pb-2 pt-1 text-sm font-medium transition",
                active
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
              onClick={() => onStateFilterChange(filter.id)}
            >
              <span>{filter.label}</span>
              <AdminStatusBadge tone={filter.tone}>{formatCount(count)}</AdminStatusBadge>
            </button>
          );
        })}
      </div>

      {resources.length ? (
        <div className="divide-y divide-border-subtle">
          {resources.map((resource) => (
            <article
              key={resource.id}
              className="grid gap-4 p-4 xl:grid-cols-[minmax(13rem,0.4fr)_minmax(0,1fr)]"
            >
              <div className="min-w-0">
                <h4 className="break-words text-base font-semibold text-foreground">
                  {resource.label}
                </h4>
                <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
                  {resource.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <AdminStatusBadge tone="clear">{resource.allowedCount} allowed</AdminStatusBadge>
                  <AdminStatusBadge tone="attention">
                    {resource.conditionalCount} conditional
                  </AdminStatusBadge>
                  <AdminStatusBadge tone="blocked">{resource.forbiddenCount} denied</AdminStatusBadge>
                </div>
              </div>
              <div className="grid min-w-0 gap-2">
                {resource.actions.map((action) => (
                  <div
                    key={action.id}
                    className="grid gap-3 rounded-lg border border-border-subtle bg-bg-muted/35 p-3 md:grid-cols-[minmax(0,1fr)_minmax(12rem,auto)]"
                  >
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="break-words text-sm font-semibold text-foreground">
                          {action.label}
                        </p>
                        <AdminStatusBadge tone={permissionTone(action.state)}>
                          {action.state === "forbid" ? "denied" : action.state}
                        </AdminStatusBadge>
                      </div>
                      <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
                        {action.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {action.grantedBy.map((source) => (
                          <AdminStatusBadge key={source} tone={sourceTone(source)}>
                            {sourceBasis(source)}: {source}
                          </AdminStatusBadge>
                        ))}
                      </div>
                    </div>
                    <div className="min-w-0 md:text-right">
                      <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                        Reviewer note
                      </p>
                      <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
                        {action.reviewNote}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 p-4">
          <div className="rounded-lg border border-border-subtle bg-bg-muted/35 p-4 text-sm text-muted-foreground">
            No effective actions match the current state filter.
          </div>
          {hasActiveFilters ? (
            <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onClearFilters}>
              <SlidersHorizontalIcon aria-hidden="true" />
              <span>Reset filters</span>
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}
