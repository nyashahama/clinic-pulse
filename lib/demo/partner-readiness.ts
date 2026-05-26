import type {
  CreatePartnerApiKeyApiResponse,
  CreatePartnerWebhookApiResponse,
  IntegrationStatusCheckApiResponse,
  PartnerApiKeyApiResponse,
  PartnerReadinessApiResponse,
  PartnerWebhookEventApiResponse,
  PartnerWebhookSubscriptionApiResponse,
} from "@/lib/demo/api-types";

export type PartnerReadinessSeverity = "clear" | "watch" | "attention";

export type PartnerReadinessMetric = {
  label: string;
  value: string;
  detail?: string;
  tone: PartnerReadinessSeverity | "info";
};

export type PartnerReadinessModel = {
  severity: PartnerReadinessSeverity;
  title: string;
  description: string;
  metrics: PartnerReadinessMetric[];
};

export type PartnerLaunchGateId =
  | "access"
  | "contract"
  | "delivery"
  | "operations";

export type PartnerLaunchGate = {
  id: PartnerLaunchGateId;
  label: string;
  status: string;
  summary: string;
  detail: string;
  tone: PartnerReadinessMetric["tone"];
};

export type PartnerHandoffPacketItem = {
  label: string;
  value: string;
  detail: string;
  tone: PartnerReadinessMetric["tone"];
};

export type PartnerEventDeliveryRow = {
  id: string;
  eventType: string;
  state: string;
  attempts: string;
  target: string;
  detail: string;
  updatedAt: string;
  tone: PartnerReadinessMetric["tone"];
};

export type PartnerEventCatalogItem = {
  eventType: string;
  source: string;
  purpose: string;
};

export type PartnerEvidenceKind =
  | "credential"
  | "contract"
  | "delivery"
  | "export"
  | "check";

export type PartnerEvidenceKindFilter = PartnerEvidenceKind | "all";

export type PartnerEvidenceStateFilter =
  | "all"
  | "needs-review"
  | "ready"
  | "watch"
  | "info";

export type PartnerEvidenceRow = {
  id: string;
  kind: PartnerEvidenceKind;
  laneLabel: string;
  title: string;
  subject: string;
  sourceLabel: string;
  stateLabel: string;
  tone: PartnerReadinessMetric["tone"];
  evidenceBasis: string;
  observedLabel: string;
  nextStep: string;
  rawFacts: Array<{ label: string; value: string }>;
  searchText: string;
};

export type PartnerActionQueueId =
  | "create-key"
  | "create-webhook"
  | "generate-export"
  | "test-webhook";

export type PartnerActionQueueItem = {
  id: PartnerActionQueueId;
  label: string;
  summary: string;
  detail: string;
  tone: PartnerReadinessMetric["tone"];
  action: PartnerActionQueueId;
};

export type PartnerSourceReference = {
  source: string;
  href: string;
  sourcePath: string;
  role: string;
  licenseUse: "adaptable" | "reference-only";
};

export type PartnerLaunchCockpitModel = {
  gates: PartnerLaunchGate[];
  handoffPacket: {
    title: string;
    status: string;
    summary: string;
    tone: PartnerReadinessMetric["tone"];
    items: PartnerHandoffPacketItem[];
  };
  deliveryRows: PartnerEventDeliveryRow[];
  eventCatalog: PartnerEventCatalogItem[];
  evidenceRows: PartnerEvidenceRow[];
  actionQueue: PartnerActionQueueItem[];
  sourceReferences: PartnerSourceReference[];
};

export type OneTimePartnerApiKeySecret = {
  id: number;
  name: string;
  keyPrefix: string;
  secret: string;
};

export type OneTimePartnerWebhookSecret = {
  id: number;
  name: string;
  targetUrl: string;
  secret: string;
};

const numberFormatter = new Intl.NumberFormat("en-ZA");
const requiredPartnerReadinessScopes = [
  "clinics:read",
  "status:read",
  "alternatives:read",
  "exports:read",
];

export function createEmptyPartnerReadiness(): PartnerReadinessApiResponse {
  return {
    apiKeys: [],
    webhookSubscriptions: [],
    webhookEvents: [],
    exportRuns: [],
    integrationChecks: [],
  };
}

export function createOneTimePartnerApiKeySecret(
  response: CreatePartnerApiKeyApiResponse,
): OneTimePartnerApiKeySecret {
  return {
    id: response.apiKey.id,
    name: response.apiKey.name,
    keyPrefix: response.apiKey.keyPrefix,
    secret: response.secret,
  };
}

export function createOneTimePartnerWebhookSecret(
  response: CreatePartnerWebhookApiResponse,
): OneTimePartnerWebhookSecret {
  return {
    id: response.subscription.id,
    name: response.subscription.name,
    targetUrl: response.subscription.targetUrl,
    secret: response.secret,
  };
}

function formatCount(value: number) {
  return numberFormatter.format(value);
}

function formatAttemptCount(value: number) {
  return `${formatCount(value)} ${value === 1 ? "attempt" : "attempts"}`;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatLabel(value?: string | null) {
  if (!value) {
    return "Unavailable";
  }

  const normalized = value.replaceAll("_", " ").replaceAll(".", " ");

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function isPartnerApiKeyActive(
  apiKey: PartnerApiKeyApiResponse,
  now = new Date(),
) {
  if (apiKey.revokedAt) {
    return false;
  }

  if (!apiKey.expiresAt) {
    return true;
  }

  const expiresAt = new Date(apiKey.expiresAt);
  if (Number.isNaN(expiresAt.getTime())) {
    return false;
  }

  return expiresAt.getTime() > now.getTime();
}

function activeApiKeysCoverRequiredScopes(apiKeys: PartnerApiKeyApiResponse[]) {
  return getMissingRequiredPartnerScopes(apiKeys).length === 0;
}

function getMissingRequiredPartnerScopes(apiKeys: PartnerApiKeyApiResponse[]) {
  const covered = new Set<string>();
  for (const apiKey of apiKeys) {
    for (const scope of apiKey.scopes) {
      covered.add(scope.trim());
    }
  }

  return requiredPartnerReadinessScopes.filter((scope) => !covered.has(scope));
}

function getCheckStatus(check: IntegrationStatusCheckApiResponse) {
  return check.status.trim().toLowerCase();
}

function hasWebhookTest(readiness: PartnerReadinessApiResponse) {
  if (readiness.webhookEvents.length > 0) {
    return true;
  }

  if (
    readiness.webhookSubscriptions.some(
      (subscription) => subscription.lastTestedAt || subscription.lastTestStatus,
    )
  ) {
    return true;
  }

  return readiness.integrationChecks.some(
    (check) =>
      check.checkName === "webhook_test_recorded" && getCheckStatus(check) === "passing",
  );
}

function getIntegrationCheckTone(
  integrationChecks: IntegrationStatusCheckApiResponse[],
): PartnerReadinessMetric["tone"] {
  if (integrationChecks.some((check) => getCheckStatus(check) === "failing")) {
    return "attention";
  }

  if (integrationChecks.some((check) => getCheckStatus(check) === "attention")) {
    return "watch";
  }

  return "clear";
}

function getStatusTone(status: string): PartnerReadinessMetric["tone"] {
  const normalized = status.trim().toLowerCase();
  if (normalized === "passing" || normalized === "active" || normalized === "delivered") {
    return "clear";
  }
  if (normalized === "attention" || normalized === "queued" || normalized === "preview_only") {
    return "watch";
  }
  if (normalized === "failing" || normalized === "disabled" || normalized === "failed") {
    return "attention";
  }
  return "info";
}

function toneForCheckStatus(status: string): PartnerReadinessMetric["tone"] {
  const normalized = status.trim().toLowerCase();

  if (normalized === "passing") {
    return "clear";
  }

  if (normalized === "attention") {
    return "watch";
  }

  if (normalized === "failing") {
    return "attention";
  }

  return "info";
}

function isActiveWebhook(subscription: PartnerWebhookSubscriptionApiResponse) {
  return subscription.status.trim().toLowerCase() === "active";
}

function latestCreatedAt<T extends { createdAt: string }>(rows: T[]) {
  return [...rows].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  )[0];
}

function buildSubscriptionNameMap(
  subscriptions: PartnerWebhookSubscriptionApiResponse[],
) {
  return new Map(
    subscriptions.map((subscription) => [
      subscription.id,
      subscription.name || `Subscription ${subscription.id}`,
    ]),
  );
}

function buildDeliveryRows(
  events: PartnerWebhookEventApiResponse[],
  subscriptions: PartnerWebhookSubscriptionApiResponse[],
): PartnerEventDeliveryRow[] {
  const subscriptionNames = buildSubscriptionNameMap(subscriptions);

  return [...events]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((event) => ({
      id: `webhook-event-${event.id}`,
      eventType: event.eventType,
      state: event.status,
      attempts: formatAttemptCount(event.attemptCount),
      target:
        subscriptionNames.get(event.subscriptionId) ??
        `Subscription ${event.subscriptionId}`,
      detail: event.lastError ?? "Delivery evidence recorded",
      updatedAt: event.deliveredAt ?? event.createdAt,
      tone: getStatusTone(event.status),
    }));
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

function withPartnerEvidenceSearchText(
  row: Omit<PartnerEvidenceRow, "searchText">,
): PartnerEvidenceRow {
  const searchText = [
    row.laneLabel,
    row.title,
    row.subject,
    row.sourceLabel,
    row.stateLabel,
    row.evidenceBasis,
    row.observedLabel,
    row.nextStep,
    ...row.rawFacts.flatMap((fact) => [fact.label, fact.value]),
  ]
    .join(" ")
    .toLowerCase();

  return { ...row, searchText };
}

function buildCredentialEvidenceRows(
  apiKeys: PartnerApiKeyApiResponse[],
): PartnerEvidenceRow[] {
  if (!apiKeys.length) {
    return [
      withPartnerEvidenceSearchText({
        id: "credential-missing",
        kind: "credential",
        laneLabel: "Credential",
        title: "Partner API key",
        subject: "No scoped key",
        sourceLabel: "Partner API key",
        stateLabel: "Needs key",
        tone: "attention",
        evidenceBasis:
          "No partner credential is ready for endpoint smoke tests or handoff.",
        observedLabel: "Unavailable",
        nextStep: "Create a scoped partner API key for the launch packet.",
        rawFacts: [
          { label: "Active keys", value: "0" },
          { label: "Required scopes", value: requiredPartnerReadinessScopes.join(", ") },
        ],
      }),
    ];
  }

  return apiKeys.map((apiKey) => {
    const active = isPartnerApiKeyActive(apiKey);
    const missingScopes = getMissingRequiredPartnerScopes([apiKey]);
    const hasScopeGap = missingScopes.length > 0;
    const districtLabel = apiKey.allowedDistricts.length
      ? apiKey.allowedDistricts.join(", ")
      : "All districts";
    const stateLabel = !active ? "Inactive" : hasScopeGap ? "Scope gap" : "Ready";
    const tone: PartnerReadinessMetric["tone"] =
      !active || hasScopeGap ? "attention" : "clear";

    return withPartnerEvidenceSearchText({
      id: `credential-${apiKey.id}`,
      kind: "credential",
      laneLabel: "Credential",
      title: apiKey.name,
      subject: `${apiKey.keyPrefix} / ${formatLabel(apiKey.environment)}`,
      sourceLabel: "Partner API key",
      stateLabel,
      tone,
      evidenceBasis: hasScopeGap
        ? `Scope gap: missing ${missingScopes.join(", ")}.`
        : "Credential covers the required partner read scopes without exposing plaintext secrets.",
      observedLabel: formatDateTime(apiKey.updatedAt ?? apiKey.createdAt),
      nextStep: active
        ? "Rotate or revoke this key only if ownership, scope, or expiry changes before launch."
        : "Create or restore an active scoped credential before partner handoff.",
      rawFacts: [
        { label: "Prefix", value: apiKey.keyPrefix },
        { label: "Environment", value: formatLabel(apiKey.environment) },
        { label: "Scopes", value: apiKey.scopes.join(", ") || "No scopes recorded" },
        { label: "Districts", value: districtLabel },
        { label: "Expiry", value: formatDateTime(apiKey.expiresAt) },
      ],
    });
  });
}

function buildContractEvidenceRow({
  activeKeysCoverRequiredScopes,
  missingScopes,
}: {
  activeKeysCoverRequiredScopes: boolean;
  missingScopes: string[];
}) {
  return withPartnerEvidenceSearchText({
    id: "contract-required-scopes",
    kind: "contract",
    laneLabel: "Contract",
    title: "Endpoint contract",
    subject: "Clinics, status, alternatives, and exports",
    sourceLabel: "Partner API contract",
    stateLabel: activeKeysCoverRequiredScopes ? "Covered" : "Scope gap",
    tone: activeKeysCoverRequiredScopes ? "clear" : "attention",
    evidenceBasis: activeKeysCoverRequiredScopes
      ? "Active credential scope covers each endpoint family needed for the partner handoff."
      : `Scope gap: missing ${missingScopes.join(", ")}.`,
    observedLabel: "Launch packet",
    nextStep: activeKeysCoverRequiredScopes
      ? "Share the endpoint contract with the current credential prefix in the handoff packet."
      : "Create a credential that covers every required partner endpoint before smoke testing.",
    rawFacts: [
      { label: "Required scopes", value: requiredPartnerReadinessScopes.join(", ") },
      {
        label: "Endpoint families",
        value: "clinics, current status, alternatives, export packages",
      },
    ],
  });
}

function buildDeliveryEvidenceRows({
  subscriptions,
  events,
}: {
  subscriptions: PartnerWebhookSubscriptionApiResponse[];
  events: PartnerWebhookEventApiResponse[];
}) {
  const rows: PartnerEvidenceRow[] = subscriptions.length
    ? subscriptions.map((subscription) => {
        const active = isActiveWebhook(subscription);
        const hasFailure = Boolean(subscription.lastError);
        const tone: PartnerReadinessMetric["tone"] = hasFailure
          ? "attention"
          : active
            ? "clear"
            : "watch";

        return withPartnerEvidenceSearchText({
          id: `delivery-subscription-${subscription.id}`,
          kind: "delivery",
          laneLabel: "Delivery",
          title: subscription.name,
          subject: subscription.targetUrl,
          sourceLabel: "Webhook destination",
          stateLabel: hasFailure ? "Needs review" : formatLabel(subscription.status),
          tone,
          evidenceBasis: subscription.lastError
            ? subscription.lastError
            : "Destination, event topics, and last test metadata are available for partner verification.",
          observedLabel: formatDateTime(subscription.updatedAt),
          nextStep: active
            ? "Send a test event with the partner present before go-live."
            : "Activate the webhook receiver before launch testing.",
          rawFacts: [
            { label: "Target URL", value: subscription.targetUrl },
            {
              label: "Event types",
              value: subscription.eventTypes.join(", ") || "No event types recorded",
            },
            { label: "Last test", value: formatLabel(subscription.lastTestStatus) },
            {
              label: "Last test metadata",
              value: compactRecord(subscription.lastTestMetadata),
            },
          ],
        });
      })
    : [
        withPartnerEvidenceSearchText({
          id: "delivery-missing",
          kind: "delivery",
          laneLabel: "Delivery",
          title: "Webhook destination",
          subject: "No active receiver",
          sourceLabel: "Webhook destination",
          stateLabel: "Needs receiver",
          tone: "attention",
          evidenceBasis:
            "No partner destination is ready for event delivery testing.",
          observedLabel: "Unavailable",
          nextStep: "Create a webhook destination before sending test events.",
          rawFacts: [
            { label: "Subscriptions", value: "0" },
            { label: "Events", value: formatCount(events.length) },
          ],
        }),
      ];

  return rows.concat(
    events.map((event) =>
      withPartnerEvidenceSearchText({
        id: `delivery-event-${event.id}`,
        kind: "delivery",
        laneLabel: "Delivery",
        title: formatLabel(event.eventType),
        subject: `Subscription ${event.subscriptionId}`,
        sourceLabel: "Webhook event",
        stateLabel: formatLabel(event.status),
        tone: getStatusTone(event.status),
        evidenceBasis: event.lastError
          ? event.lastError
          : `Delivery metadata: ${compactRecord(event.metadata)}.`,
        observedLabel: formatDateTime(event.deliveredAt ?? event.createdAt),
        nextStep:
          "Open the delivery evidence when response metadata, retry behavior, or payload context needs review.",
        rawFacts: [
          { label: "Event type", value: event.eventType },
          { label: "Status", value: formatLabel(event.status) },
          { label: "Attempts", value: formatAttemptCount(event.attemptCount) },
        ],
      }),
    ),
  );
}

function buildExportEvidenceRow(exportRun?: PartnerReadinessApiResponse["exportRuns"][number]) {
  if (!exportRun) {
    return withPartnerEvidenceSearchText({
      id: "export-missing",
      kind: "export",
      laneLabel: "Export",
      title: "Export package",
      subject: "No package generated",
      sourceLabel: "Partner export",
      stateLabel: "Missing export",
      tone: "attention",
      evidenceBasis:
        "The launch packet does not yet include a checksum-backed export package.",
      observedLabel: "Unavailable",
      nextStep: "Generate a partner export package after source freshness is reviewed.",
      rawFacts: [
        { label: "Packages", value: "0" },
        { label: "Checksum", value: "Unavailable" },
      ],
    });
  }

  return withPartnerEvidenceSearchText({
    id: `export-${exportRun.id}`,
    kind: "export",
    laneLabel: "Export",
    title: `${exportRun.format.toUpperCase()} export package`,
    subject: exportRun.checksum,
    sourceLabel: "Partner export",
    stateLabel: "Ready",
    tone: "clear",
    evidenceBasis:
      "Checksum-backed export package is available for partner handoff and source freshness review.",
    observedLabel: formatDateTime(exportRun.createdAt),
    nextStep: "Share the checksum with the partner and regenerate if clinic status freshness changes.",
    rawFacts: [
      { label: "Format", value: exportRun.format.toUpperCase() },
      { label: "Checksum", value: exportRun.checksum },
      { label: "Scope", value: compactRecord(exportRun.scope) },
      { label: "Record counts", value: compactRecord(exportRun.recordCounts) },
    ],
  });
}

function buildCheckEvidenceRows(checks: IntegrationStatusCheckApiResponse[]) {
  if (!checks.length) {
    return [
      withPartnerEvidenceSearchText({
        id: "check-missing",
        kind: "check",
        laneLabel: "Check",
        title: "Integration checks",
        subject: "No checks reported",
        sourceLabel: "Readiness check",
        stateLabel: "No checks",
        tone: "attention",
        evidenceBasis:
          "No readiness check evidence has been recorded for the launch packet.",
        observedLabel: "Unavailable",
        nextStep: "Run partner readiness checks before handoff.",
        rawFacts: [{ label: "Checks", value: "0" }],
      }),
    ];
  }

  return checks.map((check, index) =>
    withPartnerEvidenceSearchText({
      id: `check-${check.id}-${index}`,
      kind: "check",
      laneLabel: "Check",
      title: formatLabel(check.checkName),
      subject: check.summary,
      sourceLabel: "Readiness check",
      stateLabel: formatLabel(check.status),
      tone: toneForCheckStatus(check.status),
      evidenceBasis: check.summary,
      observedLabel: formatDateTime(check.checkedAt),
      nextStep:
        getCheckStatus(check) === "passing"
          ? "Keep this check in the launch packet as supporting evidence."
          : "Resolve this check before the partner readiness decision is promoted.",
      rawFacts: [
        { label: "Check", value: check.checkName },
        { label: "Status", value: formatLabel(check.status) },
        { label: "Metadata", value: compactRecord(check.metadata) },
      ],
    }),
  );
}

function buildActionQueue({
  activeKeysCoverRequiredScopes,
  activeSubscriptions,
  hasRecordedWebhookTest,
  latestExport,
}: {
  activeKeysCoverRequiredScopes: boolean;
  activeSubscriptions: PartnerWebhookSubscriptionApiResponse[];
  hasRecordedWebhookTest: boolean;
  latestExport?: PartnerReadinessApiResponse["exportRuns"][number];
}): PartnerActionQueueItem[] {
  return [
    {
      id: "create-key",
      label: activeKeysCoverRequiredScopes
        ? "Scoped API key ready"
        : "Create scoped API key",
      summary: activeKeysCoverRequiredScopes
        ? "Credential scope covers partner read access."
        : "Issue a credential with clinic, status, alternatives, and export scopes.",
      detail: activeKeysCoverRequiredScopes
        ? "Use rotation only if ownership or scope changes before launch."
        : "Needed before endpoint smoke tests or partner handoff.",
      tone: activeKeysCoverRequiredScopes ? "clear" : "attention",
      action: "create-key",
    },
    {
      id: "create-webhook",
      label: activeSubscriptions.length > 0
        ? "Webhook receiver active"
        : "Create webhook receiver",
      summary: activeSubscriptions.length > 0
        ? `${formatCount(activeSubscriptions.length)} active receiver ready for testing.`
        : "Create a partner destination before event delivery testing.",
      detail: activeSubscriptions.length > 0
        ? "Confirm ownership with the partner before go-live."
        : "Required for status-change and export-ready delivery evidence.",
      tone: activeSubscriptions.length > 0 ? "clear" : "attention",
      action: "create-webhook",
    },
    {
      id: "generate-export",
      label: latestExport ? "Export package ready" : "Generate export package",
      summary: latestExport
        ? "Checksum-backed package is available for the handoff packet."
        : "Generate a partner package after source freshness review.",
      detail: latestExport
        ? latestExport.checksum
        : "Needed before the partner can reconcile clinic and status data.",
      tone: latestExport ? "clear" : "attention",
      action: "generate-export",
    },
    {
      id: "test-webhook",
      label: hasRecordedWebhookTest ? "Test event recorded" : "Send test event",
      summary: hasRecordedWebhookTest
        ? "Delivery evidence is available in the launch packet."
        : "Send a preview event so the partner can verify receiver handling.",
      detail: activeSubscriptions.length > 0
        ? "Use the active receiver selected in the delivery console."
        : "Create a receiver before a test event can be sent.",
      tone: hasRecordedWebhookTest
        ? "clear"
        : activeSubscriptions.length > 0
          ? "watch"
          : "attention",
      action: "test-webhook",
    },
  ];
}

function buildPartnerEvidenceRows({
  readiness,
  activeKeysCoverRequiredScopes,
  missingScopes,
  latestExport,
}: {
  readiness: PartnerReadinessApiResponse;
  activeKeysCoverRequiredScopes: boolean;
  missingScopes: string[];
  latestExport?: PartnerReadinessApiResponse["exportRuns"][number];
}) {
  return [
    ...buildCredentialEvidenceRows(readiness.apiKeys),
    buildContractEvidenceRow({ activeKeysCoverRequiredScopes, missingScopes }),
    ...buildDeliveryEvidenceRows({
      subscriptions: readiness.webhookSubscriptions,
      events: readiness.webhookEvents,
    }),
    buildExportEvidenceRow(latestExport),
    ...buildCheckEvidenceRows(readiness.integrationChecks),
  ].sort(comparePartnerEvidenceRows);
}

function comparePartnerEvidenceRows(a: PartnerEvidenceRow, b: PartnerEvidenceRow) {
  return rowPriority(a) - rowPriority(b);
}

function rowPriority(row: PartnerEvidenceRow) {
  if (row.tone === "attention") return 0;
  if (row.tone === "watch") return 1;
  if (row.kind === "credential") return 2;
  if (row.kind === "contract") return 3;
  if (row.kind === "delivery") return 4;
  if (row.kind === "export") return 5;
  return 6;
}

export function getDefaultPartnerEvidenceRowId(rows: PartnerEvidenceRow[]) {
  return (
    rows.find((row) => row.tone === "attention" || row.tone === "watch")?.id ??
    rows[0]?.id ??
    null
  );
}

export function filterPartnerEvidenceRows(
  rows: PartnerEvidenceRow[],
  {
    activeKind,
    stateFilter,
    query,
  }: {
    activeKind: PartnerEvidenceKindFilter;
    stateFilter: PartnerEvidenceStateFilter;
    query: string;
  },
) {
  const normalizedQuery = query.trim().toLowerCase();

  return rows.filter((row) => {
    const kindMatches = activeKind === "all" || row.kind === activeKind;
    const stateMatches =
      stateFilter === "all" ||
      (stateFilter === "needs-review" && row.tone === "attention") ||
      (stateFilter === "ready" && row.tone === "clear") ||
      row.tone === stateFilter;
    const queryMatches = !normalizedQuery || row.searchText.includes(normalizedQuery);

    return kindMatches && stateMatches && queryMatches;
  });
}

const eventCatalog: PartnerEventCatalogItem[] = [
  {
    eventType: "clinic.status_changed",
    source: "Clinic status workflow",
    purpose: "Notify partners when a clinic status changes.",
  },
  {
    eventType: "partner.export_ready",
    source: "Partner export workflow",
    purpose: "Signal that a fresh handoff package is ready to inspect.",
  },
  {
    eventType: "integration.check.updated",
    source: "Partner integration checks",
    purpose: "Expose readiness check changes before partner go-live.",
  },
  {
    eventType: "clinicpulse.webhook_test",
    source: "Webhook test action",
    purpose: "Send a safe preview event to validate receiver configuration.",
  },
];

const sourceReferences: PartnerSourceReference[] = [
  {
    source: "Cal.com connector setup",
    href: "https://github.com/calcom/cal.diy",
    sourcePath: "apps/web/components/apps/btcpayserver/Setup.tsx",
    role:
      "Validates partner credentials and provisions webhook configuration before a connector can be promoted.",
    licenseUse: "adaptable",
  },
  {
    source: "Trigger.dev run controls",
    href: "https://github.com/triggerdotdev/trigger.dev",
    sourcePath: "apps/webapp/app/components/runs/v3/ReplayRunDialog.tsx",
    role:
      "Shapes launch actions as replayable controls with payload, metadata, environment, and submit-state context.",
    licenseUse: "adaptable",
  },
  {
    source: "Unkey key verification logs",
    href: "https://github.com/unkeyed/unkey",
    sourcePath:
      "web/apps/dashboard/components/api-requests-table/components/log-details/components/roles-permissions.tsx",
    role:
      "Uses credential permissions and copy-ready facts as a reference for partner API key troubleshooting.",
    licenseUse: "reference-only",
  },
  {
    source: "Infisical Permission Audit",
    href: "https://github.com/Infisical/infisical",
    sourcePath: "frontend/src/views/PermissionAuditSheet/PermissionAuditSheet.tsx",
    role:
      "Informs the searchable effective-access review pattern for scoped credentials and launch blockers.",
    licenseUse: "adaptable",
  },
  {
    source: "Dub activity metadata",
    href: "https://github.com/dubinc/dub",
    sourcePath: "apps/web/ui/analytics/events/metadata-viewer.tsx",
    role:
      "Provides a reference-only pattern for compact event metadata previews with copyable raw evidence.",
    licenseUse: "reference-only",
  },
];

export function buildPartnerLaunchCockpitModel(
  readiness: PartnerReadinessApiResponse,
): PartnerLaunchCockpitModel {
  const activeApiKeys = readiness.apiKeys.filter((apiKey) =>
    isPartnerApiKeyActive(apiKey),
  );
  const missingScopes = getMissingRequiredPartnerScopes(activeApiKeys);
  const activeKeyCount = activeApiKeys.length;
  const activeKeysCoverRequiredScopes = missingScopes.length === 0;
  const latestApiKey = latestCreatedAt(activeApiKeys);
  const latestExport = latestCreatedAt(readiness.exportRuns);
  const activeSubscriptions = readiness.webhookSubscriptions.filter(isActiveWebhook);
  const latestWebhookEvent = latestCreatedAt(readiness.webhookEvents);
  const hasRecordedWebhookTest = hasWebhookTest(readiness);
  const failingCheckCount = readiness.integrationChecks.filter(
    (check) => getCheckStatus(check) === "failing",
  ).length;
  const attentionCheckCount = readiness.integrationChecks.filter(
    (check) => getCheckStatus(check) === "attention",
  ).length;
  const passingCheckCount = readiness.integrationChecks.filter(
    (check) => getCheckStatus(check) === "passing",
  ).length;

  const accessGate: PartnerLaunchGate =
    activeKeyCount === 0
      ? {
          id: "access",
          label: "Access",
          status: "No key",
          summary: "Create a scoped partner API key before handoff.",
          detail: `${formatCount(readiness.apiKeys.length)} total credentials`,
          tone: "attention",
        }
      : activeKeysCoverRequiredScopes
        ? {
            id: "access",
            label: "Access",
            status: "Ready",
            summary: "Active partner credential covers required read scopes.",
            detail: `${formatCount(activeKeyCount)} active keys`,
            tone: "clear",
          }
        : {
            id: "access",
            label: "Access",
            status: "Scope gap",
            summary: `Missing ${missingScopes.join(", ")}`,
            detail: `${formatCount(activeKeyCount)} active keys`,
            tone: "attention",
          };

  const contractGate: PartnerLaunchGate = activeKeysCoverRequiredScopes
    ? {
        id: "contract",
        label: "Contract",
        status: "Covered",
        summary: "Partner endpoint contract is covered by active scopes.",
        detail: `${formatCount(requiredPartnerReadinessScopes.length)} endpoint scopes`,
        tone: "clear",
      }
    : {
        id: "contract",
        label: "Contract",
        status: "Missing scope",
        summary: "Endpoint smoke tests need a credential with every required scope.",
        detail: `${formatCount(missingScopes.length)} missing scopes`,
        tone: "attention",
      };

  const deliveryGate: PartnerLaunchGate =
    activeSubscriptions.length === 0
      ? {
          id: "delivery",
          label: "Delivery",
          status: "No receiver",
          summary: "Create an active webhook receiver before partner go-live.",
          detail: `${formatCount(readiness.webhookSubscriptions.length)} subscriptions`,
          tone: "attention",
        }
      : hasRecordedWebhookTest
        ? {
            id: "delivery",
            label: "Delivery",
            status: "Ready",
            summary: "Webhook receiver and delivery evidence are recorded.",
            detail: latestWebhookEvent
              ? `${latestWebhookEvent.eventType} / ${latestWebhookEvent.status}`
              : `${formatCount(activeSubscriptions.length)} active subscriptions`,
            tone: "clear",
          }
        : {
            id: "delivery",
            label: "Delivery",
            status: "Needs test",
            summary: "Send a test event so the partner can verify receiver handling.",
            detail: `${formatCount(activeSubscriptions.length)} active subscriptions`,
            tone: "watch",
          };

  const operationsGate: PartnerLaunchGate = !latestExport
    ? {
        id: "operations",
        label: "Operations",
        status: "Missing export",
        summary: "Generate a partner export package before handoff.",
        detail: `${formatCount(readiness.integrationChecks.length)} checks reported`,
        tone: "attention",
      }
    : failingCheckCount > 0
      ? {
          id: "operations",
          label: "Operations",
          status: "Failing",
          summary: `${formatCount(failingCheckCount)} integration checks are failing.`,
          detail: `${formatCount(passingCheckCount)} passing checks`,
          tone: "attention",
        }
      : attentionCheckCount > 0
        ? {
            id: "operations",
            label: "Operations",
            status: "Watch",
            summary: `${formatCount(attentionCheckCount)} integration checks need review.`,
            detail: `${formatCount(passingCheckCount)} passing checks`,
            tone: "watch",
          }
        : {
            id: "operations",
            label: "Operations",
            status: "Ready",
            summary: "Export package and integration checks are ready for handoff.",
            detail: latestExport.checksum,
            tone: "clear",
          };

  const handoffItems: PartnerHandoffPacketItem[] = [
    {
      label: "API credential",
      value: latestApiKey?.keyPrefix ?? "Not created",
      detail: activeKeysCoverRequiredScopes
        ? `${formatCount(requiredPartnerReadinessScopes.length)} required scopes covered`
        : "Required scopes are not fully covered",
      tone: accessGate.tone,
    },
    {
      label: "Endpoint contract",
      value: `${formatCount(requiredPartnerReadinessScopes.length)} scopes`,
      detail: "Clinics, status, alternatives, and export endpoints",
      tone: contractGate.tone,
    },
    {
      label: "Webhook evidence",
      value: latestWebhookEvent?.eventType ?? "No event",
      detail: latestWebhookEvent
        ? `${latestWebhookEvent.status} / ${formatAttemptCount(
            latestWebhookEvent.attemptCount,
          )}`
        : "No delivery evidence recorded",
      tone: deliveryGate.tone,
    },
    {
      label: "Export checksum",
      value: latestExport?.checksum ?? "No export",
      detail: latestExport
        ? `${latestExport.format.toUpperCase()} package`
        : "Generate an export package",
      tone: operationsGate.tone,
    },
  ];

  const blockingGateCount = [
    accessGate,
    contractGate,
    deliveryGate,
    operationsGate,
  ].filter((gate) => gate.tone === "attention").length;
  const watchGateCount = [
    accessGate,
    contractGate,
    deliveryGate,
    operationsGate,
  ].filter((gate) => gate.tone === "watch").length;
  const handoffTone =
    blockingGateCount > 0 ? "attention" : watchGateCount > 0 ? "watch" : "clear";

  return {
    gates: [accessGate, contractGate, deliveryGate, operationsGate],
    handoffPacket: {
      title: "Handoff packet",
      status:
        handoffTone === "clear"
          ? "Ready"
          : handoffTone === "watch"
            ? "Review"
            : "Blocked",
      summary:
        handoffTone === "clear"
          ? "Credential, endpoint contract, webhook evidence, and export checksum are ready."
          : "Resolve readiness gaps before handing this integration to a partner.",
      tone: handoffTone,
      items: handoffItems,
    },
    deliveryRows: buildDeliveryRows(
      readiness.webhookEvents,
      readiness.webhookSubscriptions,
    ),
    eventCatalog,
    evidenceRows: buildPartnerEvidenceRows({
      readiness,
      activeKeysCoverRequiredScopes,
      missingScopes,
      latestExport,
    }),
    actionQueue: buildActionQueue({
      activeKeysCoverRequiredScopes,
      activeSubscriptions,
      hasRecordedWebhookTest,
      latestExport,
    }),
    sourceReferences,
  };
}

export function buildPartnerReadinessModel(
  readiness: PartnerReadinessApiResponse,
): PartnerReadinessModel {
  const activeApiKeys = readiness.apiKeys.filter((apiKey) =>
    isPartnerApiKeyActive(apiKey),
  );
  const inactiveApiKeyCount = readiness.apiKeys.length - activeApiKeys.length;
  const activeKeysCoverRequiredScopes = activeApiKeysCoverRequiredScopes(activeApiKeys);
  const hasActiveApiKey = activeApiKeys.length > 0 && activeKeysCoverRequiredScopes;
  const hasExportPackage = readiness.exportRuns.length > 0;
  const webhookTestCount = readiness.webhookEvents.length;
  const hasRecordedWebhookTest = hasWebhookTest(readiness);
  const failingCheckCount = readiness.integrationChecks.filter(
    (check) => getCheckStatus(check) === "failing",
  ).length;
  const attentionCheckCount = readiness.integrationChecks.filter(
    (check) => getCheckStatus(check) === "attention",
  ).length;
  const passingCheckCount = readiness.integrationChecks.filter(
    (check) => getCheckStatus(check) === "passing",
  ).length;

  let severity: PartnerReadinessSeverity = "clear";
  if (!hasActiveApiKey || !hasExportPackage || failingCheckCount > 0) {
    severity = "attention";
  } else if (attentionCheckCount > 0 || !hasRecordedWebhookTest) {
    severity = "watch";
  }

  const statusCopy = {
    clear: {
      title: "Partner readiness clear",
      description:
        "Partner API access, export handoff, webhook preview, and integration checks are ready.",
    },
    watch: {
      title: "Partner readiness watch",
      description:
        "Webhook preview or attention check evidence needs review before partner handoff.",
    },
    attention: {
      title: "Integration checks need attention",
      description:
        "Partner API access, export handoff, or integration health needs review before handoff.",
    },
  } satisfies Record<
    PartnerReadinessSeverity,
    { title: string; description: string }
  >;

  return {
    severity,
    title: statusCopy[severity].title,
    description: statusCopy[severity].description,
    metrics: [
      {
        label: "API keys",
        value: formatCount(activeApiKeys.length),
        detail:
          activeApiKeys.length > 0 && !activeKeysCoverRequiredScopes
            ? "Missing required scopes"
            : inactiveApiKeyCount > 0
              ? `${formatCount(inactiveApiKeyCount)} inactive`
              : `${formatCount(readiness.apiKeys.length)} total`,
        tone: hasActiveApiKey ? "clear" : "attention",
      },
      {
        label: "Export packages",
        value: formatCount(readiness.exportRuns.length),
        detail: hasExportPackage ? "Latest export available" : "No export generated",
        tone: hasExportPackage ? "clear" : "attention",
      },
      {
        label: "Webhook previews",
        value: formatCount(webhookTestCount),
        detail: hasRecordedWebhookTest ? "Test evidence recorded" : "No test recorded",
        tone: hasRecordedWebhookTest ? "clear" : "watch",
      },
      {
        label: "Integration checks",
        value: `${formatCount(passingCheckCount)} / ${formatCount(
          readiness.integrationChecks.length,
        )}`,
        detail:
          failingCheckCount > 0
            ? `${formatCount(failingCheckCount)} failing`
            : `${formatCount(attentionCheckCount)} attention`,
        tone: getIntegrationCheckTone(readiness.integrationChecks),
      },
    ],
  };
}
