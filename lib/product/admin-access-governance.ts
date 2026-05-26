import type { AuthRole } from "@/lib/auth/api";
import type { AdminUserAccessApiResponse } from "@/lib/demo/api-types";
import { buildAdminUserDetailHref } from "@/lib/product/admin-detail-routes";
import { classifyAccessRisk } from "@/lib/product/admin-governance";

export type AccessGovernanceTone = "clear" | "attention" | "blocked" | "info";

export type AccessGovernanceMetric = {
  id: "users-in-scope" | "privileged-access" | "review-load" | "session-evidence";
  label: string;
  value: string;
  detail: string;
  tone: AccessGovernanceTone;
};

export type AccessGovernanceAction = {
  id: "review-privileged" | "fix-scope" | "revoke-sessions" | "maintain-roster";
  title: string;
  description: string;
  count: string;
  href: string;
  tone: AccessGovernanceTone;
};

export type AccessGovernanceReviewRow = {
  id: string;
  userId: number;
  displayName: string;
  email: string;
  roleLabel: string;
  scopeLabel: string;
  accountStateLabel: string;
  sessionLabel: string;
  lastSeenLabel: string;
  reviewState: "Review required" | "Clear";
  reviewTone: AccessGovernanceTone;
  reasons: string[];
  decisionHandoff: string;
  detailHref: string;
  searchText: string;
};

export type AccessGovernanceSourceReference = {
  source: string;
  role: string;
  href: string;
  licenseUse: "adaptable" | "reference-only";
};

export type AccessGovernanceViewModel = {
  metrics: AccessGovernanceMetric[];
  actions: AccessGovernanceAction[];
  reviewRows: AccessGovernanceReviewRow[];
  sourceReferences: AccessGovernanceSourceReference[];
};

export type AccessUserDetailSignal = {
  id: "account-state" | "role-scope" | "session-evidence" | "review-state";
  label: string;
  value: string;
  detail: string;
  tone: AccessGovernanceTone;
};

export type AccessUserDetailAction = {
  label: string;
  href: string;
  description: string;
};

export type AccessUserDetailModel = {
  signals: AccessUserDetailSignal[];
  evidenceItems: Array<{ label: string; value: string; emphasis?: boolean }>;
  timeline: Array<{
    label: string;
    title: string;
    description: string;
    timestamp?: string;
    tone: AccessGovernanceTone;
  }>;
  decisionActions: AccessUserDetailAction[];
  reasons: string[];
  reviewState: "Review required" | "Clear";
};

type BuildAccessGovernanceOptions = {
  detailReturnSource: string;
  usersHref?: string;
  accessReviewHref?: string;
  auditEvidenceHref?: string;
};

type BuildAccessUserDetailOptions = {
  usersHref?: string;
  accessReviewHref?: string;
  auditEvidenceHref?: string;
};

const activeRoles = new Set<AuthRole>([
  "reporter",
  "district_manager",
  "org_admin",
  "system_admin",
]);

const dateTimeFormatter = new Intl.DateTimeFormat("en-ZA", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Johannesburg",
});

const countFormatter = new Intl.NumberFormat("en-ZA");

const sourceReferences: AccessGovernanceSourceReference[] = [
  {
    source: "Logto console",
    role: "Role assignment review, organisation-scoped access, and privileged-account framing.",
    href: "https://github.com/logto-io/logto",
    licenseUse: "reference-only",
  },
  {
    source: "Infisical Permission Audit",
    role: "Access-review queue, decision handoff language, and source-of-truth evidence rows.",
    href: "https://github.com/Infisical/infisical",
    licenseUse: "adaptable",
  },
  {
    source: "Supabase Audit Logs",
    role: "Session and actor evidence patterns for confirming who changed access and when.",
    href: "https://github.com/supabase/supabase",
    licenseUse: "adaptable",
  },
];

export function buildAccessGovernanceViewModel(
  users: AdminUserAccessApiResponse[],
  options: BuildAccessGovernanceOptions,
): AccessGovernanceViewModel {
  const accessReviewHref = options.accessReviewHref ?? "/admin/access-review";
  const usersHref = options.usersHref ?? "/admin/users-roles";
  const activeUsers = users.filter((user) => !user.disabledAt).length;
  const disabledUsers = users.length - activeUsers;
  const privilegedUsers = users.filter((user) => isPrivilegedRole(user.role)).length;
  const missingDistrictScope = users.filter(
    (user) => user.role === "district_manager" && !user.district,
  ).length;
  const usersWithoutSession = users.filter((user) => !user.lastSeenAt).length;
  const reviewRows = users
    .map((user) => buildReviewRow(user, options.detailReturnSource))
    .filter((row): row is AccessGovernanceReviewRow => Boolean(row))
    .sort((first, second) => reviewPriority(second) - reviewPriority(first));

  return {
    metrics: [
      {
        id: "users-in-scope",
        label: "Users in scope",
        value: formatCount(users.length),
        detail: `${formatCount(activeUsers)} active; ${formatCount(disabledUsers)} disabled`,
        tone: users.length > 0 ? "info" : "attention",
      },
      {
        id: "privileged-access",
        label: "Privileged access",
        value: formatCount(privilegedUsers),
        detail: "Organisation and system administrator accounts",
        tone: toneForAttention(privilegedUsers),
      },
      {
        id: "review-load",
        label: "Needs review",
        value: formatCount(reviewRows.length),
        detail: "Privileged, disabled, stale, or unscoped access",
        tone: toneForAttention(reviewRows.length),
      },
      {
        id: "session-evidence",
        label: "Session evidence",
        value: `${formatCount(users.length - usersWithoutSession)}/${formatCount(users.length)}`,
        detail:
          usersWithoutSession === 0
            ? "All accounts have recent active session evidence"
            : `${formatCount(usersWithoutSession)} ${pluralize(
                usersWithoutSession,
                "account",
              )} without a recent active session`,
        tone: toneForAttention(usersWithoutSession),
      },
    ],
    actions: [
      {
        id: "review-privileged",
        title: "Review privileged access",
        description: "Confirm organisation and system administrators still need elevated access.",
        count: formatCount(privilegedUsers),
        href: accessReviewHref,
        tone: toneForAttention(privilegedUsers),
      },
      {
        id: "fix-scope",
        title: "Fix missing district scope",
        description: "District managers need a district before their review scope is defensible.",
        count: formatCount(missingDistrictScope),
        href: accessReviewHref,
        tone: toneForAttention(missingDistrictScope),
      },
      {
        id: "revoke-sessions",
        title: "Revoke stale sessions",
        description: "Use the users table to revoke sessions when access evidence is unclear.",
        count: formatCount(usersWithoutSession),
        href: usersHref,
        tone: toneForAttention(usersWithoutSession),
      },
      {
        id: "maintain-roster",
        title: "Maintain pilot roster",
        description: "Create pilot users, change roles, disable accounts, or update scopes.",
        count: formatCount(users.length),
        href: usersHref,
        tone: "info",
      },
    ],
    reviewRows,
    sourceReferences,
  };
}

export function buildAccessUserDetailModel(
  user: AdminUserAccessApiResponse,
  options: BuildAccessUserDetailOptions = {},
): AccessUserDetailModel {
  const risk = getAccessRisk(user);
  const reasons = risk.reasons;
  const reviewState = reasons.length ? "Review required" : "Clear";
  const sessionTone = user.lastSeenAt ? "clear" : "attention";
  const scopeDetail = scopeEvidenceLabel(user, reasons);
  const accountDisabled = Boolean(user.disabledAt);

  return {
    signals: [
      {
        id: "account-state",
        label: "Account state",
        value: accountDisabled ? "Disabled" : "Active",
        detail: accountDisabled
          ? "Account is blocked until re-enabled"
          : "Account can sign in unless sessions are revoked",
        tone: accountDisabled ? "blocked" : "clear",
      },
      {
        id: "role-scope",
        label: "Role scope",
        value: formatRole(user.role),
        detail: scopeDetail,
        tone: reasons.includes("Missing district scope") ? "attention" : "info",
      },
      {
        id: "session-evidence",
        label: "Session evidence",
        value: formatDateTime(user.lastSeenAt),
        detail: user.lastSeenAt
          ? "Latest active session signal"
          : "No recent active session recorded",
        tone: sessionTone,
      },
      {
        id: "review-state",
        label: "Review state",
        value: reviewState,
        detail: reasons.length ? reasons.join("; ") : "No role, scope, account, or session flags",
        tone: reasons.length ? "attention" : "clear",
      },
    ],
    evidenceItems: [
      {
        label: "Identity",
        value: `${user.displayName} / ${user.email}`,
        emphasis: true,
      },
      {
        label: "Scope",
        value: buildScopeLabel(user),
      },
      {
        label: "Lifecycle",
        value: accountDisabled
          ? `Disabled ${formatDateTime(user.disabledAt)}`
          : `Created ${formatDateTime(user.createdAt)}`,
      },
      {
        label: "Review basis",
        value: reasons.length ? reasons.join("; ") : "No access review flags",
        emphasis: reasons.length > 0,
      },
    ],
    timeline: [
      {
        label: "Account created",
        title: "User entered the pilot roster",
        description: buildScopeLabel(user),
        timestamp: formatDateTime(user.createdAt),
        tone: "info",
      },
      {
        label: "Session evidence",
        title: user.lastSeenAt ? "Recent active session recorded" : "No recent session signal",
        description: user.lastSeenAt
          ? "Use this as the latest sign-in confidence signal before changing access."
          : "Confirm whether access is still needed before retaining or elevating the account.",
        timestamp: user.lastSeenAt ? formatDateTime(user.lastSeenAt) : undefined,
        tone: sessionTone,
      },
      {
        label: "Decision path",
        title: reviewState,
        description: reasons.length
          ? "Review the account, make the access change if needed, then use audit evidence as the durable decision record."
          : "No immediate access exception is visible from role, scope, lifecycle, or session evidence.",
        tone: reasons.length ? "attention" : "clear",
      },
    ],
    decisionActions: [
      {
        label: "Manage access",
        href: options.usersHref ?? "/admin/users-roles",
        description: "Change role, district scope, lifecycle state, or sessions.",
      },
      {
        label: "Access review",
        href: options.accessReviewHref ?? "/admin/access-review",
        description: "Return to the review queue for other access exceptions.",
      },
      {
        label: "Audit evidence",
        href: options.auditEvidenceHref ?? "/admin/audit-evidence",
        description: "Use the audit trail as the decision record path.",
      },
    ],
    reasons,
    reviewState,
  };
}

function buildReviewRow(
  user: AdminUserAccessApiResponse,
  detailReturnSource: string,
): AccessGovernanceReviewRow | null {
  const risk = getAccessRisk(user);

  if (risk.reasons.length === 0) {
    return null;
  }

  const accountStateLabel = user.disabledAt ? "Disabled" : "Active";
  const lastSeenLabel = formatDateTime(user.lastSeenAt);
  const scopeLabel = buildScopeLabel(user);

  return {
    id: `user-${user.userId}`,
    userId: user.userId,
    displayName: user.displayName,
    email: user.email,
    roleLabel: formatRole(user.role),
    scopeLabel,
    accountStateLabel,
    sessionLabel: user.lastSeenAt ? "Recent session" : "No recent session",
    lastSeenLabel,
    reviewState: "Review required",
    reviewTone: risk.tone,
    reasons: risk.reasons,
    decisionHandoff: "Record access decision in audit evidence",
    detailHref: buildAdminUserDetailHref(user.userId, detailReturnSource),
    searchText: [
      user.displayName,
      user.email,
      user.role,
      scopeLabel,
      accountStateLabel,
      lastSeenLabel,
      risk.reasons.join(" "),
    ]
      .join(" ")
      .toLowerCase(),
  };
}

function getAccessRisk(user: AdminUserAccessApiResponse) {
  if (!isActiveRole(user.role)) {
    return {
      tone: "attention" as const,
      label: "Review" as const,
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

function isActiveRole(role: string): role is AuthRole {
  return activeRoles.has(role as AuthRole);
}

function isPrivilegedRole(role: string) {
  return role === "org_admin" || role === "system_admin";
}

function reviewPriority(row: AccessGovernanceReviewRow) {
  let priority = 0;

  if (row.reasons.includes("System administrator access")) {
    priority += 100;
  }

  if (row.reasons.includes("Organisation administrator access")) {
    priority += 90;
  }

  if (row.reasons.includes("Disabled account")) {
    priority += 80;
  }

  if (row.reasons.includes("Missing district scope")) {
    priority += 70;
  }

  if (row.reasons.includes("No recent session")) {
    priority += 5;
  }

  return priority;
}

function scopeEvidenceLabel(user: AdminUserAccessApiResponse, reasons: string[]) {
  if (reasons.includes("Missing district scope")) {
    return "Missing district scope";
  }

  return buildScopeLabel(user);
}

function buildScopeLabel(user: AdminUserAccessApiResponse) {
  if (user.role === "system_admin") {
    return "Platform-wide access";
  }

  if (user.district) {
    return user.district;
  }

  if (user.organisationId) {
    return `Organisation ${user.organisationId}`;
  }

  return "All districts";
}

function formatRole(role: string) {
  const label = role.replaceAll("_", " ");

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return dateTimeFormatter.format(date);
}

function formatCount(value: number) {
  return countFormatter.format(value);
}

function pluralize(count: number, singular: string) {
  return count === 1 ? singular : `${singular}s`;
}

function toneForAttention(count: number): AccessGovernanceTone {
  return count > 0 ? "attention" : "clear";
}
