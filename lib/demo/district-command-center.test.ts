import { describe, expect, it } from "vitest";

import {
  buildDistrictCommandCenter,
  scoreDistrictSeverityItem,
  type DistrictCommandClinicInput,
} from "./district-command-center";

const operationalClinic: DistrictCommandClinicInput = {
  id: "clinic-operational",
  name: "Green Valley Clinic",
  district: "Umkhanyakude",
  status: "operational",
  freshness: "fresh",
  services: ["Primary care", "Immunisation"],
  updatedAt: "2026-05-09T06:00:00.000Z",
  hasActiveAlert: false,
  isInOfflineQueue: false,
  alternativeCount: 2,
  recentTrend: "stable",
};

const failingClinic: DistrictCommandClinicInput = {
  id: "clinic-failing",
  name: "Ndlovu Clinic",
  district: "Umkhanyakude",
  status: "non_functional",
  freshness: "stale",
  services: ["Maternity", "Primary care"],
  updatedAt: "2026-05-09T04:00:00.000Z",
  hasActiveAlert: true,
  isInOfflineQueue: true,
  alternativeCount: 0,
  recentTrend: "worsening",
};

describe("scoreDistrictSeverityItem", () => {
  it("scores non-functional stale clinics with alerts above operational clinics", () => {
    const failingScore = scoreDistrictSeverityItem(failingClinic);
    const operationalScore = scoreDistrictSeverityItem(operationalClinic);

    expect(failingScore.score).toBeGreaterThan(operationalScore.score);
    expect(failingScore.severityLabel).toBe("critical");
    expect(failingScore.reasonCodes).toContain("service_unavailable");
    expect(failingScore.reasonCodes).toContain("stale_report");
    expect(failingScore.reasonCodes).toContain("active_alert");
    expect(failingScore.reasonCodes).toContain("no_alternative_capacity");
  });

  it("keeps low-risk clinics explainable", () => {
    const result = scoreDistrictSeverityItem(operationalClinic);

    expect(result.severityLabel).toBe("stable");
    expect(result.reasonCodes).toEqual(["operational_baseline"]);
    expect(result.patientImpact).toContain("Service continuity is currently stable");
  });
});

describe("buildDistrictCommandCenter", () => {
  it("selects the highest severity item by default and builds intervention context", () => {
    const commandCenter = buildDistrictCommandCenter({
      session: {
        userId: 1,
        email: "operator@example.com",
        name: "Amina Dlamini",
        displayName: "Amina Dlamini",
        role: "district_admin",
        organisationName: "Umkhanyakude District Health",
        district: "Umkhanyakude",
        organisationId: 7,
      },
      clinics: [operationalClinic, failingClinic],
      activeAlertCount: 1,
      offlineQueueCount: 1,
      lastSyncAt: "2026-05-09T06:10:00.000Z",
      selectedClinicId: null,
    });

    expect(commandCenter.brief.operatorName).toBe("Amina Dlamini");
    expect(commandCenter.brief.districtLabel).toBe("Umkhanyakude");
    expect(commandCenter.queue[0]?.clinicId).toBe("clinic-failing");
    expect(commandCenter.selectedItem?.clinicId).toBe("clinic-failing");
    expect(commandCenter.intervention.primaryAction.label).toBe("Open intervention plan");
    expect(commandCenter.analytics.statusMix.critical).toBe(1);
    expect(commandCenter.handover.items[0]).toContain("Ndlovu Clinic");
  });

  it("selects the requested clinic while preserving severity queue order", () => {
    const commandCenter = buildDistrictCommandCenter({
      session: {
        userId: 1,
        email: "operator@example.com",
        name: "Amina Dlamini",
        displayName: "Amina Dlamini",
        role: "district_admin",
        organisationName: "Umkhanyakude District Health",
        district: "Umkhanyakude",
        organisationId: 7,
      },
      clinics: [operationalClinic, failingClinic],
      activeAlertCount: 1,
      offlineQueueCount: 1,
      lastSyncAt: "2026-05-09T06:10:00.000Z",
      selectedClinicId: "clinic-operational",
    });

    expect(commandCenter.selectedItem?.clinicId).toBe("clinic-operational");
    expect(commandCenter.queue[0]?.clinicId).toBe("clinic-failing");
  });

  it("orders tied severity items by clinic name without locale-dependent sorting", () => {
    const alphaClinic: DistrictCommandClinicInput = {
      ...operationalClinic,
      id: "clinic-alpha",
      name: "Alpha Clinic",
    };
    const zuluClinic: DistrictCommandClinicInput = {
      ...operationalClinic,
      id: "clinic-zulu",
      name: "Zulu Clinic",
    };

    const commandCenter = buildDistrictCommandCenter({
      session: null,
      clinics: [zuluClinic, alphaClinic],
      activeAlertCount: 0,
      offlineQueueCount: 0,
      lastSyncAt: null,
      selectedClinicId: null,
    });

    expect(commandCenter.queue.map((item) => item.clinicName)).toEqual([
      "Alpha Clinic",
      "Zulu Clinic",
    ]);
  });

  it("derives analytics alert and offline counts from clinic flags", () => {
    const alertClinic: DistrictCommandClinicInput = {
      ...operationalClinic,
      id: "clinic-alert",
      name: "Alert Clinic",
      hasActiveAlert: true,
    };
    const offlineClinic: DistrictCommandClinicInput = {
      ...operationalClinic,
      id: "clinic-offline",
      name: "Offline Clinic",
      isInOfflineQueue: true,
    };

    const commandCenter = buildDistrictCommandCenter({
      session: null,
      clinics: [alertClinic, offlineClinic, operationalClinic],
      activeAlertCount: 99,
      offlineQueueCount: 88,
      lastSyncAt: null,
      selectedClinicId: null,
    });

    expect(commandCenter.analytics.activeAlertCount).toBe(1);
    expect(commandCenter.analytics.offlineQueueCount).toBe(1);
  });

  it("returns a calm empty-state command surface when no clinics are loaded", () => {
    const commandCenter = buildDistrictCommandCenter({
      session: null,
      clinics: [],
      activeAlertCount: 0,
      offlineQueueCount: 0,
      lastSyncAt: null,
      selectedClinicId: null,
    });

    expect(commandCenter.brief.riskLabel).toBe("No clinic signal loaded");
    expect(commandCenter.queue).toEqual([]);
    expect(commandCenter.selectedItem).toBeNull();
    expect(commandCenter.intervention.primaryAction.label).toBe("Load district signal");
  });
});
