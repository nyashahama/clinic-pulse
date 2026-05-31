import type {
  IntegrationStatusCheckApiResponse,
  PartnerApiKeyApiResponse,
  PartnerExportRunApiResponse,
  PartnerReadinessApiResponse,
  PartnerWebhookEventApiResponse,
  PartnerWebhookSubscriptionApiResponse,
} from "@/lib/demo/api-types";
import { isPartnerApiKeyActive } from "@/lib/demo/partner-readiness";
import {
  buildAdminApiKeyDetailHref,
  buildAdminExportRunDetailHref,
  buildAdminIntegrationCheckDetailHref,
  buildAdminWebhookEventDetailHref,
  buildAdminWebhookSubscriptionDetailHref,
} from "@/lib/product/admin-detail-routes";

export type IntegrationTone = "clear" | "attention" | "blocked" | "info";

export type IntegrationEvidenceKind =
  | "credential"
  | "endpoint"
  | "webhook"
  | "export"
  | "check";

export type IntegrationEvidenceKindFilter = IntegrationEvidenceKind | "all";

export type IntegrationEvidenceStateFilter =
  | "all"
  | "needs-review"
  | "ready"
  | "preview"
  | "blocked"
  | "info";

export type IntegrationSummaryMetric = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: IntegrationTone;
};

export type IntegrationActionCard = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  detail: string;
  tone: IntegrationTone;
  href?: string;
  actionLabel?: string;
};

export type IntegrationEndpointRow = {
  method: string;
  path: string;
  scope: string;
  purpose: string;
  covered: boolean;
  tone: IntegrationTone;
  command: string;
};

export type IntegrationDeliveryLogRow = {
  id: string;
  eventType: string;
  stateLabel: string;
  tone: IntegrationTone;
  target: string;
  attempts: string;
  observedLabel: string;
  sourceHref: string;
  ariaLabel: string;
};

export type IntegrationEvidenceRow = {
  id: string;
  kind: IntegrationEvidenceKind;
  title: string;
  subject: string;
  subjectDetail: string;
  sourceLabel: string;
  stateLabel: string;
  tone: IntegrationTone;
  evidenceBasis: string;
  observedLabel: string;
  nextStep: string;
  sourceHref: string;
  ariaLabel: string;
  rawFacts: Array<{ label: string; value: string }>;
  searchText: string;
};

export type IntegrationSourceReference = {
  source: string;
  role: string;
  repositoryUrl: string;
  license: "MIT" | "AGPL reference-only";
};

export type IntegrationOperationsModel = {
  summaryMetrics: IntegrationSummaryMetric[];
  workspaceMetrics: IntegrationSummaryMetric[];
  actionCards: IntegrationActionCard[];
  endpointRows: IntegrationEndpointRow[];
  evidenceRows: IntegrationEvidenceRow[];
  deliveryLogRows: IntegrationDeliveryLogRow[];
  sourceReferences: IntegrationSourceReference[];
  consoleState: {
    tone: IntegrationTone;
    summary: string;
  };
};

type BuildIntegrationOperationsOptions = {
  now?: Date;
};

type CredentialState = {
  label: string;
  tone: IntegrationTone;
  basis: string;
  nextStep: string;
};

type WebhookState = {
  label: string;
  tone: IntegrationTone;
  basis: string;
  nextStep: string;
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-ZA", {
  dateStyle: "medium",
  timeStyle: "short",
});

const numberFormatter = new Intl.NumberFormat("en-ZA");

const returnSource = "admin-integrations";

const sourceReferences: IntegrationSourceReference[] = [
  {
    source: "Infisical admin integrations",
    role: "Tabbed integration configuration with instance-wide workflow connectors and admin-owned setup boundaries.",
    repositoryUrl: "https://github.com/Infisical/infisical",
    license: "MIT",
  },
  {
    source: "Cal.com BTCPay setup",
    role: "Credential validation paired with webhook provisioning before a connector is treated as ready.",
    repositoryUrl: "https://github.com/calcom/cal.com",
    license: "MIT",
  },
  {
    source: "Unkey request log details",
    role: "API-key verification logs, permission chips, and empty-state guidance for credential troubleshooting.",
    repositoryUrl: "https://github.com/unkeyed/unkey",
    license: "AGPL reference-only",
  },
  {
    source: "Dub events metadata",
    role: "Event-row metadata previews, copy affordances, and event IDs for delivery debugging.",
    repositoryUrl: "https://github.com/dubinc/dub",
    license: "AGPL reference-only",
  },
  {
    source: "OpenStatus health check",
    role: "Health-check posture and endpoint diagnostic language for integration status review.",
    repositoryUrl: "https://github.com/openstatusHQ/openstatus",
    license: "AGPL reference-only",
  },
];

const endpointCatalog = [
  {
    method: "GET",
    path: "/v1/partner/clinics",
    scope: "clinics:read",
    purpose: "Partner-safe clinic directory and current public status.",
  },
  {
    method: "GET",
    path: "/v1/partner/clinics/{clinicId}/status",
    scope: "status:read",
    purpose: "Partner-safe operational status for a selected clinic.",
  },
  {
    method: "GET",
    path: "/v1/partner/alternatives",
    scope: "alternatives:read",
    purpose: "Alternative clinic recommendations for a clinic and service.",
  },
  {
    method: "GET",
    path: "/v1/partner/export/latest",
    scope: "exports:read",
    purpose: "Latest generated partner export package metadata.",
  },
  {
    method: "GET",
    path: "/v1/partner/integration-status",
    scope: "status:read",
    purpose: "Partner-visible readiness and integration check state.",
  },
] as const;

export const integrationEndpointRows = endpointCatalog.map((row) => ({
  ...row,
}));

export function buildIntegrationOperationsModel(
  readiness: PartnerReadinessApiResponse,
  options: BuildIntegrationOperationsOptions = {},
): IntegrationOperationsModel {
  const now = options.now ?? new Date();
  const activeApiKeys = readiness.apiKeys.filter((apiKey) =>
    isPartnerApiKeyActive(apiKey, now),
  );
  const coveredScopes = getActiveScopes(readiness.apiKeys, now);
  const endpointRows = endpointCatalog.map((row): IntegrationEndpointRow => {
    const covered = coveredScopes.has(row.scope);

    return {
      ...row,
      covered,
      tone: covered ? "clear" : "attention",
      command: smokeCommand(row.path),
    };
  });
  const endpointCoverage = endpointRows.filter((row) => row.covered).length;
  const latestExportRun = latestExport(readiness.exportRuns);
  const credentialRows = buildCredentialRows(readiness.apiKeys, coveredScopes, now);
  const subscriptionRows = buildWebhookSubscriptionRows(
    readiness.webhookSubscriptions,
  );
  const eventRows = buildWebhookEventRows(readiness.webhookEvents);
  const exportRows = buildExportRows(readiness.exportRuns);
  const checkRows = buildCheckRows(readiness.integrationChecks);
  const evidenceRows = prioritizeEvidenceRows([
    ...credentialRows,
    ...subscriptionRows,
    ...eventRows,
    ...exportRows,
    ...checkRows,
  ]);
  const deliveryReviewCount = [...subscriptionRows, ...eventRows].filter((row) =>
    needsReview(row.tone),
  ).length;
  const deliveryLogRows = buildDeliveryLogRows(
    readiness.webhookSubscriptions,
    readiness.webhookEvents,
  );
  const missingEndpointCount = endpointRows.length - endpointCoverage;
  const blockedEvidenceCount = evidenceRows.filter((row) => row.tone === "blocked").length;
  const reviewEvidenceCount = evidenceRows.filter((row) => needsReview(row.tone)).length;
  const consoleTone: IntegrationTone =
    blockedEvidenceCount > 0
      ? "blocked"
      : reviewEvidenceCount > 0 || missingEndpointCount > 0
        ? "attention"
        : "clear";

  return {
    summaryMetrics: [
      {
        id: "connection-state",
        label: "Connection state",
        value: `${formatCount(activeApiKeys.length)} active`,
        detail: `${formatCount(readiness.apiKeys.length)} total ${pluralize(
          readiness.apiKeys.length,
          "credential",
          "credentials",
        )}`,
        tone: activeApiKeys.length > 0 ? "clear" : "attention",
      },
      {
        id: "endpoint-coverage",
        label: "Endpoint coverage",
        value: `${formatCount(endpointCoverage)} / ${formatCount(endpointRows.length)}`,
        detail: "Covered by active key scopes",
        tone: missingEndpointCount === 0 ? "clear" : "attention",
      },
      {
        id: "delivery-review",
        label: "Delivery review",
        value: `${formatCount(deliveryReviewCount)} ${pluralize(
          deliveryReviewCount,
          "review",
          "reviews",
        )}`,
        detail: `${formatCount(deliveryLogRows.length)} webhook records`,
        tone: deliveryReviewCount > 0 ? "attention" : "clear",
      },
      {
        id: "latest-export",
        label: "Latest export",
        value: latestExportRun?.format ?? "None",
        detail: latestExportRun
          ? formatIntegrationDateTime(latestExportRun.createdAt)
          : "Generate a package before handoff",
        tone: latestExportRun ? "clear" : "attention",
      },
    ],
    workspaceMetrics: [
      {
        id: "review-evidence",
        label: "Review items",
        value: formatCount(reviewEvidenceCount),
        detail: "Blocked or attention rows",
        tone: reviewEvidenceCount > 0 ? "attention" : "clear",
      },
      {
        id: "credential-evidence",
        label: "Credentials",
        value: formatCount(credentialRows.length),
        detail: `${formatCount(activeApiKeys.length)} active`,
        tone: activeApiKeys.length > 0 ? "clear" : "attention",
      },
      {
        id: "webhook-evidence",
        label: "Webhooks",
        value: formatCount(subscriptionRows.length + eventRows.length),
        detail: `${formatCount(deliveryReviewCount)} need review`,
        tone: deliveryReviewCount > 0 ? "attention" : "clear",
      },
      {
        id: "export-evidence",
        label: "Exports",
        value: formatCount(exportRows.length),
        detail: latestExportRun ? "Latest package linked" : "No package evidence",
        tone: latestExportRun ? "clear" : "attention",
      },
      {
        id: "check-evidence",
        label: "Checks",
        value: formatCount(checkRows.length),
        detail: `${formatCount(
          checkRows.filter((row) => needsReview(row.tone)).length,
        )} need review`,
        tone: checkRows.some((row) => needsReview(row.tone)) ? "attention" : "clear",
      },
    ],
    actionCards: [
      {
        id: "credential-owner",
        eyebrow: "Credential owner",
        title: activeApiKeys.length > 0 ? "Partner key active" : "Credential required",
        description:
          activeApiKeys.length > 0
            ? "At least one partner key can reach the covered API surface."
            : "Create a partner API key before treating this integration as live.",
        detail: `${formatCount(endpointCoverage)} of ${formatCount(
          endpointRows.length,
        )} endpoints covered`,
        tone: activeApiKeys.length > 0 && missingEndpointCount === 0 ? "clear" : "attention",
        href: "/admin/partner-readiness",
        actionLabel: "Manage keys",
      },
      {
        id: "receiver-health",
        eyebrow: "Receiver health",
        title: deliveryReviewCount > 0 ? "Delivery needs review" : "Delivery evidence clear",
        description:
          deliveryReviewCount > 0
            ? "Webhook tests or events show a partner receiver issue to inspect."
            : "Webhook subscriptions and preview events are not reporting receiver failures.",
        detail: `${formatCount(deliveryReviewCount)} delivery reviews`,
        tone: deliveryReviewCount > 0 ? "attention" : "clear",
        href: "#webhook-delivery-log",
        actionLabel: "Review delivery",
      },
      {
        id: "package-proof",
        eyebrow: "Package proof",
        title: latestExportRun ? "Latest export linked" : "Export package missing",
        description: latestExportRun
          ? "The latest partner export package has checksum and scope evidence."
          : "Generate an export package so the partner has a reproducible handoff artifact.",
        detail: latestExportRun
          ? latestExportRun.checksum
          : "No checksum recorded",
        tone: latestExportRun ? "clear" : "attention",
        href: "/admin/partner-readiness",
        actionLabel: latestExportRun ? "Review packet" : "Generate packet",
      },
    ],
    endpointRows,
    evidenceRows,
    deliveryLogRows,
    sourceReferences,
    consoleState: {
      tone: consoleTone,
      summary:
        consoleTone === "clear"
          ? "Integration evidence is linked and ready for operational review."
          : `${formatCount(reviewEvidenceCount + missingEndpointCount)} integration signals need review.`,
    },
  };
}

export function filterIntegrationEvidenceRows(
  rows: IntegrationEvidenceRow[],
  {
    activeKind,
    stateFilter,
    query,
  }: {
    activeKind: IntegrationEvidenceKindFilter;
    stateFilter: IntegrationEvidenceStateFilter;
    query: string;
  },
) {
  const normalizedQuery = query.trim().toLowerCase();

  return rows.filter((row) => {
    const kindMatches = activeKind === "all" || row.kind === activeKind;
    const stateMatches =
      stateFilter === "all" ||
      (stateFilter === "needs-review" && needsReview(row.tone)) ||
      (stateFilter === "ready" && row.tone === "clear") ||
      (stateFilter === "preview" &&
        row.stateLabel.toLowerCase().includes("preview")) ||
      (stateFilter === "blocked" && row.tone === "blocked") ||
      (stateFilter === "info" && row.tone === "info");
    const queryMatches = !normalizedQuery || row.searchText.includes(normalizedQuery);

    return kindMatches && stateMatches && queryMatches;
  });
}

export function getDefaultIntegrationEvidenceRowId(rows: IntegrationEvidenceRow[]) {
  return (
    rows.find((row) => row.tone === "blocked" || row.tone === "attention")?.id ??
    rows[0]?.id ??
    null
  );
}

export function formatIntegrationDateTime(value?: string | null) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return dateTimeFormatter.format(date);
}

export function formatIntegrationLabel(value?: string | null) {
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

export function compactIntegrationRecord(value: Record<string, unknown>) {
  const entries = Object.entries(value);
  if (!entries.length) {
    return "Unavailable";
  }

  return entries
    .map(([key, entryValue]) => `${formatIntegrationLabel(key)}: ${String(entryValue)}`)
    .join("; ");
}

export function smokeCommand(path: string) {
  return `curl -H "Authorization: Bearer $CLINICPULSE_PARTNER_API_KEY" "$CLINICPULSE_API_BASE_URL${path}"`;
}

function buildCredentialRows(
  apiKeys: PartnerApiKeyApiResponse[],
  coveredScopes: Set<string>,
  now: Date,
) {
  return apiKeys.map((row): IntegrationEvidenceRow => {
    const state = getCredentialState(row, coveredScopes, now);
    const rawFacts = [
      { label: "Prefix", value: row.keyPrefix },
      { label: "Environment", value: formatIntegrationLabel(row.environment) },
      { label: "Scopes", value: formatList(row.scopes) },
      { label: "Districts", value: formatList(row.allowedDistricts) },
      { label: "Last used", value: formatIntegrationDateTime(row.lastUsedAt) },
    ];

    return withSearchText({
      id: `credential-${row.id}`,
      kind: "credential",
      title: "Credential scope coverage",
      subject: row.name,
      subjectDetail: row.keyPrefix,
      sourceLabel: "API key",
      stateLabel: state.label,
      tone: state.tone,
      evidenceBasis: state.basis,
      observedLabel: formatIntegrationDateTime(row.lastUsedAt ?? row.updatedAt),
      nextStep: state.nextStep,
      sourceHref: buildAdminApiKeyDetailHref(row.id, returnSource),
      ariaLabel: `Open ${row.name} API key detail`,
      rawFacts,
    });
  });
}

function buildWebhookSubscriptionRows(
  subscriptions: PartnerWebhookSubscriptionApiResponse[],
) {
  return subscriptions.map((row): IntegrationEvidenceRow => {
    const state = getWebhookState(row.lastTestStatus ?? row.status, row.lastError);
    const metadata = row.lastError ?? compactIntegrationRecord(row.lastTestMetadata);
    const rawFacts = [
      { label: "Target", value: row.targetUrl },
      { label: "Event types", value: formatList(row.eventTypes) },
      { label: "Last test status", value: formatIntegrationLabel(row.lastTestStatus) },
      { label: "Evidence", value: metadata },
      { label: "Updated", value: formatIntegrationDateTime(row.lastTestedAt ?? row.updatedAt) },
    ];

    return withSearchText({
      id: `webhook-subscription-${row.id}`,
      kind: "webhook",
      title: "Webhook subscription",
      subject: row.name,
      subjectDetail: row.targetUrl,
      sourceLabel: "Webhook subscription",
      stateLabel: state.label,
      tone: state.tone,
      evidenceBasis: state.basis,
      observedLabel: formatIntegrationDateTime(row.lastTestedAt ?? row.updatedAt),
      nextStep: state.nextStep,
      sourceHref: buildAdminWebhookSubscriptionDetailHref(row.id, returnSource),
      ariaLabel: `Open webhook subscription ${row.id} detail`,
      rawFacts,
    });
  });
}

function buildWebhookEventRows(events: PartnerWebhookEventApiResponse[]) {
  return events.map((row): IntegrationEvidenceRow => {
    const state = getWebhookState(row.status, row.lastError);
    const rawFacts = [
      { label: "Subscription", value: String(row.subscriptionId) },
      { label: "Attempts", value: formatCount(row.attemptCount) },
      { label: "Evidence", value: row.lastError ?? compactIntegrationRecord(row.metadata) },
      { label: "Delivered", value: formatIntegrationDateTime(row.deliveredAt) },
      { label: "Created", value: formatIntegrationDateTime(row.createdAt) },
    ];

    return withSearchText({
      id: `webhook-event-${row.id}`,
      kind: "webhook",
      title: "Webhook event",
      subject: formatIntegrationLabel(row.eventType),
      subjectDetail: `Subscription ${row.subscriptionId}`,
      sourceLabel: "Webhook event",
      stateLabel: state.label,
      tone: state.tone,
      evidenceBasis: state.basis,
      observedLabel: formatIntegrationDateTime(row.deliveredAt ?? row.createdAt),
      nextStep: state.nextStep,
      sourceHref: buildAdminWebhookEventDetailHref(row.id, returnSource),
      ariaLabel: `Open webhook event ${row.id} detail`,
      rawFacts,
    });
  });
}

function buildExportRows(exportRuns: PartnerExportRunApiResponse[]) {
  return exportRuns.map((row): IntegrationEvidenceRow => {
    const rawFacts = [
      { label: "Checksum", value: row.checksum },
      { label: "Format", value: row.format },
      { label: "Record counts", value: compactIntegrationRecord(row.recordCounts) },
      { label: "Scope", value: compactIntegrationRecord(row.scope) },
      { label: "Created", value: formatIntegrationDateTime(row.createdAt) },
    ];

    return withSearchText({
      id: `export-${row.id}`,
      kind: "export",
      title: "Export package",
      subject: row.checksum,
      subjectDetail: row.format,
      sourceLabel: "Export package",
      stateLabel: "Ready",
      tone: "clear",
      evidenceBasis: `${row.format} package with ${compactIntegrationRecord(
        row.recordCounts,
      )}.`,
      observedLabel: formatIntegrationDateTime(row.createdAt),
      nextStep: "Use the checksum and scope evidence when validating the partner handoff.",
      sourceHref: buildAdminExportRunDetailHref(row.id, returnSource),
      ariaLabel: `Open export run ${row.id} detail`,
      rawFacts,
    });
  });
}

function buildCheckRows(checks: IntegrationStatusCheckApiResponse[]) {
  return checks.map((row): IntegrationEvidenceRow => {
    const tone = getCheckTone(row);
    const rawFacts = [
      { label: "Check", value: formatIntegrationLabel(row.checkName) },
      { label: "Status", value: formatIntegrationLabel(row.status) },
      { label: "Metadata", value: compactIntegrationRecord(row.metadata) },
      { label: "Checked", value: formatIntegrationDateTime(row.checkedAt) },
    ];

    return withSearchText({
      id: `check-${row.id}`,
      kind: "check",
      title: "Integration check",
      subject: formatIntegrationLabel(row.checkName),
      subjectDetail: row.summary,
      sourceLabel: "Integration check",
      stateLabel: formatIntegrationLabel(row.status),
      tone,
      evidenceBasis: row.summary,
      observedLabel: formatIntegrationDateTime(row.checkedAt),
      nextStep:
        tone === "clear"
          ? "Keep this check in the operational evidence trail."
          : "Open the check detail and resolve the failing integration condition.",
      sourceHref: buildAdminIntegrationCheckDetailHref(row.id, returnSource),
      ariaLabel: `Open ${formatIntegrationLabel(row.checkName)} integration check detail`,
      rawFacts,
    });
  });
}

function buildDeliveryLogRows(
  subscriptions: PartnerWebhookSubscriptionApiResponse[],
  events: PartnerWebhookEventApiResponse[],
) {
  return [
    ...subscriptions.map((row): IntegrationDeliveryLogRow => {
      const state = getWebhookState(row.lastTestStatus ?? row.status, row.lastError);

      return {
        id: `subscription-${row.id}`,
        eventType: row.eventTypes.join(", ") || "Subscription test",
        stateLabel: state.label,
        tone: state.tone,
        target: row.targetUrl,
        attempts: "Test receiver",
        observedLabel: formatIntegrationDateTime(row.lastTestedAt ?? row.updatedAt),
        sourceHref: buildAdminWebhookSubscriptionDetailHref(row.id, returnSource),
        ariaLabel: `Open webhook subscription ${row.id} detail`,
      };
    }),
    ...events.map((row): IntegrationDeliveryLogRow => {
      const state = getWebhookState(row.status, row.lastError);

      return {
        id: `event-${row.id}`,
        eventType: row.eventType,
        stateLabel: state.label,
        tone: state.tone,
        target: `Subscription ${row.subscriptionId}`,
        attempts: formatCount(row.attemptCount),
        observedLabel: formatIntegrationDateTime(row.deliveredAt ?? row.createdAt),
        sourceHref: buildAdminWebhookEventDetailHref(row.id, returnSource),
        ariaLabel: `Open webhook event ${row.id} detail`,
      };
    }),
  ];
}

function getActiveScopes(apiKeys: PartnerApiKeyApiResponse[], now: Date) {
  const scopes = new Set<string>();

  for (const apiKey of apiKeys) {
    if (!isPartnerApiKeyActive(apiKey, now)) {
      continue;
    }

    for (const scope of apiKey.scopes) {
      scopes.add(scope.trim());
    }
  }

  return scopes;
}

function getCredentialState(
  apiKey: PartnerApiKeyApiResponse,
  coveredScopes: Set<string>,
  now: Date,
): CredentialState {
  if (apiKey.revokedAt) {
    return {
      label: "Revoked",
      tone: "blocked",
      basis: "This credential is revoked and cannot be used by a partner.",
      nextStep: "Create or rotate to an active partner credential before handoff.",
    };
  }

  if (!isPartnerApiKeyActive(apiKey, now)) {
    return {
      label: "Review",
      tone: "attention",
      basis: "The credential is expired or has an invalid expiry timestamp.",
      nextStep: "Rotate the partner key or correct the expiry before relying on it.",
    };
  }

  const missingScopes = endpointCatalog
    .map((row) => row.scope)
    .filter((scope) => !coveredScopes.has(scope));

  if (missingScopes.length) {
    return {
      label: "Missing scope",
      tone: "attention",
      basis: `Active credentials are missing ${formatList(missingScopes)}.`,
      nextStep: "Add the missing scopes or create a scoped replacement key.",
    };
  }

  return {
    label: "Active",
    tone: "clear",
    basis: "This credential is active and covers the partner endpoint surface.",
    nextStep: "Keep monitoring last-used activity and rotate on schedule.",
  };
}

function getWebhookState(status?: string | null, error?: string | null): WebhookState {
  const normalized = status?.trim().toLowerCase();

  if (error || normalized?.includes("fail") || normalized?.includes("disabled")) {
    return {
      label: "Failed",
      tone: "attention",
      basis: error ?? "The last webhook status shows a receiver failure.",
      nextStep: "Open the source evidence and validate the partner receiver response.",
    };
  }

  if (normalized?.includes("delivered") || normalized?.includes("active")) {
    return {
      label: normalized.includes("delivered") ? "Delivered" : "Active",
      tone: "clear",
      basis: "Webhook delivery evidence is linked to a partner receiver record.",
      nextStep: "Keep this receiver in the monitoring rotation.",
    };
  }

  if (normalized?.includes("preview")) {
    return {
      label: "Preview",
      tone: "info",
      basis: "This is preview-only webhook evidence and has not reached a live receiver.",
      nextStep: "Run a receiver test before partner handoff.",
    };
  }

  return {
    label: "Review",
    tone: "attention",
    basis: "Webhook state is not clear enough for an operational handoff.",
    nextStep: "Open the source record and capture a fresh receiver test.",
  };
}

function getCheckTone(check: IntegrationStatusCheckApiResponse): IntegrationTone {
  const normalized = check.status.trim().toLowerCase();

  if (normalized === "passing") {
    return "clear";
  }

  if (normalized === "failing") {
    return "blocked";
  }

  return "attention";
}

function latestExport(exportRuns: PartnerExportRunApiResponse[]) {
  return [...exportRuns].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  )[0];
}

function prioritizeEvidenceRows(rows: IntegrationEvidenceRow[]) {
  const priority: Record<IntegrationTone, number> = {
    blocked: 0,
    attention: 1,
    clear: 2,
    info: 3,
  };

  return [...rows].sort((left, right) => priority[left.tone] - priority[right.tone]);
}

function withSearchText(
  row: Omit<IntegrationEvidenceRow, "searchText">,
): IntegrationEvidenceRow {
  const searchable = [
    row.id,
    row.kind,
    row.title,
    row.subject,
    row.subjectDetail,
    row.sourceLabel,
    row.stateLabel,
    row.evidenceBasis,
    row.observedLabel,
    row.nextStep,
    row.sourceHref,
    ...row.rawFacts.flatMap((fact) => [fact.label, fact.value]),
  ];

  return {
    ...row,
    searchText: searchable.join(" ").toLowerCase(),
  };
}

function needsReview(tone: IntegrationTone) {
  return tone === "attention" || tone === "blocked";
}

function formatList(values: string[]) {
  if (!values.length) {
    return "All";
  }

  return values.map(formatIntegrationLabel).join(", ");
}

function formatCount(value: number) {
  return numberFormatter.format(value);
}

function pluralize(value: number, singular: string, plural: string) {
  return value === 1 ? singular : plural;
}
