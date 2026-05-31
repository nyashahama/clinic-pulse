import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

function sourceFile(path: string) {
  return readFileSync(path, "utf8");
}

describe("security evidence command briefing source", () => {
  it("renders security posture as a risk surface rather than another command packet", () => {
    const source = sourceFile("app/(demo)/admin/security/page.tsx");

    expect(source).toContain("Security risk surface");
    expect(source).toContain('aria-label="Security risk surface"');
    expect(source).toContain('aria-label="Credential and access risk lanes"');
    expect(source).toContain('aria-label="Security lead evidence inspector"');
    expect(source).not.toContain("EvidenceCommandHeader");
    expect(source).not.toContain("EvidenceCommandMetricStrip");
    expect(source).not.toContain("EvidenceCaseBriefPanel");
    expect(source).not.toContain("EvidenceDecisionPanel");
    expect(source).not.toContain("EvidenceTimeline");
    expect(source).not.toContain("Security posture packet");
    expect(source).not.toContain("EvidenceOperationsBriefing");
  });

  it("keeps the selected-row security evidence workspace mounted", () => {
    const source = sourceFile("app/(demo)/admin/security/page.tsx");

    expect(source).toContain('data-admin-module="security"');
    expect(source).toContain('id="security-evidence-workspace"');
    expect(source).toContain("SecurityEvidenceWorkspace");
  });
});
