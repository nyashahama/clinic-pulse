import type { AuthRole } from "@/lib/auth/api";
import { classifyAccessRisk, type GovernanceTone } from "@/lib/product/admin-governance";

export type AccessLifecycleUser = {
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

export type AccessPermissionState = "allow" | "conditional" | "forbid";

export type AccessPermissionStateFilter = AccessPermissionState | "all";

export type AccessPermissionAction = {
  id: string;
  label: string;
  description: string;
  state: AccessPermissionState;
  grantedBy: string[];
  reviewNote: string;
};

export type AccessPermissionResource = {
  id: string;
  label: string;
  description: string;
  actions: AccessPermissionAction[];
  allowedCount: number;
  conditionalCount: number;
  forbiddenCount: number;
};

export type AccessLifecycleSubject = {
  id: string;
  userId: number;
  displayName: string;
  email: string;
  role: AuthRole | string;
  roleLabel: string;
  scopeLabel: string;
  stateLabel: string;
  stateTone: GovernanceTone;
  riskLabel: string;
  reviewReasons: string[];
  permissionResources: AccessPermissionResource[];
  allowedActions: number;
  conditionalActions: number;
  forbiddenActions: number;
};

export type AccessRoleSummary = {
  role: AuthRole;
  label: string;
  assignedCount: number;
  permissionBaseline: string;
  reviewNote: string;
  privileged: boolean;
};

export type AdminAccessLifecycleModel = {
  defaultSubjectId: string | null;
  summary: {
    totalUsers: number;
    activeUsers: number;
    privilegedUsers: number;
    reviewSubjects: number;
    staleSessions: number;
    disabledAccounts: number;
    allowedActions: number;
    conditionalActions: number;
    forbiddenActions: number;
  };
  subjects: AccessLifecycleSubject[];
  roleSummaries: AccessRoleSummary[];
  evidenceLinks: Array<{
    label: string;
    href: string;
    description: string;
  }>;
};

export function filterAccessReviewSubjects(
  subjects: AccessLifecycleSubject[],
  query: string,
): AccessLifecycleSubject[] {
  const normalizedQuery = normalizeSearch(query);

  if (!normalizedQuery) {
    return subjects;
  }

  return subjects.filter((subject) =>
    subjectSearchText(subject).includes(normalizedQuery),
  );
}

export function filterAccessPermissionResources(
  subject: AccessLifecycleSubject,
  filters: { query?: string; state?: AccessPermissionStateFilter },
): AccessPermissionResource[] {
  const normalizedQuery = normalizeSearch(filters.query ?? "");
  const stateFilter = filters.state ?? "all";

  return subject.permissionResources
    .map((resource) => {
      const resourceMatches =
        !normalizedQuery || resourceSearchText(resource).includes(normalizedQuery);
      const actions = resource.actions.filter((action) => {
        const stateMatches = stateFilter === "all" || action.state === stateFilter;
        const queryMatches =
          resourceMatches ||
          !normalizedQuery ||
          actionSearchText(action).includes(normalizedQuery);

        return stateMatches && queryMatches;
      });

      return {
        ...resource,
        actions,
        allowedCount: actions.filter((action) => action.state === "allow").length,
        conditionalCount: actions.filter((action) => action.state === "conditional").length,
        forbiddenCount: actions.filter((action) => action.state === "forbid").length,
      };
    })
    .filter((resource) => resource.actions.length > 0);
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function subjectSearchText(subject: AccessLifecycleSubject) {
  return normalizeSearch(
    [
      subject.displayName,
      subject.email,
      subject.roleLabel,
      subject.scopeLabel,
      subject.stateLabel,
      subject.riskLabel,
      ...subject.reviewReasons,
      ...subject.permissionResources.flatMap((resource) => [
        resource.label,
        resource.description,
        ...resource.actions.flatMap((action) => [
          action.label,
          action.description,
          action.state,
          action.reviewNote,
          ...action.grantedBy,
        ]),
      ]),
    ].join(" "),
  );
}

function resourceSearchText(resource: AccessPermissionResource) {
  return normalizeSearch([resource.label, resource.description].join(" "));
}

function actionSearchText(action: AccessPermissionAction) {
  return normalizeSearch(
    [
      action.label,
      action.description,
      action.state,
      action.reviewNote,
      ...action.grantedBy,
    ].join(" "),
  );
}

const activeRoles = new Set<AuthRole>([
  "reporter",
  "district_manager",
  "org_admin",
  "system_admin",
]);

const roleOrder: AuthRole[] = [
  "org_admin",
  "district_manager",
  "reporter",
  "system_admin",
];

const roleLabels: Record<AuthRole, string> = {
  reporter: "Field reporter",
  district_manager: "District manager",
  org_admin: "Organisation admin",
  system_admin: "System admin",
};

const roleBaselines: Record<AuthRole, string> = {
  reporter: "Field reports and offline sync only",
  district_manager: "District operations inside district scope",
  org_admin: "Organisation governance and partner handoff",
  system_admin: "Platform administration and tenant security",
};

function isActiveRole(role: string): role is AuthRole {
  return activeRoles.has(role as AuthRole);
}

function roleLabel(role: string) {
  return isActiveRole(role) ? roleLabels[role] : "Unrecognised role";
}

function scopeLabel(user: AccessLifecycleUser) {
  if (user.district) {
    return user.district;
  }

  if (user.organisationId) {
    return `Organisation ${user.organisationId}`;
  }

  return "Platform scope";
}

function subjectId(user: AccessLifecycleUser) {
  return `user-${user.userId}`;
}

function permissionAction({
  id,
  label,
  description,
  state,
  grantedBy,
  reviewNote,
}: AccessPermissionAction): AccessPermissionAction {
  return {
    id,
    label,
    description,
    state,
    grantedBy,
    reviewNote,
  };
}

function createResource(
  id: string,
  label: string,
  description: string,
  actions: AccessPermissionAction[],
): AccessPermissionResource {
  return {
    id,
    label,
    description,
    actions,
    allowedCount: actions.filter((action) => action.state === "allow").length,
    conditionalCount: actions.filter((action) => action.state === "conditional").length,
    forbiddenCount: actions.filter((action) => action.state === "forbid").length,
  };
}

function buildPermissionResources(user: AccessLifecycleUser): AccessPermissionResource[] {
  const role = isActiveRole(user.role) ? user.role : null;
  const isDisabled = Boolean(user.disabledAt);
  const districtScoped = Boolean(user.district);
  const disabledNote = "Disabled accounts must be restored before access can be exercised.";

  function resolveState(allowedRoles: AuthRole[], options?: { needsDistrict?: boolean }) {
    if (isDisabled) {
      return "conditional" as const;
    }

    if (!role || !allowedRoles.includes(role)) {
      return "forbid" as const;
    }

    if (options?.needsDistrict && !districtScoped) {
      return "conditional" as const;
    }

    return "allow" as const;
  }

  function sourceFor(state: AccessPermissionState, fallback: string) {
    if (isDisabled) {
      return ["Lifecycle: disabled account"];
    }

    if (state === "forbid") {
      return ["No matching role grant"];
    }

    return [fallback];
  }

  function noteFor(state: AccessPermissionState, allowNote: string, conditionalNote?: string) {
    if (isDisabled) {
      return disabledNote;
    }

    if (state === "conditional") {
      return conditionalNote ?? "Requires reviewer confirmation before handoff.";
    }

    if (state === "forbid") {
      return "No active grant for this principal.";
    }

    return allowNote;
  }

  const submitFieldReportState = resolveState(["reporter"]);
  const reviewFieldReportState = resolveState(["district_manager", "org_admin", "system_admin"], {
    needsDistrict: role === "district_manager",
  });
  const manageDistrictState = resolveState(["district_manager", "org_admin", "system_admin"], {
    needsDistrict: role === "district_manager",
  });
  const accessReviewState = resolveState(["org_admin", "system_admin"]);
  const partnerState = resolveState(["org_admin", "system_admin"]);
  const platformState =
    role === "org_admin" && !isDisabled
      ? ("conditional" as const)
      : resolveState(["system_admin"]);

  return [
    createResource(
      "field-reporting",
      "Field reporting",
      "Submission and review powers tied to frontline reports.",
      [
        permissionAction({
          id: "submit-field-report",
          label: "Submit field reports",
          description: "Create clinic status evidence from the field cockpit.",
          state: submitFieldReportState,
          grantedBy: sourceFor(submitFieldReportState, "Role: field reporter"),
          reviewNote: noteFor(
            submitFieldReportState,
            "Reporter can submit reports with source attribution.",
          ),
        }),
        permissionAction({
          id: "review-field-report",
          label: "Review field report evidence",
          description: "Accept or return field submissions before trusted state changes.",
          state: reviewFieldReportState,
          grantedBy: sourceFor(reviewFieldReportState, `Role: ${roleLabel(user.role)}`),
          reviewNote: noteFor(
            reviewFieldReportState,
            "Reviewer can move reports through governance review.",
            "District managers need a district scope before review authority is trusted.",
          ),
        }),
      ],
    ),
    createResource(
      "district-operations",
      "District operations",
      "District-scoped clinic state, interventions, and severity queues.",
      [
        permissionAction({
          id: "manage-district-clinic-state",
          label: "Manage district clinic state",
          description: "Inspect clinic coverage, severity, and intervention context.",
          state: manageDistrictState,
          grantedBy: sourceFor(manageDistrictState, `Role: ${roleLabel(user.role)}`),
          reviewNote: noteFor(
            manageDistrictState,
            "District scope is present for operational decisions.",
            "District manager assignment needs a district before this grant is trusted.",
          ),
        }),
      ],
    ),
    createResource(
      "organisation-governance",
      "Organisation governance",
      "Organisation-level access, reporting coverage, and audit evidence workflows.",
      [
        permissionAction({
          id: "review-access-evidence",
          label: "Review access evidence",
          description: "Inspect role, scope, lifecycle, and session evidence.",
          state: accessReviewState,
          grantedBy: sourceFor(accessReviewState, `Role: ${roleLabel(user.role)}`),
          reviewNote: noteFor(accessReviewState, "Org governance access is active."),
        }),
      ],
    ),
    createResource(
      "partner-handoff",
      "Partner handoff",
      "Partner readiness, export schema, API contract, and integration evidence.",
      [
        permissionAction({
          id: "generate-partner-handoff",
          label: "Generate partner handoff proof",
          description: "Review exports, webhooks, and partner-safe API evidence.",
          state: partnerState,
          grantedBy: sourceFor(partnerState, `Role: ${roleLabel(user.role)}`),
          reviewNote: noteFor(partnerState, "Partner handoff controls are available."),
        }),
      ],
    ),
    createResource(
      "platform-administration",
      "Platform administration",
      "Tenant health, security posture, and system-wide controls.",
      [
        permissionAction({
          id: "manage-platform-controls",
          label: "Manage platform controls",
          description: "Use tenant, security, and platform command surfaces.",
          state: platformState,
          grantedBy: sourceFor(platformState, `Role: ${roleLabel(user.role)}`),
          reviewNote: noteFor(
            platformState,
            "System administrator access is active.",
            "Organisation admin can inspect evidence, but platform controls require system scope.",
          ),
        }),
      ],
    ),
  ];
}

function reviewPriority(subject: AccessLifecycleSubject) {
  if (subject.reviewReasons.includes("Missing district scope")) {
    return 5;
  }

  if (subject.reviewReasons.includes("Disabled account")) {
    return 4;
  }

  if (subject.reviewReasons.includes("No recent session")) {
    return 3;
  }

  if (subject.reviewReasons.includes("System administrator access")) {
    return 2;
  }

  if (subject.role === "org_admin") {
    return 1;
  }

  return 0;
}

function buildSubject(user: AccessLifecycleUser): AccessLifecycleSubject {
  const accessRisk = isActiveRole(user.role)
    ? classifyAccessRisk({
        role: user.role,
        disabled: Boolean(user.disabledAt),
        district: user.district,
        lastSeenAt: user.lastSeenAt,
      })
    : {
        tone: "attention" as GovernanceTone,
        label: "Review",
        reasons: ["Unrecognised role assignment"],
      };
  const permissionResources = buildPermissionResources(user);
  const allowedActions = permissionResources.reduce(
    (total, resource) => total + resource.allowedCount,
    0,
  );
  const conditionalActions = permissionResources.reduce(
    (total, resource) => total + resource.conditionalCount,
    0,
  );
  const forbiddenActions = permissionResources.reduce(
    (total, resource) => total + resource.forbiddenCount,
    0,
  );

  return {
    id: subjectId(user),
    userId: user.userId,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    roleLabel: roleLabel(user.role),
    scopeLabel: scopeLabel(user),
    stateLabel: user.disabledAt ? "Disabled" : "Active",
    stateTone: user.disabledAt ? "attention" : "clear",
    riskLabel: accessRisk.label,
    reviewReasons: accessRisk.reasons,
    permissionResources,
    allowedActions,
    conditionalActions,
    forbiddenActions,
  };
}

function buildRoleSummaries(users: AccessLifecycleUser[]): AccessRoleSummary[] {
  return roleOrder.map((role) => {
    const assignedCount = users.filter((user) => user.role === role).length;
    const privileged = role === "org_admin" || role === "system_admin";

    return {
      role,
      label: roleLabels[role],
      assignedCount,
      permissionBaseline: roleBaselines[role],
      reviewNote: privileged
        ? "Privileged access must stay tied to audit evidence and active sessions."
        : "Scope and lifecycle checks keep this role safe for daily operations.",
      privileged,
    };
  });
}

export function buildAdminAccessLifecycleModel(
  users: AccessLifecycleUser[],
): AdminAccessLifecycleModel {
  const subjects = users
    .map(buildSubject)
    .sort((left, right) => {
      const priority = reviewPriority(right) - reviewPriority(left);
      if (priority !== 0) {
        return priority;
      }

      return left.displayName.localeCompare(right.displayName);
    });
  const summary = {
    totalUsers: users.length,
    activeUsers: users.filter((user) => !user.disabledAt).length,
    privilegedUsers: users.filter((user) =>
      ["org_admin", "system_admin"].includes(user.role),
    ).length,
    reviewSubjects: subjects.filter((subject) => subject.reviewReasons.length > 0).length,
    staleSessions: users.filter((user) => !user.lastSeenAt).length,
    disabledAccounts: users.filter((user) => Boolean(user.disabledAt)).length,
    allowedActions: subjects.reduce((total, subject) => total + subject.allowedActions, 0),
    conditionalActions: subjects.reduce(
      (total, subject) => total + subject.conditionalActions,
      0,
    ),
    forbiddenActions: subjects.reduce((total, subject) => total + subject.forbiddenActions, 0),
  };

  return {
    defaultSubjectId: subjects[0]?.id ?? null,
    summary,
    subjects,
    roleSummaries: buildRoleSummaries(users),
    evidenceLinks: [
      {
        label: "Access review",
        href: "/admin/access-review",
        description: "Effective access, review reasons, and permission matrix.",
      },
      {
        label: "Users and roles",
        href: "/admin/users-roles",
        description: "Lifecycle controls, role assignments, and user directory.",
      },
      {
        label: "Audit evidence",
        href: "/admin/audit-evidence",
        description: "Access decisions and source events for reviewer evidence.",
      },
      {
        label: "Security posture",
        href: "/admin/security",
        description: "Privileged access and authentication posture review.",
      },
    ],
  };
}
