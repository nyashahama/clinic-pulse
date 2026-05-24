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

export type PartnerReadinessReference = {
  name: string;
  url: string;
  source: string;
  appliedTo: string;
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
  references: PartnerReadinessReference[];
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

const partnerReadinessReferences: PartnerReadinessReference[] = [
  {
    name: "Hookdeck Outpost",
    url: "https://hookdeck.com/docs/outpost/overview",
    source: "Hookdeck Outpost docs",
    appliedTo: "Outbound event destinations, topics, retries, and delivery health",
  },
  {
    name: "Svix App Portal",
    url: "https://docs.svix.com/app-portal",
    source: "Svix App Portal docs",
    appliedTo: "Partner self-service endpoint and replay/debugging expectations",
  },
  {
    name: "Dub Webhooks",
    url: "https://dub.co/docs/webhooks/introduction",
    source:
      "reference-projects/dub/apps/web/ui/modals/send-test-webhook-modal.tsx",
    appliedTo: "Webhook test event action and delivery console CTA",
  },
  {
    name: "Trigger.dev Runs",
    url: "https://trigger.dev/docs/runs",
    source:
      "reference-projects/trigger.dev/apps/webapp/app/components/runs/v3/TaskRunsTable.tsx",
    appliedTo: "Run-style delivery rows with status, attempts, and timestamps",
  },
  {
    name: "Infisical Audit Logs",
    url: "https://infisical.com/docs/documentation/getting-started/concepts/audit-logs",
    source:
      "reference-projects/infisical/frontend/src/pages/organization/AuditLogsPage/components/LogsTable.tsx",
    appliedTo: "Timestamped evidence history and empty-state treatment",
  },
  {
    name: "Appwrite Webhooks",
    url: "https://appwrite.io/docs/advanced/platform/webhooks",
    source: "Appwrite webhook docs",
    appliedTo: "Webhook configuration and event subscription framing",
  },
  {
    name: "Unkey Permissions",
    url: "https://www.unkey.com/docs/platform/root-keys/permissions",
    source: "Unkey permissions docs",
    appliedTo: "Credential scope clarity and least-privilege language",
  },
  {
    name: "Scalar API References",
    url: "https://scalar.com/products/api-references/getting-started",
    source: "Scalar API reference docs",
    appliedTo: "API contract handoff reference posture",
  },
  {
    name: "Standard Webhooks",
    url: "https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md",
    source: "Standard Webhooks specification",
    appliedTo: "Webhook signature and receiver interoperability language",
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
    references: partnerReadinessReferences,
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
