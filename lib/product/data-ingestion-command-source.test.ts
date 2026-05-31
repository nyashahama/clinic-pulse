import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

function sourceFile(path: string) {
  return readFileSync(path, "utf8");
}

describe("data ingestion command briefing source", () => {
  it("renders data ingestion with the shared evidence-command primitives", () => {
    const source = sourceFile("app/(demo)/admin/data-ingestion/page.tsx");

    expect(source).toContain("EvidenceCommandHeader");
    expect(source).toContain("EvidenceCommandMetricStrip");
    expect(source).toContain("EvidenceCaseBriefPanel");
    expect(source).toContain("EvidenceDecisionPanel");
    expect(source).toContain("EvidenceTimeline");
    expect(source).not.toContain("EstateOperationsBriefing");
  });

  it("keeps the detailed ingestion evidence workspace mounted", () => {
    const source = sourceFile("app/(demo)/admin/data-ingestion/page.tsx");
    const workspaceSource = sourceFile("components/product/data-ingestion-workspace.tsx");

    expect(source).toContain('data-admin-module="data-ingestion"');
    expect(source).toContain('id="data-ingestion-workspace"');
    expect(source).toContain("DataIngestionWorkspace");
    expect(workspaceSource).toContain("Ingestion evidence ledger");
  });
});
