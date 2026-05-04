import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const adminClient = path.join(process.cwd(), "app", "(demo)", "admin", "page-client.tsx");
const partnerPanel = path.join(
  process.cwd(),
  "components",
  "demo",
  "partner-readiness-panel.tsx",
);

describe("admin partner readiness workflow", () => {
  it("wires webhook creation into the admin partner readiness panel", () => {
    const adminClientSource = readFileSync(adminClient, "utf8");
    const panelSource = readFileSync(partnerPanel, "utf8");

    expect(adminClientSource).toContain("createPartnerWebhookAction");
    expect(adminClientSource).toContain("handleCreatePartnerWebhook");
    expect(adminClientSource).toContain("onCreateWebhook={handleCreatePartnerWebhook}");
    expect(panelSource).toContain("onCreateWebhook");
    expect(panelSource).toContain("Create webhook");
  });
});
