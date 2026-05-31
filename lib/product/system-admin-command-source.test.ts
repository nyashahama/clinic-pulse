import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

function sourceFile(path: string) {
  return readFileSync(path, "utf8");
}

describe("system admin command briefing source", () => {
  it("renders a dedicated operations cockpit instead of the shared evidence-command shell", () => {
    const source = sourceFile("components/product/system-admin-command-console.tsx");

    expect(source).toContain("useState");
    expect(source).toContain("function ActiveOperationalCase");
    expect(source).toContain("function PlatformHealthMonitorGrid");
    expect(source).toContain("function OperationsQueue");
    expect(source).toContain("function SelectedCaseDetail");
    expect(source).not.toContain("EvidenceCommandHeader");
    expect(source).not.toContain("EvidenceCommandMetricStrip");
    expect(source).not.toContain("EvidenceCaseBriefPanel");
    expect(source).not.toContain("EvidenceDecisionPanel");
    expect(source).not.toContain("EvidenceTimeline");
  });

  it("keeps the existing system-admin navigation landmarks stable", () => {
    const source = sourceFile("components/product/system-admin-command-console.tsx");

    expect(source).toContain('data-role-dashboard="system_admin"');
    expect(source).toContain('aria-label="Active operational case"');
    expect(source).toContain('aria-label="Platform health monitors"');
    expect(source).toContain('aria-label="Operations queue"');
    expect(source).toContain('aria-label="Selected operational case"');
  });
});
