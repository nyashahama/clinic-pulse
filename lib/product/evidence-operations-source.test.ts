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
  it("replaces the audit evidence command shell with an evidence cockpit", () => {
    const source = readSource(auditEvidencePage);

    expect(source).toContain("EvidenceOperationsBriefing");
    expect(source).toContain("Audit evidence cockpit");
    expect(source).toContain("Evidence packet rail");
    expect(source).toContain("Review routing");
    expect(source).not.toContain("Audit evidence command centre");
    expect(source).not.toContain("Audit evidence queue");
  });

  it("promotes security posture into the same evidence cockpit system", () => {
    const source = readSource(securityPage);

    expect(source).toContain("EvidenceOperationsBriefing");
    expect(source).toContain("Security posture cockpit");
    expect(source).toContain("Credential lifecycle rail");
    expect(source).toContain("Privileged access watch");
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
