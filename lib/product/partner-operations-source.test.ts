import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const partnerReadinessPage = path.join(
  process.cwd(),
  "app",
  "(workspace)",
  "admin",
  "partner-readiness",
  "page.tsx",
);
const integrationsPage = path.join(
  process.cwd(),
  "app",
  "(workspace)",
  "admin",
  "integrations",
  "page.tsx",
);
const partnerOperationsBriefing = path.join(
  process.cwd(),
  "components",
  "product",
  "partner-operations-briefing.tsx",
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

describe("admin partner operations surfaces", () => {
  it("replaces the partner readiness command shell with a launch cockpit briefing", () => {
    const source = readSource(partnerReadinessPage);

    expect(source).toContain("buildPartnerLaunchCockpitModel");
    expect(source).toContain("PartnerOperationsBriefing");
    expect(source).toContain("Partner Launch Cockpit");
    expect(source).not.toContain("Partner readiness command centre");
    expect(source).not.toContain("Partner handoff queue");
  });

  it("replaces the integrations command shell with a delivery console briefing", () => {
    const source = readSource(integrationsPage);

    expect(source).toContain("buildPartnerLaunchCockpitModel");
    expect(source).toContain("PartnerOperationsBriefing");
    expect(source).toContain("Integration Delivery Console");
    expect(source).toContain("Endpoint smoke matrix");
    expect(source).toContain("Delivery runbook");
    expect(source).not.toContain("Integration operations command centre");
    expect(source).not.toContain("Integration evidence queue");
  });

  it("keeps the shared briefing grounded in launch gates and handoff evidence", () => {
    const source = readSource(partnerOperationsBriefing);

    expect(source).toContain("Launch gate runway");
    expect(source).toContain("Handoff packet");
    expect(source).toContain("Launch evidence map");
    expect(source).toContain("Receiver test lane");
    expect(source).toContain("getPartnerOperationsToneClassName");
    expect(source).not.toContain("Hookdeck");
    expect(source).not.toContain("Svix");
    expect(source).not.toContain("Dub Webhooks");
  });
});
