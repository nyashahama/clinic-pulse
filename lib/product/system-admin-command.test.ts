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

    expect(model.header.title).toBe("Platform Operations Cockpit");
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
    expect(model.healthMonitors.map((monitor) => monitor.id)).toEqual([
      "tenant-health",
      "ingestion-pressure",
      "security-posture",
      "audit-readiness",
    ]);
  });

  test("prioritizes a single active operational case with real destination links", () => {
    const model = buildSystemAdminCommandModel(baseInput);

    expect(model.activeCase).toMatchObject({
      id: "ingestion-review",
      href: "/admin/data-ingestion",
      tone: "attention",
      primaryActionLabel: "Open data ingestion",
    });
    expect(model.activeCase.progress).toMatchObject({
      label: "Open signals",
      value: "3",
    });
    expect(model.operationQueue[0]).toMatchObject({
      id: "ingestion-review",
      href: "/admin/data-ingestion",
    });
    expect(model.evidenceRows.map((row) => row.href)).toEqual([
      "/admin/audit-evidence",
      "/admin/security",
      "/admin/integrations",
      "/admin/tenant-health",
      "/admin/partner-readiness",
    ]);
  });

  test("builds a cockpit workflow instead of a generic command brief", () => {
    const model = buildSystemAdminCommandModel(baseInput);

    expect(model.activeCase.summary).toBe("3 ingestion signals need review");
    expect(model.activeCase.nextStep).toContain("Open Data ingestion");
    expect(model.operationQueue.map((item) => item.id)).toEqual([
      "ingestion-review",
      "tenant-health",
      "security-access",
      "audit-evidence",
      "partner-readiness",
    ]);
    expect(model.reliabilityTimeline.map((item) => item.label)).toEqual([
      "Sync",
      "Ingestion",
      "Security",
      "Partner",
    ]);
  });
});
