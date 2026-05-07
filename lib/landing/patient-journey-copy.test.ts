import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { productFlowSteps, routingMoment } from "@/components/landing/landing-scenario-data";

const routingMomentComponent = path.join(
  process.cwd(),
  "components",
  "landing",
  "routing-moment.tsx",
);

describe("patient journey landing copy", () => {
  it("frames the landing reroute story as a wasted trip avoided", () => {
    expect(routingMoment.before).toContain("wasted trip");
    expect(routingMoment.recommendation).toContain("Akasia Hills Clinic");
    expect(routingMoment.reasons).toContain("Wasted travel avoided: 18 min");
    expect(routingMoment.reasons).toContain("Best nearby compatible clinic");
    expect(productFlowSteps[3].title).toBe("Wasted trip avoided");
  });

  it("renders the landing visual with journey impact proof labels", () => {
    const source = readFileSync(routingMomentComponent, "utf8");

    expect(source).toContain("Wasted trip avoided");
    expect(source).toContain("18 min avoided");
    expect(source).toContain("Best nearby compatible");
  });
});
