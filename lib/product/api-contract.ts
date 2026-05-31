import type {
  PartnerExportRunApiResponse,
  PartnerReadinessApiResponse,
} from "@/lib/workspace/api-types";
import { isPartnerApiKeyActive } from "@/lib/workspace/partner-readiness";
import {
  buildAdminExportRunDetailHref,
  buildAdminIntegrationCheckDetailHref,
} from "@/lib/product/admin-detail-routes";
import {
  compactIntegrationRecord,
  formatIntegrationLabel,
} from "@/lib/product/integration-operations";

export type ApiContractTone = "clear" | "attention" | "blocked" | "info";

export type ApiContractMethod = "GET" | "POST";

export type ApiContractMethodFilter = ApiContractMethod | "all";

export type ApiContractReadinessFilter = "all" | "needs-review" | "ready";

export type ApiContractParameter = {
  name: string;
  location: "header" | "query" | "body" | "path";
  required: boolean;
  type: string;
  description: string;
};

export type ApiContractResponse = {
  status: string;
  label: string;
  description: string;
  fields: string[];
};

export type ApiContractReadinessCheck = {
  id: string;
  label: string;
  state: string;
  detail: string;
  tone: ApiContractTone;
  sourceHref?: string;
};

export type ApiContractEndpoint = {
  id: string;
  method: ApiContractMethod;
  path: string;
  title: string;
  purpose: string;
  owner: string;
  authMode: string;
  authDetail: string;
  consumer: string;
  requiredScopes: string[];
  parameters: ApiContractParameter[];
  responses: ApiContractResponse[];
  safety: string[];
  samplePayload: string;
  sourceLabel: string;
  sourceHref: string;
  readinessLabel: string;
  readinessTone: ApiContractTone;
  readinessChecks: ApiContractReadinessCheck[];
  searchText: string;
};

export type ApiContractSummaryMetric = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: ApiContractTone;
};

export type ApiContractSourceReference = {
  source: string;
  role: string;
  repositoryUrl: string;
  sourcePath: string;
  license: "Apache-2.0";
};

export type ApiContractModel = {
  endpoints: ApiContractEndpoint[];
  summaryMetrics: ApiContractSummaryMetric[];
  sourceReferences: ApiContractSourceReference[];
};

type BuildApiContractModelOptions = {
  now?: Date;
};

type EndpointCatalogItem = Omit<
  ApiContractEndpoint,
  | "readinessLabel"
  | "readinessTone"
  | "readinessChecks"
  | "samplePayload"
  | "sourceHref"
  | "searchText"
> & {
  sample: (context: ContractContext) => Record<string, unknown>;
  sourceHref: (context: ContractContext) => string;
};

type ContractContext = {
  activeScopes: Set<string>;
  latestExportRun?: PartnerExportRunApiResponse;
  readiness: PartnerReadinessApiResponse;
};

const returnSource = "admin-api-contract";

const sourceReferences: ApiContractSourceReference[] = [
  {
    source: "Swagger UI operation components",
    role: "Operation, parameter, response, and sample-payload anatomy adapted into a ClinicPulse read-only contract explorer.",
    repositoryUrl: "https://github.com/swagger-api/swagger-ui",
    sourcePath: "src/core/components/operation.jsx",
    license: "Apache-2.0",
  },
  {
    source: "OpenMetadata data contract schema table",
    role: "Column, type, constraint, and validation-status review adapted for endpoint response fields and contract readiness.",
    repositoryUrl: "https://github.com/open-metadata/OpenMetadata",
    sourcePath:
      "openmetadata-ui/src/main/resources/ui/src/components/DataContract/ContractSchemaTable/ContractSchemaTable.component.tsx",
    license: "Apache-2.0",
  },
];

const endpointCatalog: EndpointCatalogItem[] = [
  {
    id: "clinics",
    method: "GET",
    path: "/v1/clinics",
    title: "Clinic directory",
    purpose: "Operational clinic directory for authenticated operations users.",
    owner: "Operations API",
    authMode: "Operations session",
    authDetail: "Signed-in operations or admin user with district visibility.",
    consumer: "District dashboards and admin reporting coverage.",
    requiredScopes: [],
    sourceLabel: "Reporting coverage",
    parameters: [
      {
        name: "district",
        location: "query",
        required: false,
        type: "string",
        description: "Limits the directory to one operating district.",
      },
      {
        name: "freshness",
        location: "query",
        required: false,
        type: "current | stale | needs_confirmation",
        description: "Filters clinics by current operating evidence state.",
      },
    ],
    responses: [
      {
        status: "200",
        label: "Clinic list",
        description: "Returns operational clinic records visible to the signed-in user.",
        fields: ["clinic.id", "facilityCode", "currentStatus.status", "freshness"],
      },
      {
        status: "401",
        label: "Unauthenticated",
        description: "Returned when there is no operations session.",
        fields: ["error.code", "error.message"],
      },
    ],
    safety: [
      "Reporter private identity is excluded from the directory response.",
      "District scoping follows the authenticated user's membership.",
    ],
    sample: () => ({
      clinics: [
        {
          id: "clinic-001",
          facilityCode: "GT-TSH-001",
          currentStatus: { status: "open", freshness: "current" },
        },
      ],
    }),
    sourceHref: () => "/admin/reporting-coverage",
  },
  {
    id: "reports",
    method: "POST",
    path: "/v1/reports",
    title: "Field report submission",
    purpose: "Field report submission that enters review before changing trusted state.",
    owner: "Field reporting",
    authMode: "Reporter session",
    authDetail: "Signed-in reporter or clinic coordinator session.",
    consumer: "Reporter cockpit, review queue, and governance evidence.",
    requiredScopes: [],
    sourceLabel: "Reporting coverage",
    parameters: [
      {
        name: "clinicId",
        location: "body",
        required: true,
        type: "string",
        description: "Clinic identifier receiving the field report.",
      },
      {
        name: "status",
        location: "body",
        required: true,
        type: "open | busy | closed | unknown",
        description: "Reported operating state.",
      },
      {
        name: "offlineReceipt",
        location: "body",
        required: false,
        type: "string",
        description: "Client receipt used to reconcile queued offline submissions.",
      },
    ],
    responses: [
      {
        status: "202",
        label: "Queued for review",
        description: "Report accepted into pending review without changing trusted clinic state.",
        fields: ["report.id", "reviewState", "receivedAt", "validationMessages"],
      },
      {
        status: "422",
        label: "Validation failed",
        description: "The submitted payload failed contract or field validation.",
        fields: ["error.code", "error.fields", "error.message"],
      },
    ],
    safety: [
      "Accepted reports stay pending until an authorised reviewer decides.",
      "Offline receipts make duplicates and conflicts visible instead of silent.",
    ],
    sample: () => ({
      report: {
        id: 141,
        reviewState: "pending",
        receivedAt: "2026-05-24T10:00:00.000Z",
      },
    }),
    sourceHref: () => "/admin/reporting-coverage",
  },
  {
    id: "alternatives",
    method: "GET",
    path: "/v1/partner/alternatives",
    title: "Alternative clinic recommendations",
    purpose: "Partner-safe alternative clinic recommendations for referral workflows.",
    owner: "Partner API",
    authMode: "Partner bearer key",
    authDetail: "Bearer credential with alternatives:read scope.",
    consumer: "Partner search and referral workflows.",
    requiredScopes: ["alternatives:read"],
    sourceLabel: "Partner readiness",
    parameters: [
      {
        name: "Authorization",
        location: "header",
        required: true,
        type: "Bearer token",
        description: "Partner API key presented as a bearer token.",
      },
      {
        name: "clinicId",
        location: "query",
        required: true,
        type: "string",
        description: "Clinic that needs alternative recommendations.",
      },
      {
        name: "radiusKm",
        location: "query",
        required: false,
        type: "number",
        description: "Optional radius used to rank nearby clinics.",
      },
    ],
    responses: [
      {
        status: "200",
        label: "Alternatives",
        description: "Returns ranked partner-safe clinics with distance and service hints.",
        fields: ["clinic.id", "distanceKm", "rankReason", "matchedService"],
      },
      {
        status: "403",
        label: "Missing scope",
        description: "The credential does not cover alternatives:read.",
        fields: ["error.code", "error.message"],
      },
    ],
    safety: [
      "Only partner-safe clinic metadata is returned.",
      "Internal audit metadata and reporter identity stay out of the response.",
    ],
    sample: () => ({
      alternatives: [
        {
          clinic: { id: "clinic-042", name: "Soshanguve CHC" },
          distanceKm: 4.6,
          rankReason: "Closest open clinic with matching service",
        },
      ],
    }),
    sourceHref: () => "/admin/partner-readiness",
  },
  {
    id: "export-latest",
    method: "GET",
    path: "/v1/partner/export/latest",
    title: "Latest export package",
    purpose: "Latest generated partner export metadata and package location.",
    owner: "Partner handoff",
    authMode: "Partner bearer key",
    authDetail: "Bearer credential with exports:read scope.",
    consumer: "Analytics, BI, and partner ingestion jobs.",
    requiredScopes: ["exports:read"],
    sourceLabel: "Export package",
    parameters: [
      {
        name: "Authorization",
        location: "header",
        required: true,
        type: "Bearer token",
        description: "Partner API key presented as a bearer token.",
      },
      {
        name: "format",
        location: "query",
        required: false,
        type: "json | csv",
        description: "Optional export package format.",
      },
    ],
    responses: [
      {
        status: "200",
        label: "Package metadata",
        description: "Returns the latest export package checksum, counts, scope, and reference.",
        fields: ["generatedAt", "recordCounts", "scope", "checksum", "downloadRef"],
      },
      {
        status: "401",
        label: "Invalid credential",
        description: "The partner bearer credential is missing, expired, or revoked.",
        fields: ["error.code", "error.message"],
      },
      {
        status: "404",
        label: "No package",
        description: "No generated export package is available for the requested scope.",
        fields: ["error.code", "error.message"],
      },
    ],
    safety: [
      "Checksum must be recorded before partner ingestion.",
      "Export package excludes internal-only fields and reporter identity.",
    ],
    sample: ({ latestExportRun }) => ({
      generatedAt: latestExportRun?.createdAt ?? "unavailable",
      format: latestExportRun?.format ?? "json",
      recordCounts: latestExportRun?.recordCounts ?? { clinics: 0, statuses: 0 },
      scope: latestExportRun?.scope ?? { district: "not generated" },
      checksum: latestExportRun?.checksum ?? "missing",
    }),
    sourceHref: ({ latestExportRun }) =>
      latestExportRun
        ? buildAdminExportRunDetailHref(latestExportRun.id, returnSource)
        : "/admin/partner-readiness",
  },
  {
    id: "integration-status",
    method: "GET",
    path: "/v1/partner/integration-status",
    title: "Integration status",
    purpose: "Partner-visible readiness and integration status.",
    owner: "Integration operations",
    authMode: "Partner bearer key",
    authDetail: "Bearer credential with status:read scope.",
    consumer: "Partner readiness review and support escalation.",
    requiredScopes: ["status:read"],
    sourceLabel: "Integration checks",
    parameters: [
      {
        name: "Authorization",
        location: "header",
        required: true,
        type: "Bearer token",
        description: "Partner API key presented as a bearer token.",
      },
      {
        name: "group",
        location: "query",
        required: false,
        type: "delivery | export | credential",
        description: "Optional readiness check group.",
      },
    ],
    responses: [
      {
        status: "200",
        label: "Readiness state",
        description: "Returns credential, webhook, export, and smoke-test readiness.",
        fields: ["readinessLabel", "webhookHealth", "exportFreshness", "keyState"],
      },
      {
        status: "403",
        label: "Missing scope",
        description: "The credential does not cover status:read.",
        fields: ["error.code", "error.message"],
      },
    ],
    safety: [
      "Status only; raw webhook payloads and secrets are not exposed.",
      "Failed checks stay visible to system admins for review.",
    ],
    sample: ({ readiness }) => ({
      readinessLabel: readiness.integrationChecks.some((check) => isFailing(check.status))
        ? "needs_review"
        : "ready",
      checks: readiness.integrationChecks.map((check) => ({
        name: check.checkName,
        status: check.status,
      })),
    }),
    sourceHref: ({ readiness }) => {
      const reviewCheck = readiness.integrationChecks.find((check) =>
        isFailing(check.status),
      );

      return reviewCheck
        ? buildAdminIntegrationCheckDetailHref(reviewCheck.id, returnSource)
        : "/admin/integrations";
    },
  },
];

export function buildApiContractModel(
  readiness: PartnerReadinessApiResponse,
  options: BuildApiContractModelOptions = {},
): ApiContractModel {
  const now = options.now ?? new Date();
  const context: ContractContext = {
    activeScopes: getActiveScopes(readiness, now),
    latestExportRun: latestExport(readiness.exportRuns),
    readiness,
  };
  const endpoints = endpointCatalog.map((endpoint) => buildEndpoint(endpoint, context));
  const requiredScopes = uniqueScopes(endpoints);
  const coveredScopes = requiredScopes.filter((scope) => context.activeScopes.has(scope));
  const reviewCheckCount = endpoints.flatMap((endpoint) =>
    endpoint.readinessChecks.filter((check) => needsReview(check.tone)),
  ).length;

  return {
    endpoints,
    summaryMetrics: [
      {
        id: "endpoint-count",
        label: "Endpoints",
        value: String(endpoints.length),
        detail: "Operations, reporter, and partner-facing routes.",
        tone: "info",
      },
      {
        id: "partner-scope-coverage",
        label: "Partner scope coverage",
        value: `${coveredScopes.length} / ${requiredScopes.length}`,
        detail: "Active partner credential scopes.",
        tone: coveredScopes.length === requiredScopes.length ? "clear" : "attention",
      },
      {
        id: "checks-needing-review",
        label: "Checks needing review",
        value: String(reviewCheckCount),
        detail: "Contract checks with blocked or attention state.",
        tone: reviewCheckCount > 0 ? "attention" : "clear",
      },
      {
        id: "evidence-handoffs",
        label: "Evidence handoffs",
        value: String(endpoints.filter((endpoint) => endpoint.sourceHref).length),
        detail: "Endpoint contracts link to source evidence.",
        tone: "clear",
      },
    ],
    sourceReferences,
  };
}

export function filterApiContractEndpoints(
  endpoints: ApiContractEndpoint[],
  {
    method,
    readiness,
    query,
  }: {
    method: ApiContractMethodFilter;
    readiness: ApiContractReadinessFilter;
    query: string;
  },
) {
  const normalizedQuery = query.trim().toLowerCase();

  return endpoints.filter((endpoint) => {
    const methodMatches = method === "all" || endpoint.method === method;
    const readinessMatches =
      readiness === "all" ||
      (readiness === "needs-review" && needsReview(endpoint.readinessTone)) ||
      (readiness === "ready" && endpoint.readinessTone === "clear");
    const queryMatches =
      !normalizedQuery || endpoint.searchText.includes(normalizedQuery);

    return methodMatches && readinessMatches && queryMatches;
  });
}

export function getDefaultApiContractEndpointId(endpoints: ApiContractEndpoint[]) {
  return (
    endpoints.find((endpoint) => needsReview(endpoint.readinessTone))?.id ??
    endpoints[0]?.id ??
    null
  );
}

function buildEndpoint(
  endpoint: EndpointCatalogItem,
  context: ContractContext,
): ApiContractEndpoint {
  const { sample, sourceHref: getSourceHref, ...contract } = endpoint;
  const readinessChecks = buildReadinessChecks(endpoint, context);
  const readinessTone = getWorstTone(readinessChecks.map((check) => check.tone));
  const readinessLabel = needsReview(readinessTone) ? "Needs review" : "Ready";
  const samplePayload = JSON.stringify(sample(context), null, 2);
  const sourceHref = getSourceHref(context);

  return withSearchText({
    ...contract,
    samplePayload,
    sourceHref,
    readinessChecks,
    readinessLabel,
    readinessTone,
  });
}

function buildReadinessChecks(
  endpoint: EndpointCatalogItem,
  context: ContractContext,
): ApiContractReadinessCheck[] {
  const missingScopes = endpoint.requiredScopes.filter(
    (scope) => !context.activeScopes.has(scope),
  );
  const checks: ApiContractReadinessCheck[] = [
    endpoint.requiredScopes.length
      ? {
          id: `${endpoint.id}-scope`,
          label: "Credential scope",
          state: missingScopes.length ? "Missing scope" : "Covered",
          detail: missingScopes.length
            ? `Active partner credentials are missing ${missingScopes.join(", ")}.`
            : `${endpoint.requiredScopes.join(", ")} covered by an active credential.`,
          tone: missingScopes.length ? "attention" : "clear",
          sourceHref: "/admin/partner-readiness",
        }
      : {
          id: `${endpoint.id}-session`,
          label: "Session boundary",
          state: "Session gated",
          detail: endpoint.authDetail,
          tone: "clear",
        },
    {
      id: `${endpoint.id}-shape`,
      label: "Request and response shape",
      state: "Documented",
      detail: `${endpoint.parameters.length} request fields and ${endpoint.responses.length} response states are documented.`,
      tone: "clear",
    },
    {
      id: `${endpoint.id}-safety`,
      label: "Safety boundary",
      state: "Guarded",
      detail: endpoint.safety[0] ?? "Safety boundary documented.",
      tone: "clear",
    },
  ];

  if (endpoint.id === "export-latest") {
    checks.push({
      id: "export-latest-package",
      label: "Export package",
      state: context.latestExportRun ? "Checksum recorded" : "Package missing",
      detail: context.latestExportRun
        ? `Latest ${context.latestExportRun.format} package has checksum ${context.latestExportRun.checksum}.`
        : "Generate an export package before exposing latest export metadata.",
      tone: context.latestExportRun ? "clear" : "attention",
      sourceHref: context.latestExportRun
        ? buildAdminExportRunDetailHref(context.latestExportRun.id, returnSource)
        : "/admin/partner-readiness",
    });
  }

  if (endpoint.id === "integration-status") {
    const failingCheck = context.readiness.integrationChecks.find((check) =>
      isFailing(check.status),
    );

    checks.push({
      id: "integration-status-check",
      label: "Integration check",
      state: failingCheck ? formatIntegrationLabel(failingCheck.status) : "Passing",
      detail: failingCheck?.summary ?? "No failing integration checks are visible.",
      tone: failingCheck ? "attention" : "clear",
      sourceHref: failingCheck
        ? buildAdminIntegrationCheckDetailHref(failingCheck.id, returnSource)
        : "/admin/integrations",
    });
  }

  return checks;
}

function withSearchText<T extends Omit<ApiContractEndpoint, "searchText">>(
  endpoint: T,
): T & { searchText: string } {
  const values = [
    endpoint.id,
    endpoint.method,
    endpoint.path,
    endpoint.title,
    endpoint.purpose,
    endpoint.owner,
    endpoint.authMode,
    endpoint.consumer,
    endpoint.sourceLabel,
    endpoint.readinessLabel,
    ...endpoint.requiredScopes,
    ...endpoint.parameters.flatMap((parameter) => [
      parameter.name,
      parameter.type,
      parameter.description,
    ]),
    ...endpoint.responses.flatMap((response) => [
      response.status,
      response.label,
      response.description,
      ...response.fields,
    ]),
    ...endpoint.readinessChecks.flatMap((check) => [
      check.label,
      check.state,
      check.detail,
    ]),
  ];

  return {
    ...endpoint,
    searchText: values.join(" ").toLowerCase(),
  };
}

function getActiveScopes(readiness: PartnerReadinessApiResponse, now: Date) {
  const scopes = new Set<string>();

  for (const apiKey of readiness.apiKeys) {
    if (!isPartnerApiKeyActive(apiKey, now)) {
      continue;
    }

    for (const scope of apiKey.scopes) {
      scopes.add(scope.trim());
    }
  }

  return scopes;
}

function uniqueScopes(endpoints: ApiContractEndpoint[]) {
  return Array.from(new Set(endpoints.flatMap((endpoint) => endpoint.requiredScopes)));
}

function latestExport(exportRuns: PartnerExportRunApiResponse[]) {
  return [...exportRuns].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  )[0];
}

function getWorstTone(tones: ApiContractTone[]): ApiContractTone {
  if (tones.includes("blocked")) {
    return "blocked";
  }

  if (tones.includes("attention")) {
    return "attention";
  }

  if (tones.includes("info")) {
    return "info";
  }

  return "clear";
}

function needsReview(tone: ApiContractTone) {
  return tone === "attention" || tone === "blocked";
}

function isFailing(status: string) {
  const normalized = status.trim().toLowerCase();

  return (
    normalized.includes("fail") ||
    normalized.includes("error") ||
    normalized.includes("blocked")
  );
}

export function compactApiContractRecord(value: Record<string, unknown>) {
  return compactIntegrationRecord(value);
}
