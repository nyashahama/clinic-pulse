"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  ArrowUpRightIcon,
  ArrowUpDownIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EyeOffIcon,
  KeyRoundIcon,
  SearchIcon,
  ShieldCheckIcon,
  XIcon,
} from "lucide-react";

import { AdminStatusBadge, type AdminTone } from "@/components/product/admin-module";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  AccessLifecycleSubject,
  AccessPermissionResource,
  AccessPermissionState,
} from "@/lib/product/admin-access-lifecycle";
import { buildAdminUserDetailHref } from "@/lib/product/admin-detail-routes";
import { classifyAccessRisk } from "@/lib/product/admin-governance";
import { cn } from "@/lib/utils";

type AuthRole = "system_admin" | "org_admin" | "district_manager" | "reporter";

export type UserRow = {
  userId: number;
  email: string;
  displayName: string;
  disabledAt?: string | null;
  createdAt: string;
  role: AuthRole | string;
  organisationId?: number | null;
  district?: string | null;
  lastSeenAt?: string | null;
};

const activeRoles = new Set<AuthRole>([
  "reporter",
  "district_manager",
  "org_admin",
  "system_admin",
]);

const roleOptions: Array<{ value: AuthRole; label: string }> = [
  { value: "reporter", label: "Field reporter" },
  { value: "district_manager", label: "District manager" },
  { value: "org_admin", label: "Organisation admin" },
  { value: "system_admin", label: "System admin" },
];

function isActiveRole(role: string): role is AuthRole {
  return activeRoles.has(role as AuthRole);
}

function getRisk(user: UserRow) {
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

function formatDateTime(value?: string | null) {
  if (!value) return "Unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";

  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatLabel(value?: string | null) {
  if (!value) return "Unavailable";
  return value.replaceAll("_", " ");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type SortField = "displayName" | "role" | "lastSeenAt" | "createdAt";
type SortDirection = "asc" | "desc";

type UsersRolesDataTableProps = {
  users: UserRow[];
  accessSubjects?: AccessLifecycleSubject[];
  defaultSubjectId?: string | null;
  evidenceLinks?: AccessEvidenceLink[];
  detailReturnSource?: string;
  onBulkDisable?: (userIds: number[]) => Promise<void>;
  onBulkEnable?: (userIds: number[]) => Promise<void>;
  onBulkRevokeSessions?: (userIds: number[]) => Promise<void>;
};

type AccessEvidenceLink = {
  label: string;
  href: string;
  description: string;
};

const PAGE_SIZE = 10;

export function UsersRolesDataTable({
  users,
  accessSubjects = [],
  defaultSubjectId = null,
  evidenceLinks = [],
  detailReturnSource = "admin-users-roles",
  onBulkDisable,
  onBulkEnable,
  onBulkRevokeSessions,
}: UsersRolesDataTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(null);
  const [disabledOverrides, setDisabledOverrides] = useState<Map<number, string | null>>(
    new Map(),
  );
  const [inspectedUserId, setInspectedUserId] = useState<number | null>(() =>
    getInitialInspectedUserId(users, accessSubjects, defaultSubjectId),
  );

  const search = searchParams.get("q") || "";
  const roleFilter = searchParams.get("role") || "all";
  const statusFilter = searchParams.get("status") || "all";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const sortField = (searchParams.get("sort") as SortField) || "displayName";
  const sortDirection = (searchParams.get("dir") as SortDirection) || "asc";
  const subjectsByUserId = useMemo(
    () => new Map(accessSubjects.map((subject) => [subject.userId, subject])),
    [accessSubjects],
  );
  const lifecycleUsers = useMemo(
    () =>
      users.map((user) =>
        disabledOverrides.has(user.userId)
          ? { ...user, disabledAt: disabledOverrides.get(user.userId) }
          : user,
      ),
    [disabledOverrides, users],
  );

  const createQueryString = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === "" || value === "all" || value === "1") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      return params.toString();
    },
    [searchParams]
  );

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      router.push(`${pathname}?${createQueryString(updates)}`, { scroll: false });
    },
    [router, pathname, createQueryString]
  );

  const filteredUsers = useMemo(() => {
    let result = lifecycleUsers;

    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(
        (user) =>
          user.displayName.toLowerCase().includes(lowerSearch) ||
          user.email.toLowerCase().includes(lowerSearch)
      );
    }

    if (roleFilter !== "all") {
      result = result.filter((user) => isActiveRole(user.role) && user.role === roleFilter);
    }

    if (statusFilter === "active") {
      result = result.filter((user) => !user.disabledAt);
    } else if (statusFilter === "disabled") {
      result = result.filter((user) => user.disabledAt);
    }

    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "displayName":
          comparison = a.displayName.localeCompare(b.displayName);
          break;
        case "role":
          comparison = a.role.localeCompare(b.role);
          break;
        case "lastSeenAt":
          comparison = (a.lastSeenAt || "").localeCompare(b.lastSeenAt || "");
          break;
        case "createdAt":
          comparison = a.createdAt.localeCompare(b.createdAt);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [lifecycleUsers, search, roleFilter, statusFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const safePage = Math.min(Math.max(1, page), totalPages || 1);
  const paginatedUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const inspectedUser =
    filteredUsers.find((user) => user.userId === inspectedUserId) ??
    filteredUsers[0] ??
    null;
  const inspectedSubject = inspectedUser ? subjectsByUserId.get(inspectedUser.userId) ?? null : null;
  const activeInspectedUserId = inspectedUser?.userId ?? null;

  const allPageSelected =
    paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedIds.has(u.userId));
  const somePageSelected = paginatedUsers.some((u) => selectedIds.has(u.userId));

  const handleSort = (field: SortField) => {
    const newDirection = sortField === field && sortDirection === "asc" ? "desc" : "asc";
    updateParams({ sort: field, dir: newDirection });
  };

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedUsers.forEach((u) => next.delete(u.userId));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedUsers.forEach((u) => next.add(u.userId));
        return next;
      });
    }
  };

  const toggleSelect = (userId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkAction = async (action: string, handler?: (ids: number[]) => Promise<void>) => {
    if (!handler || selectedIds.size === 0) return;
    setBulkActionLoading(action);
    try {
      await handler(Array.from(selectedIds));
      if (action === "disable" || action === "enable") {
        const nextDisabledAt = action === "disable" ? new Date().toISOString() : null;
        setDisabledOverrides((current) => {
          const next = new Map(current);
          for (const userId of selectedIds) {
            next.set(userId, nextDisabledAt);
          }
          return next;
        });
      }
      clearSelection();
      router.refresh();
    } finally {
      setBulkActionLoading(null);
    }
  };

  function renderSortIcon(field: SortField) {
    if (sortField !== field) return <ArrowUpDownIcon className="size-3 opacity-30" />;
    return sortDirection === "asc" ? (
      <ChevronUpIcon className="size-3" />
    ) : (
      <ChevronDownIcon className="size-3" />
    );
  }

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.42fr)] xl:items-start">
      <div className="min-w-0 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              aria-label="Search users"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => updateParams({ q: e.target.value, page: "1" })}
              className="pl-8"
            />
            {search && (
              <button
                onClick={() => updateParams({ q: "", page: "1" })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-3" />
              </button>
            )}
          </div>
          <select
            value={roleFilter}
            onChange={(e) => updateParams({ role: e.target.value, page: "1" })}
            className="h-9 rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="all">All roles</option>
            {roleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => updateParams({ status: e.target.value, page: "1" })}
            className="h-9 rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
        <p className="text-sm text-muted-foreground">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
          {selectedIds.size > 0 && ` · ${selectedIds.size} selected`}
        </p>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm dark:border-sky-900/60 dark:bg-sky-950/30">
          <span className="font-medium text-sky-900 dark:text-sky-100">
            {selectedIds.size} user{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-1 ml-auto">
            {onBulkDisable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("disable", onBulkDisable)}
                disabled={bulkActionLoading === "disable"}
                className="h-7 text-xs"
              >
                <EyeOffIcon className="size-3" />
                {bulkActionLoading === "disable" ? "Disabling..." : "Disable"}
              </Button>
            )}
            {onBulkEnable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("enable", onBulkEnable)}
                disabled={bulkActionLoading === "enable"}
                className="h-7 text-xs"
              >
                <CheckIcon className="size-3" />
                {bulkActionLoading === "enable" ? "Enabling..." : "Enable"}
              </Button>
            )}
            {onBulkRevokeSessions && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("revoke", onBulkRevokeSessions)}
                disabled={bulkActionLoading === "revoke"}
                className="h-7 text-xs"
              >
                <KeyRoundIcon className="size-3" />
                {bulkActionLoading === "revoke" ? "Revoking..." : "Revoke sessions"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-7 text-xs"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default shadow-sm">
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[700px]">
            <TableHeader>
              <TableRow className="border-border-subtle bg-bg-muted/60 hover:bg-bg-muted/60">
                <TableHead className="h-11 w-10 px-3">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = somePageSelected && !allPageSelected;
                    }}
                    onChange={toggleSelectAll}
                    className="size-4 rounded border-input accent-foreground"
                  />
                </TableHead>
                <TableHead className="h-11 px-3">
                  <button
                    onClick={() => handleSort("displayName")}
                    className="flex items-center gap-1 text-xs font-semibold uppercase tracking-normal text-content-default hover:text-foreground"
                  >
                    User
                    {renderSortIcon("displayName")}
                  </button>
                </TableHead>
                <TableHead className="h-11 px-3">
                  <button
                    onClick={() => handleSort("role")}
                    className="flex items-center gap-1 text-xs font-semibold uppercase tracking-normal text-content-default hover:text-foreground"
                  >
                    Role
                    {renderSortIcon("role")}
                  </button>
                </TableHead>
                <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-normal text-content-default hidden sm:table-cell">
                  Scope
                </TableHead>
                <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-normal text-content-default">
                  Status
                </TableHead>
                <TableHead className="h-11 px-3 hidden md:table-cell">
                  <button
                    onClick={() => handleSort("lastSeenAt")}
                    className="flex items-center gap-1 text-xs font-semibold uppercase tracking-normal text-content-default hover:text-foreground"
                  >
                    Last seen
                    {renderSortIcon("lastSeenAt")}
                  </button>
                </TableHead>
                <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-normal text-content-default hidden lg:table-cell">
                  Review
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border-subtle [&_tr]:border-0">
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                    {search || roleFilter !== "all" || statusFilter !== "all"
                      ? "No users match your filters. Try adjusting your search."
                      : "No users found."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => {
                  const risk = getRisk(user);
                  const detailHref = buildAdminUserDetailHref(user.userId, detailReturnSource);
                  const isSelected = selectedIds.has(user.userId);
                  const isInspected = activeInspectedUserId === user.userId;

                  return (
                    <TableRow
                      key={user.userId}
                      tabIndex={0}
                      aria-selected={isInspected}
                      data-state={isInspected ? "selected" : undefined}
                      className={cn(
                        "cursor-pointer hover:bg-bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        isInspected &&
                          "bg-sky-50/70 hover:bg-sky-50/80 dark:bg-sky-950/35 dark:hover:bg-sky-950/45",
                        isSelected && "bg-accent/50",
                      )}
                      onClick={() => setInspectedUserId(user.userId)}
                      onFocus={() => setInspectedUserId(user.userId)}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) {
                          return;
                        }
                        if (event.key !== "Enter" && event.key !== " ") {
                          return;
                        }
                        event.preventDefault();
                        setInspectedUserId(user.userId);
                      }}
                    >
                      <TableCell className="px-3 py-3 w-10">
                        <input
                          type="checkbox"
                          aria-label={`Select ${user.displayName}`}
                          checked={isSelected}
                          onChange={(event) => {
                            event.stopPropagation();
                            toggleSelect(user.userId);
                          }}
                          onClick={(event) => event.stopPropagation()}
                          className="size-4 rounded border-input accent-foreground"
                        />
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                            {getInitials(user.displayName)}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={detailHref}
                              className="block font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {user.displayName}
                            </Link>
                            <p className="break-all text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <AdminStatusBadge tone="info">{formatLabel(user.role)}</AdminStatusBadge>
                      </TableCell>
                      <TableCell className="px-3 py-3 text-sm text-foreground hidden sm:table-cell">
                        {user.district ?? user.organisationId ?? "Platform"}
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <AdminStatusBadge tone={user.disabledAt ? "blocked" : "clear"}>
                          {user.disabledAt ? "Disabled" : "Active"}
                        </AdminStatusBadge>
                      </TableCell>
                      <TableCell className="px-3 py-3 text-xs text-muted-foreground hidden md:table-cell">
                        {formatDateTime(user.lastSeenAt)}
                      </TableCell>
                      <TableCell className="px-3 py-3 hidden lg:table-cell">
                        <div className="space-y-1">
                          <AdminStatusBadge tone={risk.tone}>{risk.label}</AdminStatusBadge>
                          {risk.reasons.length > 0 && (
                            <p className="max-w-xs text-xs text-muted-foreground">
                              {risk.reasons.join("; ")}
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {safePage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateParams({ page: String(safePage - 1) })}
              disabled={safePage === 1}
            >
              <ChevronLeftIcon className="size-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (safePage <= 3) {
                  pageNum = i + 1;
                } else if (safePage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = safePage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === safePage ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateParams({ page: String(pageNum) })}
                    className="w-9"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateParams({ page: String(safePage + 1) })}
              disabled={safePage === totalPages}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}
      </div>
      <PrincipalAccessPacket
        user={inspectedUser}
        subject={inspectedSubject}
        evidenceLinks={evidenceLinks}
        detailReturnSource={detailReturnSource}
      />
    </div>
  );
}

function getInitialInspectedUserId(
  users: UserRow[],
  subjects: AccessLifecycleSubject[],
  defaultSubjectId: string | null,
) {
  const defaultSubject = defaultSubjectId
    ? subjects.find((subject) => subject.id === defaultSubjectId)
    : null;

  return defaultSubject?.userId ?? subjects[0]?.userId ?? users[0]?.userId ?? null;
}

function PrincipalAccessPacket({
  user,
  subject,
  evidenceLinks,
  detailReturnSource,
}: {
  user: UserRow | null;
  subject: AccessLifecycleSubject | null;
  evidenceLinks: AccessEvidenceLink[];
  detailReturnSource: string;
}) {
  if (!user || !subject) {
    return (
      <aside
        aria-label="Selected principal access packet"
        className="rounded-lg border border-border-subtle bg-bg-default p-4 text-sm text-muted-foreground shadow-sm"
      >
        Select a user row to inspect its role, lifecycle state, and effective access evidence.
      </aside>
    );
  }

  const detailHref = buildAdminUserDetailHref(user.userId, detailReturnSource);
  const disabled = Boolean(user.disabledAt);
  const stateLabel = disabled ? "Disabled" : subject.stateLabel;
  const stateTone = disabled ? "attention" : subject.stateTone;
  const baseReviewReasons = disabled
    ? Array.from(new Set(["Disabled account", ...subject.reviewReasons]))
    : subject.reviewReasons;
  const reviewReasons = baseReviewReasons.length
    ? baseReviewReasons
    : ["No active review reasons"];

  return (
    <aside
      aria-label="Selected principal access packet"
      className="grid gap-3 rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm"
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Selected principal
          </p>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            Principal access packet
          </h2>
        </div>
        <span
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-bg-muted/60 text-muted-foreground"
          aria-hidden="true"
        >
          <ShieldCheckIcon className="size-4" />
        </span>
      </div>

      <div className="rounded-lg border border-border-subtle bg-bg-muted/40 p-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="break-words text-lg font-semibold leading-tight text-foreground">
              {subject.displayName}
            </h3>
            <p className="mt-1 break-all text-xs text-muted-foreground">{subject.email}</p>
          </div>
          <AdminStatusBadge tone={stateTone}>{stateLabel}</AdminStatusBadge>
        </div>

        <dl className="mt-3 grid gap-2 text-sm">
          <PacketFact label="Assigned role">{subject.roleLabel}</PacketFact>
          <PacketFact label="Scope">{subject.scopeLabel}</PacketFact>
          <PacketFact label="Review state">{subject.riskLabel}</PacketFact>
        </dl>
      </div>

      <section aria-label="Effective access" className="grid gap-2">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">Effective access</h3>
          <div className="flex shrink-0 gap-1">
            <AccessCountBadge state="allow" value={subject.allowedActions} />
            <AccessCountBadge state="conditional" value={subject.conditionalActions} />
            <AccessCountBadge state="forbid" value={subject.forbiddenActions} />
          </div>
        </div>

        <div className="grid gap-2">
          {subject.permissionResources.map((resource) => (
            <PermissionResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border-subtle bg-bg-muted/35 p-3">
        <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
          Review reasons
        </p>
        <ul className="mt-2 grid gap-1 text-sm text-foreground">
          {reviewReasons.map((reason) => (
            <li key={reason} className="break-words">
              {reason}
            </li>
          ))}
        </ul>
      </section>

      {evidenceLinks.length ? (
        <section className="rounded-lg border border-border-subtle bg-bg-muted/35 p-3">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Source evidence
          </p>
          <div className="mt-2 grid gap-2">
            {evidenceLinks.map((link) => (
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href}
                className="grid gap-1 rounded-md border border-border-subtle bg-bg-default p-2 text-sm transition hover:bg-bg-muted"
              >
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  {link.label}
                  <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
                </span>
                <span className="break-words text-xs leading-5 text-muted-foreground">
                  {link.description}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        <Link
          href={detailHref}
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition hover:bg-foreground/90"
        >
          Open user evidence
          <ArrowUpRightIcon className="size-4" aria-hidden="true" />
        </Link>
        <Link
          href="/admin/access-review#effective-access-workspace"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-border-subtle bg-bg-default px-3 py-2 text-sm font-medium text-foreground transition hover:bg-bg-muted"
        >
          Open access review
          <ArrowUpRightIcon className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}

function PacketFact({ label, children }: { label: string; children: string }) {
  return (
    <div className="grid gap-1 rounded-md bg-bg-default p-2">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="break-words font-medium text-foreground">{children}</dd>
    </div>
  );
}

function AccessCountBadge({
  state,
  value,
}: {
  state: AccessPermissionState;
  value: number;
}) {
  const label: Record<AccessPermissionState, string> = {
    allow: "Allow",
    conditional: "Review",
    forbid: "Deny",
  };

  return (
    <span className="rounded-md border border-border-subtle bg-bg-default px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
      {label[state]} {value}
    </span>
  );
}

function PermissionResourceCard({ resource }: { resource: AccessPermissionResource }) {
  return (
    <article className="rounded-lg border border-border-subtle bg-bg-muted/25 p-3">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-foreground">{resource.label}</p>
          <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
            {resource.description}
          </p>
        </div>
        <span className="rounded-md bg-bg-default px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
          {resource.allowedCount}/{resource.actions.length}
        </span>
      </div>

      <div className="mt-3 grid gap-2">
        {resource.actions.map((action) => (
          <div
            key={action.id}
            className="grid gap-1 rounded-md border border-border-subtle bg-bg-default p-2"
          >
            <div className="flex min-w-0 items-center justify-between gap-2">
              <p className="break-words text-sm font-medium text-foreground">{action.label}</p>
              <PermissionStateBadge state={action.state} />
            </div>
            <p className="break-words text-xs leading-5 text-muted-foreground">
              {action.reviewNote}
            </p>
            <p className="break-words text-xs leading-5 text-muted-foreground">
              <span className="font-medium text-foreground">Source: </span>
              {action.grantedBy.join(", ")}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function PermissionStateBadge({ state }: { state: AccessPermissionState }) {
  const badge: Record<AccessPermissionState, { label: string; tone: AdminTone }> = {
    allow: { label: "Allowed", tone: "clear" },
    conditional: { label: "Review", tone: "attention" },
    forbid: { label: "Denied", tone: "blocked" },
  };

  return <AdminStatusBadge tone={badge[state].tone}>{badge[state].label}</AdminStatusBadge>;
}
