import { describe, expect, it } from "vitest";

import { buildRecommendationInputKey } from "@/lib/workspace/recommendation-input-key";
import { createInitialWorkspaceState } from "@/lib/workspace/scenarios";
import { getClinicRows } from "@/lib/workspace/selectors";
import type { ClinicRow } from "@/lib/workspace/types";

function cloneClinic(row: ClinicRow, overrides: Partial<ClinicRow> = {}): ClinicRow {
  return {
    ...row,
    services: [...row.services],
    ...overrides,
  };
}

describe("buildRecommendationInputKey", () => {
  it("changes when source routing evidence changes for the same clinic and service", () => {
    const [source, ...candidates] = getClinicRows(createInitialWorkspaceState());

    const before = buildRecommendationInputKey({
      sourceClinic: source,
      localClinics: candidates,
      requestedService: "Primary care",
    });
    const after = buildRecommendationInputKey({
      sourceClinic: cloneClinic(source, {
        freshness: "stale",
        lastReportedAt: "2026-05-07T08:00:00.000Z",
        status: "non_functional",
      }),
      localClinics: candidates,
      requestedService: "Primary care",
    });

    expect(after).not.toBe(before);
  });

  it("changes when candidate routing inputs change for the same selected clinic", () => {
    const [source, candidate, ...rest] = getClinicRows(createInitialWorkspaceState());

    const before = buildRecommendationInputKey({
      sourceClinic: source,
      localClinics: [candidate, ...rest],
      requestedService: "Primary care",
    });
    const after = buildRecommendationInputKey({
      sourceClinic: source,
      localClinics: [
        cloneClinic(candidate, {
          freshness: "stale",
          lastReportedAt: "2026-05-07T08:00:00.000Z",
          services: ["Pharmacy"],
        }),
        ...rest,
      ],
      requestedService: "Primary care",
    });

    expect(after).not.toBe(before);
  });
});
