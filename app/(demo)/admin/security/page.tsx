import {
  AdminEmptyState,
  AdminEvidenceTable,
  AdminFilterBar,
  AdminMetricStrip,
  AdminModuleHeader,
  type AdminTone,
} from "@/components/product/admin-module";
import type {
  AdminAuditEventApiResponse,
  AdminUserAccessApiResponse,
  PartnerApiKeyApiResponse,
  PartnerWebhookEventApiResponse,
  PartnerWebhookSubscriptionApiResponse,
} from "@/lib/demo/api-types";
import { isPartnerApiKeyActive } from "@/lib/demo/partner-readiness";
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

type WebhookSecurityEvidenceRow = {
  id: string;
  type: string;
  name: string;
  state: string;
  target: string;
  evidence: string;
  createdAt: string;
  tone: AdminTone;
};

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
  const privilegedUserRows = privilegedUsers(users);
  const securityPosture = summarizeSecurityPosture({
    activeApiKeys,
    revokedApiKeys,
    privilegedUsers: privilegedUserRows.length,
    failedWebhookEvents: failingWebhookEvents.length + failingWebhookSubscriptions.length,
  });
  const accessAuditEvents = auditEvents.filter((event) =>
    includesAny(event.eventType, ["access", "auth", "role", "user", "api", "webhook"]),
  );
  const webhookRows: WebhookSecurityEvidenceRow[] = [
    ...partnerReadiness.webhookSubscriptions.map(
      (subscription): WebhookSecurityEvidenceRow => ({
        id: `subscription-${subscription.id}`,
        type: "Subscription",
        name: subscription.name,
        state: subscription.lastTestStatus ?? subscription.status,
        target: subscription.targetUrl,
        evidence: subscription.lastError
          ? subscription.lastError
          : compactRecord(subscription.lastTestMetadata),
        createdAt: subscription.updatedAt,
        tone: webhookSubscriptionHasFailure(subscription) ? "attention" : "info",
      }),
    ),
    ...partnerReadiness.webhookEvents.map(
      (event): WebhookSecurityEvidenceRow => ({
        id: `event-${event.id}`,
        type: "Event",
        name: event.eventType,
        state: event.status,
        target: `Subscription ${event.subscriptionId}`,
        evidence: event.lastError ?? compactRecord(event.metadata),
        createdAt: event.deliveredAt ?? event.createdAt,
        tone: webhookEventHasFailure(event) ? "attention" : "clear",
      }),
    ),
  ];

  return (
    <div className="space-y-4" data-admin-module="security">
      <AdminModuleHeader
        eyebrow="Platform operations"
        title="Security posture"
        description="Read-only platform evidence for partner API keys, webhook delivery, privileged access, and access-related audit events."
      />
      <AdminMetricStrip
        metrics={[
          {
            label: "Active API keys",
            value: formatCount(activeApiKeys),
            detail: `${formatCount(revokedApiKeys)} revoked; ${formatCount(
              expiredApiKeys,
            )} expired`,
            tone: activeApiKeys > 0 ? "clear" : "attention",
          },
          {
            label: "Webhook failures",
            value: formatCount(failingWebhookEvents.length + failingWebhookSubscriptions.length),
            detail: `${formatCount(partnerReadiness.webhookEvents.length)} events; ${formatCount(
              partnerReadiness.webhookSubscriptions.length,
            )} subscriptions`,
            tone: toneForAttention(
              failingWebhookEvents.length + failingWebhookSubscriptions.length,
            ),
          },
          {
            label: "Privileged access evidence",
            value: formatCount(privilegedUserRows.length),
            detail: "Organisation and system administrator roles",
            tone: toneForAttention(privilegedUserRows.length),
          },
          {
            label: "Access audit events",
            value: formatCount(accessAuditEvents.length),
            detail: securityPosture.summary,
            tone: securityPosture.tone,
          },
        ]}
      />
      <AdminFilterBar>
        <StatusBadge tone={securityPosture.tone}>Security posture evidence</StatusBadge>
        <span className="text-sm text-muted-foreground">
          This module reviews credential and access evidence only; credential rotation remains in
          backend partner readiness workflows.
        </span>
      </AdminFilterBar>
      <AdminEvidenceTable
        label="API key evidence"
        rows={apiKeys}
        getRowKey={(row) => String(row.id)}
        emptyState={
          <AdminEmptyState
            title="No API key evidence"
            description="No partner API keys are recorded for the current organisation."
          />
        }
        columns={[
          {
            key: "name",
            header: "API key evidence",
            render: (row) => (
              <div className="min-w-0">
                <p className="font-medium text-foreground">{row.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{row.keyPrefix}</p>
              </div>
            ),
          },
          {
            key: "state",
            header: "State",
            render: (row) => {
              const state = apiKeyState(row, now);
              return <StatusBadge tone={state.tone}>{state.label}</StatusBadge>;
            },
          },
          {
            key: "scope",
            header: "Scope",
            render: (row) =>
              row.scopes.length ? row.scopes.map(formatLabel).join(", ") : "No scopes recorded",
          },
          {
            key: "lastUsed",
            header: "Last used",
            render: (row) => formatDateTime(row.lastUsedAt),
          },
          {
            key: "expires",
            header: "Expires / revoked",
            render: (row) =>
              row.revokedAt
                ? `Revoked ${formatDateTime(row.revokedAt)}`
                : formatDateTime(row.expiresAt),
          },
        ]}
      />
      <AdminEvidenceTable
        label="Webhook security evidence"
        rows={webhookRows}
        getRowKey={(row) => row.id}
        emptyState={
          <AdminEmptyState
            title="No webhook evidence"
            description="No webhook subscriptions or delivery events are recorded."
          />
        }
        columns={[
          {
            key: "type",
            header: "Webhook evidence",
            render: (row) => (
              <div className="space-y-1">
                <StatusBadge tone={row.tone}>{row.type}</StatusBadge>
                <p className="font-medium text-foreground">{row.name}</p>
              </div>
            ),
          },
          {
            key: "state",
            header: "State",
            render: (row) => formatLabel(row.state),
          },
          {
            key: "target",
            header: "Target",
            render: (row) => <span className="break-all text-sm">{row.target}</span>,
          },
          {
            key: "evidence",
            header: "Failure / metadata",
            render: (row) => <p className="max-w-sm text-sm">{row.evidence}</p>,
          },
          {
            key: "createdAt",
            header: "Observed",
            render: (row) => formatDateTime(row.createdAt),
          },
        ]}
      />
      <AdminEvidenceTable
        label="Privileged access evidence"
        rows={privilegedUserRows}
        getRowKey={(row) => String(row.userId)}
        emptyState={
          <AdminEmptyState
            title="No privileged access evidence"
            description="No organisation or system administrator accounts are recorded."
          />
        }
        columns={[
          {
            key: "user",
            header: "Privileged access evidence",
            render: (row) => (
              <div className="min-w-0">
                <p className="font-medium text-foreground">{row.displayName}</p>
                <p className="break-all text-xs text-muted-foreground">{row.email}</p>
              </div>
            ),
          },
          {
            key: "role",
            header: "Role",
            render: (row) => <StatusBadge tone="attention">{formatLabel(row.role)}</StatusBadge>,
          },
          {
            key: "scope",
            header: "Scope",
            render: (row) => row.district ?? row.organisationId ?? "Platform",
          },
          {
            key: "lastSeen",
            header: "Last seen",
            render: (row) => formatDateTime(row.lastSeenAt),
          },
        ]}
      />
      <AdminEvidenceTable
        label="Access audit evidence"
        rows={accessAuditEvents}
        getRowKey={(row) => String(row.id)}
        emptyState={
          <AdminEmptyState
            title="No access audit evidence"
            description="No access-related audit events are recorded in the current evidence window."
          />
        }
        columns={[
          {
            key: "eventType",
            header: "Event type",
            render: (row) => <StatusBadge tone="info">{formatLabel(row.eventType)}</StatusBadge>,
          },
          {
            key: "actor",
            header: "Actor / role",
            render: (row) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  {row.actorName ?? "System activity"}
                </p>
                <p className="text-xs text-muted-foreground">{formatLabel(row.actorRole)}</p>
              </div>
            ),
          },
          {
            key: "entity",
            header: "Entity",
            render: (row) => auditEntity(row),
          },
          {
            key: "summary",
            header: "Summary",
            render: (row) => <p className="max-w-md text-sm">{row.summary}</p>,
          },
          {
            key: "created",
            header: "Created",
            render: (row) => formatDateTime(row.createdAt),
          },
        ]}
      />
    </div>
  );
}
