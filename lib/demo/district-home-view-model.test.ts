import { describe, expect, it } from "vitest";

import { createInitialDemoState } from "@/lib/demo/scenarios";
import { buildDistrictHomeViewModel } from "./district-home-view-model";

const session = {
  userId: 2,
  email: "district-manager@clinicpulse.local",
  name: "District Manager",
  displayName: "District Manager",
  role: "district_manager",
  organisationName: "ClinicPulse Pilot",
  district: "Tshwane North",
  organisationId: 1,
} as const;

describe("buildDistrictHomeViewModel", () => {
  it("composes a complete district manager home from the four operational modules", () => {
    const state = createInitialDemoState();
    const viewModel = buildDistrictHomeViewModel({
      pendingEvidenceReportCount: 2,
      session,
      state,
      syncSummary: {
        windowStartedAt: "2026-05-01T07:40:00.000Z",
        offlineReportsReceived: 9,
        duplicateSyncsHandled: 0,
        conflictsNeedingAttention: 0,
        validationFailures: 0,
        pendingOfflineReports: 0,
        needsConfirmationClinics: 2,
        staleClinics: 1,
        medianCurrentStatusAgeHours: 6,
      },
    });

    expect(viewModel.hero).toEqual(
      expect.objectContaining({
        eyebrow: "District command",
        title: "Tshwane North operating picture",
        primaryAction: {
          href: "/district/severity-queue",
          label: "Open severity queue",
        },
      }),
    );
    expect(viewModel.hero.primaryDecision.clinicName).toBe("Mabopane Station Clinic");
    expect(viewModel.hero.primaryDecision.score).toBeGreaterThan(0);
    expect(viewModel.hero.signals.map((signal) => signal.label)).toEqual([
      "Active alerts",
      "Evidence due",
      "Routing moves",
      "Clinics visible",
    ]);

    expect(viewModel.moduleCards.map((card) => card.id)).toEqual([
      "severity",
      "network",
      "evidence",
      "interventions",
    ]);
    expect(viewModel.moduleCards).toContainEqual(
      expect.objectContaining({
        id: "severity",
        href: "/district/severity-queue",
        title: "Severity queue",
        actionLabel: "Triage queue",
      }),
    );
    expect(viewModel.moduleCards).toContainEqual(
      expect.objectContaining({
        id: "network",
        href: "/district/clinic-network",
        title: "Clinic network",
        actionLabel: "Inspect capacity",
      }),
    );
    expect(viewModel.moduleCards).toContainEqual(
      expect.objectContaining({
        id: "evidence",
        href: "/district/clinic-evidence",
        title: "Clinic evidence",
        actionLabel: "Review evidence",
      }),
    );
    expect(viewModel.moduleCards).toContainEqual(
      expect.objectContaining({
        id: "interventions",
        href: "/district/interventions",
        title: "Interventions",
        actionLabel: "Manage plans",
        label: "Active plans",
        value: "5",
      }),
    );

    expect(viewModel.commandPreview.queueItems).toHaveLength(4);
    expect(viewModel.commandPreview.selectedClinic?.clinicName).toBe(
      viewModel.hero.primaryDecision.clinicName,
    );
    expect(viewModel.commandPreview.commandMap.scopeLabel).toBe("Tshwane North");
    expect(viewModel.commandPreview.commandMap.pins).toHaveLength(8);
    expect(viewModel.commandPreview.commandMap.pins[0]).toEqual(
      expect.objectContaining({
        clinicId: "clinic-mabopane-station",
        clinicName: "Mabopane Station Clinic",
        href: "/district/clinics/clinic-mabopane-station?from=district-home",
        isSelected: true,
        score: viewModel.hero.primaryDecision.score,
        tone: viewModel.hero.primaryDecision.tone,
      }),
    );
    expect(viewModel.commandPreview.commandMap.routes).toHaveLength(3);
    expect(viewModel.commandPreview.commandMap.routes[0]).toEqual(
      expect.objectContaining({
        fromClinicId: "clinic-mabopane-station",
        fromClinicName: "Mabopane Station Clinic",
        isPrimary: true,
        label: expect.stringContaining("Recommended route"),
        matchedService: expect.any(String),
        toClinicId: expect.any(String),
        toClinicName: expect.any(String),
      }),
    );
    expect(viewModel.commandPreview.commandMap.routes[0].x1).toBe(
      viewModel.commandPreview.commandMap.pins[0].x,
    );
    expect(viewModel.commandPreview.commandMap.routes[0].y1).toBe(
      viewModel.commandPreview.commandMap.pins[0].y,
    );
    expect(viewModel.commandPreview.commandMap.routes[0].x2).toEqual(expect.any(Number));
    expect(viewModel.commandPreview.commandMap.routes[0].y2).toEqual(expect.any(Number));
    expect(
      viewModel.commandPreview.commandMap.pins
        .filter((pin) => pin.labelVisibility !== "dot")
        .map((pin) => pin.clinicName),
    ).toEqual([
      "Mabopane Station Clinic",
      "Hammanskraal Unit D Clinic",
      "Atteridgeville Extension Clinic",
      "Winterveldt West Clinic",
    ]);
    expect(
      viewModel.commandPreview.commandMap.pins.find(
        (pin) => pin.clinicName === "Mamelodi East Community Clinic",
      )?.labelVisibility,
    ).toBe("dot");
    expect(viewModel.commandPreview.decisionPacket).toEqual(
      expect.objectContaining({
        clinicId: "clinic-mabopane-station",
        clinicName: "Mabopane Station Clinic",
        evidenceTitle: expect.any(String),
        interventionTitle: "Routing",
        routePlan: expect.stringContaining("Protect"),
        verification: viewModel.hero.primaryDecision.verification,
      }),
    );
    expect(viewModel.commandPreview.decisionPacket.timeline.map((item) => item.id)).toEqual([
      "severity",
      "evidence",
      "intervention",
    ]);
    expect(viewModel.commandPreview.interventionPlan?.clinicName).toBe(
      viewModel.hero.primaryDecision.clinicName,
    );
    expect(viewModel.supportingSections.map((section) => section.id)).toEqual([
      "report-review",
      "data-trust",
      "field-signal-stream",
      "clinic-roster",
    ]);
  });
});
