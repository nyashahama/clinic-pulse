import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const incidentReplayPanelPath = path.join(
  process.cwd(),
  "components",
  "demo",
  "incident-replay-panel.tsx",
);
const demoControlsPath = path.join(
  process.cwd(),
  "components",
  "demo",
  "demo-controls.tsx",
);
const demoPageClientPath = path.join(
  process.cwd(),
  "app",
  "(demo)",
  "demo",
  "page-client.tsx",
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

describe("incident replay controls and page wiring source boundary", () => {
  it("contains the replay control and page orchestration integration points", () => {
    const controlsSource = readFileSync(demoControlsPath, "utf8");
    const pageSource = readFileSync(demoPageClientPath, "utf8");

    expect(controlsSource).toContain("Replay incident");
    expect(controlsSource).toContain("onReplayIncident");
    expect(controlsSource).toContain("replayRunning");

    expect(pageSource).toContain("IncidentReplayPanel");
    expect(pageSource).toContain("startIncidentReplay");
    expect(pageSource).toContain("setSelectedClinicId(INCIDENT_REPLAY_SOURCE_CLINIC_ID)");
    expect(pageSource).toContain("setClinicPanelOpen(true)");
    expect(pageSource).toContain("setRerouteClinicId(null)");
    expect(pageSource).toContain("applyIncidentReplayStep(step.id");
    expect(pageSource).toContain("buildIncidentReplayWebhookPreview");
  });
});
