import { describe, expect, it } from "vitest";

import {
  buildSecurityEvidenceViewModel,
} from "@/lib/demo/admin-security-evidence";
import type {
  AdminAuditEventApiResponse,
  AdminUserAccessApiResponse,
  PartnerApiKeyApiResponse,
  PartnerWebhookEventApiResponse,
  PartnerWebhookSubscriptionApiResponse,
} from "@/lib/demo/api-types";
import {
  filterSecurityEvidenceRows,
  getDefaultSecurityEvidenceRowId,
} from "@/lib/product/security-evidence";

const now = new Date("2026-05-24T10:00:00.000Z");

const activeApiKey: PartnerApiKeyApiResponse = {
  id: 11,
  organisationId: 7,
  name: "District partner key",
  environment: "demo",
  keyPrefix: "cp_live_1234",
  scopes: ["clinic_status:read", "reports:write"],
  allowedDistricts: ["Tshwane North"],
  expiresAt: "2026-06-24T10:00:00.000Z",
  revokedAt: null,
  lastUsedAt: "2026-05-23T08:00:00.000Z",
  lastUsedIp: "10.0.0.5",
  createdByUserId: 101,
  createdAt: "2026-05-01T08:00:00.000Z",
  updatedAt: "2026-05-23T08:00:00.000Z",
};

const failingSubscription: PartnerWebhookSubscriptionApiResponse = {
  id: 21,
  organisationId: 7,
  name: "Partner callback",
  targetUrl: "https://partner.example.test/webhook",
  eventTypes: ["clinic.status_changed"],
  status: "enabled",
  lastTestedAt: "2026-05-23T08:10:00.000Z",
  lastTestStatus: "failed",
  lastTestMetadata: { statusCode: 500 },
  lastError: "500 from partner endpoint",
  createdByUserId: 101,
  createdAt: "2026-05-01T08:00:00.000Z",
  updatedAt: "2026-05-23T08:10:00.000Z",
};

const deliveredWebhookEvent: PartnerWebhookEventApiResponse = {
  id: 22,
  subscriptionId: 21,
  eventType: "clinic.status_changed",
  payload: { clinicId: "clinic-1" },
  metadata: { attempt: 1 },
  status: "delivered",
  attemptCount: 1,
  lastError: null,
  createdAt: "2026-05-23T08:15:00.000Z",
  deliveredAt: "2026-05-23T08:16:00.000Z",
};

const systemAdmin: AdminUserAccessApiResponse = {
  userId: 31,
  email: "system-admin@clinicpulse.local",
  displayName: "System Admin",
  createdAt: "2026-05-01T08:00:00.000Z",
  role: "system_admin",
  organisationId: null,
  district: null,
  lastSeenAt: "2026-05-23T09:00:00.000Z",
};

const reporter: AdminUserAccessApiResponse = {
  userId: 32,
  email: "reporter@clinicpulse.local",
  displayName: "Reporter",
  createdAt: "2026-05-01T08:00:00.000Z",
  role: "reporter",
  organisationId: 7,
  district: "Tshwane North",
  lastSeenAt: "2026-05-23T09:00:00.000Z",
};

const auditEvent: AdminAuditEventApiResponse = {
  id: 41,
  clinicId: "clinic-1",
  actorName: "System Admin",
  actorUserId: 31,
  actorRole: "system_admin",
  eventType: "auth.login.succeeded",
  summary: "System Admin signed in",
  entityType: "user",
  entityId: "31",
  organisationId: 7,
  metadata: { ip: "127.0.0.1" },
  createdAt: "2026-05-23T09:05:00.000Z",
};

describe("buildSecurityEvidenceViewModel", () => {
  it("normalizes credentials, webhook records, privileged users, and access audit events", () => {
    const viewModel = buildSecurityEvidenceViewModel({
      apiKeys: [activeApiKey],
      webhookSubscriptions: [failingSubscription],
      webhookEvents: [deliveredWebhookEvent],
      users: [systemAdmin, reporter],
      auditEvents: [auditEvent],
      now,
    });

    expect(viewModel.metrics.map((metric) => metric.label)).toEqual([
      "Advisor findings",
      "Credential exposure",
      "Webhook delivery",
      "Privileged access",
      "Access audit trail",
    ]);
    expect(viewModel.sourceReferences.map((reference) => reference.source)).toEqual([
      "Unkey audit logs",
      "Infisical",
      "Logto console",
      "Supabase security advisor",
    ]);
    expect(viewModel.rows.map((row) => row.kind)).toEqual([
      "webhook",
      "privileged-access",
      "credential",
      "webhook",
      "audit",
    ]);
    expect(viewModel.rows[0]).toMatchObject({
      id: "webhook-subscription-21",
      sourceHref: "/admin/integrations/webhook-subscriptions/21?from=admin-security",
      subject: "Partner callback",
      stateLabel: "Failed",
      stateTone: "attention",
      sourceLabel: "Webhook subscription",
    });
    expect(viewModel.rows.find((row) => row.id === "credential-11")).toMatchObject({
      sourceHref: "/admin/integrations/api-keys/11?from=admin-security",
      subject: "District partner key",
      sourceLabel: "API key",
      stateLabel: "Active",
      stateTone: "clear",
    });
    expect(viewModel.rows.find((row) => row.id === "privileged-access-31")).toMatchObject({
      sourceHref: "/admin/users-roles/31?from=admin-security",
      subject: "System Admin",
      subjectDetail: "system-admin@clinicpulse.local",
      stateLabel: "Privileged",
      stateTone: "attention",
    });
    expect(viewModel.rows.find((row) => row.id === "audit-41")).toMatchObject({
      sourceHref: "/admin/audit-evidence/events/41?from=admin-security",
      subject: "Auth login succeeded",
      actorLabel: "System Admin",
      sourceLabel: "Audit event",
    });
  });

  it("selects the highest-priority review row by default", () => {
    const viewModel = buildSecurityEvidenceViewModel({
      apiKeys: [activeApiKey],
      webhookSubscriptions: [failingSubscription],
      webhookEvents: [deliveredWebhookEvent],
      users: [systemAdmin],
      auditEvents: [auditEvent],
      now,
    });

    expect(getDefaultSecurityEvidenceRowId(viewModel.rows)).toBe("webhook-subscription-21");
  });

  it("filters rows by lane, state, and search text", () => {
    const viewModel = buildSecurityEvidenceViewModel({
      apiKeys: [activeApiKey],
      webhookSubscriptions: [failingSubscription],
      webhookEvents: [deliveredWebhookEvent],
      users: [systemAdmin],
      auditEvents: [auditEvent],
      now,
    });

    expect(
      filterSecurityEvidenceRows(viewModel.rows, {
        activeKind: "webhook",
        stateFilter: "needs-review",
        query: "500",
      }).map((row) => row.id),
    ).toEqual(["webhook-subscription-21"]);

    expect(
      filterSecurityEvidenceRows(viewModel.rows, {
        activeKind: "all",
        stateFilter: "all",
        query: "system admin",
      }).map((row) => row.id),
    ).toEqual(["privileged-access-31", "audit-41"]);
  });
});
