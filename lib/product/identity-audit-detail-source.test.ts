import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const detailRoutes = [
  ["user", "app", "(demo)", "admin", "users-roles", "[userId]", "page.tsx"],
  [
    "audit event",
    "app",
    "(demo)",
    "admin",
    "audit-evidence",
    "events",
    "[eventId]",
    "page.tsx",
  ],
] as const;

function sourceFile(...segments: string[]) {
  try {
    return readFileSync(path.join(process.cwd(), ...segments), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return "";
    }

    throw error;
  }
}

describe("identity and audit detail cockpit routes", () => {
  it.each(detailRoutes)(
    "renders the %s detail route with the shared evidence briefing shell",
    (_label, ...segments) => {
      const source = sourceFile(...segments);

      expect(source).toContain("IdentityAuditDetailBriefing");
      expect(source).toContain("buildIdentityAuditDetailModel");
      expect(source).not.toContain("AdminDetailFieldGrid");
    },
  );

  it("keeps the shared identity/audit detail component aligned to evidence-command panels", () => {
    const componentSource = sourceFile(
      "components",
      "product",
      "identity-audit-detail-briefing.tsx",
    );

    expect(componentSource).toContain("EvidenceCommandHeader");
    expect(componentSource).toContain("EvidenceCommandMetricStrip");
    expect(componentSource).toContain("EvidenceCaseBriefPanel");
    expect(componentSource).toContain("EvidenceDecisionPanel");
    expect(componentSource).toContain("EvidenceTimeline");
    expect(componentSource).toContain("AdminDetailJsonBlock");
  });
});
