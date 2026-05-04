import type {
  CreatePartnerApiKeyApiResponse,
  CreatePartnerWebhookApiResponse,
  IntegrationStatusCheckApiResponse,
  PartnerApiKeyApiResponse,
  PartnerReadinessApiResponse,
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
  const covered = new Set<string>();
  for (const apiKey of apiKeys) {
    for (const scope of apiKey.scopes) {
      covered.add(scope.trim());
    }
  }

  return requiredPartnerReadinessScopes.every((scope) => covered.has(scope));
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
      title: "Partner readiness needs setup",
      description:
        "Partner API access, export handoff, or integration health is not ready for handoff.",
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
