import type {
  AdminAuditEventApiResponse,
  AdminUserAccessApiResponse,
  PartnerExportRunApiResponse,
  PartnerWebhookEventApiResponse,
} from "@/lib/workspace/api-types";
import {
  buildAdminAuditEventDetailHref,
  buildAdminExportRunDetailHref,
  buildAdminWebhookEventDetailHref,
} from "@/lib/product/admin-detail-routes";

const returnSource = "admin-audit-evidence";

const numberFormatter = new Intl.NumberFormat("en-ZA");
const dateTimeFormatter = new Intl.DateTimeFormat("en-ZA", {
  dateStyle: "medium",
  timeStyle: "short",
});

export type AuditEvidenceTone = "clear" | "attention" | "blocked" | "info";

export type AuditEvidenceLane =
  | "access"
  | "report"
  | "sync"
  | "export"
  | "webhook"
  | "operating";

export type AuditEvidenceLaneFilter = AuditEvidenceLane | "all";

export type AuditEvidenceStateFilter =
  | "all"
  | "needs-review"
  | "clear"
  | "info"
  | "attention"
  | "blocked";

export type AuditEvidenceMetric = {
  id: "evidence-volume" | "review-load" | "partner-handoffs" | "access-events";
  label: string;
  value: string;
  detail: string;
  tone: AuditEvidenceTone;
};

export type AuditEvidencePacket = {
  id: "audit-trail" | "partner-exports" | "webhook-delivery";
  label: string;
  value: string;
  detail: string;
  tone: AuditEvidenceTone;
};

export type AuditEvidenceRow = {
  id: string;
  lane: AuditEvidenceLane;
  sourceKind: "audit-event" | "export-run" | "webhook-event";
  sourceHref: string;
  ariaLabel: string;
  title: string;
  subtitle: string;
  summary: string;
  stateLabel: string;
  stateTone: AuditEvidenceTone;
  observedLabel: string;
  actorLabel: string;
  entityLabel: string;
  sourceLabel: string;
  evidenceBasis: string;
  reviewState: string;
  nextStep: string;
  rawFacts: Array<{ label: string; value: string }>;
  searchText: string;
};

export type AuditEvidenceSourceReference = {
  source: string;
  role: string;
  href: string;
  licenseUse: "adaptable" | "reference-only";
};

export type AuditEvidenceViewModel = {
  metrics: AuditEvidenceMetric[];
  packets: AuditEvidencePacket[];
  rows: AuditEvidenceRow[];
  sourceReferences: AuditEvidenceSourceReference[];
};

const sourceReferences: AuditEvidenceSourceReference[] = [
  {
    source: "Supabase Audit Logs",
    role: "Audit-log filters, date windows, selected-row details, and read-only metadata panels.",
    href: "https://github.com/supabase/supabase",
    licenseUse: "adaptable",
  },
  {
    source: "Infisical Permission Audit",
    role: "Effective-access review with source pills, state filters, search, and exportable evidence.",
    href: "https://github.com/Infisical/infisical",
    licenseUse: "adaptable",
  },
  {
    source: "Unkey log details",
    role: "Request-log detail structure, action popovers, filter chips, and diagnostic evidence states.",
    href: "https://github.com/unkeyed/unkey",
    licenseUse: "reference-only",
  },
  {
    source: "Dub activity metadata",
    role: "Compact event metadata previews with detail expansion and copy-ready raw facts.",
    href: "https://github.com/dubinc/dub",
    licenseUse: "reference-only",
  },
  {
    source: "Twenty activity timeline",
    role: "Grouped operational activity timeline for record-linked history and audit context.",
    href: "https://github.com/twentyhq/twenty",
    licenseUse: "reference-only",
  },
];

export function buildAuditEvidenceViewModel({
  auditEvents,
  exportRuns,
  webhookEvents,
  users,
}: {
  auditEvents: AdminAuditEventApiResponse[];
  exportRuns: PartnerExportRunApiResponse[];
  webhookEvents: PartnerWebhookEventApiResponse[];
  users: AdminUserAccessApiResponse[];
}): AuditEvidenceViewModel {
  const userById = new Map(users.map((user) => [user.userId, user.displayName]));
  const auditRows = auditEvents.map(buildAuditEventRow);
  const exportRows = exportRuns.map((exportRun) =>
    buildExportRunRow(exportRun, userById),
  );
  const webhookRows = webhookEvents.map(buildWebhookEventRow);
  const rows = [...auditRows, ...exportRows, ...webhookRows].sort(
    compareAuditEvidenceRows,
  );
  const reviewLoad = rows.filter(rowNeedsReview).length;
  const failedWebhookEvents = webhookRows.filter((row) =>
    row.stateTone === "blocked" || row.stateTone === "attention",
  ).length;
  const accessEvents = auditRows.filter((row) => row.lane === "access").length;
  const missingExportChecksums = exportRows.filter(
    (row) => row.stateTone === "attention" || row.stateTone === "blocked",
  ).length;

  return {
    metrics: [
      {
        id: "evidence-volume",
        label: "Evidence rows",
        value: formatCount(rows.length),
        detail: `${formatCount(auditEvents.length)} audit; ${formatCount(
          exportRuns.length + webhookEvents.length,
        )} partner handoff`,
        tone: rows.length > 0 ? "info" : "attention",
      },
      {
        id: "review-load",
        label: "Needs review",
        value: formatCount(reviewLoad),
        detail: "Failed delivery, stale freshness, and access changes",
        tone: toneForAttention(reviewLoad),
      },
      {
        id: "partner-handoffs",
        label: "Partner handoffs",
        value: formatCount(exportRuns.length + webhookEvents.length),
        detail: `${formatCount(exportRuns.length)} exports; ${formatCount(
          webhookEvents.length,
        )} webhook events`,
        tone: failedWebhookEvents > 0 || missingExportChecksums > 0 ? "attention" : "clear",
      },
      {
        id: "access-events",
        label: "Access evidence",
        value: formatCount(accessEvents),
        detail: "Auth, role, user, session, and API events",
        tone: accessEvents > 0 ? "info" : "clear",
      },
    ],
    packets: [
      {
        id: "audit-trail",
        label: "Audit trail",
        value: formatCount(auditEvents.length),
        detail: "Actor, role, entity, timestamp, and metadata evidence",
        tone: auditEvents.length > 0 ? "info" : "attention",
      },
      {
        id: "partner-exports",
        label: "Partner exports",
        value: formatCount(exportRuns.length),
        detail: missingExportChecksums
          ? `${formatCount(missingExportChecksums)} export checksum needs review`
          : "Checksums and record counts are available",
        tone: missingExportChecksums > 0 ? "attention" : "clear",
      },
      {
        id: "webhook-delivery",
        label: "Webhook delivery",
        value: formatCount(webhookEvents.length),
        detail:
          failedWebhookEvents > 0
            ? `${formatCount(failedWebhookEvents)} delivery record needs review`
            : "Delivery and preview events are recorded",
        tone: failedWebhookEvents > 0 ? "blocked" : "clear",
      },
    ],
    rows,
    sourceReferences,
  };
}

export function getDefaultAuditEvidenceRowId(rows: AuditEvidenceRow[]) {
  return rows.find(rowNeedsReview)?.id ?? rows[0]?.id ?? null;
}

export function filterAuditEvidenceRows(
  rows: AuditEvidenceRow[],
  {
    activeLane,
    stateFilter,
    query,
  }: {
    activeLane: AuditEvidenceLaneFilter;
    stateFilter: AuditEvidenceStateFilter;
    query: string;
  },
) {
  const normalizedQuery = query.trim().toLowerCase();

  return rows.filter((row) => {
    const laneMatches = activeLane === "all" || row.lane === activeLane;
    const stateMatches =
      stateFilter === "all" ||
      (stateFilter === "needs-review" && rowNeedsReview(row)) ||
      row.stateTone === stateFilter;
    const queryMatches = !normalizedQuery || row.searchText.includes(normalizedQuery);

    return laneMatches && stateMatches && queryMatches;
  });
}

function buildAuditEventRow(event: AdminAuditEventApiResponse): AuditEvidenceRow {
  const lane = auditEventLane(event.eventType);
  const state = auditEventState(event);
  const actorLabel = event.actorName ?? "System activity";
  const entityLabel = auditEventEntity(event);
  const observedLabel = formatDateTime(event.createdAt);
  const title = formatLabel(event.eventType);
  const rawFacts = [
    { label: "Event type", value: title },
    { label: "Actor", value: actorLabel },
    { label: "Role", value: formatLabel(event.actorRole) },
    { label: "Entity", value: entityLabel },
    { label: "Clinic", value: event.clinicId || "Unavailable" },
    { label: "Metadata", value: compactRecord(event.metadata ?? {}) },
  ];

  return withSearchText({
    id: `audit-event-${event.id}`,
    lane,
    sourceKind: "audit-event",
    sourceHref: buildAdminAuditEventDetailHref(event.id, returnSource),
    ariaLabel: `Open audit event ${event.id} detail`,
    title,
    subtitle: entityLabel,
    summary: event.summary,
    stateLabel: state.label,
    stateTone: state.tone,
    observedLabel,
    actorLabel,
    entityLabel,
    sourceLabel: "Audit event",
    evidenceBasis: `${laneLabel(lane)} evidence captured with actor, entity, timestamp, and source metadata.`,
    reviewState: auditEventReviewState(state.tone, lane),
    nextStep:
      "Open the source event when timestamp, actor, entity, or metadata detail needs investigation.",
    rawFacts,
  });
}

function buildExportRunRow(
  exportRun: PartnerExportRunApiResponse,
  userById: Map<number, string>,
): AuditEvidenceRow {
  const actorLabel = exportRun.requestedByUserId
    ? userById.get(exportRun.requestedByUserId) ?? `User ${exportRun.requestedByUserId}`
    : "Unavailable";
  const entityLabel = exportRun.organisationId
    ? `Organisation ${exportRun.organisationId}`
    : "Organisation scope unavailable";
  const hasChecksum = Boolean(exportRun.checksum);
  const rawFacts = [
    { label: "Format", value: formatLabel(exportRun.format) },
    { label: "Checksum", value: exportRun.checksum || "Unavailable" },
    { label: "Record counts", value: compactRecord(exportRun.recordCounts) },
    { label: "Scope", value: compactRecord(exportRun.scope) },
    { label: "Requester", value: actorLabel },
    { label: "Created", value: formatDateTime(exportRun.createdAt) },
  ];

  return withSearchText({
    id: `export-run-${exportRun.id}`,
    lane: "export",
    sourceKind: "export-run",
    sourceHref: buildAdminExportRunDetailHref(exportRun.id, returnSource),
    ariaLabel: `Open export run ${exportRun.id} detail`,
    title: `Export run ${exportRun.id}`,
    subtitle: `${formatLabel(exportRun.format)} / ${compactRecord(exportRun.recordCounts)}`,
    summary: `Export scope: ${compactRecord(exportRun.scope)}`,
    stateLabel: hasChecksum ? "Checksum recorded" : "Checksum missing",
    stateTone: hasChecksum ? "clear" : "attention",
    observedLabel: formatDateTime(exportRun.createdAt),
    actorLabel,
    entityLabel,
    sourceLabel: "Export run",
    evidenceBasis:
      "Export evidence provides checksum, record counts, scope, requester, and creation time for partner packet review.",
    reviewState: hasChecksum
      ? "Export checksum and record-count evidence are available for review."
      : "Export checksum is missing and should be reviewed before partner handoff.",
    nextStep:
      "Open the export run when payload scope, checksum, or record counts need investigation.",
    rawFacts,
  });
}

function buildWebhookEventRow(event: PartnerWebhookEventApiResponse): AuditEvidenceRow {
  const state = webhookEventState(event);
  const observedLabel = formatDateTime(event.deliveredAt ?? event.createdAt);
  const rawFacts = [
    { label: "Event type", value: formatLabel(event.eventType) },
    { label: "Subscription", value: String(event.subscriptionId) },
    { label: "Status", value: formatLabel(event.status) },
    { label: "Attempts", value: formatCount(event.attemptCount) },
    { label: "Last error", value: event.lastError ?? "Unavailable" },
    { label: "Metadata", value: compactRecord(event.metadata) },
  ];

  return withSearchText({
    id: `webhook-event-${event.id}`,
    lane: "webhook",
    sourceKind: "webhook-event",
    sourceHref: buildAdminWebhookEventDetailHref(event.id, returnSource),
    ariaLabel: `Open webhook event ${event.id} detail`,
    title: formatLabel(event.eventType),
    subtitle: `Subscription ${event.subscriptionId}`,
    summary: webhookEventSummary(event),
    stateLabel: state.label,
    stateTone: state.tone,
    observedLabel,
    actorLabel: "Partner delivery worker",
    entityLabel: `Subscription ${event.subscriptionId}`,
    sourceLabel: "Webhook event",
    evidenceBasis:
      "Webhook evidence provides delivery status, attempt count, last error, metadata, and payload context for partner handoff review.",
    reviewState:
      state.tone === "blocked" || state.tone === "attention"
        ? "Webhook delivery evidence needs review before relying on downstream partner handoff."
        : "Webhook delivery or preview evidence is recorded without a visible failure.",
    nextStep:
      "Open the webhook event when response metadata, payload context, or retry history needs investigation.",
    rawFacts,
  });
}

function withSearchText(row: Omit<AuditEvidenceRow, "searchText">): AuditEvidenceRow {
  const searchText = [
    row.title,
    row.subtitle,
    row.summary,
    row.stateLabel,
    row.observedLabel,
    row.actorLabel,
    row.entityLabel,
    row.sourceLabel,
    row.evidenceBasis,
    row.reviewState,
    row.nextStep,
    ...row.rawFacts.flatMap((fact) => [fact.label, fact.value]),
  ]
    .join(" ")
    .toLowerCase();

  return { ...row, searchText };
}

function compareAuditEvidenceRows(a: AuditEvidenceRow, b: AuditEvidenceRow) {
  const priorityDelta = rowPriority(a) - rowPriority(b);
  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  return dateSortValue(b.observedLabel) - dateSortValue(a.observedLabel);
}

function rowPriority(row: AuditEvidenceRow) {
  if (row.stateTone === "blocked") {
    return 0;
  }

  if (row.stateTone === "attention") {
    return 1;
  }

  if (row.lane === "export" || row.lane === "webhook") {
    return 2;
  }

  if (row.lane === "report" || row.lane === "sync") {
    return 3;
  }

  return 4;
}

function dateSortValue(value: string) {
  const parsed = Date.parse(value);

  return Number.isNaN(parsed) ? 0 : parsed;
}

function rowNeedsReview(row: AuditEvidenceRow) {
  return row.stateTone === "attention" || row.stateTone === "blocked";
}

function auditEventLane(eventType: string): AuditEvidenceLane {
  if (includesAny(eventType, ["access", "auth", "role", "user", "session", "api"])) {
    return "access";
  }

  if (includesAny(eventType, ["report", "review"])) {
    return "report";
  }

  if (includesAny(eventType, ["sync", "offline", "stale", "reconciliation"])) {
    return "sync";
  }

  if (includesAny(eventType, ["export"])) {
    return "export";
  }

  if (includesAny(eventType, ["webhook"])) {
    return "webhook";
  }

  return "operating";
}

function auditEventState(event: AdminAuditEventApiResponse) {
  if (includesAny(event.eventType, ["failed", "failure", "error"])) {
    return { label: "Failed", tone: "blocked" as AuditEvidenceTone };
  }

  if (includesAny(event.eventType, ["stale", "reconciliation"])) {
    return { label: "Freshness review", tone: "attention" as AuditEvidenceTone };
  }

  if (accessEventNeedsReview(event)) {
    return { label: "Access review", tone: "attention" as AuditEvidenceTone };
  }

  if (auditEventLane(event.eventType) === "access") {
    return { label: "Access record", tone: "info" as AuditEvidenceTone };
  }

  if (includesAny(event.eventType, ["review"])) {
    return { label: "Review recorded", tone: "info" as AuditEvidenceTone };
  }

  return { label: "Recorded", tone: "info" as AuditEvidenceTone };
}

function auditEventReviewState(tone: AuditEvidenceTone, lane: AuditEvidenceLane) {
  if (tone === "blocked") {
    return "Source event records a failed operating path and needs investigation.";
  }

  if (tone === "attention" && lane === "access") {
    return "Access or role-change evidence should be reviewed before administrative handoff.";
  }

  if (tone === "attention") {
    return "Evidence is recorded, but the operating state should be reviewed.";
  }

  return "Evidence is recorded as context for audit and operating review.";
}

function accessEventNeedsReview(event: AdminAuditEventApiResponse) {
  return includesAny(event.eventType, [
    "role",
    "permission",
    "privilege",
    "disabled",
    "revoked",
    "reset",
    "password",
    "api_key",
    "access.granted",
    "access.revoked",
    "user.created",
    "user.updated",
  ]);
}

function webhookEventState(event: PartnerWebhookEventApiResponse) {
  if (event.lastError || isFailingStatus(event.status)) {
    return { label: formatLabel(event.status), tone: "blocked" as AuditEvidenceTone };
  }

  if (event.status === "preview_only" || includesAny(event.eventType, ["webhook_test"])) {
    return { label: "Preview only", tone: "info" as AuditEvidenceTone };
  }

  if (event.deliveredAt || includesAny(event.status, ["delivered", "success", "sent"])) {
    return { label: formatLabel(event.status), tone: "clear" as AuditEvidenceTone };
  }

  return { label: formatLabel(event.status), tone: "attention" as AuditEvidenceTone };
}

function webhookEventSummary(event: PartnerWebhookEventApiResponse) {
  if (event.lastError) {
    return event.lastError;
  }

  return event.status === "preview_only"
    ? "Preview-only webhook test event recorded without delivery."
    : "Webhook delivery or test event recorded.";
}

function auditEventEntity(event: AdminAuditEventApiResponse) {
  if (event.entityType || event.entityId) {
    return [event.entityType, event.entityId].filter(Boolean).join(" ");
  }

  return event.clinicId || "Unavailable";
}

function includesAny(value: string, terms: string[]) {
  const normalized = value.toLowerCase();

  return terms.some((term) => normalized.includes(term));
}

function isFailingStatus(status?: string | null) {
  const normalized = status?.toLowerCase();

  return Boolean(
    normalized &&
      (normalized.includes("fail") ||
        normalized.includes("error") ||
        normalized.includes("dead")),
  );
}

function laneLabel(lane: AuditEvidenceLane) {
  const labels: Record<AuditEvidenceLane, string> = {
    access: "Access",
    report: "Report",
    sync: "Sync and freshness",
    export: "Partner export",
    webhook: "Webhook delivery",
    operating: "Operating",
  };

  return labels[lane];
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

function formatLabel(value?: string | null) {
  if (!value) {
    return "Unavailable";
  }

  return value
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function toneForAttention(value: number): AuditEvidenceTone {
  return value > 0 ? "attention" : "clear";
}
