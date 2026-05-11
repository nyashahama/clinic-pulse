import {
  AdminEvidenceTable,
  AdminFilterBar,
  AdminMetricStrip,
  AdminModuleHeader,
} from "@/components/product/admin-module";
import type {
  AdminAuditEventApiResponse,
  PartnerExportRunApiResponse,
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

function requesterLabel(
  exportRun: PartnerExportRunApiResponse,
  userById: Map<number, string>,
) {
  if (!exportRun.requestedByUserId) {
    return "Unavailable";
  }

  return userById.get(exportRun.requestedByUserId) ?? `User ${exportRun.requestedByUserId}`;
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
            label: "Access-related events",
            value: formatCount(accessEvents),
            tone: toneForAttention(accessEvents),
          },
        ]}
      />
      <AdminFilterBar>
        <StatusBadge tone="info">Operating evidence</StatusBadge>
        <span className="text-sm text-muted-foreground">
          Evidence is shown for review and traceability; this module does not make formal attestations.
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
    </div>
  );
}
