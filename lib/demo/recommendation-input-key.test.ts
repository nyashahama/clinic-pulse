import { describe, expect, it } from "vitest";

import { buildRecommendationInputKey } from "@/lib/demo/recommendation-input-key";
import { createInitialDemoState } from "@/lib/demo/scenarios";
import { getClinicRows } from "@/lib/demo/selectors";
import type { ClinicRow } from "@/lib/demo/types";

function cloneClinic(row: ClinicRow, overrides: Partial<ClinicRow> = {}): ClinicRow {
  return {
    ...row,
    services: [...row.services],
    ...overrides,
  };
}

describe("buildRecommendationInputKey", () => {
  it("changes when source routing evidence changes for the same clinic and service", () => {
    const [source, ...candidates] = getClinicRows(createInitialDemoState());

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
    const [source, candidate, ...rest] = getClinicRows(createInitialDemoState());

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
