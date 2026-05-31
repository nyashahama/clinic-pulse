import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

function sourceFile(path: string) {
  return readFileSync(path, "utf8");
}

describe("audit evidence command briefing source", () => {
  it("renders audit evidence with the shared evidence-command primitives", () => {
    const source = sourceFile("app/(demo)/admin/audit-evidence/page.tsx");

    expect(source).toContain("EvidenceCommandHeader");
    expect(source).toContain("EvidenceCommandMetricStrip");
    expect(source).toContain("EvidenceCaseBriefPanel");
    expect(source).toContain("EvidenceDecisionPanel");
    expect(source).toContain("EvidenceTimeline");
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
