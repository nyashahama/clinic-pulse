import { describe, expect, it } from "vitest";

import { buildOrgAdminGovernanceWorkbenchModel } from "@/lib/product/org-admin-governance-workbench";

describe("buildOrgAdminGovernanceWorkbenchModel", () => {
  it("prioritizes pending governance reviews ahead of access and evidence work", () => {
    const model = buildOrgAdminGovernanceWorkbenchModel({
      clinicCount: 8,
      staleClinicCount: 2,
      needsConfirmationClinicCount: 1,
      pendingReviewCount: 3,
      queuedOfflineCount: 1,
      activeAlertCount: 2,
      newStakeholderCount: 1,
      followUpStakeholderCount: 2,
      partnerCheckCount: 4,
      partnerSeverity: "attention",
      latestActivityLabel: "01 May, 08:40",
    });

    expect(model.hero.activeBlocker).toBe("3 field reports need governance review");
    expect(model.taskQueue.map((item) => item.id)).toEqual([
      "review-field-evidence",
      "resolve-coverage",
      "review-access",
      "confirm-evidence",
    ]);
    expect(model.readinessStrip[0]).toMatchObject({
      label: "Governance readiness",
      value: "13%",
      tone: "attention",
    });
  });

  it("marks the workbench ready when governance blockers are clear", () => {
    const model = buildOrgAdminGovernanceWorkbenchModel({
      clinicCount: 8,
      staleClinicCount: 0,
      needsConfirmationClinicCount: 0,
      pendingReviewCount: 0,
      queuedOfflineCount: 0,
      activeAlertCount: 0,
      newStakeholderCount: 0,
      followUpStakeholderCount: 0,
      partnerCheckCount: 4,
      partnerSeverity: "clear",
      latestActivityLabel: "01 May, 08:40",
    });

    expect(model.hero.activeBlocker).toBe("No governance blockers");
    expect(model.hero.primaryActionHref).toBe("#coverage-ledger");
    expect(model.readinessStrip[0]).toMatchObject({
      label: "Governance readiness",
      value: "100%",
      tone: "clear",
    });
  });

  it("calls out missing organisation scope when no clinics are available", () => {
    const model = buildOrgAdminGovernanceWorkbenchModel({
      clinicCount: 0,
      staleClinicCount: 0,
      needsConfirmationClinicCount: 0,
      pendingReviewCount: 0,
      queuedOfflineCount: 0,
      activeAlertCount: 0,
      newStakeholderCount: 0,
      followUpStakeholderCount: 0,
      partnerCheckCount: 0,
      partnerSeverity: "clear",
      latestActivityLabel: "No activity yet",
    });

    expect(model.hero.activeBlocker).toBe("No clinics in organisation scope");
    expect(model.readinessStrip[0]).toMatchObject({
      value: "0%",
      tone: "blocked",
    });
  });

  it("uses queued offline reports as coverage blockers with singular wording", () => {
    const model = buildOrgAdminGovernanceWorkbenchModel({
      clinicCount: 8,
      staleClinicCount: 0,
      needsConfirmationClinicCount: 0,
      pendingReviewCount: 0,
      queuedOfflineCount: 1,
      activeAlertCount: 0,
      newStakeholderCount: 0,
      followUpStakeholderCount: 0,
      partnerCheckCount: 4,
      partnerSeverity: "clear",
      latestActivityLabel: "01 May, 08:40",
    });

    expect(model.hero.activeBlocker).toBe("1 coverage blocker affects readiness");
    expect(model.taskQueue[1]).toMatchObject({
      id: "resolve-coverage",
      stateLabel: "1 blocker",
      tone: "attention",
    });
  });

  it("keeps partner evidence in review when partner checks are not clear", () => {
    const model = buildOrgAdminGovernanceWorkbenchModel({
      clinicCount: 8,
      staleClinicCount: 0,
      needsConfirmationClinicCount: 0,
      pendingReviewCount: 0,
      queuedOfflineCount: 0,
      activeAlertCount: 0,
      newStakeholderCount: 0,
      followUpStakeholderCount: 0,
      partnerCheckCount: 4,
      partnerSeverity: "watch",
      latestActivityLabel: "01 May, 08:40",
    });

    expect(model.hero.activeBlocker).toBe("Partner evidence needs confirmation");
    expect(model.readinessStrip[3]).toMatchObject({
      label: "Evidence state",
      value: "Review",
      tone: "attention",
    });
  });

  it("keeps export schema and API contract proof in the evidence trail", () => {
    const model = buildOrgAdminGovernanceWorkbenchModel({
      clinicCount: 8,
      staleClinicCount: 0,
      needsConfirmationClinicCount: 0,
      pendingReviewCount: 0,
      queuedOfflineCount: 0,
      activeAlertCount: 0,
      newStakeholderCount: 0,
      followUpStakeholderCount: 0,
      partnerCheckCount: 4,
      partnerSeverity: "clear",
      latestActivityLabel: "01 May, 08:40",
    });

    expect(model.evidenceLinks.map((link) => [link.label, link.href])).toEqual([
      ["Reporting coverage", "/admin/reporting-coverage"],
      ["Users and roles", "/admin/users-roles"],
      ["Partner readiness", "/admin/partner-readiness"],
      ["Audit evidence", "/admin/audit-evidence"],
      ["Export schema", "/admin/export-schema?from=admin"],
      ["API contract", "/admin/api-contract?from=admin"],
    ]);
  });
});
