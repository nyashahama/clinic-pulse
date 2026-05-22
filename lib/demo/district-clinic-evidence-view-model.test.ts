import { describe, expect, it } from "vitest";

import { createInitialDemoState } from "@/lib/demo/scenarios";
import {
  buildDistrictClinicEvidenceViewModel,
  type DistrictClinicEvidenceFilters,
} from "@/lib/demo/district-clinic-evidence-view-model";

const emptyFilters: DistrictClinicEvidenceFilters = {
  kind: "all",
  queue: "all",
  status: "all",
  source: "all",
  clinic: "all",
  query: "",
};

describe("buildDistrictClinicEvidenceViewModel", () => {
  it("builds evidence metrics, rows, selected packet, and detail links", () => {
    const state = createInitialDemoState();
    const viewModel = buildDistrictClinicEvidenceViewModel({
      state,
      filters: emptyFilters,
      selectedEvidenceId: "report-005",
    });

    expect(viewModel.metrics).toHaveLength(4);
    expect(viewModel.header).toMatchObject({
      eyebrow: "District command",
      title: "Clinic evidence",
      readiness: {
        label: "Evidence readiness",
        value: String(viewModel.rows.filter((row) => row.tone === "blocked").length),
        tone: "blocked",
      },
      primaryAction: {
        href: "/district/severity-queue",
        label: "Open severity queue",
      },
      secondaryAction: {
        href: "/district/clinic-network",
        label: "Open clinic network",
      },
    });
    expect(viewModel.header.readiness.detail).toContain("require district verification");
    expect(viewModel.queue.chips).toEqual([
      expect.objectContaining({ id: "all", label: "All", count: viewModel.rows.length }),
      expect.objectContaining({
        id: "needs_action",
        label: "Needs action",
        count: viewModel.rows.filter((row) => row.tone !== "clear").length,
      }),
      expect.objectContaining({ id: "reports", label: "Reports" }),
      expect.objectContaining({ id: "alerts", label: "Alerts" }),
      expect.objectContaining({ id: "audit", label: "Audit" }),
    ]);
    expect(viewModel.rows.length).toBe(
      state.reports.length + state.auditEvents.length + state.alerts.length,
    );
    expect(viewModel.metrics).toContainEqual(
      expect.objectContaining({
        label: "Blocking evidence",
        value: String(viewModel.rows.filter((row) => row.tone === "blocked").length),
      }),
    );
    expect(viewModel.selectedPacket?.evidenceId).toBe("report-005");
    expect(viewModel.selectedPacket?.reportHref).toMatch(
      /^\/district\/reports\/[^?]+\?from=district-clinic-evidence$/,
    );
    expect(viewModel.selectedPacket?.clinicHref).toMatch(
      /^\/district\/clinics\/[^?]+\?from=district-clinic-evidence$/,
    );
    expect(viewModel.selectedPacket?.actionTone).toBe("blocked");
    expect(viewModel.selectedPacket?.decisionSummary).toEqual([
      expect.objectContaining({
        label: "Decision",
        tone: "blocked",
        value: "Review report",
      }),
      expect.objectContaining({
        label: "Signal",
        tone: "blocked",
        value: "non functional",
      }),
      expect.objectContaining({
        label: "Trust chain",
      }),
      expect.objectContaining({
        label: "Verification gap",
        value: "Owner confirmation",
      }),
    ]);
    expect(viewModel.selectedPacket?.trace.map((step) => step.label)).toEqual([
      "Source",
      "Signal",
      "Verification",
      "District action",
    ]);
    expect(viewModel.selectedPacket?.timelineSummary).toContain("linked evidence records");
    expect(viewModel.filterOptions.clinics).toContainEqual(
      expect.objectContaining({
        label: "Mabopane Station Clinic",
        value: "clinic-mabopane-station",
      }),
    );
    expect(viewModel.timeline.length).toBeGreaterThan(0);
  });

  it("supports queue lenses for action, report, alert, and audit review", () => {
    const state = createInitialDemoState();
    const allEvidence = buildDistrictClinicEvidenceViewModel({
      state,
      filters: emptyFilters,
      selectedEvidenceId: null,
    });
    const actionEvidence = buildDistrictClinicEvidenceViewModel({
      state,
      filters: {
        ...emptyFilters,
        queue: "needs_action",
      },
      selectedEvidenceId: null,
    });
    const reportEvidence = buildDistrictClinicEvidenceViewModel({
      state,
      filters: {
        ...emptyFilters,
        queue: "reports",
      },
      selectedEvidenceId: null,
    });
    const alertEvidence = buildDistrictClinicEvidenceViewModel({
      state,
      filters: {
        ...emptyFilters,
        queue: "alerts",
      },
      selectedEvidenceId: null,
    });
    const auditEvidence = buildDistrictClinicEvidenceViewModel({
      state,
      filters: {
        ...emptyFilters,
        queue: "audit",
      },
      selectedEvidenceId: null,
    });

    expect(actionEvidence.rows.length).toBe(
      allEvidence.queue.chips.find((chip) => chip.id === "needs_action")?.count,
    );
    expect(actionEvidence.rows.every((row) => row.tone !== "clear")).toBe(true);
    expect(reportEvidence.rows.every((row) => row.kind === "report")).toBe(true);
    expect(alertEvidence.rows.every((row) => row.kind === "alert")).toBe(true);
    expect(auditEvidence.rows.every((row) => row.kind === "audit")).toBe(true);
  });

  it("exposes selected packet navigation within the filtered review queue", () => {
    const state = createInitialDemoState();
    const viewModel = buildDistrictClinicEvidenceViewModel({
      state,
      filters: emptyFilters,
      selectedEvidenceId: null,
    });

    expect(viewModel.selectedPacket?.navigation).toMatchObject({
      previousEvidenceId: null,
      nextEvidenceId: viewModel.rows[1]?.evidenceId,
      position: 1,
      total: viewModel.rows.length,
    });
  });

  it("filters by evidence kind, status, source, clinic, and search query", () => {
    const state = createInitialDemoState();
    const viewModel = buildDistrictClinicEvidenceViewModel({
      state,
      filters: {
        kind: "report",
        status: "non_functional",
        source: "field_worker",
        clinic: "clinic-mabopane-station",
        query: "generator",
      },
      selectedEvidenceId: null,
    });

    expect(viewModel.rows.map((row) => row.evidenceId)).toEqual(["report-005"]);
    expect(viewModel.rows[0]).toMatchObject({
      clinicId: "clinic-mabopane-station",
      kind: "report",
      source: "field_worker",
      status: "non_functional",
    });
  });

  it("keeps audit evidence searchable and links the selected clinic context", () => {
    const state = createInitialDemoState();
    const viewModel = buildDistrictClinicEvidenceViewModel({
      state,
      filters: {
        ...emptyFilters,
        kind: "audit",
        query: "stale",
      },
      selectedEvidenceId: "audit-002",
    });

    expect(viewModel.rows.every((row) => row.kind === "audit")).toBe(true);
    expect(viewModel.selectedPacket).toMatchObject({
      evidenceId: "audit-002",
      clinicId: "clinic-winterveldt-west",
      kind: "audit",
    });
    expect(viewModel.selectedPacket?.reportHref).toBeNull();
    expect(viewModel.selectedPacket?.clinicHref).toBe(
      "/district/clinics/clinic-winterveldt-west?from=district-clinic-evidence",
    );
  });

  it("defaults the selected packet to the highest-priority evidence", () => {
    const state = createInitialDemoState();
    const viewModel = buildDistrictClinicEvidenceViewModel({
      state,
      filters: emptyFilters,
      selectedEvidenceId: null,
    });

    expect(viewModel.rows[0]?.tone).toBe("blocked");
    expect(viewModel.selectedPacket?.tone).toBe("blocked");
    expect(viewModel.selectedPacket?.evidenceId).toBe(viewModel.rows[0]?.evidenceId);
    expect(viewModel.selectedPacket?.verificationNeed).toContain("clinic owner");
  });

  it("falls back to the first filtered row and exposes an empty state", () => {
    const state = createInitialDemoState();
    const filtered = buildDistrictClinicEvidenceViewModel({
      state,
      filters: {
        ...emptyFilters,
        kind: "alert",
      },
      selectedEvidenceId: "missing-evidence",
    });

    expect(filtered.selectedPacket?.tone).toBe("blocked");

    const empty = buildDistrictClinicEvidenceViewModel({
      state,
      filters: {
        kind: "report",
        status: "operational",
        source: "seed",
        clinic: "clinic-mabopane-station",
        query: "not present",
      },
      selectedEvidenceId: null,
    });

    expect(empty.rows).toEqual([]);
    expect(empty.selectedPacket).toBeNull();
    expect(empty.emptyState.title).toBe("No evidence matches these filters");
  });
});
