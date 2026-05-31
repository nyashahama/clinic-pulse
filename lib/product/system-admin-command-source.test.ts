import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

function sourceFile(path: string) {
  return readFileSync(path, "utf8");
}

describe("system admin command briefing source", () => {
  it("uses the shared evidence-command grammar for the platform overview", () => {
    const source = sourceFile("components/product/system-admin-command-console.tsx");

    expect(source).toContain("EvidenceCommandHeader");
    expect(source).toContain("EvidenceCommandMetricStrip");
    expect(source).toContain("EvidenceCaseBriefPanel");
    expect(source).toContain("EvidenceDecisionPanel");
    expect(source).toContain("EvidenceTimeline");
    expect(source).not.toContain("function MetricCard");
  });

  it("keeps the existing system-admin navigation landmarks stable", () => {
    const source = sourceFile("components/product/system-admin-command-console.tsx");

    expect(source).toContain('data-role-dashboard="system_admin"');
    expect(source).toContain('ariaLabel="Platform command metrics"');
    expect(source).toContain('aria-label="Operational command lanes"');
    expect(source).toContain('aria-label="Audit and evidence console"');
  });
});
