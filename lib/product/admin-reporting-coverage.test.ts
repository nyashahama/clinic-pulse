import { describe, expect, it } from "vitest";

import { getReportingCoverageTone } from "@/app/(demo)/admin/governance-formatters";

describe("getReportingCoverageTone", () => {
  it("flags unknown reporting freshness for attention", () => {
    expect(
      getReportingCoverageTone({
        status: "open",
        freshness: "unknown",
      }),
    ).toBe("attention");
  });
});
