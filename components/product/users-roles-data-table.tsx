"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
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
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatLabel(value?: string | null) {
  if (!value) {
    return "Unavailable";
  }

  return value.replaceAll("_", " ");
}

type UsersRolesDataTableProps = {
  users: UserRow[];
  detailReturnSource?: string;
  defaultRoleFilter?: AuthRole | "all";
};

const PAGE_SIZE = 10;

export function UsersRolesDataTable({
  users,
  detailReturnSource = "admin-users-roles",
  defaultRoleFilter = "all",
}: UsersRolesDataTableProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<AuthRole | "all">(defaultRoleFilter);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        !search ||
        user.displayName.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      const matchesRole =
        roleFilter === "all" || isActiveRole(user.role) && user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !user.disabledAt) ||
        (statusFilter === "disabled" && user.disabledAt);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as AuthRole | "all");
              setCurrentPage(1);
            }}
            className="h-8 rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
            onChange={(e) => {
              setStatusFilter(e.target.value as "all" | "active" | "disabled");
              setCurrentPage(1);
            }}
            className="h-8 rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
              <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-normal text-content-default">
                User
              </TableHead>
              <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-normal text-content-default">
                Role
              </TableHead>
              <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-normal text-content-default">
                Scope
              </TableHead>
              <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-normal text-content-default">
                Status
              </TableHead>
              <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-normal text-content-default">
                Last seen
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
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => {
                const risk = getRisk(user);
                const detailHref = buildAdminUserDetailHref(user.userId, detailReturnSource);

                return (
                  <TableRow
                    key={user.userId}
                    className="hover:bg-bg-muted/60"
                  >
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
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
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
