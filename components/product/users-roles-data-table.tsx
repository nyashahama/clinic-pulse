"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  ArrowUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  SearchIcon,
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
import { buildAdminUserDetailHref } from "@/lib/product/admin-detail-routes";
import { classifyAccessRisk } from "@/lib/product/admin-governance";

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

type SortField = "displayName" | "role" | "lastSeenAt" | "createdAt";
type SortDirection = "asc" | "desc";

type UsersRolesDataTableProps = {
  users: UserRow[];
  detailReturnSource?: string;
};

const PAGE_SIZE = 10;

export function UsersRolesDataTable({
  users,
  detailReturnSource = "admin-users-roles",
}: UsersRolesDataTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("q") || "";
  const roleFilter = searchParams.get("role") || "all";
  const statusFilter = searchParams.get("status") || "all";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const sortField = (searchParams.get("sort") as SortField) || "displayName";
  const sortDirection = (searchParams.get("dir") as SortDirection) || "asc";

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
    let result = users;

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
  }, [users, search, roleFilter, statusFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const safePage = Math.min(Math.max(1, page), totalPages || 1);
  const paginatedUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSort = (field: SortField) => {
    const newDirection = sortField === field && sortDirection === "asc" ? "desc" : "asc";
    updateParams({ sort: field, dir: newDirection });
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
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
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
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border-subtle bg-bg-muted/60 hover:bg-bg-muted/60">
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
              <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-normal text-content-default">
                Scope
              </TableHead>
              <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-normal text-content-default">
                Status
              </TableHead>
              <TableHead className="h-11 px-3">
                <button
                  onClick={() => handleSort("lastSeenAt")}
                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-normal text-content-default hover:text-foreground"
                >
                  Last seen
                  {renderSortIcon("lastSeenAt")}
                </button>
              </TableHead>
              <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-normal text-content-default">
                Review
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border-subtle [&_tr]:border-0">
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                  {search || roleFilter !== "all" || statusFilter !== "all"
                    ? "No users match your filters. Try adjusting your search."
                    : "No users found."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => {
                const risk = getRisk(user);
                const detailHref = buildAdminUserDetailHref(user.userId, detailReturnSource);

                return (
                  <TableRow key={user.userId} className="hover:bg-bg-muted/60">
                    <TableCell className="px-3 py-3">
                      <Link
                        href={detailHref}
                        className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {user.displayName}
                      </Link>
                      <p className="break-all text-xs text-muted-foreground">{user.email}</p>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <AdminStatusBadge tone="info">{formatLabel(user.role)}</AdminStatusBadge>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-sm text-foreground">
                      {user.district ?? user.organisationId ?? "Platform"}
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <AdminStatusBadge tone={user.disabledAt ? "blocked" : "clear"}>
                        {user.disabledAt ? "Disabled" : "Active"}
                      </AdminStatusBadge>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-xs text-muted-foreground">
                      {formatDateTime(user.lastSeenAt)}
                    </TableCell>
                    <TableCell className="px-3 py-3">
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
              Previous
            </Button>
            <div className="flex items-center gap-1">
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
              Next
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
