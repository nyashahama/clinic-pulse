import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

function sourceFile(path: string) {
  return readFileSync(path, "utf8");
}

describe("audit evidence command briefing source", () => {
  it("renders audit evidence as an event ledger rather than another command packet", () => {
    const source = sourceFile("app/(demo)/admin/audit-evidence/page.tsx");

    expect(source).toContain("Audit event ledger");
    expect(source).toContain('aria-label="Audit query builder"');
    expect(source).toContain('aria-label="Selected event record"');
    expect(source).toContain('aria-label="Evidence export and retention"');
    expect(source).not.toContain("EvidenceCommandHeader");
    expect(source).not.toContain("EvidenceCommandMetricStrip");
    expect(source).not.toContain("EvidenceCaseBriefPanel");
    expect(source).not.toContain("EvidenceDecisionPanel");
    expect(source).not.toContain("EvidenceTimeline");
    expect(source).not.toContain("EvidenceOperationsBriefing");
  });

  it("keeps the selected-row audit evidence workspace mounted", () => {
    const source = sourceFile("app/(demo)/admin/audit-evidence/page.tsx");
    const workspaceSource = sourceFile("components/product/audit-evidence-workspace.tsx");

    expect(source).toContain('data-admin-module="audit-evidence"');
    expect(source).toContain('id="audit-evidence-workspace"');
    expect(source).toContain("AuditEvidenceWorkspace");
    expect(workspaceSource).toContain("Selected audit evidence");
  });
});
