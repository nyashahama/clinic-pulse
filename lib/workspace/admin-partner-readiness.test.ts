import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const adminClient = path.join(process.cwd(), "app", "(workspace)", "admin", "page-client.tsx");
const orgAdminWorkbench = path.join(
  process.cwd(),
  "components",
  "product",
  "org-admin-governance-workbench.tsx",
);
const orgAdminWorkbenchModel = path.join(
  process.cwd(),
  "lib",
  "product",
  "org-admin-governance-workbench.ts",
);
const partnerReadinessPage = path.join(
  process.cwd(),
  "app",
  "(workspace)",
  "admin",
  "partner-readiness",
  "page.tsx",
);
const partnerReadinessClient = path.join(
  process.cwd(),
  "app",
  "(workspace)",
  "admin",
  "partner-readiness",
  "page-client.tsx",
);
const integrationsPage = path.join(
  process.cwd(),
  "app",
  "(workspace)",
  "admin",
  "integrations",
  "page.tsx",
);
const partnerPanel = path.join(
  process.cwd(),
  "components",
  "workspace",
  "partner-readiness-panel.tsx",
);
const partnerReadinessModel = path.join(
  process.cwd(),
  "lib",
  "workspace",
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

    expect(partnerReadinessPageSource).toContain('requireWorkspaceWorkflowAccess("admin")');
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
    expect(panelSource).toContain('aria-label="Partner launch workspace"');
    expect(panelSource).toContain("Readiness gates");
    expect(panelSource).toContain("Handoff packet");
    expect(panelSource).toContain("Partner action queue");
    expect(panelSource).toContain("Partner evidence ledger");
    expect(panelSource).toContain("Selected partner evidence");
    expect(panelSource).toContain("Event delivery console");
    expect(panelSource).toContain("Event catalog");
    expect(panelSource).toContain("filterPartnerEvidenceRows");
    expect(panelSource).toContain("getDefaultPartnerEvidenceRowId");
    expect(panelSource).not.toContain("Reference map");
  });

  it("keeps external reference sites out of the partner readiness product UI", () => {
    const panelSource = readSource(partnerPanel);
    const modelSource = readSource(partnerReadinessModel);

    expect(panelSource).not.toContain("cockpit.references");
    expect(panelSource).not.toContain("reference.name");
    expect(modelSource).not.toContain("Hookdeck Outpost");
    expect(modelSource).not.toContain("Svix App Portal");
    expect(modelSource).not.toContain("Dub Webhooks");
    expect(modelSource).not.toContain("Trigger.dev Runs");
    expect(modelSource).not.toContain("Infisical Audit Logs");
    expect(modelSource).not.toContain("Unkey Permissions");
  });

  it("keeps the admin overview compact and links to the dedicated partner readiness route", () => {
    const adminClientSource = readSource(adminClient);
    const modelSource = readSource(orgAdminWorkbenchModel);
    const workbenchSource = readSource(orgAdminWorkbench);

    expect(modelSource).toContain('href: "/admin/partner-readiness"');
    expect(workbenchSource).toContain("return `Open ${label.toLowerCase()}`");
    expect(workbenchSource).not.toContain("<PartnerReadinessPanel");
    expect(adminClientSource).not.toContain("createPartnerApiKeyAction");
    expect(adminClientSource).not.toContain("createPartnerExportAction");
    expect(adminClientSource).not.toContain("createPartnerWebhookAction");
    expect(adminClientSource).not.toContain("testPartnerWebhookAction");
  });

  it("productizes the integrations route as a partner handoff module", () => {
    const integrationsPageSource = readSource(integrationsPage);

    expect(integrationsPageSource).toContain('requireWorkspaceWorkflowAccess("admin")');
    expect(integrationsPageSource).toContain("loadAdminPartnerReadiness");
    expect(integrationsPageSource).toContain('data-admin-module="integrations"');
    expect(integrationsPageSource).toContain("Partner API contract");
    expect(integrationsPageSource).toContain("Credential scope coverage");
    expect(integrationsPageSource).not.toContain("ModulePlaceholderPage");
  });

  it("keeps wall-clock timestamps out of the admin render path", () => {
    const adminClientSource = readSource(adminClient);

    expect(adminClientSource).toContain("getLatestAdminInteractionAt(state)");
    expect(adminClientSource).not.toContain("generatedAt: new Date().toISOString()");
    expect(adminClientSource).not.toContain("Last admin interaction: {formatDate(new Date().toISOString())}");
  });

  it("keeps scaffold wording out of the admin proof copy", () => {
    const adminClientSource = readSource(adminClient);
    const workbenchSource = readSource(orgAdminWorkbench);
    const modelSource = readSource(orgAdminWorkbenchModel);
    const proofSource = `${adminClientSource}\n${workbenchSource}\n${modelSource}`;
    const scaffoldPhrases = [
      ["mock", "first"].join("-"),
      ["solo", "founder", "pacing"].join(" "),
      ["demo", "state"].join(" "),
    ];

    for (const phrase of scaffoldPhrases) {
      expect(proofSource).not.toContain(phrase);
    }
    expect(proofSource).toContain("operating evidence");
  });
});
