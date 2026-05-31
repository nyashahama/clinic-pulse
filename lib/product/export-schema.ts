import type {
  AdminAuditEventApiResponse,
  PartnerExportRunApiResponse,
  PartnerReadinessApiResponse,
} from "@/lib/demo/api-types";
import {
  buildAdminAuditEventDetailHref,
  buildAdminExportRunDetailHref,
} from "@/lib/product/admin-detail-routes";
import {
  compactIntegrationRecord,
  formatIntegrationDateTime,
} from "@/lib/product/integration-operations";

export type ExportSchemaTone = "clear" | "attention" | "blocked" | "info";

export type ExportSchemaStateFilter = "all" | "needs-review" | "ready" | "info";

export type ExportSchemaField = {
  name: string;
  type: string;
  requirement: "Required" | "Optional";
  constraint: string;
  description: string;
  validationState: string;
  sampleValue: string;
};

export type ExportSchemaSection = {
  id: string;
  title: string;
  description: string;
  recordScope: string;
  sourceLabel: string;
  sourceHref: string;
  sourceKind: "export" | "coverage" | "lead" | "audit" | "report";
  proofLabel: string;
  tone: ExportSchemaTone;
  valueContract: string;
  privacyBoundary: string;
  consumerNote: string;
  fields: ExportSchemaField[];
  rawShape: Record<string, unknown>;
  searchText: string;
};

export type ExportSchemaSummaryMetric = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: ExportSchemaTone;
};

export type ExportSchemaSourceReference = {
  source: string;
  role: string;
  repositoryUrl: string;
  sourcePath: string;
  license: "Apache-2.0";
};

export type ExportSchemaModel = {
  sections: ExportSchemaSection[];
  summaryMetrics: ExportSchemaSummaryMetric[];
  valueGuardrails: string[];
  sourceReferences: ExportSchemaSourceReference[];
};

type BuildExportSchemaModelInput = {
  readiness: PartnerReadinessApiResponse;
  auditEvents: AdminAuditEventApiResponse[];
};

type ExportContext = {
  latestExportRun?: PartnerExportRunApiResponse;
  latestAuditEvent?: AdminAuditEventApiResponse;
};

type SectionDefinition = Omit<
  ExportSchemaSection,
  "sourceHref" | "proofLabel" | "tone" | "searchText"
> & {
  sourceHref: (context: ExportContext) => string;
  proofLabel: (context: ExportContext) => string;
  tone: (context: ExportContext) => ExportSchemaTone;
};

const returnSource = "admin-export-schema";

const sourceReferences: ExportSchemaSourceReference[] = [
  {
    source: "OpenMetadata data contract schema table",
    role: "Column name, type, constraint, and validation-status patterns adapted into ClinicPulse export field contracts.",
    repositoryUrl: "https://github.com/open-metadata/OpenMetadata",
    sourcePath:
      "openmetadata-ui/src/main/resources/ui/src/components/DataContract/ContractSchemaTable/ContractSchemaTable.component.tsx",
    license: "Apache-2.0",
  },
  {
    source: "OpenMetadata contract quality card",
    role: "Contract status and quality/result summary patterns adapted into section-level proof and review states.",
    repositoryUrl: "https://github.com/open-metadata/OpenMetadata",
    sourcePath:
      "openmetadata-ui/src/main/resources/ui/src/components/DataContract/ContractQualityCard/ContractQualityCard.component.tsx",
    license: "Apache-2.0",
  },
];

const sectionDefinitions: SectionDefinition[] = [
  {
    id: "metadata",
    title: "Package metadata",
    description: "Identifies when the export was generated and which district scope it covers.",
    recordScope: "One package header",
    sourceLabel: "Partner export run",
    sourceKind: "export",
    valueContract: "ISO timestamp plus canonical district and province names.",
    privacyBoundary: "No person-level data appears in the package header.",
    consumerNote: "Consumers should reject a package when the checksum or generatedAt proof is missing.",
    fields: [
      field("generatedAt", "ISO-8601 timestamp", "Required", "format: date-time", "Export generation timestamp.", "Format constrained", "2026-05-24T10:00:00.000Z"),
      field("district", "string", "Required", "canonical district", "District represented by the package.", "Source constrained", "Tshwane North"),
      field("province", "string", "Required", "canonical province", "Province represented by the package.", "Source constrained", "Gauteng"),
    ],
    rawShape: {
      generatedAt: "ISO-8601 timestamp",
      district: "District name represented in the package",
      province: "Province name represented in the package",
    },
    sourceHref: ({ latestExportRun }) =>
      latestExportRun
        ? buildAdminExportRunDetailHref(latestExportRun.id, returnSource)
        : "/admin/partner-readiness",
    proofLabel: ({ latestExportRun }) => latestExportRun?.checksum ?? "No export package",
    tone: ({ latestExportRun }) => (latestExportRun ? "clear" : "attention"),
  },
  {
    id: "clinics",
    title: "Clinic operating state",
    description: "Carries the current trusted facility record that downstream teams reconcile.",
    recordScope: "One row per clinic",
    sourceLabel: "Reporting coverage",
    sourceKind: "coverage",
    valueContract: "Status and freshness enums match the reporting coverage review surface.",
    privacyBoundary: "Reporter identity and internal audit metadata are excluded.",
    consumerNote: "Consumers should treat stale or needs-confirmation freshness as review state, not confirmed closure.",
    fields: [
      field("id", "string", "Required", "primary key", "Clinic identifier.", "Key constrained", "clinic-001"),
      field("name", "string", "Required", "facility display name", "Clinic display name.", "Source constrained", "Mamelodi Clinic"),
      field("facilityCode", "string", "Required", "facility code", "Government facility code.", "Source constrained", "GT-TSH-001"),
      field("status", "operational | degraded | non_functional | unknown", "Required", "enum", "Trusted operating state.", "Enum constrained", "operational"),
      field("freshness", "fresh | needs_confirmation | stale | unknown", "Required", "enum", "Evidence freshness state.", "Enum constrained", "needs_confirmation"),
      field("reason", "string", "Optional", "human-readable context", "Current operating-state reason.", "Review constrained", "Cold-chain stockout reported"),
    ],
    rawShape: {
      clinics: [
        {
          id: "Clinic identifier",
          name: "Clinic display name",
          facilityCode: "Facility code",
          status: "operational | degraded | non_functional | unknown",
          freshness: "fresh | needs_confirmation | stale | unknown",
          reason: "Current operating-state reason",
        },
      ],
    },
    sourceHref: () => "/admin/reporting-coverage",
    proofLabel: () => "Coverage ledger",
    tone: () => "attention",
  },
  {
    id: "leads",
    title: "Stakeholder leads",
    description: "Shows partner and operator contacts without exposing reporter credentials.",
    recordScope: "One row per captured lead",
    sourceLabel: "Admin leads",
    sourceKind: "lead",
    valueContract: "Lead status stays in new, contacted, scheduled, or completed.",
    privacyBoundary: "Captured stakeholder contacts stay separate from reporter identities.",
    consumerNote: "Downstream teams should use workEmail for follow-up and status for workflow routing.",
    fields: [
      field("name", "string", "Required", "stakeholder name", "Stakeholder display name.", "Source constrained", "Thandi Mabuza"),
      field("workEmail", "email", "Required", "format: email", "Stakeholder work email.", "Format constrained", "thandi.mabuza@gautenghealth.gov.za"),
      field("organization", "string", "Required", "organisation", "Stakeholder organisation.", "Source constrained", "Gauteng Health"),
      field("interest", "string", "Required", "workflow interest", "Workflow interest.", "Source constrained", "District operations"),
      field("status", "new | contacted | scheduled | completed", "Required", "enum", "Lead workflow status.", "Enum constrained", "scheduled"),
      field("createdAt", "ISO-8601 timestamp", "Required", "format: date-time", "Lead capture timestamp.", "Format constrained", "2026-05-24T08:15:00.000Z"),
    ],
    rawShape: {
      leads: [
        {
          name: "Stakeholder name",
          workEmail: "Stakeholder work email",
          organization: "Organisation",
          interest: "Workflow interest",
          status: "new | contacted | scheduled | completed",
          createdAt: "ISO-8601 timestamp",
        },
      ],
    },
    sourceHref: () => "/admin",
    proofLabel: () => "Stakeholder activity",
    tone: () => "info",
  },
  {
    id: "alerts",
    title: "Alert trail",
    description: "Preserves operational warning events as reviewable context for the handoff.",
    recordScope: "Audit and alert summaries",
    sourceLabel: "Audit evidence",
    sourceKind: "audit",
    valueContract: "Every alert keeps a human summary and source metadata for review.",
    privacyBoundary: "Alert summaries are included without raw secrets or private credentials.",
    consumerNote: "Consumers should use alerts as context for triage, not as the primary clinic state.",
    fields: [
      field("eventType", "string", "Required", "audit event type", "Operational event type.", "Source constrained", "export.generated"),
      field("summary", "string", "Required", "human summary", "Human-readable alert summary.", "Review constrained", "Export package generated"),
      field("createdAt", "ISO-8601 timestamp", "Required", "format: date-time", "Event timestamp.", "Format constrained", "2026-05-24T10:05:00.000Z"),
      field("metadata", "object", "Optional", "source metadata", "Reviewable supporting metadata.", "Proof constrained", "{ checksum: \"sha256:...\" }"),
    ],
    rawShape: {
      alerts: ["Audit and alert events included in the operations package"],
    },
    sourceHref: ({ latestAuditEvent }) =>
      latestAuditEvent
        ? buildAdminAuditEventDetailHref(latestAuditEvent.id, returnSource)
        : "/admin/audit-evidence",
    proofLabel: ({ latestAuditEvent }) =>
      latestAuditEvent ? formatIntegrationDateTime(latestAuditEvent.createdAt) : "Audit trail",
    tone: () => "clear",
  },
  {
    id: "reports",
    title: "Reviewed reports",
    description: "Exports reports after governance review rather than raw field submissions.",
    recordScope: "One row per report",
    sourceLabel: "Report review",
    sourceKind: "report",
    valueContract: "Report state is downstream-safe only after review and source attribution.",
    privacyBoundary: "Reporter credentials are not part of the export contract.",
    consumerNote: "Consumers should use receivedAt and source to reconcile report provenance.",
    fields: [
      field("id", "number", "Required", "report identifier", "Report identifier.", "Key constrained", "141"),
      field("clinicId", "string", "Required", "clinic foreign key", "Clinic identifier.", "Relationship constrained", "clinic-001"),
      field("status", "operational | degraded | non_functional | unknown", "Required", "enum", "Reported operating status.", "Enum constrained", "degraded"),
      field("reason", "string", "Optional", "submitted context", "Submitted context.", "Review constrained", "Long queue and medicine stockout"),
      field("receivedAt", "ISO-8601 timestamp", "Required", "format: date-time", "Server receipt timestamp.", "Format constrained", "2026-05-24T09:15:00.000Z"),
      field("source", "field_worker | clinic_coordinator | demo_control | seed", "Required", "enum", "Report source.", "Enum constrained", "field_worker"),
    ],
    rawShape: {
      reports: [
        {
          id: "Report identifier",
          clinicId: "Clinic identifier",
          status: "Reported operating status",
          reason: "Submitted context",
          receivedAt: "ISO-8601 timestamp",
          source: "Report source",
        },
      ],
    },
    sourceHref: () => "/admin/reporting-coverage",
    proofLabel: () => "Report review queue",
    tone: () => "attention",
  },
];

const valueGuardrails = [
  "Clinic status: operational, degraded, non_functional, unknown",
  "Freshness: fresh, needs_confirmation, stale, unknown",
  "Lead status: new, contacted, scheduled, completed",
  "Reports: exported only with source and receivedAt attribution",
];

export function buildExportSchemaModel({
  readiness,
  auditEvents,
}: BuildExportSchemaModelInput): ExportSchemaModel {
  const context: ExportContext = {
    latestExportRun: latestExport(readiness.exportRuns),
    latestAuditEvent: latestExportOrAlertAuditEvent(auditEvents),
  };
  const sections = sectionDefinitions.map((section) => buildSection(section, context));
  const reviewSections = sections.filter((section) => sectionNeedsReview(section)).length;
  const fieldCount = sections.reduce((total, section) => total + section.fields.length, 0);
  const proofCount = sections.filter((section) => section.sourceHref).length;

  return {
    sections,
    summaryMetrics: [
      {
        id: "payload-sections",
        label: "Payload sections",
        value: String(sections.length),
        detail: "Metadata, clinics, leads, alerts, and reports.",
        tone: "info",
      },
      {
        id: "schema-fields",
        label: "Schema fields",
        value: String(fieldCount),
        detail: "Field-level constraints and examples.",
        tone: "clear",
      },
      {
        id: "review-sections",
        label: "Review sections",
        value: String(reviewSections),
        detail: "Sections requiring governance attention.",
        tone: reviewSections ? "attention" : "clear",
      },
      {
        id: "source-proofs",
        label: "Source proofs",
        value: String(proofCount),
        detail: "Every section keeps source evidence.",
        tone: proofCount === sections.length ? "clear" : "attention",
      },
    ],
    valueGuardrails,
    sourceReferences,
  };
}

export function getDefaultExportSchemaSectionId(sections: ExportSchemaSection[]) {
  return sections.find(sectionNeedsReview)?.id ?? sections[0]?.id ?? null;
}

export function getExportSchemaSectionStateLabel(section: ExportSchemaSection) {
  if (sectionNeedsReview(section)) {
    return "Needs review";
  }

  if (section.tone === "info") {
    return "Info";
  }

  return "Ready";
}

export function filterExportSchemaSections(
  sections: ExportSchemaSection[],
  {
    state,
    query,
  }: {
    state: ExportSchemaStateFilter;
    query: string;
  },
) {
  const normalizedQuery = query.trim().toLowerCase();

  return sections.filter((section) => {
    const stateMatches =
      state === "all" ||
      (state === "needs-review" && sectionNeedsReview(section)) ||
      (state === "ready" && section.tone === "clear") ||
      (state === "info" && section.tone === "info");
    const queryMatches = !normalizedQuery || section.searchText.includes(normalizedQuery);

    return stateMatches && queryMatches;
  });
}

export function getExportSchemaShape(model: ExportSchemaModel) {
  return Object.assign({}, ...model.sections.map((section) => section.rawShape));
}

function buildSection(
  definition: SectionDefinition,
  context: ExportContext,
): ExportSchemaSection {
  const { sourceHref, proofLabel, tone, ...section } = definition;
  const builtSection = {
    ...section,
    sourceHref: sourceHref(context),
    proofLabel: proofLabel(context),
    tone: tone(context),
  };

  return {
    ...builtSection,
    searchText: [
      builtSection.id,
      builtSection.title,
      builtSection.description,
      builtSection.recordScope,
      builtSection.sourceLabel,
      builtSection.proofLabel,
      builtSection.valueContract,
      builtSection.privacyBoundary,
      builtSection.consumerNote,
      ...builtSection.fields.flatMap((field) => [
        field.name,
        field.type,
        field.requirement,
        field.constraint,
        field.description,
        field.validationState,
        field.sampleValue,
      ]),
    ]
      .join(" ")
      .toLowerCase(),
  };
}

function field(
  name: string,
  type: string,
  requirement: ExportSchemaField["requirement"],
  constraint: string,
  description: string,
  validationState: string,
  sampleValue: string,
): ExportSchemaField {
  return {
    name,
    type,
    requirement,
    constraint,
    description,
    validationState,
    sampleValue,
  };
}

function latestExport(exportRuns: PartnerExportRunApiResponse[]) {
  return [...exportRuns].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  )[0];
}

function latestExportOrAlertAuditEvent(auditEvents: AdminAuditEventApiResponse[]) {
  return auditEvents.filter(isExportOrAlertAuditEvent).sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  )[0];
}

function sectionNeedsReview(section: ExportSchemaSection) {
  return section.tone === "attention" || section.tone === "blocked";
}

function isExportOrAlertAuditEvent(event: AdminAuditEventApiResponse) {
  const eventType = event.eventType.toLowerCase();
  const entityType = event.entityType?.toLowerCase() ?? "";

  return (
    eventType.startsWith("partner.export") ||
    eventType.startsWith("alert.") ||
    entityType.includes("export")
  );
}

export function compactExportSchemaRecord(value: Record<string, unknown>) {
  return compactIntegrationRecord(value);
}
