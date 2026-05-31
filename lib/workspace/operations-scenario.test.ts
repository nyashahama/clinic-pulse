import { describe, expect, it } from "vitest";

import {
  DISTRICT_OPERATIONS_DISTRICT,
  DISTRICT_OPERATIONS_PROVINCE,
  OPERATIONS_INCIDENT,
  PRODUCT_LANGUAGE_BAN_LIST,
} from "@/lib/workspace/operations-scenario";

describe("district operations scenario", () => {
  it("defines one canonical district incident lifecycle", () => {
    expect(DISTRICT_OPERATIONS_DISTRICT).toBe("Tshwane North District");
    expect(OPERATIONS_INCIDENT.sourceClinicId).toBe("clinic-mabopane-station");
    expect(OPERATIONS_INCIDENT.sourceClinicName).toBe("Mabopane Station Clinic");
    expect(OPERATIONS_INCIDENT.affectedService).toBe("Pharmacy");
    expect(OPERATIONS_INCIDENT.recommendedAlternativeName).toBe("Akasia Hills Clinic");
    expect(OPERATIONS_INCIDENT.lifecycle).toEqual([
      "signal_received",
      "district_triage",
      "field_update",
      "admin_review",
      "monitoring",
    ]);
  });

  it("keeps user-facing scenario copy away from demo framing", () => {
    const serialized = JSON.stringify({
      district: DISTRICT_OPERATIONS_DISTRICT,
      incident: OPERATIONS_INCIDENT,
    }).toLowerCase();

    for (const banned of PRODUCT_LANGUAGE_BAN_LIST) {
      expect(serialized).not.toContain(banned.toLowerCase());
    }
  });

  it("covers authenticated product phrases that should not return", () => {
    expect(PRODUCT_LANGUAGE_BAN_LIST).toEqual(
      expect.arrayContaining([
        "LIVE_DEMO",
        "Book a demo",
        "Book demo",
        "Book a Clinic Pulse demo",
        "Book a ClinicPulse demo",
        "Demo controls",
        "Demo with Clinic Pulse",
        "Demo with ClinicPulse",
        "View walkthrough flow",
        "YC_DEMO",
        "The workspace is one moving operating record",
        "controlled scenario reset",
        "Add seeded scenario presets for demos",
        "Demo tenant estate",
        "demo-seeded",
        "Reset demo",
        "Demo actions",
        "mock state",
        "Reset walkthrough data",
        "YC demo-critical",
        "walkthrough booking intake",
        "Mock partner API surface",
        "founder demo",
        "founder demos",
        "sandbox endpoints",
        "sandbox API docs",
        "demo_token",
        "Quick actions for the founder-led walkthrough flow",
        "Clear local workspace changes",
        "Demo reset",
        "Demo lead event",
        "Demo export payload",
        "seeded operating data",
        "Seeded seeded operating data",
        "pilot organisation",
        "Confirm demo",
        "The workspace has",
        "scenario replay state",
        "seeded local seed credentials",
        "local demo includes seeded users",
        "founder pitch",
        "Demo leads",
        "walkthrough booking submissions",
        "walkthrough requests",
        "Founder package",
        "founder pipeline",
        "YC-ready",
        "current workspace state",
        "Demo partner integration",
        "Demo partner webhook",
        "Refresh the workspace surface",
      ]),
    );
  });

  it("keeps legacy clinic constants aligned to the district operations scenario", () => {
    expect(DISTRICT_OPERATIONS_PROVINCE).toBe(DISTRICT_OPERATIONS_PROVINCE);
    expect(DISTRICT_OPERATIONS_DISTRICT).toBe(DISTRICT_OPERATIONS_DISTRICT);
  });
});
