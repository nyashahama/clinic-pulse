import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const scenarioControlsPage = path.join(
  process.cwd(),
  "app",
  "(workspace)",
  "admin",
  "scenario-controls",
  "page-client.tsx",
);
const scenarioBriefing = path.join(
  process.cwd(),
  "components",
  "product",
  "scenario-rehearsal-briefing.tsx",
);
const scenarioWorkspace = path.join(
  process.cwd(),
  "components",
  "product",
  "scenario-controls-workspace.tsx",
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

describe("admin scenario rehearsal cockpit", () => {
  it("replaces the generic scenario controls shell with a rehearsal cockpit", () => {
    const source = readSource(scenarioControlsPage);

    expect(source).toContain("ScenarioRehearsalBriefing");
    expect(source).toContain("Scenario rehearsal cockpit");
    expect(source).not.toContain("AdminModuleHeader");
    expect(source).not.toContain("AdminFilterBar");
  });

  it("adds playback, preflight, state diff, and flight-recorder framing to the scenario workspace", () => {
    const briefingSource = readSource(scenarioBriefing);
    const workspaceSource = readSource(scenarioWorkspace);

    expect(briefingSource).toContain("Rehearsal playback console");
    expect(briefingSource).toContain("Run state diff");
    expect(briefingSource).toContain("Preflight checklist");
    expect(workspaceSource).toContain("Launch controls");
    expect(workspaceSource).toContain("Scenario flight recorder");
    expect(workspaceSource).toContain("Selected state diff");
  });

  it("keeps open-source reference names out of the product UI source", () => {
    const combinedSource = `${readSource(scenarioBriefing)}\n${readSource(scenarioWorkspace)}`;

    expect(combinedSource).not.toContain("Trigger.dev");
    expect(combinedSource).not.toContain("OpenPanel");
    expect(combinedSource).not.toContain("Twenty");
  });
});
