import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const incidentReplayPanelPath = path.join(
  process.cwd(),
  "components",
  "demo",
  "incident-replay-panel.tsx",
);

describe("incident replay panel source boundary", () => {
  it("contains the replay timeline and webhook preview states", () => {
    const panelSource = readFileSync(incidentReplayPanelPath, "utf8");

    expect(panelSource).toContain("Incident replay");
    expect(panelSource).toContain("Partner webhook");
    expect(panelSource).toContain("Delivered preview");
    expect(panelSource).toContain("completedStepIds");
    expect(panelSource).toContain("activeStepId");
  });
});
