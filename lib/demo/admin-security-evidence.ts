import type {
  AdminAuditEventApiResponse,
  AdminUserAccessApiResponse,
  PartnerApiKeyApiResponse,
  PartnerWebhookEventApiResponse,
  PartnerWebhookSubscriptionApiResponse,
} from "@/lib/demo/api-types";
import { isPartnerApiKeyActive } from "@/lib/demo/partner-readiness";
import {
  buildAdminApiKeyDetailHref,
  buildAdminAuditEventDetailHref,
  buildAdminUserDetailHref,
  buildAdminWebhookEventDetailHref,
  buildAdminWebhookSubscriptionDetailHref,
} from "@/lib/product/admin-detail-routes";
import { summarizeSecurityPosture } from "@/lib/product/admin-governance";
import type {
  EvidenceCommandChip,
  EvidenceCommandMetric,
  EvidenceCommandTone,
} from "@/lib/product/evidence-command";
import type {
  SecurityEvidenceRow,
  SecurityEvidenceSourceReference,
  SecurityEvidenceTone,
  SecurityEvidenceViewModel,
  SecuritySummaryMetric,
} from "@/lib/product/security-evidence";

const returnSource = "admin-security";

const numberFormatter = new Intl.NumberFormat("en-ZA");
const dateTimeFormatter = new Intl.DateTimeFormat("en-ZA", {
  dateStyle: "medium",
  timeStyle: "short",
});
const sourceReferences: SecurityEvidenceSourceReference[] = [
  {
    source: "Unkey audit logs",
    role: "Selected-row evidence review, audit filtering, and source-record drilldown.",
    href: "https://github.com/unkeyed/unkey",
    licenseUse: "reference-only",
  },
  {
    source: "Infisical",
    role: "Credential posture, secret lifecycle, and audit-backed security review language.",
    href: "https://github.com/Infisical/infisical",
    licenseUse: "adaptable",
  },
  {
    source: "Logto console",
    role: "RBAC, tenant access, privileged-role framing, and access review hierarchy.",
    href: "https://github.com/logto-io/logto",
    licenseUse: "reference-only",
  },
  {
    source: "Supabase security advisor",
    role: "Advisor-style findings, posture summaries, and concise security control grouping.",
    href: "https://github.com/supabase/supabase",
    licenseUse: "adaptable",
  },
];

export function buildSecurityEvidenceViewModel({
  apiKeys,
  webhookSubscriptions,
  webhookEvents,
  users,
  auditEvents,
  now = new Date(),
}: {
  apiKeys: PartnerApiKeyApiResponse[];
  webhookSubscriptions: PartnerWebhookSubscriptionApiResponse[];
  webhookEvents: PartnerWebhookEventApiResponse[];
  users: AdminUserAccessApiResponse[];
  auditEvents: AdminAuditEventApiResponse[];
  now?: Date;
}): SecurityEvidenceViewModel {
  const activeApiKeys = apiKeys.filter((apiKey) =>
    isPartnerApiKeyActive(apiKey, now),
  ).length;
  const revokedApiKeys = apiKeys.filter((apiKey) => Boolean(apiKey.revokedAt)).length;
  const expiredApiKeys = apiKeys.filter(
    (apiKey) => !apiKey.revokedAt && isExpired(apiKey, now),
  ).length;
  const failingWebhookSubscriptions = webhookSubscriptions.filter(
    webhookSubscriptionHasFailure,
  );
  const failingWebhookEvents = webhookEvents.filter(webhookEventHasFailure);
  const privilegedUsers = users.filter((user) => isPrivilegedRole(user.role));
  const accessAuditEvents = auditEvents.filter((event) =>
    includesAny(event.eventType, ["access", "auth", "role", "user", "api", "webhook"]),
  );
  const posture = summarizeSecurityPosture({
    activeApiKeys,
    revokedApiKeys,
    privilegedUsers: privilegedUsers.length,
    failedWebhookEvents: failingWebhookSubscriptions.length + failingWebhookEvents.length,
  });
  const rows = [
    ...webhookSubscriptions.map(buildWebhookSubscriptionRow),
    ...webhookEvents.map(buildWebhookEventRow),
    ...apiKeys.map((apiKey) => buildCredentialRow(apiKey, now)),
    ...privilegedUsers.map(buildPrivilegedAccessRow),
    ...accessAuditEvents.map(buildAuditRow),
  ].sort(compareSecurityEvidenceRows);
  const reviewFindingCount = rows.filter(
    (row) => row.stateTone === "attention" || row.stateTone === "blocked",
  ).length;
  const metrics = buildMetrics({
    reviewFindingCount,
    activeApiKeys,
    revokedApiKeys,
    expiredApiKeys,
    failingWebhookCount: failingWebhookSubscriptions.length + failingWebhookEvents.length,
    webhookRecordCount: webhookSubscriptions.length + webhookEvents.length,
    privilegedUserCount: privilegedUsers.length,
    accessAuditCount: accessAuditEvents.length,
  });

  return {
    commandBrief: buildCommandBrief({
      metrics,
      posture,
      rows,
      reviewFindingCount,
      activeApiKeys,
      revokedApiKeys,
      expiredApiKeys,
      failingWebhookCount: failingWebhookSubscriptions.length + failingWebhookEvents.length,
      webhookRecordCount: webhookSubscriptions.length + webhookEvents.length,
      privilegedUserCount: privilegedUsers.length,
      accessAuditCount: accessAuditEvents.length,
    }),
    metrics,
    posture,
    rows,
    sourceReferences,
  };
}

function buildMetrics({
  reviewFindingCount,
  activeApiKeys,
  revokedApiKeys,
  expiredApiKeys,
  failingWebhookCount,
  webhookRecordCount,
  privilegedUserCount,
  accessAuditCount,
}: {
  reviewFindingCount: number;
  activeApiKeys: number;
  revokedApiKeys: number;
  expiredApiKeys: number;
  failingWebhookCount: number;
  webhookRecordCount: number;
  privilegedUserCount: number;
  accessAuditCount: number;
}): SecuritySummaryMetric[] {
  return [
    {
      id: "advisor-findings",
      label: "Advisor findings",
      value: formatCount(reviewFindingCount),
      detail: "Rows needing security review",
      tone: toneForAttention(reviewFindingCount),
    },
    {
      id: "credential-exposure",
      label: "Credential exposure",
      value: formatCount(activeApiKeys),
      detail: `${formatCount(revokedApiKeys)} revoked; ${formatCount(expiredApiKeys)} expired`,
      tone: expiredApiKeys > 0 ? "attention" : "clear",
    },
    {
      id: "webhook-delivery",
      label: "Webhook delivery",
      value: formatCount(failingWebhookCount),
      detail: `${formatCount(webhookRecordCount)} delivery records`,
      tone: toneForAttention(failingWebhookCount),
    },
    {
      id: "privileged-access",
      label: "Privileged access",
      value: formatCount(privilegedUserCount),
      detail: "Organisation and system administrator roles",
      tone: toneForAttention(privilegedUserCount),
    },
    {
      id: "access-audit-trail",
      label: "Access audit trail",
      value: formatCount(accessAuditCount),
      detail: "Auth, role, user, API, and webhook events",
      tone: accessAuditCount > 0 ? "info" : "attention",
    },
  ];
}

function buildCommandBrief({
  metrics,
  posture,
  rows,
  reviewFindingCount,
  activeApiKeys,
  revokedApiKeys,
  expiredApiKeys,
  failingWebhookCount,
  webhookRecordCount,
  privilegedUserCount,
  accessAuditCount,
}: {
  metrics: SecuritySummaryMetric[];
  posture: SecurityEvidenceViewModel["posture"];
  rows: SecurityEvidenceRow[];
  reviewFindingCount: number;
  activeApiKeys: number;
  revokedApiKeys: number;
  expiredApiKeys: number;
  failingWebhookCount: number;
  webhookRecordCount: number;
  privilegedUserCount: number;
  accessAuditCount: number;
}): SecurityEvidenceViewModel["commandBrief"] {
  const leadEvidence =
    rows.find((row) => row.stateTone === "blocked" || row.stateTone === "attention") ??
    rows[0];
  const leadTone = leadEvidence ? toEvidenceTone(leadEvidence.stateTone) : "info";
  const commandChips: EvidenceCommandChip[] = [
    { label: posture.summary, tone: toEvidenceTone(posture.tone) },
    {
      label:
        reviewFindingCount > 0
          ? `${formatCount(reviewFindingCount)} findings to review`
          : "No advisor findings",
      tone: toEvidenceTone(toneForAttention(reviewFindingCount)),
    },
    {
      label: `${formatCount(rows.length)} source-linked rows`,
      tone: rows.length > 0 ? "info" : "neutral",
    },
  ];
  const commandMetrics: EvidenceCommandMetric[] = metrics.map((metric) => ({
    label: metric.label,
    value: metric.value,
    detail: metric.detail,
    tone: toEvidenceTone(metric.tone),
    icon: securityMetricIcon(metric.id),
    href: securityMetricHref(metric.id),
    actionLabel: securityMetricActionLabel(metric.id),
  }));

  return {
    chips: commandChips,
    metrics: commandMetrics,
    caseBrief: {
      title: "Security posture packet",
      description:
        "Source-linked security evidence for credential lifecycle, webhook receiver integrity, privileged access, and access audit activity.",
      summary: {
        label: "Evidence verdict",
        value: posture.summary,
        tone: toEvidenceTone(posture.tone),
        emphasis: true,
      },
      primaryFields: [
        {
          label: "Advisor findings",
          value: formatCount(reviewFindingCount),
          href: "#security-evidence-workspace",
          tone: toEvidenceTone(toneForAttention(reviewFindingCount)),
          emphasis: true,
        },
        {
          label: "Security evidence",
          value: `${formatCount(rows.length)} rows`,
          href: "#security-evidence-workspace",
        },
        {
          label: "Lead source",
          value: leadEvidence?.sourceLabel ?? "Unavailable",
          href: leadEvidence?.sourceHref,
          tone: leadTone,
        },
      ],
      sections: [
        {
          title: "Credential lifecycle rail",
          description: "Credential and receiver evidence that can expose partner or tenant security pressure.",
          fields: [
            {
              label: "Active credentials",
              value: formatCount(activeApiKeys),
              href: "/admin/integrations",
              tone: activeApiKeys > 0 ? "stable" : "attention",
            },
            {
              label: "Revoked credentials",
              value: formatCount(revokedApiKeys),
              href: "/admin/integrations",
              tone: revokedApiKeys > 0 ? "info" : "neutral",
            },
            {
              label: "Expired credentials",
              value: formatCount(expiredApiKeys),
              href: "/admin/integrations",
              tone: toEvidenceTone(toneForAttention(expiredApiKeys)),
            },
            {
              label: "Webhook delivery",
              value:
                failingWebhookCount > 0
                  ? `${formatCount(failingWebhookCount)} failing`
                  : `${formatCount(webhookRecordCount)} records`,
              href: "/admin/integrations",
              tone: toEvidenceTone(toneForAttention(failingWebhookCount)),
            },
          ],
        },
        {
          title: "Privileged access watch",
          description:
            "Access, role, and audit trail evidence that should stay visible before pilot handoff.",
          fields: [
            {
              label: "Privileged users",
              value: formatCount(privilegedUserCount),
              href: "/admin/users-roles",
              tone: toEvidenceTone(toneForAttention(privilegedUserCount)),
            },
            {
              label: "Access audit trail",
              value: `${formatCount(accessAuditCount)} events`,
              href: "/admin/audit-evidence",
              tone: accessAuditCount > 0 ? "info" : "attention",
            },
            {
              label: "Lead review",
              value: leadEvidence?.subject ?? "No selected evidence",
              href: leadEvidence?.sourceHref,
              tone: leadTone,
              fullWidth: true,
            },
          ],
        },
      ],
    },
    decision: {
      contextLabel: "Security posture",
      title:
        reviewFindingCount > 0
          ? "Security evidence needs review"
          : "Security posture is clear",
      scoreLabel: "Lead evidence",
      scoreValue: leadEvidence?.subject ?? "No evidence rows",
      chips: commandChips,
      nextStep:
        reviewFindingCount > 0 && leadEvidence
          ? `Review ${leadEvidence.subject} before promoting this posture.`
          : "Keep monitoring credential, webhook, privileged access, and audit evidence.",
      nextStepTone: leadTone,
      impactTitle: "System impact",
      impact:
        "System administrators need security posture to connect credentials, receivers, privileged roles, and audit events before they trust partner or tenant handoff.",
      verificationTitle: "Verification",
      verification:
        "Use the selected-row security workspace below to confirm the source record, raw facts, review state, and next step.",
      evidence: leadEvidence
        ? {
            label: leadEvidence.reviewState,
            detail: leadEvidence.nextStep,
            href: leadEvidence.sourceHref,
            tone: leadTone,
          }
        : undefined,
      actions: [
        {
          label: "Review security evidence",
          href: "#security-evidence-workspace",
          priority: "primary",
          icon: "stream",
        },
        {
          label: "Open audit evidence",
          href: "/admin/audit-evidence",
          priority: "secondary",
          icon: "stream",
        },
        {
          label: "Open users and roles",
          href: "/admin/users-roles",
          priority: "secondary",
          icon: "stream",
        },
      ],
    },
    timeline: {
      title: "Security evidence timeline",
      description:
        "The review sequence a system administrator should follow before trusting the security posture.",
      items: [
        {
          label: "Credentials",
          title:
            expiredApiKeys > 0
              ? `${formatCount(expiredApiKeys)} expired credentials`
              : `${formatCount(activeApiKeys)} active credentials`,
          description: `${formatCount(revokedApiKeys)} revoked credentials remain visible for lifecycle review.`,
          tone: toEvidenceTone(toneForAttention(expiredApiKeys)),
        },
        {
          label: "Webhooks",
          title:
            failingWebhookCount > 0
              ? `${formatCount(failingWebhookCount)} receiver failures`
              : "Webhook receiver evidence clear",
          description: `${formatCount(webhookRecordCount)} subscription and delivery records in scope.`,
          tone: toEvidenceTone(toneForAttention(failingWebhookCount)),
        },
        {
          label: "Access",
          title: `${formatCount(privilegedUserCount)} privileged users`,
          description:
            "Organisation and system administrator roles stay visible for posture review.",
          tone: toEvidenceTone(toneForAttention(privilegedUserCount)),
        },
        {
          label: "Audit",
          title: `${formatCount(accessAuditCount)} access audit events`,
          description:
            "Auth, role, user, API, and webhook audit activity provides actor and entity context.",
          tone: accessAuditCount > 0 ? "info" : "attention",
        },
      ],
    },
  };
}

function buildCredentialRow(
  apiKey: PartnerApiKeyApiResponse,
  now: Date,
): SecurityEvidenceRow {
  const state = apiKeyState(apiKey, now);
  const scopeLabel = apiKey.scopes.length
    ? apiKey.scopes.map(formatLabel).join(", ")
    : "No scopes recorded";
  const districtLabel = apiKey.allowedDistricts.length
    ? apiKey.allowedDistricts.join(", ")
    : "All districts";
  const rawFacts = [
    { label: "Prefix", value: apiKey.keyPrefix },
    { label: "Environment", value: formatLabel(apiKey.environment) },
    { label: "Scopes", value: scopeLabel },
    { label: "Districts", value: districtLabel },
    { label: "Last used", value: formatDateTime(apiKey.lastUsedAt) },
    { label: "Expiry", value: apiKeyExpiryLabel(apiKey) },
  ];

  return withSearchText({
    id: `credential-${apiKey.id}`,
    kind: "credential",
    sourceHref: buildAdminApiKeyDetailHref(apiKey.id, returnSource),
    ariaLabel: `Inspect security evidence for ${apiKey.name}`,
    subject: apiKey.name,
    subjectDetail: `${apiKey.keyPrefix} / ${formatLabel(apiKey.environment)}`,
    stateLabel: state.label,
    stateTone: state.tone,
    evidenceBasis:
      "Partner API key rows provide state, scope, district coverage, expiry, and last-use evidence without exposing plaintext secrets.",
    observedLabel: formatDateTime(apiKey.updatedAt ?? apiKey.lastUsedAt),
    sourceLabel: "API key",
    reviewState:
      state.tone === "clear"
        ? "Credential state is active and no immediate lifecycle exception is visible."
        : "Review credential ownership, expiry, and scope before promotion.",
    nextStep:
      "Open the source key only when ownership, scope, expiry, or rotation needs investigation.",
    rawFacts,
  });
}

function buildWebhookSubscriptionRow(
  subscription: PartnerWebhookSubscriptionApiResponse,
): SecurityEvidenceRow {
  const hasFailure = webhookSubscriptionHasFailure(subscription);
  const rawFacts = [
    { label: "Target URL", value: subscription.targetUrl },
    {
      label: "Event types",
      value: subscription.eventTypes.length
        ? subscription.eventTypes.map(formatLabel).join(", ")
        : "No event types recorded",
    },
    { label: "Status", value: formatLabel(subscription.status) },
    { label: "Last test", value: formatLabel(subscription.lastTestStatus) },
    { label: "Observed", value: formatDateTime(subscription.updatedAt) },
  ];

  return withSearchText({
    id: `webhook-subscription-${subscription.id}`,
    kind: "webhook",
    sourceHref: buildAdminWebhookSubscriptionDetailHref(subscription.id, returnSource),
    ariaLabel: `Inspect security evidence for ${subscription.name}`,
    subject: subscription.name,
    subjectDetail: subscription.targetUrl,
    stateLabel: formatLabel(subscription.lastTestStatus ?? subscription.status),
    stateTone: hasFailure ? "attention" : "info",
    evidenceBasis: subscription.lastError
      ? subscription.lastError
      : `Latest subscription test metadata: ${compactRecord(subscription.lastTestMetadata)}.`,
    observedLabel: formatDateTime(subscription.updatedAt),
    sourceLabel: "Webhook subscription",
    reviewState: hasFailure
      ? "Webhook subscription delivery needs review before partner incident handoff."
      : "Webhook subscription is recorded for review with no failing test evidence.",
    nextStep:
      "Confirm target URL, retry metadata, and last error before escalating delivery issues.",
    rawFacts,
  });
}

function buildWebhookEventRow(event: PartnerWebhookEventApiResponse): SecurityEvidenceRow {
  const hasFailure = webhookEventHasFailure(event);
  const rawFacts = [
    { label: "Subscription", value: String(event.subscriptionId) },
    { label: "Status", value: formatLabel(event.status) },
    { label: "Attempts", value: formatCount(event.attemptCount) },
    { label: "Observed", value: formatDateTime(event.deliveredAt ?? event.createdAt) },
  ];

  return withSearchText({
    id: `webhook-event-${event.id}`,
    kind: "webhook",
    sourceHref: buildAdminWebhookEventDetailHref(event.id, returnSource),
    ariaLabel: `Inspect security evidence for ${formatLabel(event.eventType)} webhook event`,
    subject: formatLabel(event.eventType),
    subjectDetail: `Subscription ${event.subscriptionId}`,
    stateLabel: formatLabel(event.status),
    stateTone: hasFailure ? "attention" : "clear",
    evidenceBasis: event.lastError
      ? event.lastError
      : `Delivery metadata: ${compactRecord(event.metadata)}.`,
    observedLabel: formatDateTime(event.deliveredAt ?? event.createdAt),
    sourceLabel: "Webhook event",
    reviewState: hasFailure
      ? "Webhook delivery attempt needs review."
      : "Webhook delivery attempt is recorded without failure evidence.",
    nextStep:
      "Open the delivery event when response metadata or payload context needs investigation.",
    rawFacts,
  });
}

function buildPrivilegedAccessRow(user: AdminUserAccessApiResponse): SecurityEvidenceRow {
  const scope = user.district ?? (user.organisationId ? `Organisation ${user.organisationId}` : "Platform");
  const rawFacts = [
    { label: "Email", value: user.email },
    { label: "Role", value: formatLabel(user.role) },
    { label: "Scope", value: scope },
    { label: "Last seen", value: formatDateTime(user.lastSeenAt) },
  ];

  return withSearchText({
    id: `privileged-access-${user.userId}`,
    kind: "privileged-access",
    sourceHref: buildAdminUserDetailHref(user.userId, returnSource),
    ariaLabel: `Inspect security evidence for ${user.displayName}`,
    subject: user.displayName,
    subjectDetail: user.email,
    stateLabel: "Privileged",
    stateTone: "attention",
    evidenceBasis:
      "Access scope and last-seen evidence come from admin user access records.",
    observedLabel: formatDateTime(user.lastSeenAt),
    actorLabel: user.displayName,
    entityLabel: scope,
    sourceLabel: "User access",
    reviewState:
      "Elevated access should be reviewed before pilot handoff or security posture promotion.",
    nextStep:
      "Open the user record when role scope, session history, or account ownership needs inspection.",
    rawFacts,
  });
}

function buildAuditRow(event: AdminAuditEventApiResponse): SecurityEvidenceRow {
  const entityLabel = auditEntity(event);
  const rawFacts = [
    { label: "Actor", value: event.actorName ?? "System activity" },
    { label: "Role", value: formatLabel(event.actorRole) },
    { label: "Entity", value: entityLabel },
    { label: "Observed", value: formatDateTime(event.createdAt) },
    { label: "Metadata", value: compactRecord(event.metadata ?? {}) },
  ];

  return withSearchText({
    id: `audit-${event.id}`,
    kind: "audit",
    sourceHref: buildAdminAuditEventDetailHref(event.id, returnSource),
    ariaLabel: `Inspect security evidence for ${formatAuditEventLabel(event.eventType)}`,
    subject: formatAuditEventLabel(event.eventType),
    subjectDetail: event.summary,
    stateLabel: "Info",
    stateTone: "info",
    evidenceBasis:
      "Audit trail evidence provides actor, role, entity, summary, and timestamp context for security review.",
    observedLabel: formatDateTime(event.createdAt),
    actorLabel: event.actorName ?? "System activity",
    entityLabel,
    sourceLabel: "Audit event",
    reviewState:
      "Use this audit row as context when a selected security finding needs actor or entity evidence.",
    nextStep:
      "Open the source audit event when timestamp, metadata, or entity details need investigation.",
    rawFacts,
  });
}

function withSearchText(row: Omit<SecurityEvidenceRow, "searchText">): SecurityEvidenceRow {
  const searchText = [
    row.subject,
    row.subjectDetail,
    row.stateLabel,
    row.evidenceBasis,
    row.observedLabel,
    row.actorLabel ?? "",
    row.entityLabel ?? "",
    row.sourceLabel,
    row.reviewState,
    row.nextStep,
    ...row.rawFacts.flatMap((fact) => [fact.label, fact.value]),
  ]
    .join(" ")
    .toLowerCase();

  return { ...row, searchText };
}

function compareSecurityEvidenceRows(a: SecurityEvidenceRow, b: SecurityEvidenceRow) {
  return rowPriority(a) - rowPriority(b);
}

function rowPriority(row: SecurityEvidenceRow) {
  if (row.stateTone === "blocked") {
    return 0;
  }

  if (row.stateTone === "attention" && row.sourceLabel === "Webhook subscription") {
    return 1;
  }

  if (row.stateTone === "attention" && row.kind === "privileged-access") {
    return 2;
  }

  if (row.stateTone === "attention") {
    return 3;
  }

  if (row.kind === "credential") {
    return 4;
  }

  if (row.sourceLabel === "Webhook event") {
    return 5;
  }

  if (row.kind === "audit") {
    return 6;
  }

  return 7;
}

function apiKeyState(apiKey: PartnerApiKeyApiResponse, now: Date) {
  if (apiKey.revokedAt) {
    return { label: "Revoked", tone: "blocked" as SecurityEvidenceTone };
  }

  if (isExpired(apiKey, now)) {
    return { label: "Expired", tone: "attention" as SecurityEvidenceTone };
  }

  if (isPartnerApiKeyActive(apiKey, now)) {
    return { label: "Active", tone: "clear" as SecurityEvidenceTone };
  }

  return { label: "Review", tone: "attention" as SecurityEvidenceTone };
}

function toEvidenceTone(tone: SecurityEvidenceTone): EvidenceCommandTone {
  if (tone === "blocked") {
    return "critical";
  }

  if (tone === "attention") {
    return "attention";
  }

  if (tone === "info") {
    return "info";
  }

  return "stable";
}

function securityMetricHref(id: string) {
  if (id === "advisor-findings") {
    return "#security-evidence-workspace";
  }

  if (id === "privileged-access") {
    return "/admin/users-roles";
  }

  if (id === "access-audit-trail") {
    return "/admin/audit-evidence";
  }

  return "/admin/integrations";
}

function securityMetricActionLabel(id: string) {
  if (id === "advisor-findings") {
    return "Review evidence";
  }

  if (id === "privileged-access") {
    return "Open users";
  }

  if (id === "access-audit-trail") {
    return "Open audit";
  }

  return "Open integrations";
}

function securityMetricIcon(id: string): EvidenceCommandMetric["icon"] {
  if (id === "advisor-findings") {
    return "alert";
  }

  if (id === "webhook-delivery") {
    return "radio";
  }

  if (id === "privileged-access") {
    return "user";
  }

  if (id === "credential-exposure") {
    return "check";
  }

  return "activity";
}

function isExpired(apiKey: PartnerApiKeyApiResponse, now: Date) {
  if (!apiKey.expiresAt) {
    return false;
  }

  const expiresAt = new Date(apiKey.expiresAt);

  return !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() <= now.getTime();
}

function apiKeyExpiryLabel(apiKey: PartnerApiKeyApiResponse) {
  if (apiKey.revokedAt) {
    return `Revoked ${formatDateTime(apiKey.revokedAt)}`;
  }

  if (apiKey.expiresAt) {
    return `Expires ${formatDateTime(apiKey.expiresAt)}`;
  }

  return "No expiry recorded";
}

function webhookEventHasFailure(event: PartnerWebhookEventApiResponse) {
  return Boolean(event.lastError) || isFailingStatus(event.status);
}

function webhookSubscriptionHasFailure(subscription: PartnerWebhookSubscriptionApiResponse) {
  return Boolean(subscription.lastError) || isFailingStatus(subscription.lastTestStatus);
}

function isFailingStatus(status?: string | null) {
  const normalized = status?.trim().toLowerCase();

  return Boolean(
    normalized &&
      (normalized.includes("fail") ||
        normalized.includes("error") ||
        normalized.includes("dead")),
  );
}

function isPrivilegedRole(role?: string | null) {
  return role === "org_admin" || role === "system_admin";
}

function auditEntity(event: AdminAuditEventApiResponse) {
  if (event.entityType || event.entityId) {
    return [event.entityType, event.entityId].filter(Boolean).join(" ");
  }

  return event.clinicId || "Unavailable";
}

function includesAny(value: string, terms: string[]) {
  const normalized = value.toLowerCase();

  return terms.some((term) => normalized.includes(term));
}

function compactRecord(value: Record<string, unknown>) {
  const entries = Object.entries(value);

  if (!entries.length) {
    return "Unavailable";
  }

  return entries
    .map(([key, entryValue]) => `${formatLabel(key)}: ${String(entryValue)}`)
    .join("; ");
}

function formatCount(value: number) {
  return numberFormatter.format(value);
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

function formatAuditEventLabel(value: string) {
  if (!value) {
    return "Unavailable";
  }

  return formatLabel(value);
}

function formatLabel(value?: string | null) {
  if (!value) {
    return "Unavailable";
  }

  const normalized = value.replaceAll("_", " ").replaceAll(".", " ");

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function toneForAttention(value: number): SecurityEvidenceTone {
  return value > 0 ? "attention" : "clear";
}
