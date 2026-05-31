import type {
  IntegrationStatusCheckApiResponse,
  PartnerApiKeyApiResponse,
  PartnerExportRunApiResponse,
  PartnerWebhookEventApiResponse,
  PartnerWebhookSubscriptionApiResponse,
} from "@/lib/demo/api-types";
import { isPartnerApiKeyActive } from "@/lib/demo/partner-readiness";
import type {
  EvidenceCommandChip,
  EvidenceCommandDecision,
  EvidenceCommandField,
  EvidenceCommandMetric,
  EvidenceCommandSection,
  EvidenceCommandTimelineItem,
  EvidenceCommandTone,
} from "@/lib/product/evidence-command";
import {
  compactIntegrationRecord,
  formatIntegrationDateTime,
  formatIntegrationLabel,
} from "@/lib/product/integration-operations";

export type IntegrationDetailJsonBlock = {
  title: string;
  value: unknown;
};

export type IntegrationDetailCaseBrief = {
  title: string;
  description: string;
  summary: EvidenceCommandField;
  primaryFields: EvidenceCommandField[];
  sections: EvidenceCommandSection[];
};

export type IntegrationDetailModel = {
  eyebrow: string;
  title: string;
  description: string;
  contextItems: string[];
  chips: EvidenceCommandChip[];
  metrics: EvidenceCommandMetric[];
  caseBrief: IntegrationDetailCaseBrief;
  decision: EvidenceCommandDecision;
  timeline: {
    title: string;
    description: string;
    items: EvidenceCommandTimelineItem[];
  };
  jsonBlocks: IntegrationDetailJsonBlock[];
};

type SharedInput = {
  returnHref: string;
};

type BuildIntegrationDetailInput =
  | (SharedInput & {
      kind: "api-key";
      apiKey: PartnerApiKeyApiResponse;
      now?: Date;
    })
  | (SharedInput & {
      kind: "webhook-subscription";
      subscription: PartnerWebhookSubscriptionApiResponse;
    })
  | (SharedInput & {
      kind: "webhook-event";
      event: PartnerWebhookEventApiResponse;
      subscription?: PartnerWebhookSubscriptionApiResponse;
    })
  | (SharedInput & {
      kind: "export-run";
      exportRun: PartnerExportRunApiResponse;
      requesterLabel: string;
    })
  | (SharedInput & {
      kind: "integration-check";
      check: IntegrationStatusCheckApiResponse;
    });

type EvidenceState = {
  label: string;
  tone: EvidenceCommandTone;
  title: string;
  basis: string;
  nextStep: string;
  impact: string;
  verification: string;
};

const numberFormatter = new Intl.NumberFormat("en-ZA");

function formatList(values: string[]) {
  if (!values.length) {
    return "All";
  }

  return values.map(formatIntegrationLabel).join(", ");
}

function formatCount(value: number) {
  return numberFormatter.format(value);
}

function organisationLabel(value?: number | null) {
  return value ? `Organisation ${value}` : "Platform";
}

function totalRecordCount(value: Record<string, unknown>) {
  const total = Object.values(value).reduce<number>((sum, entry) => {
    const count = typeof entry === "number" ? entry : Number(entry);
    return Number.isFinite(count) ? sum + count : sum;
  }, 0);

  return total > 0 ? formatCount(total) : "Unavailable";
}

function apiKeyState(apiKey: PartnerApiKeyApiResponse, now: Date): EvidenceState {
  if (apiKey.revokedAt) {
    return {
      label: "Revoked",
      tone: "critical",
      title: "Credential cannot support handoff",
      basis: "This partner credential is revoked and cannot authenticate partner API requests.",
      nextStep: "Create or rotate to an active partner credential before the next handoff.",
      impact:
        "A revoked credential turns endpoint coverage into unusable evidence for the partner team.",
      verification: "Confirm the replacement key covers the required endpoint scopes.",
    };
  }

  if (!isPartnerApiKeyActive(apiKey, now)) {
    return {
      label: "Review",
      tone: "attention",
      title: "Credential expiry needs review",
      basis: "The credential is expired or its expiry cannot be trusted.",
      nextStep: "Rotate the partner key or correct the expiry before relying on it.",
      impact:
        "Partner validation may fail even when the surrounding integration evidence looks ready.",
      verification: "Check expiry, last-used evidence, and the intended handoff window.",
    };
  }

  return {
    label: "Active",
    tone: "stable",
    title: "Credential ready for endpoint validation",
    basis: "This credential is active and available for partner API smoke tests.",
    nextStep: "Keep monitoring last-used activity and rotate it on schedule.",
    impact:
      "An active key lets partner engineers validate endpoint coverage without blocking on access.",
    verification: "Confirm scopes, allowed districts, and the last-used source before handoff.",
  };
}

function webhookState(status?: string | null, error?: string | null): EvidenceState {
  const normalized = status?.trim().toLowerCase() ?? "";

  if (error || normalized.includes("fail") || normalized.includes("disabled")) {
    return {
      label: "Failed",
      tone: "attention",
      title: "Receiver evidence needs replay",
      basis: error ?? "The last webhook status shows a receiver failure.",
      nextStep: "Validate the partner receiver and capture a fresh successful delivery test.",
      impact:
        "Delivery failures mean partners may miss clinic-status changes even if API access works.",
      verification: "Compare target URL, event type, attempts, and receiver response metadata.",
    };
  }

  if (normalized.includes("delivered") || normalized.includes("active")) {
    return {
      label: normalized.includes("delivered") ? "Delivered" : "Active",
      tone: "stable",
      title: "Receiver evidence is ready",
      basis: "Webhook delivery evidence is linked to a configured partner receiver.",
      nextStep: "Keep this receiver in the operational monitoring rotation.",
      impact:
        "Partners have a live event path for clinic-status changes and delivery diagnostics.",
      verification: "Confirm event coverage, target URL, and the most recent delivery metadata.",
    };
  }

  if (normalized.includes("preview")) {
    return {
      label: "Preview",
      tone: "info",
      title: "Preview evidence needs live validation",
      basis: "This webhook evidence has not reached a live receiver yet.",
      nextStep: "Run a receiver test before treating this event path as launch-ready.",
      impact:
        "Preview-only delivery can hide receiver configuration errors until partner launch.",
      verification: "Capture a tested receiver response and link it back to this record.",
    };
  }

  return {
    label: "Review",
    tone: "attention",
    title: "Receiver state needs review",
    basis: "Webhook state is not clear enough for an operational handoff.",
    nextStep: "Open the source evidence and capture a fresh receiver test.",
    impact:
      "Unclear delivery state makes the partner handoff harder to verify under pressure.",
    verification: "Check status, error text, target URL, and delivery metadata together.",
  };
}

function checkState(status: string): EvidenceState {
  const normalized = status.trim().toLowerCase();

  if (normalized === "passing") {
    return {
      label: "Passing",
      tone: "stable",
      title: "Integration check is passing",
      basis: "The latest integration check is clear.",
      nextStep: "Keep this check in the operational evidence trail.",
      impact:
        "A passing check reduces launch uncertainty for the partner integration surface.",
      verification: "Confirm the checked timestamp and metadata match the current handoff.",
    };
  }

  if (normalized === "failing") {
    return {
      label: "Failing",
      tone: "critical",
      title: "Integration check blocks handoff",
      basis: "The latest integration check is failing.",
      nextStep: "Resolve the failing condition before partner handoff.",
      impact:
        "A failing check can make partner access, delivery, or export proof unreliable.",
      verification: "Use the metadata and checked timestamp to reproduce the failure.",
    };
  }

  return {
    label: "Review",
    tone: "attention",
    title: "Integration check needs review",
    basis: "The latest integration check is not definitively passing.",
    nextStep: "Confirm the check outcome and update the evidence trail.",
    impact:
      "Ambiguous integration checks slow down partner readiness decisions.",
    verification: "Review the summary, metadata, and check timestamp together.",
  };
}

function buildDecision({
  chips,
  returnHref,
  scoreLabel,
  scoreValue,
  state,
}: {
  chips: EvidenceCommandChip[];
  returnHref: string;
  scoreLabel: string;
  scoreValue: string;
  state: EvidenceState;
}): EvidenceCommandDecision {
  return {
    contextLabel: "Partner evidence",
    title: state.title,
    scoreLabel,
    scoreValue,
    chips,
    nextStep: state.nextStep,
    nextStepTone: state.tone,
    impactTitle: "Partner handoff impact",
    impact: state.impact,
    verificationTitle: "Verification",
    verification: state.verification,
    evidence: {
      label: state.basis,
      detail: scoreValue,
      tone: state.tone,
    },
    actions: [
      {
        label: "Review integration queue",
        href: returnHref,
        priority: "primary",
        icon: "queue",
      },
      {
        label: "Open partner readiness",
        href: "/admin/partner-readiness",
        priority: "secondary",
        icon: "stream",
      },
    ],
  };
}

function buildApiKeyDetailModel({
  apiKey,
  now,
  returnHref,
}: Extract<BuildIntegrationDetailInput, { kind: "api-key" }>): IntegrationDetailModel {
  const state = apiKeyState(apiKey, now ?? new Date());
  const chips: EvidenceCommandChip[] = [
    { label: state.label, tone: state.tone },
    { label: formatIntegrationLabel(apiKey.environment), tone: "info" },
    { label: apiKey.keyPrefix, tone: "neutral" },
  ];

  return {
    eyebrow: "Partner operations",
    title: "API key evidence brief",
    description: state.basis,
    contextItems: [apiKey.name, apiKey.keyPrefix, formatIntegrationLabel(apiKey.environment)],
    chips,
    metrics: [
      {
        label: "Runtime state",
        value: state.label,
        detail: apiKey.revokedAt ? `Revoked ${formatIntegrationDateTime(apiKey.revokedAt)}` : "Credential can be evaluated for partner API access",
        tone: state.tone,
        icon: "check",
      },
      {
        label: "Scopes",
        value: formatCount(apiKey.scopes.length),
        detail: formatList(apiKey.scopes),
        tone: apiKey.scopes.length ? "stable" : "attention",
        icon: "activity",
      },
      {
        label: "Districts",
        value: apiKey.allowedDistricts.length ? formatCount(apiKey.allowedDistricts.length) : "All",
        detail: formatList(apiKey.allowedDistricts),
        tone: "info",
        icon: "radio",
      },
      {
        label: "Last used",
        value: formatIntegrationDateTime(apiKey.lastUsedAt),
        detail: apiKey.lastUsedIp ?? "No source IP recorded",
        tone: apiKey.lastUsedAt ? "stable" : "attention",
        icon: "clock",
      },
    ],
    caseBrief: {
      title: "Credential packet",
      description: "Access scope and usage evidence for partner endpoint validation.",
      summary: {
        label: "Credential basis",
        value: state.basis,
        tone: state.tone,
        emphasis: true,
      },
      primaryFields: [
        { label: "Credential", value: apiKey.name, emphasis: true },
        { label: "Prefix", value: apiKey.keyPrefix },
        { label: "Environment", value: formatIntegrationLabel(apiKey.environment), tone: "info" },
      ],
      sections: [
        {
          title: "Access scope",
          fields: [
            { label: "Scopes", value: formatList(apiKey.scopes), fullWidth: true },
            {
              label: "Allowed districts",
              value: formatList(apiKey.allowedDistricts),
              fullWidth: true,
            },
            { label: "Organisation", value: organisationLabel(apiKey.organisationId) },
          ],
        },
        {
          title: "Lifecycle",
          fields: [
            { label: "Created", value: formatIntegrationDateTime(apiKey.createdAt) },
            { label: "Updated", value: formatIntegrationDateTime(apiKey.updatedAt) },
            { label: "Expires", value: formatIntegrationDateTime(apiKey.expiresAt) },
            { label: "Revoked", value: formatIntegrationDateTime(apiKey.revokedAt) },
          ],
        },
      ],
    },
    decision: buildDecision({
      chips,
      returnHref,
      scoreLabel: "Credential",
      scoreValue: apiKey.keyPrefix,
      state,
    }),
    timeline: {
      title: "Credential timeline",
      description: "The timestamps that explain whether this key can support a partner handoff.",
      items: [
        {
          label: "Created",
          title: "Credential created",
          description: `${apiKey.name} was added for ${formatIntegrationLabel(apiKey.environment)} partner access.`,
          timestamp: formatIntegrationDateTime(apiKey.createdAt),
          tone: "info",
        },
        {
          label: "Last used",
          title: apiKey.lastUsedAt ? "Credential used by partner client" : "No usage recorded",
          description: apiKey.lastUsedIp
            ? `Last observed from ${apiKey.lastUsedIp}.`
            : "No last-used source IP is recorded for this credential.",
          timestamp: formatIntegrationDateTime(apiKey.lastUsedAt),
          tone: apiKey.lastUsedAt ? "stable" : "attention",
        },
        {
          label: apiKey.revokedAt ? "Revoked" : "Current",
          title: state.title,
          description: state.nextStep,
          timestamp: apiKey.revokedAt ? formatIntegrationDateTime(apiKey.revokedAt) : undefined,
          tone: state.tone,
        },
      ],
    },
    jsonBlocks: [],
  };
}

function buildWebhookSubscriptionDetailModel({
  returnHref,
  subscription,
}: Extract<
  BuildIntegrationDetailInput,
  { kind: "webhook-subscription" }
>): IntegrationDetailModel {
  const state = webhookState(subscription.lastTestStatus ?? subscription.status, subscription.lastError);
  const chips: EvidenceCommandChip[] = [
    { label: state.label, tone: state.tone },
    { label: formatIntegrationLabel(subscription.status), tone: "info" },
    { label: `${formatCount(subscription.eventTypes.length)} events`, tone: "neutral" },
  ];

  return {
    eyebrow: "Partner operations",
    title: "Webhook receiver evidence brief",
    description: state.basis,
    contextItems: [subscription.name, subscription.targetUrl],
    chips,
    metrics: [
      {
        label: "Receiver state",
        value: state.label,
        detail: subscription.lastError ?? "No receiver error recorded",
        tone: state.tone,
        icon: "radio",
      },
      {
        label: "Event types",
        value: formatCount(subscription.eventTypes.length),
        detail: formatList(subscription.eventTypes),
        tone: "info",
        icon: "activity",
      },
      {
        label: "Last tested",
        value: formatIntegrationDateTime(subscription.lastTestedAt),
        detail: `Last test ${formatIntegrationLabel(subscription.lastTestStatus)}`,
        tone: subscription.lastTestedAt ? "stable" : "attention",
        icon: "clock",
      },
      {
        label: "Target",
        value: formatIntegrationLabel(subscription.status),
        detail: subscription.targetUrl,
        tone: state.tone,
        icon: "radio",
      },
    ],
    caseBrief: {
      title: "Receiver packet",
      description: "Endpoint, event coverage, and last-test evidence for the partner receiver.",
      summary: {
        label: "Delivery basis",
        value: state.basis,
        tone: state.tone,
        emphasis: true,
      },
      primaryFields: [
        { label: "Subscription", value: subscription.name, emphasis: true },
        { label: "Status", value: formatIntegrationLabel(subscription.status), tone: state.tone },
        { label: "Last test", value: formatIntegrationLabel(subscription.lastTestStatus), tone: state.tone },
      ],
      sections: [
        {
          title: "Receiver target",
          fields: [
            { label: "Target URL", value: subscription.targetUrl, fullWidth: true },
            { label: "Event types", value: formatList(subscription.eventTypes), fullWidth: true },
            { label: "Organisation", value: organisationLabel(subscription.organisationId) },
          ],
        },
        {
          title: "Test evidence",
          fields: [
            { label: "Last tested", value: formatIntegrationDateTime(subscription.lastTestedAt) },
            { label: "Last error", value: subscription.lastError ?? "None recorded", fullWidth: true },
            { label: "Updated", value: formatIntegrationDateTime(subscription.updatedAt) },
          ],
        },
      ],
    },
    decision: buildDecision({
      chips,
      returnHref,
      scoreLabel: "Receiver",
      scoreValue: subscription.name,
      state,
    }),
    timeline: {
      title: "Receiver timeline",
      description: "The receiver lifecycle and last test outcome for delivery debugging.",
      items: [
        {
          label: "Created",
          title: "Webhook receiver configured",
          description: `${subscription.name} was created for ${formatList(subscription.eventTypes)}.`,
          timestamp: formatIntegrationDateTime(subscription.createdAt),
          tone: "info",
        },
        {
          label: "Last tested",
          title: `Last test ${formatIntegrationLabel(subscription.lastTestStatus)}`,
          description: subscription.lastError ?? "No receiver error was recorded.",
          timestamp: formatIntegrationDateTime(subscription.lastTestedAt),
          tone: state.tone,
        },
        {
          label: "Next",
          title: state.title,
          description: state.nextStep,
          tone: state.tone,
        },
      ],
    },
    jsonBlocks: [
      {
        title: "Last test metadata",
        value: subscription.lastTestMetadata,
      },
    ],
  };
}

function buildWebhookEventDetailModel({
  event,
  returnHref,
  subscription,
}: Extract<BuildIntegrationDetailInput, { kind: "webhook-event" }>): IntegrationDetailModel {
  const state = webhookState(event.status, event.lastError);
  const subscriptionLabel = subscription
    ? `${subscription.name} (${event.subscriptionId})`
    : `Subscription ${event.subscriptionId}`;
  const chips: EvidenceCommandChip[] = [
    { label: state.label, tone: state.tone },
    { label: formatIntegrationLabel(event.eventType), tone: "info" },
    { label: `${formatCount(event.attemptCount)} attempts`, tone: "neutral" },
  ];

  return {
    eyebrow: "Partner operations",
    title: "Webhook event evidence brief",
    description: state.basis,
    contextItems: [formatIntegrationLabel(event.eventType), subscriptionLabel],
    chips,
    metrics: [
      {
        label: "Delivery state",
        value: state.label,
        detail: event.lastError ?? "No delivery error recorded",
        tone: state.tone,
        icon: "radio",
      },
      {
        label: "Attempts",
        value: formatCount(event.attemptCount),
        detail: subscriptionLabel,
        tone: event.attemptCount > 1 ? "attention" : "stable",
        icon: "activity",
      },
      {
        label: "Created",
        value: formatIntegrationDateTime(event.createdAt),
        detail: "Event entered delivery queue",
        tone: "info",
        icon: "clock",
      },
      {
        label: "Delivered",
        value: formatIntegrationDateTime(event.deliveredAt),
        detail: formatIntegrationLabel(event.status),
        tone: event.deliveredAt ? "stable" : state.tone,
        icon: "check",
      },
    ],
    caseBrief: {
      title: "Delivery packet",
      description: "Event payload, receiver link, and delivery attempt evidence.",
      summary: {
        label: "Delivery basis",
        value: state.basis,
        tone: state.tone,
        emphasis: true,
      },
      primaryFields: [
        { label: "Event type", value: formatIntegrationLabel(event.eventType), tone: "info" },
        { label: "Status", value: formatIntegrationLabel(event.status), tone: state.tone },
        { label: "Subscription", value: subscriptionLabel },
      ],
      sections: [
        {
          title: "Delivery evidence",
          fields: [
            { label: "Attempts", value: formatCount(event.attemptCount) },
            { label: "Last error", value: event.lastError ?? "None recorded", fullWidth: true },
            { label: "Metadata", value: compactIntegrationRecord(event.metadata), fullWidth: true },
          ],
        },
        {
          title: "Timing",
          fields: [
            { label: "Created", value: formatIntegrationDateTime(event.createdAt) },
            { label: "Delivered", value: formatIntegrationDateTime(event.deliveredAt) },
          ],
        },
      ],
    },
    decision: buildDecision({
      chips,
      returnHref,
      scoreLabel: "Event",
      scoreValue: formatIntegrationLabel(event.eventType),
      state,
    }),
    timeline: {
      title: "Delivery timeline",
      description: "The timestamps that explain how this event moved through delivery.",
      items: [
        {
          label: "Created",
          title: "Webhook event created",
          description: `${formatIntegrationLabel(event.eventType)} entered delivery for ${subscriptionLabel}.`,
          timestamp: formatIntegrationDateTime(event.createdAt),
          tone: "info",
        },
        {
          label: "Delivered",
          title: event.deliveredAt ? "Receiver accepted event" : "Delivery not confirmed",
          description: event.lastError ?? state.basis,
          timestamp: formatIntegrationDateTime(event.deliveredAt),
          tone: event.deliveredAt ? "stable" : state.tone,
        },
        {
          label: "Next",
          title: state.title,
          description: state.nextStep,
          tone: state.tone,
        },
      ],
    },
    jsonBlocks: [
      {
        title: "Payload",
        value: event.payload,
      },
      {
        title: "Metadata",
        value: event.metadata,
      },
    ],
  };
}

function buildExportRunDetailModel({
  exportRun,
  requesterLabel,
  returnHref,
}: Extract<BuildIntegrationDetailInput, { kind: "export-run" }>): IntegrationDetailModel {
  const state: EvidenceState = {
    label: "Ready",
    tone: "stable",
    title: "Export package ready for handoff",
    basis: "This export package has persisted scope, record counts, checksum, and payload evidence.",
    nextStep: "Use checksum and scope evidence when validating the partner handoff package.",
    impact:
      "A complete export package gives partner teams a concrete dataset to verify against the API surface.",
    verification: "Compare checksum, scope, record counts, and generated payload before sharing.",
  };
  const chips: EvidenceCommandChip[] = [
    { label: state.label, tone: state.tone },
    { label: formatIntegrationLabel(exportRun.format), tone: "info" },
    { label: totalRecordCount(exportRun.recordCounts), tone: "neutral" },
  ];

  return {
    eyebrow: "Partner operations",
    title: "Export package evidence brief",
    description: state.basis,
    contextItems: [exportRun.checksum, formatIntegrationLabel(exportRun.format)],
    chips,
    metrics: [
      {
        label: "Format",
        value: formatIntegrationLabel(exportRun.format),
        detail: "Partner package type",
        tone: "info",
        icon: "activity",
      },
      {
        label: "Records",
        value: totalRecordCount(exportRun.recordCounts),
        detail: compactIntegrationRecord(exportRun.recordCounts),
        tone: "stable",
        icon: "activity",
      },
      {
        label: "Created",
        value: formatIntegrationDateTime(exportRun.createdAt),
        detail: requesterLabel,
        tone: "stable",
        icon: "clock",
      },
      {
        label: "Scope",
        value: organisationLabel(exportRun.organisationId),
        detail: compactIntegrationRecord(exportRun.scope),
        tone: "info",
        icon: "radio",
      },
    ],
    caseBrief: {
      title: "Export packet",
      description: "Package proof for partner data handoff and checksum validation.",
      summary: {
        label: "Checksum",
        value: exportRun.checksum,
        tone: "stable",
        emphasis: true,
      },
      primaryFields: [
        { label: "Format", value: formatIntegrationLabel(exportRun.format), tone: "info" },
        { label: "Requested by", value: requesterLabel },
        { label: "Created", value: formatIntegrationDateTime(exportRun.createdAt) },
      ],
      sections: [
        {
          title: "Package scope",
          fields: [
            { label: "Record counts", value: compactIntegrationRecord(exportRun.recordCounts), fullWidth: true },
            { label: "Scope", value: compactIntegrationRecord(exportRun.scope), fullWidth: true },
            { label: "Organisation", value: organisationLabel(exportRun.organisationId) },
          ],
        },
      ],
    },
    decision: buildDecision({
      chips,
      returnHref,
      scoreLabel: "Checksum",
      scoreValue: exportRun.checksum,
      state,
    }),
    timeline: {
      title: "Export timeline",
      description: "The package timestamp and checksum evidence for handoff validation.",
      items: [
        {
          label: "Created",
          title: "Export package generated",
          description: `${formatIntegrationLabel(exportRun.format)} package created by ${requesterLabel}.`,
          timestamp: formatIntegrationDateTime(exportRun.createdAt),
          tone: "stable",
        },
        {
          label: "Proof",
          title: "Checksum recorded",
          description: exportRun.checksum,
          tone: "stable",
        },
        {
          label: "Next",
          title: state.title,
          description: state.nextStep,
          tone: state.tone,
        },
      ],
    },
    jsonBlocks: [
      {
        title: "Export payload",
        value: exportRun.payload,
      },
    ],
  };
}

function buildIntegrationCheckDetailModel({
  check,
  returnHref,
}: Extract<
  BuildIntegrationDetailInput,
  { kind: "integration-check" }
>): IntegrationDetailModel {
  const state = checkState(check.status);
  const chips: EvidenceCommandChip[] = [
    { label: state.label, tone: state.tone },
    { label: formatIntegrationLabel(check.checkName), tone: "info" },
    { label: organisationLabel(check.organisationId), tone: "neutral" },
  ];

  return {
    eyebrow: "Partner operations",
    title: "Integration check evidence brief",
    description: check.summary,
    contextItems: [formatIntegrationLabel(check.checkName), organisationLabel(check.organisationId)],
    chips,
    metrics: [
      {
        label: "Check state",
        value: state.label,
        detail: check.summary,
        tone: state.tone,
        icon: "check",
      },
      {
        label: "Check",
        value: formatIntegrationLabel(check.checkName),
        detail: "Integration status probe",
        tone: "info",
        icon: "activity",
      },
      {
        label: "Organisation",
        value: organisationLabel(check.organisationId),
        detail: "Execution scope",
        tone: "info",
        icon: "radio",
      },
      {
        label: "Checked",
        value: formatIntegrationDateTime(check.checkedAt),
        detail: "Latest check evidence",
        tone: "stable",
        icon: "clock",
      },
    ],
    caseBrief: {
      title: "Check packet",
      description: "Status-check summary and metadata for partner operations review.",
      summary: {
        label: "Check summary",
        value: check.summary,
        tone: state.tone,
        emphasis: true,
      },
      primaryFields: [
        { label: "Check", value: formatIntegrationLabel(check.checkName), emphasis: true },
        { label: "Status", value: formatIntegrationLabel(check.status), tone: state.tone },
        { label: "Checked", value: formatIntegrationDateTime(check.checkedAt) },
      ],
      sections: [
        {
          title: "Execution evidence",
          fields: [
            { label: "Organisation", value: organisationLabel(check.organisationId) },
            { label: "Metadata", value: compactIntegrationRecord(check.metadata), fullWidth: true },
          ],
        },
      ],
    },
    decision: buildDecision({
      chips,
      returnHref,
      scoreLabel: "Check",
      scoreValue: formatIntegrationLabel(check.checkName),
      state,
    }),
    timeline: {
      title: "Check timeline",
      description: "The latest probe result and follow-up action for integration readiness.",
      items: [
        {
          label: "Checked",
          title: `${formatIntegrationLabel(check.checkName)} reported ${formatIntegrationLabel(check.status)}`,
          description: check.summary,
          timestamp: formatIntegrationDateTime(check.checkedAt),
          tone: state.tone,
        },
        {
          label: "Evidence",
          title: "Metadata recorded",
          description: compactIntegrationRecord(check.metadata),
          tone: "info",
        },
        {
          label: "Next",
          title: state.title,
          description: state.nextStep,
          tone: state.tone,
        },
      ],
    },
    jsonBlocks: [
      {
        title: "Metadata",
        value: check.metadata,
      },
    ],
  };
}

export function buildIntegrationDetailModel(
  input: BuildIntegrationDetailInput,
): IntegrationDetailModel {
  switch (input.kind) {
    case "api-key":
      return buildApiKeyDetailModel(input);
    case "webhook-subscription":
      return buildWebhookSubscriptionDetailModel(input);
    case "webhook-event":
      return buildWebhookEventDetailModel(input);
    case "export-run":
      return buildExportRunDetailModel(input);
    case "integration-check":
      return buildIntegrationCheckDetailModel(input);
  }
}
