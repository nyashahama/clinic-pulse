import {
  AdminFilterBar,
  AdminModuleHeader,
  type AdminTone,
} from "@/components/product/admin-module";
import {
  type SecurityAccessRow,
  type SecurityAuditRow,
  type SecurityCredentialRow,
  type SecurityFinding,
  SecurityPostureWorkspace,
  type SecuritySummaryMetric,
  type SecurityWebhookRow,
} from "@/components/product/security-posture-workspace";
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
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminGovernanceData } from "../admin-loaders";
import {
  formatCount,
  formatDateTime,
  formatLabel,
  StatusBadge,
  toneForAttention,
} from "../governance-formatters";

const returnSource = "admin-security";

function isExpired(apiKey: PartnerApiKeyApiResponse, now = new Date()) {
  if (!apiKey.expiresAt) {
    return false;
  }

  const expiresAt = new Date(apiKey.expiresAt);
  return !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() <= now.getTime();
}

function apiKeyState(apiKey: PartnerApiKeyApiResponse, now: Date) {
  if (apiKey.revokedAt) {
    return { label: "Revoked", tone: "blocked" as AdminTone };
  }

  if (isExpired(apiKey, now)) {
    return { label: "Expired", tone: "attention" as AdminTone };
  }

  if (isPartnerApiKeyActive(apiKey, now)) {
    return { label: "Active", tone: "clear" as AdminTone };
  }

  return { label: "Review", tone: "attention" as AdminTone };
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

function webhookEventHasFailure(event: PartnerWebhookEventApiResponse) {
  return Boolean(event.lastError) || isFailingStatus(event.status);
}

function webhookSubscriptionHasFailure(subscription: PartnerWebhookSubscriptionApiResponse) {
  return Boolean(subscription.lastError) || isFailingStatus(subscription.lastTestStatus);
}

function includesAny(value: string, terms: string[]) {
  const normalized = value.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function auditEntity(event: AdminAuditEventApiResponse) {
  if (event.entityType || event.entityId) {
    return [event.entityType, event.entityId].filter(Boolean).join(" ");
  }

  return event.clinicId || "Unavailable";
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

function privilegedUsers(users: AdminUserAccessApiResponse[]) {
  return users.filter((user) => ["org_admin", "system_admin"].includes(user.role));
}

function getUserAccessRowKey(user: AdminUserAccessApiResponse) {
  return [
    user.userId,
    user.role,
    user.organisationId ?? "platform",
    user.district ?? "all-districts",
  ].join(":");
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

function buildCredentialRows(
  apiKeys: PartnerApiKeyApiResponse[],
  now: Date,
): SecurityCredentialRow[] {
  return apiKeys.map((apiKey) => {
    const state = apiKeyState(apiKey, now);

    return {
      id: String(apiKey.id),
      href: buildAdminApiKeyDetailHref(apiKey.id, returnSource),
      name: apiKey.name,
      prefix: apiKey.keyPrefix,
      stateLabel: state.label,
      stateTone: state.tone,
      environmentLabel: formatLabel(apiKey.environment),
      scopeLabel: apiKey.scopes.length ? apiKey.scopes.map(formatLabel).join(", ") : "No scopes recorded",
      allowedDistrictsLabel: apiKey.allowedDistricts.length
        ? apiKey.allowedDistricts.join(", ")
        : "All districts",
      lastUsedLabel: formatDateTime(apiKey.lastUsedAt),
      expiryLabel: apiKeyExpiryLabel(apiKey),
    };
  });
}

function buildPrivilegedAccessRows(users: AdminUserAccessApiResponse[]): SecurityAccessRow[] {
  return users.map((user) => ({
    id: getUserAccessRowKey(user),
    href: buildAdminUserDetailHref(user.userId, returnSource),
    displayName: user.displayName,
    email: user.email,
    roleLabel: formatLabel(user.role),
    scopeLabel: user.district ?? (user.organisationId ? `Organisation ${user.organisationId}` : "Platform"),
    lastSeenLabel: formatDateTime(user.lastSeenAt),
    tone: user.role === "system_admin" ? "attention" : "info",
  }));
}

function buildWebhookRows(
  subscriptions: PartnerWebhookSubscriptionApiResponse[],
  events: PartnerWebhookEventApiResponse[],
): SecurityWebhookRow[] {
  return [
    ...subscriptions.map((subscription): SecurityWebhookRow => ({
      id: `subscription-${subscription.id}`,
      href: buildAdminWebhookSubscriptionDetailHref(subscription.id, returnSource),
      ariaLabel: `Open webhook subscription ${subscription.id} detail`,
      typeLabel: "Subscription",
      name: subscription.name,
      stateLabel: formatLabel(subscription.lastTestStatus ?? subscription.status),
      tone: webhookSubscriptionHasFailure(subscription) ? "attention" : "info",
      targetLabel: subscription.targetUrl,
      evidence: subscription.lastError
        ? subscription.lastError
        : compactRecord(subscription.lastTestMetadata),
      observedLabel: formatDateTime(subscription.updatedAt),
    })),
    ...events.map((event): SecurityWebhookRow => ({
      id: `event-${event.id}`,
      href: buildAdminWebhookEventDetailHref(event.id, returnSource),
      ariaLabel: `Open webhook event ${event.id} detail`,
      typeLabel: "Event",
      name: event.eventType,
      stateLabel: formatLabel(event.status),
      tone: webhookEventHasFailure(event) ? "attention" : "clear",
      targetLabel: `Subscription ${event.subscriptionId}`,
      evidence: event.lastError ?? compactRecord(event.metadata),
      observedLabel: formatDateTime(event.deliveredAt ?? event.createdAt),
    })),
  ];
}

function buildAuditRows(events: AdminAuditEventApiResponse[]): SecurityAuditRow[] {
  return events.map((event) => ({
    id: String(event.id),
    href: buildAdminAuditEventDetailHref(event.id, returnSource),
    eventLabel: formatLabel(event.eventType),
    actorLabel: event.actorName ?? "System activity",
    roleLabel: formatLabel(event.actorRole),
    entityLabel: auditEntity(event),
    summary: event.summary,
    createdLabel: formatDateTime(event.createdAt),
  }));
}

function buildSecurityFindings({
  activeApiKeys,
  expiredApiKeys,
  revokedApiKeys,
  failingWebhookCount,
  privilegedUserCount,
  accessAuditCount,
  credentialRows,
  privilegedAccessRows,
  webhookEvidenceRows,
  accessAuditRows,
}: {
  activeApiKeys: number;
  expiredApiKeys: number;
  revokedApiKeys: number;
  failingWebhookCount: number;
  privilegedUserCount: number;
  accessAuditCount: number;
  credentialRows: SecurityCredentialRow[];
  privilegedAccessRows: SecurityAccessRow[];
  webhookEvidenceRows: SecurityWebhookRow[];
  accessAuditRows: SecurityAuditRow[];
}): SecurityFinding[] {
  return [
    {
      id: "credential-exposure",
      title: "Credential lifecycle exposure",
      summary: "Partner API keys are reviewed by state, scope, district coverage, expiry, and last use before any credential detail is opened.",
      tone: expiredApiKeys > 0 ? "attention" : activeApiKeys > 0 ? "clear" : "attention",
      countLabel: `${formatCount(activeApiKeys)} active`,
      detailLabel: `${formatCount(revokedApiKeys)} revoked / ${formatCount(expiredApiKeys)} expired`,
      primaryEvidence: credentialRows[0]
        ? `${credentialRows[0].name} is ${credentialRows[0].stateLabel.toLowerCase()} with ${credentialRows[0].scopeLabel}.`
        : "No API key evidence is recorded.",
      secondaryEvidence: "Credential state comes from partner API key evidence, not plaintext secrets.",
      remediation: "Review expiry and scope before issuing or rotating partner credentials. Open the source key only when ownership or scope needs investigation.",
      evidenceHref: credentialRows[0]?.href,
      evidenceLabel: credentialRows[0] ? "Open key evidence" : undefined,
    },
    {
      id: "webhook-delivery",
      title: "Webhook delivery integrity",
      summary: "Subscription tests and delivery attempts are grouped so transport failures and dead-letter style statuses surface together.",
      tone: toneForAttention(failingWebhookCount),
      countLabel: `${formatCount(failingWebhookCount)} failing`,
      detailLabel: `${formatCount(webhookEvidenceRows.length)} delivery records`,
      primaryEvidence: webhookEvidenceRows[0]
        ? `${webhookEvidenceRows[0].name} reported ${webhookEvidenceRows[0].stateLabel.toLowerCase()}.`
        : "No webhook delivery evidence is recorded.",
      secondaryEvidence: "Webhook state combines subscription test evidence and event delivery evidence.",
      remediation: "Open failed delivery records before partner incident handoff. Confirm target URL, retry metadata, and last error before escalation.",
      evidenceHref: webhookEvidenceRows[0]?.href,
      evidenceLabel: webhookEvidenceRows[0] ? "Open webhook evidence" : undefined,
    },
    {
      id: "privileged-access",
      title: "Privileged access review",
      summary: "System and organisation administrator access is isolated from ordinary user lifecycle evidence so elevated accounts are easy to review.",
      tone: toneForAttention(privilegedUserCount),
      countLabel: `${formatCount(privilegedUserCount)} privileged`,
      detailLabel: "System and organisation administrator roles",
      primaryEvidence: privilegedAccessRows[0]
        ? `${privilegedAccessRows[0].displayName} has ${privilegedAccessRows[0].roleLabel} access.`
        : "No privileged access evidence is recorded.",
      secondaryEvidence: "Access scope and last-seen evidence come from admin user access records.",
      remediation: "Review privileged access before pilot handoff and open user detail only when role scope or session history needs inspection.",
      evidenceHref: privilegedAccessRows[0]?.href,
      evidenceLabel: privilegedAccessRows[0] ? "Open user evidence" : undefined,
    },
    {
      id: "access-audit-trail",
      title: "Access audit trail",
      summary: "Access-related audit events remain linked to their source event records for investigation without turning this page into raw logs.",
      tone: accessAuditCount > 0 ? "info" : "attention",
      countLabel: `${formatCount(accessAuditCount)} events`,
      detailLabel: "Auth, role, user, API, and webhook events",
      primaryEvidence: accessAuditRows[0]
        ? `${accessAuditRows[0].eventLabel} by ${accessAuditRows[0].actorLabel}.`
        : "No access audit events are recorded.",
      secondaryEvidence: "Audit trail evidence is filtered to access, auth, role, user, API, and webhook event types.",
      remediation: "Use the audit detail when a security finding needs actor, entity, or timestamp context.",
      evidenceHref: accessAuditRows[0]?.href,
      evidenceLabel: accessAuditRows[0] ? "Open audit evidence" : undefined,
    },
  ];
}

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  const { auditEvents, partnerReadiness, users } = await loadAdminGovernanceData();
  const now = new Date();
  const apiKeys = partnerReadiness.apiKeys;
  const activeApiKeys = apiKeys.filter((apiKey) => isPartnerApiKeyActive(apiKey, now)).length;
  const revokedApiKeys = apiKeys.filter((apiKey) => Boolean(apiKey.revokedAt)).length;
  const expiredApiKeys = apiKeys.filter(
    (apiKey) => !apiKey.revokedAt && isExpired(apiKey, now),
  ).length;
  const failingWebhookEvents = partnerReadiness.webhookEvents.filter(webhookEventHasFailure);
  const failingWebhookSubscriptions = partnerReadiness.webhookSubscriptions.filter(
    webhookSubscriptionHasFailure,
  );
  const failingWebhookCount = failingWebhookEvents.length + failingWebhookSubscriptions.length;
  const privilegedUserRows = privilegedUsers(users);
  const accessAuditEvents = auditEvents.filter((event) =>
    includesAny(event.eventType, ["access", "auth", "role", "user", "api", "webhook"]),
  );
  const securityPosture = summarizeSecurityPosture({
    activeApiKeys,
    revokedApiKeys,
    privilegedUsers: privilegedUserRows.length,
    failedWebhookEvents: failingWebhookCount,
  });
  const credentialRows = buildCredentialRows(apiKeys, now);
  const privilegedAccessRows = buildPrivilegedAccessRows(privilegedUserRows);
  const webhookEvidenceRows = buildWebhookRows(
    partnerReadiness.webhookSubscriptions,
    partnerReadiness.webhookEvents,
  );
  const accessAuditRows = buildAuditRows(accessAuditEvents);
  const securityFindings = buildSecurityFindings({
    activeApiKeys,
    expiredApiKeys,
    revokedApiKeys,
    failingWebhookCount,
    privilegedUserCount: privilegedUserRows.length,
    accessAuditCount: accessAuditEvents.length,
    credentialRows,
    privilegedAccessRows,
    webhookEvidenceRows,
    accessAuditRows,
  });
  const reviewFindingCount = securityFindings.filter((finding) => finding.tone !== "clear").length;
  const securityMetrics: SecuritySummaryMetric[] = [
    {
      id: "advisor-findings",
      label: "Advisor findings",
      value: formatCount(reviewFindingCount),
      detail: `${formatCount(securityFindings.length)} review areas visible`,
      tone: toneForAttention(reviewFindingCount),
    },
    {
      id: "credential-exposure",
      label: "Credential exposure",
      value: formatCount(activeApiKeys),
      detail: `${formatCount(revokedApiKeys)} revoked; ${formatCount(expiredApiKeys)} expired`,
      tone: expiredApiKeys > 0 ? "attention" : activeApiKeys > 0 ? "clear" : "attention",
    },
    {
      id: "webhook-delivery",
      label: "Webhook delivery",
      value: formatCount(failingWebhookCount),
      detail: `${formatCount(partnerReadiness.webhookEvents.length)} events; ${formatCount(
        partnerReadiness.webhookSubscriptions.length,
      )} subscriptions`,
      tone: toneForAttention(failingWebhookCount),
    },
    {
      id: "privileged-access",
      label: "Privileged access",
      value: formatCount(privilegedUserRows.length),
      detail: "Organisation and system administrator roles",
      tone: toneForAttention(privilegedUserRows.length),
    },
  ];

  return (
    <div className="space-y-4" data-admin-module="security">
      <AdminModuleHeader
        eyebrow="Platform operations"
        title="Security posture"
        description="Read-only platform evidence for credential lifecycle, webhook delivery integrity, privileged access, and access-related audit activity."
      />
      <AdminFilterBar>
        <StatusBadge tone={securityPosture.tone}>Security posture evidence</StatusBadge>
        <span className="text-sm text-muted-foreground">
          Advisor findings, credential scope, delivery failures, privileged access, and audit trail evidence are visible here. Rotation and incident handoff controls remain outside this read-only review surface.
        </span>
      </AdminFilterBar>
      <SecurityPostureWorkspace
        metrics={securityMetrics}
        findings={securityFindings}
        credentialRows={credentialRows}
        privilegedAccessRows={privilegedAccessRows}
        webhookEvidenceRows={webhookEvidenceRows}
        accessAuditRows={accessAuditRows}
      />
    </div>
  );
}
