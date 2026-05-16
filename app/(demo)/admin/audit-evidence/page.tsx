import {
  AdminEvidenceTable,
  AdminFilterBar,
  AdminMetricStrip,
  AdminModuleHeader,
} from "@/components/product/admin-module";
import type {
  AdminAuditEventApiResponse,
  PartnerExportRunApiResponse,
  PartnerWebhookEventApiResponse,
} from "@/lib/demo/api-types";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminGovernanceData } from "../admin-loaders";
import {
  formatCount,
  formatDateTime,
  formatLabel,
  StatusBadge,
  toneForAttention,
} from "../governance-formatters";

function includesAny(value: string, terms: string[]) {
  const normalized = value.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function eventEntity(event: AdminAuditEventApiResponse) {
  if (event.clinicId) {
    return event.clinicId;
  }

  if (event.entityType || event.entityId) {
    return [event.entityType, event.entityId].filter(Boolean).join(" ");
  }

  return "Unavailable";
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

function eventTrustGroup(event: AdminAuditEventApiResponse) {
  if (includesAny(event.eventType, ["sync", "report.submitted", "report.received"])) {
    return "Report submission evidence";
  }

  if (includesAny(event.eventType, ["review"])) {
    return "Review state evidence";
  }

  if (includesAny(event.eventType, ["stale", "reconciliation"])) {
    return "Stale reconciliation evidence";
  }

  if (includesAny(event.eventType, ["export"])) {
    return "Partner export evidence";
  }

  if (includesAny(event.eventType, ["webhook"])) {
    return "Webhook delivery evidence";
  }

  if (includesAny(event.eventType, ["access", "auth", "role", "user", "session"])) {
    return "Access evidence";
  }

  return "Operating evidence";
}

function requesterLabel(
  exportRun: PartnerExportRunApiResponse,
  userById: Map<number, string>,
) {
  if (!exportRun.requestedByUserId) {
    return "Unavailable";
  }

  return userById.get(exportRun.requestedByUserId) ?? `User ${exportRun.requestedByUserId}`;
}

function webhookEventTone(event: PartnerWebhookEventApiResponse) {
  return event.status === "failed" ? "blocked" : "info";
}

function webhookEventEvidence(event: PartnerWebhookEventApiResponse) {
  if (event.lastError) {
    return event.lastError;
  }

  return event.status === "preview_only"
    ? "Preview-only webhook test event recorded without delivery."
    : "Webhook delivery/test event recorded.";
}

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  const { auditEvents, partnerReadiness, users } = await loadAdminGovernanceData();
  const userById = new Map(users.map((user) => [user.userId, user.displayName]));
  const reportReviewEvents = auditEvents.filter((event) =>
    includesAny(event.eventType, ["review"]),
  ).length;
  const accessEvents = auditEvents.filter((event) =>
    includesAny(event.eventType, ["access", "auth", "role", "user"]),
  ).length;
  const exportRuns = partnerReadiness.exportRuns;
  const webhookEvents = partnerReadiness.webhookEvents;
  const webhookFailures = webhookEvents.filter(
    (event) => event.status === "failed" || Boolean(event.lastError),
  ).length;

  return (
    <div className="space-y-4">
      <AdminModuleHeader
        eyebrow="Organisation operations"
        title="Audit evidence"
        description="Read-only operating evidence for status changes, access activity, partner exports, and operator decisions."
      />
      <AdminMetricStrip
        metrics={[
          {
            label: "Audit events",
            value: formatCount(auditEvents.length),
            tone: "info",
          },
          {
            label: "Report review events",
            value: formatCount(reportReviewEvents),
            tone: "info",
          },
          {
            label: "Partner export evidence",
            value: formatCount(exportRuns.length),
            tone: "info",
          },
          {
            label: "Webhook failure evidence",
            value: formatCount(webhookFailures),
            tone: toneForAttention(webhookFailures),
          },
          {
            label: "Access-related events",
            value: formatCount(accessEvents),
            tone: toneForAttention(accessEvents),
          },
        ]}
      />
      <AdminFilterBar>
        <StatusBadge tone="info">Operating evidence</StatusBadge>
        <span className="text-sm text-muted-foreground">
          Report submission, report review, stale reconciliation, sync attempt, export, webhook, and
          access evidence are grouped for trust review. This module does not make formal attestations.
        </span>
      </AdminFilterBar>
      <AdminEvidenceTable
        label="Audit event evidence"
        rows={auditEvents}
        getRowKey={(row) => String(row.id)}
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
            header: "Clinic / entity",
            render: (row) => eventEntity(row),
          },
          {
            key: "summary",
            header: "Summary",
            render: (row) => <p className="max-w-md text-sm">{row.summary}</p>,
          },
          {
            key: "trustGroup",
            header: "Trust group",
            render: (row) => <StatusBadge tone="info">{eventTrustGroup(row)}</StatusBadge>,
          },
          {
            key: "createdAt",
            header: "Created",
            render: (row) => formatDateTime(row.createdAt),
          },
        ]}
      />
      <AdminEvidenceTable
        label="Partner export evidence"
        rows={exportRuns}
        getRowKey={(row) => String(row.id)}
        columns={[
          {
            key: "checksum",
            header: "Checksum",
            render: (row) => (
              <span className="break-all font-mono text-xs text-muted-foreground">
                {row.checksum}
              </span>
            ),
          },
          {
            key: "records",
            header: "Record counts",
            render: (row) => compactRecord(row.recordCounts),
          },
          {
            key: "scope",
            header: "Scope",
            render: (row) => <p className="max-w-sm text-sm">{compactRecord(row.scope)}</p>,
          },
          {
            key: "freshness",
            header: "Freshness assumption",
            render: () => (
              <p className="max-w-sm text-sm">
                Export evidence should be read with current source, freshness, and review state.
              </p>
            ),
          },
          {
            key: "requester",
            header: "Requester",
            render: (row) => requesterLabel(row, userById),
          },
          {
            key: "createdAt",
            header: "Created",
            render: (row) => formatDateTime(row.createdAt),
          },
        ]}
      />
      <AdminEvidenceTable
        label="Webhook delivery and test evidence"
        rows={webhookEvents}
        getRowKey={(row) => String(row.id)}
        columns={[
          {
            key: "eventType",
            header: "Event",
            render: (row) => <StatusBadge tone={webhookEventTone(row)}>{formatLabel(row.eventType)}</StatusBadge>,
          },
          {
            key: "subscription",
            header: "Subscription",
            render: (row) => `Subscription ${row.subscriptionId}`,
          },
          {
            key: "status",
            header: "Status",
            render: (row) => <StatusBadge tone={webhookEventTone(row)}>{formatLabel(row.status)}</StatusBadge>,
          },
          {
            key: "attempts",
            header: "Attempts",
            render: (row) => formatCount(row.attemptCount),
          },
          {
            key: "evidence",
            header: "Evidence",
            render: (row) => <p className="max-w-md text-sm">{webhookEventEvidence(row)}</p>,
          },
          {
            key: "createdAt",
            header: "Created",
            render: (row) => formatDateTime(row.createdAt),
          },
        ]}
      />
    </div>
  );
}
