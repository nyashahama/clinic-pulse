import type { AuthRole } from "@/lib/auth/api";
import type {
  AdminAuditEventApiResponse,
  AdminUserAccessApiResponse,
} from "@/lib/demo/api-types";
import type {
  EvidenceCommandChip,
  EvidenceCommandDecision,
  EvidenceCommandField,
  EvidenceCommandMetric,
  EvidenceCommandSection,
  EvidenceCommandTimelineItem,
  EvidenceCommandTone,
} from "@/lib/product/evidence-command";
import { classifyAccessRisk } from "@/lib/product/admin-governance";

export type IdentityAuditDetailJsonBlock = {
  title: string;
  value: unknown;
};

export type IdentityAuditCaseBrief = {
  title: string;
  description: string;
  summary: EvidenceCommandField;
  primaryFields: EvidenceCommandField[];
  sections: EvidenceCommandSection[];
};

export type IdentityAuditDetailModel = {
  eyebrow: string;
  title: string;
  description: string;
  contextItems: string[];
  chips: EvidenceCommandChip[];
  metrics: EvidenceCommandMetric[];
  caseBrief: IdentityAuditCaseBrief;
  decision: EvidenceCommandDecision;
  timeline: {
    title: string;
    description: string;
    items: EvidenceCommandTimelineItem[];
  };
  jsonBlocks: IdentityAuditDetailJsonBlock[];
};

type BuildIdentityAuditDetailInput =
  | {
      kind: "user";
      returnHref: string;
      user: AdminUserAccessApiResponse;
    }
  | {
      kind: "audit-event";
      event: AdminAuditEventApiResponse;
      returnHref: string;
    };

type EvidenceState = {
  label: string;
  tone: EvidenceCommandTone;
  title: string;
  basis: string;
  nextStep: string;
  impact: string;
  verification: string;
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-ZA", {
  dateStyle: "medium",
  timeStyle: "short",
});

const activeRoles = new Set<AuthRole>([
  "reporter",
  "district_manager",
  "org_admin",
  "system_admin",
]);

function isActiveRole(role: string): role is AuthRole {
  return activeRoles.has(role as AuthRole);
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

function formatLabel(value?: string | null) {
  if (!value) {
    return "Unavailable";
  }

  const normalized = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replaceAll(".", " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function organisationLabel(value?: number | null) {
  return value ? `Organisation ${value}` : "Platform";
}

function accountState(user: AdminUserAccessApiResponse) {
  return user.disabledAt ? "Disabled" : "Active";
}

function userRiskState(user: AdminUserAccessApiResponse): EvidenceState {
  if (!isActiveRole(user.role)) {
    return {
      label: "Review",
      tone: "attention",
      title: "Access assignment needs review",
      basis: "This user has an unrecognised role assignment.",
      nextStep: "Review the account before treating this identity as operationally cleared.",
      impact:
        "Unrecognised access can hide privilege gaps or unintended administrative reach.",
      verification: "Confirm role, organisation scope, district scope, and recent session evidence.",
    };
  }

  const risk = classifyAccessRisk({
    role: user.role,
    disabled: Boolean(user.disabledAt),
    district: user.district,
    lastSeenAt: user.lastSeenAt,
  });

  if (user.disabledAt) {
    return {
      label: "Disabled",
      tone: "critical",
      title: "Access is revoked",
      basis: `Account disabled ${formatDateTime(user.disabledAt)}.`,
      nextStep: "Keep this identity out of operational queues unless access is explicitly restored.",
      impact:
        "Disabled accounts should not retain active sessions or appear as available operators.",
      verification: "Confirm disabled timestamp, role assignment, and any related audit events.",
    };
  }

  if (risk.reasons.length) {
    return {
      label: risk.label,
      tone: risk.tone === "blocked" ? "critical" : "attention",
      title: "Access review required",
      basis: risk.reasons.join("; "),
      nextStep: "Review the account owner, role scope, and session evidence before handoff.",
      impact:
        "Privileged or poorly scoped access can change who is allowed to operate sensitive workflows.",
      verification: "Compare risk reasons against role, district scope, and last-seen evidence.",
    };
  }

  return {
    label: "Clear",
    tone: "stable",
    title: "Access is clear for current scope",
    basis: "No access review flags are present for this identity.",
    nextStep: "Keep the account in the lifecycle evidence trail and monitor future session activity.",
    impact:
      "Clear identity evidence helps administrators distinguish routine users from review targets.",
    verification: "Confirm role, scope, and last-seen timestamp before closing the packet.",
  };
}

function buildDecision({
  chips,
  returnHref,
  scoreLabel,
  scoreValue,
  state,
  secondaryHref,
  secondaryLabel,
}: {
  chips: EvidenceCommandChip[];
  returnHref: string;
  scoreLabel: string;
  scoreValue: string;
  state: EvidenceState;
  secondaryHref: string;
  secondaryLabel: string;
}): EvidenceCommandDecision {
  return {
    contextLabel: "Administrative evidence",
    title: state.title,
    scoreLabel,
    scoreValue,
    chips,
    nextStep: state.nextStep,
    nextStepTone: state.tone,
    impactTitle: "Operational impact",
    impact: state.impact,
    verificationTitle: "Verification",
    verification: state.verification,
    evidence: {
      label: state.basis,
      detail: scoreValue,
      tone: state.tone,
    },
    actions: [
      {
        label: "Return to evidence queue",
        href: returnHref,
        priority: "primary",
        icon: "queue",
      },
      {
        label: secondaryLabel,
        href: secondaryHref,
        priority: "secondary",
        icon: "stream",
      },
    ],
  };
}

function buildUserDetailModel({
  returnHref,
  user,
}: Extract<BuildIdentityAuditDetailInput, { kind: "user" }>): IdentityAuditDetailModel {
  const state = userRiskState(user);
  const chips: EvidenceCommandChip[] = [
    { label: state.label, tone: state.tone },
    { label: formatLabel(user.role), tone: "info" },
    { label: user.district ?? "All districts", tone: "neutral" },
  ];

  return {
    eyebrow: "Access operations",
    title: "Identity access evidence brief",
    description: state.basis,
    contextItems: [user.displayName, user.email, organisationLabel(user.organisationId)],
    chips,
    metrics: [
      {
        label: "Account state",
        value: accountState(user),
        detail: user.disabledAt
          ? `Disabled ${formatDateTime(user.disabledAt)}`
          : "Account is active and accessible",
        tone: user.disabledAt ? "critical" : "stable",
        icon: "user",
      },
      {
        label: "Role",
        value: formatLabel(user.role),
        detail: organisationLabel(user.organisationId),
        tone: "info",
        icon: "check",
      },
      {
        label: "District scope",
        value: user.district ?? "All districts",
        detail: user.district ? "Scoped to district" : "No district restriction",
        tone: user.district ? "stable" : "info",
        icon: "radio",
      },
      {
        label: "Last seen",
        value: formatDateTime(user.lastSeenAt),
        detail: user.lastSeenAt ? "Recent session evidence" : "No session evidence",
        tone: user.lastSeenAt ? "stable" : "attention",
        icon: "clock",
      },
    ],
    caseBrief: {
      title: "Access packet",
      description: "Effective identity scope, account state, and session evidence for access review.",
      summary: {
        label: "Review basis",
        value: state.basis,
        tone: state.tone,
        emphasis: true,
      },
      primaryFields: [
        { label: "Identity", value: user.displayName, emphasis: true },
        { label: "Email", value: user.email },
        { label: "User ID", value: String(user.userId) },
      ],
      sections: [
        {
          title: "Effective access",
          fields: [
            { label: "Role", value: formatLabel(user.role), tone: "info" },
            { label: "Organisation", value: organisationLabel(user.organisationId) },
            { label: "District", value: user.district ?? "All districts" },
          ],
        },
        {
          title: "Lifecycle evidence",
          fields: [
            { label: "Created", value: formatDateTime(user.createdAt) },
            { label: "Last seen", value: formatDateTime(user.lastSeenAt) },
            { label: "Disabled", value: formatDateTime(user.disabledAt) },
          ],
        },
      ],
    },
    decision: buildDecision({
      chips,
      returnHref,
      scoreLabel: "Identity",
      scoreValue: user.displayName,
      state,
      secondaryHref: "/admin/access-review",
      secondaryLabel: "Open access review",
    }),
    timeline: {
      title: "Identity lifecycle",
      description: "The account events that explain current access posture.",
      items: [
        {
          label: "Created",
          title: "User account provisioned",
          description: `Account created for ${user.email}.`,
          timestamp: formatDateTime(user.createdAt),
          tone: "info",
        },
        {
          label: "Last activity",
          title: user.lastSeenAt ? "Most recent session recorded" : "No recent session evidence",
          description: user.lastSeenAt
            ? "User last accessed the system."
            : "No recent session was found for this account.",
          timestamp: formatDateTime(user.lastSeenAt),
          tone: user.lastSeenAt ? "stable" : "attention",
        },
        {
          label: user.disabledAt ? "Disabled" : "Review",
          title: state.title,
          description: state.nextStep,
          timestamp: user.disabledAt ? formatDateTime(user.disabledAt) : undefined,
          tone: state.tone,
        },
      ],
    },
    jsonBlocks: [
      {
        title: "Access evidence",
        value: {
          userId: user.userId,
          email: user.email,
          role: user.role,
          organisationId: user.organisationId ?? null,
          district: user.district ?? null,
          disabledAt: user.disabledAt ?? null,
          lastSeenAt: user.lastSeenAt ?? null,
          reviewBasis: state.basis,
        },
      },
    ],
  };
}

function includesAny(value: string, terms: string[]) {
  const normalized = value.toLowerCase();

  return terms.some((term) => normalized.includes(term));
}

function auditEventEntity(event: AdminAuditEventApiResponse) {
  if (event.clinicId) {
    return event.clinicId;
  }

  if (event.entityType || event.entityId) {
    return [event.entityType, event.entityId].filter(Boolean).join(" ");
  }

  return "Unavailable";
}

function auditEventLane(eventType: string) {
  if (includesAny(eventType, ["access", "auth", "role", "user", "session", "api"])) {
    return "Access";
  }

  if (includesAny(eventType, ["report", "review"])) {
    return "Report";
  }

  if (includesAny(eventType, ["sync", "offline", "stale", "reconciliation"])) {
    return "Sync";
  }

  if (includesAny(eventType, ["export"])) {
    return "Export";
  }

  if (includesAny(eventType, ["webhook"])) {
    return "Webhook";
  }

  return "Operations";
}

function auditEventState(event: AdminAuditEventApiResponse): EvidenceState {
  if (includesAny(event.eventType, ["failed", "failure", "error"])) {
    return {
      label: "Failed",
      tone: "critical",
      title: "Audit event needs investigation",
      basis: "The source event records a failed operating path.",
      nextStep: "Review the metadata and related source record before closing this event.",
      impact:
        "Failed audit evidence can point to access, delivery, or operating conditions that need follow-up.",
      verification: "Confirm event type, actor, entity, timestamp, and metadata together.",
    };
  }

  if (includesAny(event.eventType, ["role", "permission", "privilege", "disabled", "revoked", "reset", "password", "access"])) {
    return {
      label: "Access review",
      tone: "attention",
      title: "Access event should be reviewed",
      basis: "This event touches role, access, session, or credential posture.",
      nextStep: "Confirm the actor, affected entity, and metadata before administrative handoff.",
      impact:
        "Access events can change who is allowed to operate sensitive workflows.",
      verification: "Compare actor role, entity, organisation scope, and metadata.",
    };
  }

  if (includesAny(event.eventType, ["stale", "reconciliation"])) {
    return {
      label: "Freshness review",
      tone: "attention",
      title: "Freshness event needs review",
      basis: "The event records stale or reconciled operating evidence.",
      nextStep: "Check whether the related clinic or report state still needs confirmation.",
      impact:
        "Freshness events affect whether administrators can trust current operational status.",
      verification: "Confirm entity, clinic, timestamp, and metadata before closing the signal.",
    };
  }

  return {
    label: "Recorded",
    tone: "info",
    title: "Audit event recorded",
    basis: "This event is available as audit context for operations review.",
    nextStep: "Keep the event linked to the evidence trail and use metadata for follow-up if needed.",
    impact:
      "Clear audit context helps administrators reconstruct who changed what and when.",
    verification: "Confirm actor, entity, timestamp, and metadata match the source workflow.",
  };
}

function buildAuditEventDetailModel({
  event,
  returnHref,
}: Extract<
  BuildIdentityAuditDetailInput,
  { kind: "audit-event" }
>): IdentityAuditDetailModel {
  const state = auditEventState(event);
  const actor = event.actorName ?? "System activity";
  const actorRole = formatLabel(event.actorRole);
  const entity = auditEventEntity(event);
  const lane = auditEventLane(event.eventType);
  const chips: EvidenceCommandChip[] = [
    { label: state.label, tone: state.tone },
    { label: lane, tone: "info" },
    { label: actorRole, tone: "neutral" },
  ];

  return {
    eyebrow: "Audit operations",
    title: "Audit event evidence brief",
    description: event.summary,
    contextItems: [formatLabel(event.eventType), actor, entity],
    chips,
    metrics: [
      {
        label: "Event state",
        value: state.label,
        detail: state.basis,
        tone: state.tone,
        icon: "alert",
      },
      {
        label: "Actor",
        value: actor,
        detail: actorRole,
        tone: "info",
        icon: "user",
      },
      {
        label: "Entity",
        value: entity,
        detail: organisationLabel(event.organisationId),
        tone: "info",
        icon: "activity",
      },
      {
        label: "Created",
        value: formatDateTime(event.createdAt),
        detail: formatLabel(event.eventType),
        tone: "stable",
        icon: "clock",
      },
    ],
    caseBrief: {
      title: "Audit packet",
      description: "Actor, entity, timestamp, and metadata evidence for this administrative event.",
      summary: {
        label: "Event summary",
        value: event.summary,
        tone: state.tone,
        emphasis: true,
      },
      primaryFields: [
        { label: "Event type", value: formatLabel(event.eventType), tone: "info" },
        { label: "Actor", value: actor, emphasis: true },
        { label: "Entity", value: entity },
      ],
      sections: [
        {
          title: "Actor context",
          fields: [
            { label: "Actor role", value: actorRole },
            { label: "Actor user ID", value: event.actorUserId ? String(event.actorUserId) : "Unavailable" },
            { label: "Organisation", value: organisationLabel(event.organisationId) },
          ],
        },
        {
          title: "Source record",
          fields: [
            { label: "Event ID", value: String(event.id) },
            { label: "External ID", value: event.externalId ?? "Unavailable" },
            { label: "Created", value: formatDateTime(event.createdAt) },
            { label: "Clinic", value: event.clinicId || "Unavailable" },
          ],
        },
      ],
    },
    decision: buildDecision({
      chips,
      returnHref,
      scoreLabel: "Event",
      scoreValue: `#${event.id}`,
      state,
      secondaryHref: "/admin/security",
      secondaryLabel: "Open security posture",
    }),
    timeline: {
      title: "Audit timeline",
      description: "The event trail that explains the actor, entity, and follow-up state.",
      items: [
        {
          label: "Recorded",
          title: `${formatLabel(event.eventType)} recorded`,
          description: event.summary,
          timestamp: formatDateTime(event.createdAt),
          tone: state.tone,
        },
        {
          label: "Actor",
          title: actor,
          description: `${actorRole} recorded activity against ${entity}.`,
          tone: "info",
        },
        {
          label: "Next",
          title: state.title,
          description: state.nextStep,
          tone: state.tone,
        },
      ],
    },
    jsonBlocks: [
      {
        title: "Metadata",
        value: event.metadata ?? {},
      },
    ],
  };
}

export function buildIdentityAuditDetailModel(
  input: BuildIdentityAuditDetailInput,
): IdentityAuditDetailModel {
  switch (input.kind) {
    case "user":
      return buildUserDetailModel(input);
    case "audit-event":
      return buildAuditEventDetailModel(input);
  }
}
