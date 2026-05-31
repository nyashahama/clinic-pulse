import { describe, expect, test } from "vitest";

import { buildSystemAdminCommandModel } from "@/lib/product/system-admin-command";

const baseInput = {
  clinicCount: 4,
  staleClinicCount: 2,
  queuedReports: 0,
  pendingReviewCount: 1,
  activeAlertCount: 2,
  auditEventCount: 13,
  leadStatusCount: { new: 1, contacted: 1, scheduled: 0, completed: 0 },
  partnerReadiness: {
    severity: "clear" as const,
    metrics: [
      { label: "API keys", value: "2", tone: "clear" as const },
      { label: "Webhooks", value: "3", tone: "clear" as const },
    ],
  },
  syncSummary: {
    lastSyncAt: "2026-05-26T09:30:00.000Z",
    pendingOfflineReports: 0,
    validationFailures: 0,
    conflictsNeedingAttention: 0,
    staleClinics: 2,
    needsConfirmationClinics: 0,
  },
};

describe("buildSystemAdminCommandModel", () => {
  test("builds a referenced platform command surface from current admin pressure", () => {
    const model = buildSystemAdminCommandModel(baseInput);

    expect(model.header.title).toBe("Platform Command Console");
    expect(model.references.map((reference) => reference.source)).toEqual([
      "Supabase Studio",
      "shadcn dashboard",
      "Unkey audit logs",
      "OpenStatus",
      "Trigger.dev",
      "Logto console",
      "Cal.com",
      "Infisical",
      "Dub",
      "Twenty",
    ]);
    expect(model.metrics.map((metric) => metric.id)).toEqual([
      "tenant-health",
      "ingestion-pressure",
      "security-posture",
      "audit-readiness",
    ]);
  });

  test("prioritizes action lanes with real destination links", () => {
    const model = buildSystemAdminCommandModel(baseInput);
    const needsAction = model.lanes.find((lane) => lane.id === "needs-action");

    expect(needsAction?.items[0]).toMatchObject({
      href: "/admin/data-ingestion",
      tone: "attention",
    });
    expect(model.evidenceRows.map((row) => row.href)).toEqual([
      "/admin/audit-evidence",
      "/admin/security",
      "/admin/integrations",
      "/admin/tenant-health",
      "/admin/partner-readiness",
    ]);
  });

  test("builds a platform command brief for the shared evidence-command shell", () => {
    const model = buildSystemAdminCommandModel(baseInput);

    expect(model.commandBrief.caseBrief.title).toBe("Platform readiness packet");
    expect(model.commandBrief.metrics.map((metric) => metric.label)).toEqual([
      "Tenant health",
      "Ingestion pressure",
      "Security posture",
      "Audit readiness",
    ]);
    expect(model.commandBrief.decision.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: "/admin/data-ingestion", priority: "primary" }),
        expect.objectContaining({ href: "/admin/tenant-health", priority: "secondary" }),
      ]),
    );
    expect(model.commandBrief.timeline.items.map((item) => item.label)).toEqual([
      "Sync",
      "Ingestion",
      "Security",
      "Partner",
    ]);
  });
});
