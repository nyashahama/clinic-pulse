import { describe, expect, it } from "vitest";

import { phaseOneDemoRouteChecklist } from "@/lib/demo/demo-runbook";

describe("phaseOneDemoRouteChecklist", () => {
  it("covers every route in the operations walkthrough order", () => {
    expect(phaseOneDemoRouteChecklist.map((entry) => entry.path)).toEqual([
      "/",
      "/book-demo",
      "/book-demo/thanks",
      "/demo",
      "/demo/clinics/clinic-mamelodi-east",
      "/finder",
      "/field",
      "/admin",
    ]);
  });

  it("defines operations proof moments without staged demo wording", () => {
    const serialized = JSON.stringify(phaseOneDemoRouteChecklist);

    expect(serialized).not.toMatch(/demo workspace|founder demo|demonstrates|feature tour/i);

    for (const entry of phaseOneDemoRouteChecklist) {
      expect(entry.proofMoment.length).toBeGreaterThan(12);
      expect(entry.viewports).toEqual(["desktop", "mobile"]);
    }
  });
});
