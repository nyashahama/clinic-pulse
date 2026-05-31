import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

function sourceFile(path: string) {
  return readFileSync(path, "utf8");
}

describe("tenant health command briefing source", () => {
  it("renders tenant health with the shared evidence-command primitives", () => {
    const source = sourceFile("components/product/tenant-health-board.tsx");

    expect(source).toContain("EvidenceCommandHeader");
    expect(source).toContain("EvidenceCommandMetricStrip");
    expect(source).toContain("EvidenceCaseBriefPanel");
    expect(source).toContain("EvidenceDecisionPanel");
    expect(source).toContain("EvidenceTimeline");
    expect(source).not.toContain("EstateOperationsBriefing");
  });

  it("keeps the existing tenant-health detailed workspace landmarks", () => {
    const source = sourceFile("components/product/tenant-health-board.tsx");

    expect(source).toContain('data-admin-module="tenant-health"');
    expect(source).toContain("viewModel.districtStack.title");
    expect(source).toContain("viewModel.signalLedger.title");
  });
});
