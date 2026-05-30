import { describe, expect, it } from "vitest";

import type {
  AdminAuditEventApiResponse,
  AdminUserAccessApiResponse,
  PartnerExportRunApiResponse,
  PartnerWebhookEventApiResponse,
} from "@/lib/workspace/api-types";
import {
  buildAuditEvidenceViewModel,
  filterAuditEvidenceRows,
  getDefaultAuditEvidenceRowId,
} from "@/lib/product/audit-evidence";

const users: AdminUserAccessApiResponse[] = [
  {
    userId: 2,
    email: "ops-admin@clinicpulse.local",
    displayName: "Ops Admin",
    createdAt: "2026-05-20T06:00:00.000Z",
    role: "org_admin",
    organisationId: 1,
    district: "Tshwane North District",
    lastSeenAt: "2026-05-24T09:00:00.000Z",
  },
];

const auditEvents: AdminAuditEventApiResponse[] = [
  {
    id: 10,
    clinicId: "clinic-001",
    actorName: "District Lead",
    actorRole: "district_manager",
    eventType: "report.reviewed",
    summary: "Report accepted after district review.",
    createdAt: "2026-05-24T08:00:00.000Z",
    entityType: "report",
    entityId: "7",
    metadata: { reviewState: "accepted" },
  },
  {
    id: 11,
    clinicId: "clinic-002",
    actorName: "Ops Admin",
    actorRole: "org_admin",
    eventType: "auth.role_changed",
    summary: "Organisation administrator role assigned.",
    createdAt: "2026-05-24T09:00:00.000Z",
    entityType: "user",
    entityId: "2",
    metadata: { role: "org_admin" },
  },
  {
    id: 12,
    clinicId: "clinic-003",
    actorName: null,
    actorRole: null,
    eventType: "clinic.status_marked_stale",
    summary: "Clinic status crossed the freshness threshold.",
    createdAt: "2026-05-23T09:00:00.000Z",
    metadata: { freshness: "stale" },
  },
];

const exportRuns: PartnerExportRunApiResponse[] = [
  {
    id: 4,
    organisationId: 1,
    requestedByUserId: 2,
    format: "json",
    scope: { district: "Tshwane North District" },
    recordCounts: { clinics: 12, reports: 5 },
    checksum: "sha256:abc123",
    payload: { exportedAt: "2026-05-24T10:00:00.000Z" },
    createdAt: "2026-05-24T10:00:00.000Z",
  },
];

const webhookEvents: PartnerWebhookEventApiResponse[] = [
  {
    id: 5,
    subscriptionId: 3,
    eventType: "partner.webhook_dispatched",
    payload: { reportId: 7 },
    metadata: { statusCode: 500 },
    status: "failed",
    attemptCount: 3,
    lastError: "Partner endpoint returned 500.",
    createdAt: "2026-05-25T07:00:00.000Z",
    deliveredAt: null,
  },
  {
    id: 6,
    subscriptionId: 3,
    eventType: "partner.webhook_test",
    payload: {},
    metadata: { preview: true },
    status: "preview_only",
    attemptCount: 0,
    lastError: null,
    createdAt: "2026-05-25T06:00:00.000Z",
    deliveredAt: null,
  },
];

describe("buildAuditEvidenceViewModel", () => {
  it("builds a selected-row evidence workspace model with canonical source links", () => {
    const viewModel = buildAuditEvidenceViewModel({
      auditEvents,
      exportRuns,
      webhookEvents,
      users,
    });

    expect(viewModel.metrics.map((metric) => metric.id)).toEqual([
      "evidence-volume",
      "review-load",
      "partner-handoffs",
      "access-events",
    ]);
    expect(viewModel.rows).toHaveLength(6);
    expect(viewModel.rows[0]).toMatchObject({
      id: "webhook-event-5",
      lane: "webhook",
      sourceLabel: "Webhook event",
      stateLabel: "Failed",
      stateTone: "blocked",
      sourceHref: "/admin/integrations/webhook-events/5?from=admin-audit-evidence",
    });
    expect(getDefaultAuditEvidenceRowId(viewModel.rows)).toBe("webhook-event-5");

    expect(viewModel.rows.find((row) => row.id === "audit-event-11")).toMatchObject({
      lane: "access",
      sourceHref: "/admin/audit-evidence/events/11?from=admin-audit-evidence",
      actorLabel: "Ops Admin",
      entityLabel: "user 2",
      stateTone: "attention",
    });
    expect(viewModel.rows.find((row) => row.id === "export-run-4")).toMatchObject({
      lane: "export",
      sourceHref: "/admin/integrations/export-runs/4?from=admin-audit-evidence",
      actorLabel: "Ops Admin",
      stateLabel: "Checksum recorded",
    });
    expect(viewModel.packets.map((packet) => packet.label)).toEqual([
      "Audit trail",
      "Partner exports",
      "Webhook delivery",
    ]);
    expect(viewModel.sourceReferences.map((reference) => reference.source)).toEqual([
      "Supabase Audit Logs",
      "Infisical Permission Audit",
      "Unkey log details",
      "Dub activity metadata",
      "Twenty activity timeline",
    ]);
  });

  it("filters evidence rows by lane, review state, and search text", () => {
    const viewModel = buildAuditEvidenceViewModel({
      auditEvents,
      exportRuns,
      webhookEvents,
      users,
    });

    expect(
      filterAuditEvidenceRows(viewModel.rows, {
        activeLane: "export",
        stateFilter: "all",
        query: "",
      }).map((row) => row.id),
    ).toEqual(["export-run-4"]);

    expect(
      filterAuditEvidenceRows(viewModel.rows, {
        activeLane: "all",
        stateFilter: "needs-review",
        query: "",
      }).map((row) => row.id),
    ).toEqual(["webhook-event-5", "audit-event-11", "audit-event-12"]);

    expect(
      filterAuditEvidenceRows(viewModel.rows, {
        activeLane: "all",
        stateFilter: "all",
        query: "ops admin",
      }).map((row) => row.id),
    ).toEqual(["audit-event-11", "export-run-4"]);
  });
});
