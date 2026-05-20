import {
  AdminEmptyState,
  AdminEvidenceTable,
  AdminFilterBar,
  AdminMetricStrip,
  AdminModuleHeader,
  type AdminTone,
} from "@/components/product/admin-module";
import type {
  IntegrationStatusCheckApiResponse,
  PartnerApiKeyApiResponse,
  PartnerExportRunApiResponse,
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
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminPartnerReadiness } from "../admin-loaders";
import {
  formatCount,
  formatDateTime,
  formatLabel,
  StatusBadge,
  toneForAttention,
} from "../governance-formatters";

type PartnerEndpointRow = {
  method: string;
  path: string;
  scope: string;
  purpose: string;
};

type WebhookEvidenceRow = {
  id: string;
  href: string;
  ariaLabel: string;
  type: string;
  name: string;
  target: string;
  state: string;
  evidence: string;
  updatedAt: string;
  tone: AdminTone;
};

const returnSource = "admin-integrations";

const partnerEndpointRows: PartnerEndpointRow[] = [
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
];

function activeKeys(apiKeys: PartnerApiKeyApiResponse[]) {
  const now = new Date();
  return apiKeys.filter((apiKey) => isPartnerApiKeyActive(apiKey, now));
}

function activeScopes(apiKeys: PartnerApiKeyApiResponse[]) {
  const scopes = new Set<string>();
  for (const apiKey of activeKeys(apiKeys)) {
    for (const scope of apiKey.scopes) {
      scopes.add(scope);
    }
  }
  return scopes;
}

function apiKeyState(apiKey: PartnerApiKeyApiResponse): {
  label: string;
  tone: AdminTone;
} {
  if (apiKey.revokedAt) {
    return { label: "Revoked", tone: "blocked" };
  }

  if (isPartnerApiKeyActive(apiKey)) {
    return { label: "Active", tone: "clear" };
  }

  return { label: "Review", tone: "attention" };
}

function formatList(values: string[]) {
  if (!values.length) {
    return "All";
  }

  return values.map(formatLabel).join(", ");
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

function webhookStatusTone(status?: string | null): AdminTone {
  const normalized = status?.toLowerCase();

  if (!normalized) {
    return "info";
  }

  if (normalized.includes("fail") || normalized.includes("disabled")) {
    return "attention";
  }

  if (normalized.includes("active") || normalized.includes("delivered")) {
    return "clear";
  }

  return "info";
}

function webhookEvidenceRows({
  subscriptions,
  events,
  source,
}: {
  subscriptions: PartnerWebhookSubscriptionApiResponse[];
  events: PartnerWebhookEventApiResponse[];
  source: string;
}): WebhookEvidenceRow[] {
  return [
    ...subscriptions.map(
      (subscription): WebhookEvidenceRow => ({
        id: `subscription-${subscription.id}`,
        href: buildAdminWebhookSubscriptionDetailHref(subscription.id, source),
        ariaLabel: `Open webhook subscription ${subscription.id} detail`,
        type: "Subscription",
        name: subscription.name,
        target: subscription.targetUrl,
        state: subscription.lastTestStatus ?? subscription.status,
        evidence: subscription.lastError
          ? subscription.lastError
          : compactRecord(subscription.lastTestMetadata),
        updatedAt: subscription.lastTestedAt ?? subscription.updatedAt,
        tone: webhookStatusTone(subscription.lastTestStatus ?? subscription.status),
      }),
    ),
    ...events.map(
      (event): WebhookEvidenceRow => ({
        id: `event-${event.id}`,
        href: buildAdminWebhookEventDetailHref(event.id, source),
        ariaLabel: `Open webhook event ${event.id} detail`,
        type: "Preview event",
        name: event.eventType,
        target: `Subscription ${event.subscriptionId}`,
        state: event.status,
        evidence: event.lastError ?? compactRecord(event.metadata),
        updatedAt: event.deliveredAt ?? event.createdAt,
        tone: webhookStatusTone(event.status),
      }),
    ),
  ];
}

function checkTone(check: IntegrationStatusCheckApiResponse): AdminTone {
  const normalized = check.status.toLowerCase();

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

function smokeCommand(path: string) {
  return `curl -H "Authorization: Bearer $CLINICPULSE_PARTNER_API_KEY" "$CLINICPULSE_API_BASE_URL${path}"`;
}

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  const partnerReadiness = await loadAdminPartnerReadiness();
  const keys = partnerReadiness.apiKeys;
  const activeApiKeys = activeKeys(keys);
  const coveredScopes = activeScopes(keys);
  const endpointCoverage = partnerEndpointRows.filter((row) =>
    coveredScopes.has(row.scope),
  ).length;
  const webhookRows = webhookEvidenceRows({
    subscriptions: partnerReadiness.webhookSubscriptions,
    events: partnerReadiness.webhookEvents,
    source: returnSource,
  });
  const exportRun = latestExport(partnerReadiness.exportRuns);

  return (
    <div className="space-y-4" data-admin-module="integrations">
      <AdminModuleHeader
        eyebrow="Partner operations"
        title="Integrations"
        description="Partner handoff surface for API scope coverage, endpoint smoke tests, webhook evidence, export packages, and readiness checks."
      />

      <AdminMetricStrip
        metrics={[
          {
            label: "Active partner keys",
            value: formatCount(activeApiKeys.length),
            detail: `${formatCount(keys.length)} total credentials`,
            tone: activeApiKeys.length > 0 ? "clear" : "attention",
          },
          {
            label: "Endpoint coverage",
            value: `${formatCount(endpointCoverage)} / ${formatCount(
              partnerEndpointRows.length,
            )}`,
            detail: "Covered by active key scopes",
            tone:
              endpointCoverage === partnerEndpointRows.length ? "clear" : "attention",
          },
          {
            label: "Webhook evidence",
            value: formatCount(webhookRows.length),
            detail: `${formatCount(
              partnerReadiness.webhookSubscriptions.length,
            )} subscriptions`,
            tone: webhookRows.length > 0 ? "clear" : "attention",
          },
          {
            label: "Export package evidence",
            value: formatCount(partnerReadiness.exportRuns.length),
            detail: exportRun ? formatDateTime(exportRun.createdAt) : "No export generated",
            tone: exportRun ? "clear" : "attention",
          },
        ]}
      />

      <AdminFilterBar>
        <StatusBadge tone={toneForAttention(partnerEndpointRows.length - endpointCoverage)}>
          Partner handoff readiness
        </StatusBadge>
        <span className="text-sm text-muted-foreground">
          Create keys, exports, and webhooks in Partner readiness; review the handoff package here.
        </span>
      </AdminFilterBar>

      <AdminEvidenceTable
        label="Partner API contract"
        rows={partnerEndpointRows}
        getRowKey={(row) => row.path}
        columns={[
          {
            key: "endpoint",
            header: "Partner API contract",
            render: (row) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  {row.method} {row.path}
                </p>
                <p className="max-w-md text-sm text-muted-foreground">{row.purpose}</p>
              </div>
            ),
          },
          {
            key: "scope",
            header: "Required scope",
            render: (row) => <StatusBadge tone="info">{row.scope}</StatusBadge>,
          },
          {
            key: "coverage",
            header: "Coverage",
            render: (row) => {
              const covered = coveredScopes.has(row.scope);
              return (
                <StatusBadge tone={covered ? "clear" : "attention"}>
                  {covered ? "Covered" : "Missing"}
                </StatusBadge>
              );
            },
          },
          {
            key: "smoke",
            header: "Smoke test",
            render: (row) => (
              <code className="block max-w-md break-all rounded-md bg-bg-muted px-2 py-1 font-mono text-xs text-content-default">
                {smokeCommand(row.path)}
              </code>
            ),
          },
        ]}
      />

      <AdminEvidenceTable
        label="Credential scope coverage"
        rows={keys}
        getRowKey={(row) => String(row.id)}
        getRowAriaLabel={(row) => `Open ${row.name} API key detail`}
        getRowHref={(row) => buildAdminApiKeyDetailHref(row.id, returnSource)}
        emptyState={
          <AdminEmptyState
            title="Credential scope coverage"
            description="Create a partner API key before handing this integration to a partner."
          />
        }
        columns={[
          {
            key: "key",
            header: "Credential scope coverage",
            render: (row) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{row.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{row.keyPrefix}</p>
              </div>
            ),
          },
          {
            key: "state",
            header: "State",
            render: (row) => {
              const state = apiKeyState(row);
              return <StatusBadge tone={state.tone}>{state.label}</StatusBadge>;
            },
          },
          {
            key: "scope",
            header: "Scopes",
            render: (row) => formatList(row.scopes),
          },
          {
            key: "districts",
            header: "Districts",
            render: (row) => formatList(row.allowedDistricts),
          },
          {
            key: "lastUsed",
            header: "Last used",
            render: (row) => formatDateTime(row.lastUsedAt),
          },
        ]}
      />

      <AdminEvidenceTable
        label="Webhook delivery evidence"
        rows={webhookRows}
        getRowKey={(row) => row.id}
        getRowAriaLabel={(row) => row.ariaLabel}
        getRowHref={(row) => row.href}
        emptyState={
          <AdminEmptyState
            title="Webhook delivery evidence"
            description="Create and test a webhook before partner handoff."
          />
        }
        columns={[
          {
            key: "name",
            header: "Webhook delivery evidence",
            render: (row) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{row.name}</p>
                <p className="text-xs text-muted-foreground">{row.type}</p>
              </div>
            ),
          },
          {
            key: "state",
            header: "State",
            render: (row) => <StatusBadge tone={row.tone}>{formatLabel(row.state)}</StatusBadge>,
          },
          {
            key: "target",
            header: "Target",
            render: (row) => <p className="max-w-sm break-words text-sm">{row.target}</p>,
          },
          {
            key: "evidence",
            header: "Evidence",
            render: (row) => <p className="max-w-md text-sm">{row.evidence}</p>,
          },
          {
            key: "updated",
            header: "Updated",
            render: (row) => formatDateTime(row.updatedAt),
          },
        ]}
      />

      <AdminEvidenceTable
        label="Export package evidence"
        rows={partnerReadiness.exportRuns}
        getRowKey={(row) => String(row.id)}
        getRowAriaLabel={(row) => `Open export run ${row.id} detail`}
        getRowHref={(row) => buildAdminExportRunDetailHref(row.id, returnSource)}
        emptyState={
          <AdminEmptyState
            title="No export package evidence"
            description="Generate an export package before partner handoff."
          />
        }
        columns={[
          {
            key: "checksum",
            header: "Export checksum",
            render: (row) => (
              <span className="break-all font-mono text-xs text-muted-foreground">
                {row.checksum}
              </span>
            ),
          },
          {
            key: "format",
            header: "Format",
            render: (row) => <StatusBadge tone="info">{row.format}</StatusBadge>,
          },
          {
            key: "records",
            header: "Record counts",
            render: (row) => compactRecord(row.recordCounts),
          },
          {
            key: "scope",
            header: "Scope",
            render: (row) => compactRecord(row.scope),
          },
          {
            key: "created",
            header: "Created",
            render: (row) => formatDateTime(row.createdAt),
          },
        ]}
      />

      <AdminEvidenceTable
        label="Integration check evidence"
        rows={partnerReadiness.integrationChecks}
        getRowKey={(row) => `${row.checkName}:${row.checkedAt}`}
        getRowAriaLabel={(row) => `Open ${formatLabel(row.checkName)} integration check detail`}
        getRowHref={(row) => buildAdminIntegrationCheckDetailHref(row.id, returnSource)}
        columns={[
          {
            key: "check",
            header: "Readiness check",
            render: (row) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{formatLabel(row.checkName)}</p>
                <p className="max-w-md text-sm text-muted-foreground">{row.summary}</p>
              </div>
            ),
          },
          {
            key: "state",
            header: "State",
            render: (row) => <StatusBadge tone={checkTone(row)}>{formatLabel(row.status)}</StatusBadge>,
          },
          {
            key: "metadata",
            header: "Metadata",
            render: (row) => compactRecord(row.metadata),
          },
          {
            key: "checked",
            header: "Checked",
            render: (row) => formatDateTime(row.checkedAt),
          },
        ]}
      />
    </div>
  );
}
