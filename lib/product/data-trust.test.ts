import { describe, expect, it } from "vitest";

import {
  buildDataTrustState,
  formatTrustLabel,
  type DataTrustInput,
} from "@/lib/product/data-trust";

const baseInput: DataTrustInput = {
  source: "field_report",
  freshness: "fresh",
  reviewState: "reviewed",
  lastVerifiedAt: "2026-05-16T08:00:00.000Z",
  evidenceHref: "/admin/audit-evidence",
};

describe("data trust view models", () => {
  it("marks reviewed fresh field data as high confidence", () => {
    expect(buildDataTrustState(baseInput)).toEqual({
      tone: "clear",
      confidence: "high",
      label: "Reviewed field data",
      description: "Fresh field-submitted data reviewed at 2026-05-16 08:00 UTC.",
      evidenceHref: "/admin/audit-evidence",
    });
  });

  it("marks stale imported data as low confidence", () => {
    expect(
      buildDataTrustState({
        ...baseInput,
        source: "pilot_import",
        freshness: "stale",
        reviewState: "reviewed",
      }),
    ).toMatchObject({
      tone: "blocked",
      confidence: "low",
      label: "Stale imported data",
    });
  });

  it("marks pending review field data as medium confidence", () => {
    expect(
      buildDataTrustState({
        ...baseInput,
        reviewState: "pending_review",
      }),
    ).toMatchObject({
      tone: "attention",
      confidence: "medium",
      label: "Pending review",
    });
  });

  it("does not imply human review when fresh data does not require review", () => {
    const state = buildDataTrustState({
      ...baseInput,
      reviewState: "not_required",
    });

    expect(state).toMatchObject({
      tone: "clear",
      confidence: "high",
      label: "Field data",
    });
    expect(state.label).not.toContain("Reviewed");
    expect(state.description).not.toContain("reviewed");
    expect(state.description).toContain("does not require review");
  });

  it("does not leak NaN copy for malformed verification timestamps", () => {
    const state = buildDataTrustState({
      ...baseInput,
      lastVerifiedAt: "not-a-date",
    });

    expect(state.description).not.toContain("NaN");
  });

  it("formats compact trust labels", () => {
    expect(formatTrustLabel("seeded_demo", "unknown", "unknown")).toBe("Scenario data / unknown freshness / unknown review");
  });

  it("describes seeded internal data without visible demo framing", () => {
    const state = buildDataTrustState({
      ...baseInput,
      source: "seeded_demo",
      freshness: "fresh",
      reviewState: "reviewed",
    });

    expect(state).toMatchObject({
      tone: "attention",
      confidence: "low",
      label: "Scenario data",
      description: "Scenario-seeded data supports local operations rehearsal, not pilot decisions.",
    });
    expect(`${state.label} ${state.description}`).not.toMatch(/demo/i);
  });
});
