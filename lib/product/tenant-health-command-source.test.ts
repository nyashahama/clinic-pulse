import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

function sourceFile(path: string) {
  return readFileSync(path, "utf8");
}

describe("tenant health command briefing source", () => {
  it("renders tenant health as an estate map rather than another command packet", () => {
    const source = sourceFile("components/product/tenant-health-board.tsx");

    expect(source).toContain("Tenant estate health map");
    expect(source).toContain("useState");
    expect(source).toContain('aria-label="Tenant estate readiness map"');
    expect(source).toContain('aria-label="Tenant health active issue"');
    expect(source).toContain('aria-label="Estate signal switchboard"');
    expect(source).toContain('aria-label="District readiness heatmap"');
    expect(source).toContain('aria-label="Selected estate signal"');
    expect(source).toContain("Select estate signal");
    expect(source).toContain("Select district readiness");
    expect(source).toContain("Mark estate signal reviewed");
    expect(source).toContain("viewModel.commandBrief.timeline.items");
    expect(source).not.toContain("EvidenceCommandHeader");
    expect(source).not.toContain("EvidenceCommandMetricStrip");
    expect(source).not.toContain("EvidenceCaseBriefPanel");
    expect(source).not.toContain("EvidenceDecisionPanel");
    expect(source).not.toContain("EvidenceTimeline");
    expect(source).not.toContain("Tenant readiness packet");
    expect(source).not.toContain("EstateOperationsBriefing");
  });

  it("keeps the existing tenant-health detailed workspace landmarks", () => {
    const source = sourceFile("components/product/tenant-health-board.tsx");

    expect(source).toContain('data-admin-module="tenant-health"');
    expect(source).toContain("viewModel.districtStack.title");
    expect(source).toContain("viewModel.signalLedger.title");
  });

  it("does not repeat the signal ledger below the estate map", () => {
    const source = sourceFile("components/product/tenant-health-board.tsx");

    expect(source).toContain('aria-label="Readiness handoff queue"');
    expect(source.match(/viewModel\.signalLedger\.items\.map/g)).toHaveLength(1);
    expect(source.match(/viewModel\.districtStack\.rows\.map/g)).toHaveLength(1);
    expect(source).toContain("secondaryActions.map");
  });
});
