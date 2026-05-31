import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const auditEvidencePage = path.join(
  process.cwd(),
  "app",
  "(workspace)",
  "admin",
  "audit-evidence",
  "page.tsx",
);
const securityPage = path.join(
  process.cwd(),
  "app",
  "(workspace)",
  "admin",
  "security",
  "page.tsx",
);
const evidenceBriefing = path.join(
  process.cwd(),
  "components",
  "product",
  "evidence-operations-briefing.tsx",
);

function readSource(filePath: string) {
  try {
    return readFileSync(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return "";
    }
    throw error;
  }
}

describe("admin evidence operations surfaces", () => {
  it("renders audit evidence as a distinct event-ledger briefing", () => {
    const source = readSource(auditEvidencePage);

    expect(source).toContain("Audit event ledger");
    expect(source).toContain("Audit query builder");
    expect(source).toContain("Selected event record");
    expect(source).toContain("Evidence export and retention");
    expect(source).not.toContain("EvidenceCommandHeader");
    expect(source).not.toContain("EvidenceCommandMetricStrip");
    expect(source).not.toContain("EvidenceCaseBriefPanel");
    expect(source).not.toContain("EvidenceOperationsBriefing");
    expect(source).not.toContain("Audit evidence command centre");
    expect(source).not.toContain("Audit evidence queue");
  });

  it("keeps security posture on a distinct risk-surface briefing", () => {
    const source = readSource(securityPage);
    const modelSource = readSource(
      path.join(process.cwd(), "lib", "workspace", "admin-security-evidence.ts"),
    );

    expect(source).toContain("Security risk surface");
    expect(source).toContain('aria-label="Credential and access risk lanes"');
    expect(source).toContain('aria-label="Security lead evidence inspector"');
    expect(source).not.toContain("EvidenceCommandHeader");
    expect(source).not.toContain("EvidenceCommandMetricStrip");
    expect(source).not.toContain("EvidenceCaseBriefPanel");
    expect(modelSource).toContain("Credential lifecycle rail");
    expect(modelSource).toContain("Privileged access watch");
    expect(source).not.toContain("EvidenceOperationsBriefing");
    expect(source).not.toContain("AdminModuleHeader");
    expect(source).not.toContain("AdminFilterBar");
  });

  it("keeps the shared evidence briefing focused on source-linked packets", () => {
    const source = readSource(evidenceBriefing);

    expect(source).toContain("Evidence packet rail");
    expect(source).toContain("Evidence lane map");
    expect(source).toContain("Review routing");
    expect(source).toContain("getEvidenceOperationsToneClassName");
    expect(source).not.toContain("Supabase");
    expect(source).not.toContain("Unkey");
    expect(source).not.toContain("Infisical");
  });
});
