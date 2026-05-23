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
      }),
    );

    expect(viewModel.commandPreview.queueItems).toHaveLength(4);
    expect(viewModel.commandPreview.selectedClinic?.clinicName).toBe(
      viewModel.hero.primaryDecision.clinicName,
    );
    expect(viewModel.commandPreview.interventionPlan?.clinicName).toBe(
      viewModel.hero.primaryDecision.clinicName,
    );
    expect(viewModel.supportingSections.map((section) => section.id)).toEqual([
      "report-review",
      "data-trust",
      "scenario-controls",
      "field-signal-stream",
      "clinic-roster",
    ]);
  });
});
