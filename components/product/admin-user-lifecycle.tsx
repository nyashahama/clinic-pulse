"use client";

import type { ComponentType, SVGProps } from "react";
import { useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, RefreshCw, ShieldCheck, UserPlus, UserX } from "lucide-react";

import {
  AdminEvidenceTable,
  AdminFilterBar,
  type AdminTone,
} from "@/components/product/admin-module";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { classifyAccessRisk } from "@/lib/product/admin-governance";
import { cn } from "@/lib/utils";

type AuthRole = "system_admin" | "org_admin" | "district_manager" | "reporter";

export type AdminUserLifecycleUser = {
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

export type AdminUserLifecycleCreateResult = {
  user: {
    email: string;
    displayName: string;
  };
  temporaryPassword: string;
};

const roleOptions: Array<{ value: AuthRole; label: string }> = [
  { value: "reporter", label: "Field reporter" },
  { value: "district_manager", label: "District manager" },
  { value: "org_admin", label: "Organisation admin" },
  { value: "system_admin", label: "System admin" },
];

const activeRoles = new Set<AuthRole>(roleOptions.map((role) => role.value));

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type AdminUserLifecycleProps = {
  users: AdminUserLifecycleUser[];
  createUserAction: (formData: FormData) => Promise<AdminUserLifecycleCreateResult>;
  updateUserAction: (userId: number, disabled: boolean) => Promise<void>;
  updateAccessAction: (userId: number, formData: FormData) => Promise<void>;
  revokeSessionsAction: (userId: number) => Promise<void>;
};

type TemporaryPasswordState = {
  email: string;
  displayName: string;
  password: string;
} | null;

type FeedbackState = {
  tone: "success" | "error";
  message: string;
} | null;

type UserOverrideState = Record<number, Partial<AdminUserLifecycleUser>>;

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

function isActiveRole(role: string): role is AuthRole {
  return activeRoles.has(role as AuthRole);
}

function getRisk(user: AdminUserLifecycleUser) {
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

function getRowKey(user: AdminUserLifecycleUser) {
  return [
    user.userId,
    user.role,
    user.organisationId ?? "platform",
    user.district ?? "all-districts",
  ].join(":");
}

function mutationErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Admin user update failed.";
}

function optimisticFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optimisticFormNumber(formData: FormData, key: string) {
  const value = optimisticFormString(formData, key);
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function LifecycleBadge({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: AdminTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        tone === "clear" &&
          "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
        tone === "attention" &&
          "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
        tone === "blocked" &&
          "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
        tone === "info" &&
          "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
      )}
    >
      {children}
    </span>
  );
}

function SubmitButton({
  children,
  icon: Icon,
  pendingLabel,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  icon?: IconComponent;
  pendingLabel?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="sm"
      variant={variant}
      disabled={pending}
      className={className}
    >
      {Icon ? <Icon aria-hidden="true" /> : null}
      <span>{pending ? (pendingLabel ?? "Working...") : children}</span>
    </Button>
  );
}

function FieldLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-xs font-medium uppercase tracking-normal text-muted-foreground"
    >
      {children}
    </label>
  );
}

export function AdminUserLifecycle({
  users,
  createUserAction,
  updateUserAction,
  updateAccessAction,
  revokeSessionsAction,
}: AdminUserLifecycleProps) {
  const createFormRef = useRef<HTMLFormElement>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [temporaryPassword, setTemporaryPassword] =
    useState<TemporaryPasswordState>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [userOverrides, setUserOverrides] = useState<UserOverrideState>({});
  const rows = useMemo(
    () =>
      users.map((user) => {
        const row = { ...user, ...(userOverrides[user.userId] ?? {}) };

        return { ...row, risk: getRisk(row) };
      }),
    [users, userOverrides],
  );

  async function createUser(formData: FormData) {
    setFeedback(null);
    setTemporaryPassword(null);
    try {
      const result = await createUserAction(formData);
      setTemporaryPassword({
        email: result.user.email,
        displayName: result.user.displayName,
        password: result.temporaryPassword,
      });
      createFormRef.current?.reset();
    } catch (error) {
      setTemporaryPassword(null);
      setFeedback({ tone: "error", message: mutationErrorMessage(error) });
    }
  }

  async function setDisabled(userId: number, disabled: boolean) {
    setFeedback(null);
    try {
      await updateUserAction(userId, disabled);
      setUserOverrides((current) => ({
        ...current,
        [userId]: {
          ...(current[userId] ?? {}),
          disabledAt: disabled ? new Date().toISOString() : null,
        },
      }));
      setFeedback({
        tone: "success",
        message: disabled ? "User disabled." : "User enabled.",
      });
    } catch (error) {
      setFeedback({ tone: "error", message: mutationErrorMessage(error) });
    }
  }

  async function updateAccess(userId: number, formData: FormData) {
    setFeedback(null);
    try {
      await updateAccessAction(userId, formData);
      const role = optimisticFormString(formData, "role");
      setUserOverrides((current) => ({
        ...current,
        [userId]: {
          ...(current[userId] ?? {}),
          ...(isActiveRole(role) ? { role } : {}),
          organisationId: optimisticFormNumber(formData, "organisationId"),
          district: optimisticFormString(formData, "district") || null,
        },
      }));
      setFeedback({ tone: "success", message: "User access updated." });
    } catch (error) {
      setFeedback({ tone: "error", message: mutationErrorMessage(error) });
    }
  }

  async function revokeSessions(userId: number) {
    setFeedback(null);
    try {
      await revokeSessionsAction(userId);
      setFeedback({ tone: "success", message: "Active sessions revoked." });
    } catch (error) {
      setFeedback({ tone: "error", message: mutationErrorMessage(error) });
    }
  }

  return (
    <div className="space-y-3">
      <AdminFilterBar className="items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <LifecycleBadge tone="info">Pilot lifecycle</LifecycleBadge>
            <span className="text-sm font-medium text-foreground">
              Disable or enable users
            </span>
            <span className="text-sm font-medium text-foreground">
              Revoke active sessions
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Role, scope, lifecycle, and session mutations are written through the
            admin API audit path.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant={showCreateForm ? "secondary" : "default"}
          onClick={() => setShowCreateForm((current) => !current)}
        >
          <UserPlus aria-hidden="true" />
          <span>Create pilot user</span>
        </Button>
      </AdminFilterBar>

      {showCreateForm ? (
        <form
          ref={createFormRef}
          action={createUser}
          className="grid gap-3 rounded-lg border border-border-subtle bg-bg-default p-3 shadow-sm md:grid-cols-[minmax(12rem,1.2fr)_minmax(12rem,1fr)_minmax(10rem,0.8fr)_minmax(8rem,0.6fr)_minmax(10rem,0.8fr)_auto]"
        >
          <div className="grid gap-1">
            <FieldLabel htmlFor="pilot-email">Work email</FieldLabel>
            <Input
              id="pilot-email"
              name="email"
              type="email"
              autoComplete="off"
              placeholder="pilot@example.test"
              required
            />
          </div>
          <div className="grid gap-1">
            <FieldLabel htmlFor="pilot-display-name">Display name</FieldLabel>
            <Input
              id="pilot-display-name"
              name="displayName"
              autoComplete="off"
              placeholder="Pilot User"
              required
            />
          </div>
          <div className="grid gap-1">
            <FieldLabel htmlFor="pilot-role">Role</FieldLabel>
            <select
              id="pilot-role"
              name="role"
              required
              defaultValue="reporter"
              className={selectClassName}
            >
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <FieldLabel htmlFor="pilot-organisation-id">Organisation ID</FieldLabel>
            <Input
              id="pilot-organisation-id"
              name="organisationId"
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="1"
            />
          </div>
          <div className="grid gap-1">
            <FieldLabel htmlFor="pilot-district">District</FieldLabel>
            <Input
              id="pilot-district"
              name="district"
              autoComplete="off"
              placeholder="Tshwane"
            />
          </div>
          <div className="flex items-end">
            <SubmitButton icon={UserPlus} pendingLabel="Creating...">
              Create account
            </SubmitButton>
          </div>
        </form>
      ) : null}

      {temporaryPassword ? (
        <section
          aria-live="polite"
          className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-950 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold">Temporary password</p>
              <p className="break-words text-sm">
                {temporaryPassword.displayName} ({temporaryPassword.email})
              </p>
              <code className="block w-fit max-w-full rounded-md bg-white/70 px-2 py-1 text-sm font-semibold text-amber-950 dark:bg-black/20 dark:text-amber-100">
                {temporaryPassword.password}
              </code>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setTemporaryPassword(null)}
            >
              Clear
            </Button>
          </div>
        </section>
      ) : null}

      {feedback ? (
        <p
          role={feedback.tone === "error" ? "alert" : "status"}
          className={cn(
            "rounded-lg border px-3 py-2 text-sm font-medium",
            feedback.tone === "success" &&
              "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
            feedback.tone === "error" &&
              "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
          )}
        >
          {feedback.message}
        </p>
      ) : null}

      <AdminEvidenceTable
        label="User lifecycle evidence"
        className="overflow-x-auto"
        rows={rows}
        getRowKey={getRowKey}
        columns={[
          {
            key: "user",
            header: "User",
            render: (row) => (
              <div className="min-w-56">
                <p className="font-medium text-foreground">{row.displayName}</p>
                <p className="break-all text-xs text-muted-foreground">{row.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Last seen: {formatDateTime(row.lastSeenAt)}
                </p>
              </div>
            ),
          },
          {
            key: "role",
            header: "Role and scope",
            className: "min-w-72",
            render: (row) => (
              <form action={(formData) => updateAccess(row.userId, formData)}>
                <div className="grid gap-2 sm:grid-cols-[minmax(9rem,1fr)_minmax(6rem,0.7fr)]">
                  <select
                    name="role"
                    aria-label={`Role for ${row.displayName}`}
                    defaultValue={isActiveRole(row.role) ? row.role : "reporter"}
                    className={selectClassName}
                  >
                    {roleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    name="organisationId"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    aria-label={`Organisation ID for ${row.displayName}`}
                    defaultValue={row.organisationId ?? ""}
                    placeholder="Org ID"
                  />
                  <Input
                    name="district"
                    aria-label={`District for ${row.displayName}`}
                    defaultValue={row.district ?? ""}
                    placeholder="District"
                    className="sm:col-span-2"
                  />
                  <SubmitButton
                    icon={ShieldCheck}
                    variant="outline"
                    pendingLabel="Saving..."
                    className="sm:col-span-2"
                  >
                    Update access
                  </SubmitButton>
                </div>
              </form>
            ),
          },
          {
            key: "state",
            header: "Disable or enable users",
            className: "min-w-44",
            render: (row) => {
              const disabled = Boolean(row.disabledAt);
              return (
                <div className="space-y-2">
                  <LifecycleBadge tone={disabled ? "blocked" : "clear"}>
                    {disabled ? "Disabled" : "Active"}
                  </LifecycleBadge>
                  <form action={() => setDisabled(row.userId, !disabled)}>
                    <SubmitButton
                      icon={disabled ? RefreshCw : UserX}
                      variant={disabled ? "outline" : "destructive"}
                      pendingLabel={disabled ? "Enabling..." : "Disabling..."}
                    >
                      {disabled ? "Enable user" : "Disable user"}
                    </SubmitButton>
                  </form>
                </div>
              );
            },
          },
          {
            key: "sessions",
            header: "Sessions",
            className: "min-w-44",
            render: (row) => (
              <form action={() => revokeSessions(row.userId)}>
                <SubmitButton
                  icon={KeyRound}
                  variant="outline"
                  pendingLabel="Revoking..."
                >
                  Revoke active sessions
                </SubmitButton>
              </form>
            ),
          },
          {
            key: "review",
            header: "Review status",
            render: (row) => (
              <div className="max-w-xs space-y-1">
                <LifecycleBadge tone={row.risk.tone}>{row.risk.label}</LifecycleBadge>
                <p className="text-xs text-muted-foreground">
                  {row.risk.reasons.length ? row.risk.reasons.join("; ") : "No review flags"}
                </p>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
