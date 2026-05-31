import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const integrationDetailRoutes = [
  ["api key", "api-keys", "[apiKeyId]"],
  ["webhook subscription", "webhook-subscriptions", "[subscriptionId]"],
  ["webhook event", "webhook-events", "[eventId]"],
  ["export run", "export-runs", "[exportRunId]"],
  ["integration check", "checks", "[checkId]"],
] as const;

function routeSource(...segments: string[]) {
  return readFileSync(
    path.join(process.cwd(), "app", "(workspace)", "admin", "integrations", ...segments, "page.tsx"),
    "utf8",
  );
}

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

describe("integration detail cockpit routes", () => {
  it.each(integrationDetailRoutes)(
    "renders the %s detail route with the shared evidence briefing shell",
    (_label, lane, segment) => {
      const source = routeSource(lane, segment);

      expect(source).toContain("IntegrationEvidenceDetailBriefing");
      expect(source).toContain("buildIntegrationDetailModel");
      expect(source).not.toContain("AdminDetailFieldGrid");
    },
  );

  it("keeps the shared integration detail component aligned to evidence-command panels", () => {
    const componentSource = sourceFile(
      "components",
      "product",
      "integration-evidence-detail-briefing.tsx",
    );

    expect(componentSource).toContain("EvidenceCommandHeader");
    expect(componentSource).toContain("EvidenceCommandMetricStrip");
    expect(componentSource).toContain("EvidenceCaseBriefPanel");
    expect(componentSource).toContain("EvidenceDecisionPanel");
    expect(componentSource).toContain("EvidenceTimeline");
    expect(componentSource).toContain("AdminDetailJsonBlock");
  });
});
