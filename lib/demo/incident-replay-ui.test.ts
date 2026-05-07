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
    expect(controlsSource).toContain('disabled: replayRunning');
    expect(controlsSource).toContain("onTriggerStockout");
    expect(controlsSource).toContain("onTriggerStaffingShortage");
    expect(controlsSource).toContain("onSyncOfflineReports");
    expect(controlsSource).toContain("onTriggerReroute");

    expect(pageSource).toContain("IncidentReplayPanel");
    expect(pageSource).toContain("startIncidentReplay");
    expect(pageSource).toContain("const replayNonIdle = replayStatus !== \"idle\"");
    expect(pageSource).toContain("resetDemo();");
    expect(pageSource).toContain("window.setTimeout(() => {");
    expect(pageSource).toContain("setSelectedClinicId(INCIDENT_REPLAY_SOURCE_CLINIC_ID)");
    expect(pageSource).toContain("setClinicPanelOpen(true)");
    expect(pageSource).toContain("setRerouteClinicId(null)");
    expect(pageSource).toContain("applyIncidentReplayStep(step.id");
    expect(pageSource).toContain("if (replayNonIdle) {");
    expect(pageSource).toContain("buildIncidentReplayWebhookPreview");
    expect(pageSource).toContain('replayStatus === "idle" ? mapClinics : clinicRows');
    expect(pageSource).toContain("replayStartGuardRef");
    expect(pageSource).toContain("replayStartGuardRef.current = true");
    expect(pageSource).toContain("replayStartGuardRef.current = false");
    expect(pageSource).toContain('replayStatus !== "idle" || replayStartGuardRef.current');
    expect(pageSource).toContain("replaySessionRef");
    expect(pageSource).toContain("runIncidentReplayStep(0, sessionId)");
    expect(pageSource).toContain("sessionId !== replaySessionRef.current");
    expect(pageSource).toContain("replayRunning={replayNonIdle}");
    expect(pageSource).toContain("INCIDENT_REPLAY_ROUTED_SERVICE");
    expect(pageSource).toContain(
      'const visibleClinicRows = replayStatus === "idle" ? mapClinics : clinicRows',
    );
    expect(pageSource).toContain(
      "selectedClinic?.id === INCIDENT_REPLAY_SOURCE_CLINIC_ID && replayNonIdle",
    );
    expect(pageSource).toContain("clinics={visibleClinicRows}");
    expect(pageSource).toContain('replayStatus === "idle"');
    expect(pageSource).toContain("Status filter is paused during replay");
  });
});
