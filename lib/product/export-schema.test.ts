import { describe, expect, it } from "vitest";

import type {
  AdminAuditEventApiResponse,
  PartnerExportRunApiResponse,
  PartnerReadinessApiResponse,
} from "@/lib/demo/api-types";
import {
  buildExportSchemaModel,
  filterExportSchemaSections,
  getDefaultExportSchemaSectionId,
  getExportSchemaSectionStateLabel,
  getExportSchemaShape,
} from "@/lib/product/export-schema";
import { formatIntegrationDateTime } from "@/lib/product/integration-operations";

function makeExportRun(
  overrides: Partial<PartnerExportRunApiResponse> = {},
): PartnerExportRunApiResponse {
  return {
    id: overrides.id ?? 31,
    format: overrides.format ?? "json",
    scope: overrides.scope ?? { district: "Tshwane North" },
    recordCounts: overrides.recordCounts ?? { clinics: 12, reports: 4 },
    checksum: overrides.checksum ?? "sha256:export-proof",
    payload: overrides.payload ?? { generatedBy: "test" },
    createdAt: overrides.createdAt ?? "2026-05-24T10:00:00.000Z",
  };
}

function makeReadiness(
  overrides: Partial<PartnerReadinessApiResponse> = {},
): PartnerReadinessApiResponse {
  return {
    apiKeys: overrides.apiKeys ?? [],
    webhookSubscriptions: overrides.webhookSubscriptions ?? [],
    webhookEvents: overrides.webhookEvents ?? [],
    exportRuns: overrides.exportRuns ?? [makeExportRun()],
    integrationChecks: overrides.integrationChecks ?? [],
  };
}

function makeAuditEvent(
  overrides: Partial<AdminAuditEventApiResponse> = {},
): AdminAuditEventApiResponse {
  return {
    id: overrides.id ?? 41,
    clinicId: overrides.clinicId ?? "clinic-001",
    actorName: overrides.actorName ?? "System Admin",
    eventType: overrides.eventType ?? "export.generated",
    summary: overrides.summary ?? "Export package generated",
    createdAt: overrides.createdAt ?? "2026-05-24T10:05:00.000Z",
    actorUserId: overrides.actorUserId ?? 1,
    actorRole: overrides.actorRole ?? "system_admin",
    entityType: overrides.entityType ?? "partner_export_run",
    entityId: overrides.entityId ?? "31",
    metadata: overrides.metadata ?? { checksum: "sha256:export-proof" },
  };
}

describe("buildExportSchemaModel", () => {
  it("builds selectable schema sections with field contracts and current source proof", () => {
    const model = buildExportSchemaModel({
      readiness: makeReadiness(),
      auditEvents: [makeAuditEvent()],
    });
    const metadata = model.sections.find((section) => section.id === "metadata");
    const clinics = model.sections.find((section) => section.id === "clinics");

    expect(model.summaryMetrics.map((metric) => metric.label)).toEqual([
      "Payload sections",
      "Schema fields",
      "Review sections",
      "Source proofs",
    ]);
    expect(metadata).toMatchObject({
      sourceHref: "/admin/integrations/export-runs/31?from=admin-export-schema",
      sourceLabel: "Partner export run",
      proofLabel: "sha256:export-proof",
    });
    expect(clinics).toMatchObject({
      title: "Clinic operating state",
      tone: "attention",
      sourceHref: "/admin/reporting-coverage",
    });
    expect(clinics?.fields.map((field) => field.name)).toEqual([
      "id",
      "name",
      "facilityCode",
      "status",
      "freshness",
      "reason",
    ]);
    expect(clinics?.fields.find((field) => field.name === "status")).toMatchObject({
      type: "operational | degraded | non_functional | unknown",
      requirement: "Required",
      validationState: "Enum constrained",
    });
  });

  it("keeps the raw schema shape aligned to the exported top-level payload", () => {
    const model = buildExportSchemaModel({
      readiness: makeReadiness(),
      auditEvents: [makeAuditEvent()],
    });
    const shape = getExportSchemaShape(model);

    expect(Object.keys(shape)).toEqual([
      "generatedAt",
      "district",
      "province",
      "clinics",
      "leads",
      "alerts",
      "reports",
    ]);
    expect(shape).toMatchObject({
      generatedAt: "ISO-8601 timestamp",
      clinics: [
        {
          status: "operational | degraded | non_functional | unknown",
          freshness: "fresh | needs_confirmation | stale | unknown",
        },
      ],
    });
    expect(shape).not.toHaveProperty("metadata");
  });

  it("uses the latest export or alert audit event for alert trail proof", () => {
    const model = buildExportSchemaModel({
      readiness: makeReadiness(),
      auditEvents: [
        makeAuditEvent({
          id: 41,
          eventType: "partner.export_generated",
          entityType: "partner_export_run",
          createdAt: "2026-05-24T10:05:00.000Z",
        }),
        makeAuditEvent({
          id: 99,
          eventType: "auth.login.succeeded",
          entityType: "user_session",
          createdAt: "2026-05-24T11:00:00.000Z",
        }),
      ],
    });

    expect(model.sections.find((section) => section.id === "alerts")).toMatchObject({
      sourceHref: "/admin/audit-evidence/events/41?from=admin-export-schema",
      proofLabel: formatIntegrationDateTime("2026-05-24T10:05:00.000Z"),
    });
  });

  it("promotes review sections by default and filters without changing selection implicitly", () => {
    const model = buildExportSchemaModel({
      readiness: makeReadiness(),
      auditEvents: [makeAuditEvent()],
    });

    expect(getDefaultExportSchemaSectionId(model.sections)).toBe("clinics");
    expect(
      filterExportSchemaSections(model.sections, {
        state: "needs-review",
        query: "reviewed reports",
      }).map((section) => section.id),
    ).toEqual(["reports"]);
    expect(getDefaultExportSchemaSectionId(model.sections)).toBe("clinics");
  });

  it("keeps status labels aligned with state filters", () => {
    const model = buildExportSchemaModel({
      readiness: makeReadiness(),
      auditEvents: [makeAuditEvent()],
    });

    expect(
      model.sections.map((section) => ({
        id: section.id,
        label: getExportSchemaSectionStateLabel(section),
      })),
    ).toEqual([
      { id: "metadata", label: "Ready" },
      { id: "clinics", label: "Needs review" },
      { id: "leads", label: "Info" },
      { id: "alerts", label: "Ready" },
      { id: "reports", label: "Needs review" },
    ]);
    expect(
      filterExportSchemaSections(model.sections, {
        state: "ready",
        query: "",
      }).map((section) => section.id),
    ).toEqual(["metadata", "alerts"]);
  });

  it("records permissive source references for the export schema workspace", () => {
    const model = buildExportSchemaModel({
      readiness: makeReadiness(),
      auditEvents: [makeAuditEvent()],
    });

    expect(model.sourceReferences.map((reference) => reference.source)).toEqual([
      "OpenMetadata data contract schema table",
      "OpenMetadata contract quality card",
    ]);
    expect(model.sourceReferences.map((reference) => reference.license)).toEqual([
      "Apache-2.0",
      "Apache-2.0",
    ]);
    expect(model.sourceReferences.every((reference) => reference.sourcePath)).toBe(true);
  });
});
