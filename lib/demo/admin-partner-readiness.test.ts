import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const adminClient = path.join(process.cwd(), "app", "(demo)", "admin", "page-client.tsx");
const partnerReadinessPage = path.join(
  process.cwd(),
  "app",
  "(demo)",
  "admin",
  "partner-readiness",
  "page.tsx",
);
const partnerReadinessClient = path.join(
  process.cwd(),
  "app",
  "(demo)",
  "admin",
  "partner-readiness",
  "page-client.tsx",
);
const integrationsPage = path.join(
  process.cwd(),
  "app",
  "(demo)",
  "admin",
  "integrations",
  "page.tsx",
);
const partnerPanel = path.join(
  process.cwd(),
  "components",
  "demo",
  "partner-readiness-panel.tsx",
);
const partnerReadinessModel = path.join(
  process.cwd(),
  "lib",
  "demo",
  "partner-readiness.ts",
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

describe("admin partner readiness workflow", () => {
  it("wires full partner actions in the dedicated partner readiness client", () => {
    const partnerReadinessClientSource = readSource(partnerReadinessClient);
    const partnerReadinessPageSource = readSource(partnerReadinessPage);
    const panelSource = readSource(partnerPanel);

    expect(partnerReadinessPageSource).toContain('requireDemoWorkflowAccess("admin")');
    expect(partnerReadinessPageSource).toContain("loadAdminPartnerReadiness");
    expect(partnerReadinessPageSource).toContain("PartnerReadinessPageClient");
    expect(partnerReadinessClientSource).toContain("createPartnerApiKeyAction");
    expect(partnerReadinessClientSource).toContain("createPartnerExportAction");
    expect(partnerReadinessClientSource).toContain("createPartnerWebhookAction");
    expect(partnerReadinessClientSource).toContain("testPartnerWebhookAction");
    expect(partnerReadinessClientSource).toContain("onCreateWebhook={handleCreatePartnerWebhook}");
    expect(panelSource).toContain("onCreateWebhook");
    expect(panelSource).toContain("Create webhook");
  });

  it("renders the partner launch cockpit and delivery console from referenced model data", () => {
    const panelSource = readSource(partnerPanel);

    expect(panelSource).toContain("buildPartnerLaunchCockpitModel");
    expect(panelSource).toContain("Partner Launch Cockpit");
    expect(panelSource).toContain("Readiness gates");
    expect(panelSource).toContain("Handoff packet");
    expect(panelSource).toContain("Event delivery console");
    expect(panelSource).toContain("Event catalog");
    expect(panelSource).toContain("Reference map");
  });

  it("shows the source projects that informed the partner readiness work", () => {
    const panelSource = readSource(partnerPanel);
    const modelSource = readSource(partnerReadinessModel);

    expect(panelSource).toContain("cockpit.references");
    expect(panelSource).toContain("reference.name");
    expect(modelSource).toContain("Hookdeck Outpost");
    expect(modelSource).toContain("Svix App Portal");
    expect(modelSource).toContain("Dub Webhooks");
    expect(modelSource).toContain("Trigger.dev Runs");
    expect(modelSource).toContain("Infisical Audit Logs");
    expect(modelSource).toContain("Unkey Permissions");
  });

  it("keeps the admin overview compact and links to the dedicated partner readiness route", () => {
    const adminClientSource = readSource(adminClient);

    expect(adminClientSource).toContain('id="partner-readiness"');
    expect(adminClientSource).toContain('href="/admin/partner-readiness"');
    expect(adminClientSource).not.toContain("<PartnerReadinessPanel");
    expect(adminClientSource).not.toContain("createPartnerApiKeyAction");
    expect(adminClientSource).not.toContain("createPartnerExportAction");
    expect(adminClientSource).not.toContain("createPartnerWebhookAction");
    expect(adminClientSource).not.toContain("testPartnerWebhookAction");
  });

  it("productizes the integrations route as a partner handoff module", () => {
    const integrationsPageSource = readSource(integrationsPage);

    expect(integrationsPageSource).toContain('requireDemoWorkflowAccess("admin")');
    expect(integrationsPageSource).toContain("loadAdminPartnerReadiness");
    expect(integrationsPageSource).toContain('data-admin-module="integrations"');
    expect(integrationsPageSource).toContain("Partner API contract");
    expect(integrationsPageSource).toContain("Credential scope coverage");
    expect(integrationsPageSource).not.toContain("ModulePlaceholderPage");
  });

  it("keeps wall-clock timestamps out of the admin render path", () => {
    const adminClientSource = readSource(adminClient);

    expect(adminClientSource).toContain("buildExportPayload(state, exportGeneratedAt)");
    expect(adminClientSource).not.toContain("generatedAt: new Date().toISOString()");
    expect(adminClientSource).not.toContain("Last admin interaction: {formatDate(new Date().toISOString())}");
  });

  it("keeps scaffold wording out of the admin proof copy", () => {
    const adminClientSource = readSource(adminClient);
    const scaffoldPhrases = [
      ["mock", "first"].join("-"),
      ["solo", "founder", "pacing"].join(" "),
      ["demo", "state"].join(" "),
    ];

    for (const phrase of scaffoldPhrases) {
      expect(adminClientSource).not.toContain(phrase);
    }
    expect(adminClientSource).toContain("operating evidence");
  });
});
