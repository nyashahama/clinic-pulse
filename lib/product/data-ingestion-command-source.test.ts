import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

function sourceFile(path: string) {
  return readFileSync(path, "utf8");
}

describe("data ingestion command briefing source", () => {
  it("renders data ingestion as a pipeline monitor rather than another command packet", () => {
    const source = sourceFile("app/(workspace)/admin/data-ingestion/page.tsx");
    const monitorSource = sourceFile("components/product/data-ingestion-pipeline-monitor.tsx");

    expect(source).toContain("DataIngestionPipelineMonitor");
    expect(source).toContain("Ingestion pipeline monitor");
    expect(monitorSource).toContain("useState");
    expect(monitorSource).toContain('aria-label="Source pipeline map"');
    expect(monitorSource).toContain('aria-label="Ingestion failure-origin inspector"');
    expect(monitorSource).toContain('aria-label="Pipeline run history"');
    expect(monitorSource).toContain("Inspect pipeline stage");
    expect(monitorSource).toContain("Inspect run step");
    expect(monitorSource).toContain("Stage triage queue");
    expect(monitorSource).toContain("Active ingestion issue");
    expect(monitorSource).toContain("Mark stage reviewed");
    expect(monitorSource).toContain("triageItems");
    expect(source).not.toContain("EvidenceCommandHeader");
    expect(source).not.toContain("EvidenceCommandMetricStrip");
    expect(source).not.toContain("EvidenceCaseBriefPanel");
    expect(source).not.toContain("EvidenceDecisionPanel");
    expect(source).not.toContain("EvidenceTimeline");
    expect(source).not.toContain("EstateOperationsBriefing");
  });

  it("keeps the detailed ingestion evidence workspace mounted", () => {
    const source = sourceFile("app/(workspace)/admin/data-ingestion/page.tsx");
    const workspaceSource = sourceFile("components/product/data-ingestion-workspace.tsx");

    expect(source).toContain('data-admin-module="data-ingestion"');
    expect(source).toContain('id="data-ingestion-workspace"');
    expect(source).toContain("DataIngestionWorkspace");
    expect(workspaceSource).toContain("Ingestion evidence ledger");
  });
});
