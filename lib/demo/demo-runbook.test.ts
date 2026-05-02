import { describe, expect, it } from "vitest";

import { phaseOneDemoRouteChecklist } from "@/lib/demo/demo-runbook";

describe("phaseOneDemoRouteChecklist", () => {
  it("covers every route in the founder demo path in walkthrough order", () => {
    expect(phaseOneDemoRouteChecklist.map((entry) => entry.path)).toEqual([
      "/",
      "/book-demo",
      "/book-demo/thanks",
      "/demo",
      "/clinics/clinic-mamelodi-east",
      "/finder",
      "/field",
      "/admin",
    ]);
  });

  it("defines a proof moment and viewport requirement for each route", () => {
    for (const entry of phaseOneDemoRouteChecklist) {
      expect(entry.proofMoment.length).toBeGreaterThan(12);
      expect(entry.viewports).toEqual(["desktop", "mobile"]);
    }
  });
});
