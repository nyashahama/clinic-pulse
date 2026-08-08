import { describe, expect, it } from "vitest";

import { operationalNarrative } from "@/lib/landing/operational-narrative-content";

function stringsIn(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringsIn);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(stringsIn);
  }
  return [];
}

describe("operational landing narrative", () => {
  it("defines four ordered incident stages with fixed increasing times", () => {
    expect(operationalNarrative.stages.map((stage) => stage.id)).toEqual([
      "field-report",
      "district-response",
      "patient-route",
      "audit-record",
    ]);
    expect(operationalNarrative.stages.map((stage) => stage.time)).toEqual([
      "08:42",
      "08:44",
      "08:46",
      "08:47",
    ]);
    expect(new Set(operationalNarrative.stages.map((stage) => stage.id)).size).toBe(4);
  });

  it("resolves the affected and alternative clinics used by the route", () => {
    const clinicIds = new Set(operationalNarrative.clinics.map((clinic) => clinic.id));
    expect(clinicIds.has(operationalNarrative.incident.affectedClinicId)).toBe(true);
    expect(clinicIds.has(operationalNarrative.route.toClinicId)).toBe(true);
    expect(operationalNarrative.route.estimate).toMatch(/estimated/i);
  });

  it("pairs warning and critical tones with visible state labels", () => {
    const riskStages = operationalNarrative.stages.filter((stage) =>
      ["warning", "critical"].includes(stage.tone),
    );
    expect(riskStages.length).toBeGreaterThan(0);
    for (const stage of riskStages) expect(stage.statusLabel.trim()).not.toBe("");
  });

  it("maps four unique product surfaces to declared stages", () => {
    expect(operationalNarrative.productSurfaces.map((surface) => surface.id)).toEqual([
      "district-console",
      "field-report",
      "public-routing",
      "audit-record",
    ]);
    expect(new Set(operationalNarrative.productSurfaces.map((surface) => surface.id)).size).toBe(4);
    const stageIds = new Set(operationalNarrative.stages.map((stage) => stage.id));
    for (const surface of operationalNarrative.productSurfaces) {
      expect(stageIds.has(surface.stageId)).toBe(true);
    }
  });

  it("labels the scenario honestly and avoids deployment-state claims", () => {
    expect(operationalNarrative.disclosure).toMatch(/illustrative|seeded/i);
    expect(stringsIn(operationalNarrative).join(" ")).not.toMatch(
      /currently live|live deployment|real-time district coverage|patients saved/i,
    );
  });
});
