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

  it("formats compact trust labels", () => {
    expect(formatTrustLabel("seeded_demo", "unknown", "unknown")).toBe("Demo data / unknown freshness / unknown review");
  });
});
