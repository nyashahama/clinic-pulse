import { describe, expect, it } from "vitest";

import {
  createEmptySyncSummary,
  getPilotReadinessSeverity,
} from "@/lib/demo/pilot-readiness";

describe("pilot readiness helpers", () => {
  it("formats empty sync summary as zero-risk pilot state", () => {
    const summary = createEmptySyncSummary("2026-05-03T00:00:00.000Z");

    expect(summary).toEqual({
      windowStartedAt: "2026-05-03T00:00:00.000Z",
      offlineReportsReceived: 0,
      duplicateSyncsHandled: 0,
      conflictsNeedingAttention: 0,
      validationFailures: 0,
      pendingOfflineReports: 0,
      needsConfirmationClinics: 0,
      staleClinics: 0,
      medianCurrentStatusAgeHours: null,
    });
    expect(getPilotReadinessSeverity(summary)).toBe("clear");
  });

  it("flags conflicts as operator attention", () => {
    expect(
      getPilotReadinessSeverity({
        ...createEmptySyncSummary("2026-05-03T00:00:00.000Z"),
        conflictsNeedingAttention: 1,
      }),
    ).toBe("attention");
  });

  it("flags stale clinics as operator attention", () => {
    expect(
      getPilotReadinessSeverity({
        ...createEmptySyncSummary("2026-05-03T00:00:00.000Z"),
        staleClinics: 2,
      }),
    ).toBe("attention");
  });

  it("keeps duplicate syncs informational", () => {
    expect(
      getPilotReadinessSeverity({
        ...createEmptySyncSummary("2026-05-03T00:00:00.000Z"),
        duplicateSyncsHandled: 5,
      }),
    ).toBe("clear");
  });
});
