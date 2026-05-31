import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const auditEvidencePage = path.join(
  process.cwd(),
  "app",
  "(demo)",
  "admin",
  "audit-evidence",
  "page.tsx",
);
const securityPage = path.join(
  process.cwd(),
  "app",
  "(demo)",
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
  it("keeps audit evidence on the shared evidence-command briefing", () => {
    const source = readSource(auditEvidencePage);

    expect(source).toContain("EvidenceCommandHeader");
    expect(source).toContain("EvidenceCommandMetricStrip");
    expect(source).toContain("EvidenceCaseBriefPanel");
    expect(source).toContain("Audit evidence cockpit");
    expect(source).toContain("Evidence review lane");
    expect(source).toContain("Operational decision");
    expect(source).not.toContain("EvidenceOperationsBriefing");
    expect(source).not.toContain("Audit evidence command centre");
    expect(source).not.toContain("Audit evidence queue");
  });

  it("keeps security posture on the shared evidence-command briefing", () => {
    const source = readSource(securityPage);
    const modelSource = readSource(
      path.join(process.cwd(), "lib", "demo", "admin-security-evidence.ts"),
    );

    expect(source).toContain("EvidenceCommandHeader");
    expect(source).toContain("EvidenceCommandMetricStrip");
    expect(source).toContain("EvidenceCaseBriefPanel");
    expect(source).toContain("Security posture cockpit");
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
