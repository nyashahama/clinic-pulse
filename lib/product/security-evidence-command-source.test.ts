import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

function sourceFile(path: string) {
  return readFileSync(path, "utf8");
}

describe("security evidence command briefing source", () => {
  it("renders security posture with the shared evidence-command primitives", () => {
    const source = sourceFile("app/(demo)/admin/security/page.tsx");

    expect(source).toContain("EvidenceCommandHeader");
    expect(source).toContain("EvidenceCommandMetricStrip");
    expect(source).toContain("EvidenceCaseBriefPanel");
    expect(source).toContain("EvidenceDecisionPanel");
    expect(source).toContain("EvidenceTimeline");
    expect(source).not.toContain("EvidenceOperationsBriefing");
  });

  it("keeps the selected-row security evidence workspace mounted", () => {
    const source = sourceFile("app/(demo)/admin/security/page.tsx");

    expect(source).toContain('data-admin-module="security"');
    expect(source).toContain('id="security-evidence-workspace"');
    expect(source).toContain("SecurityEvidenceWorkspace");
  });
});
