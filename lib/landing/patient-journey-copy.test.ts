import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { productFlowSteps, routingMoment } from "@/components/landing/landing-scenario-data";
import {
  featureCards,
  heroIncident,
  productSurfacePreviewRows,
  workflowIncidentStages,
  workflowSteps,
} from "@/lib/landing/openpanel-refactor-content";

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

  it("aligns the active landing patient reroute preview with journey impact proof", () => {
    const patientFeature = featureCards.find((feature) => feature.title === "Patient rerouting");
    const publicFinderStage = workflowIncidentStages.find(
      (stage) => stage.surface === "Public finder",
    );

    expect(workflowSteps[3].title).toBe("Wasted trip avoided");
    expect(workflowSteps[3].detail).toBe("18 min avoided wasted travel");
    expect(publicFinderStage?.title).toBe("Wasted trip avoided");
    expect(publicFinderStage?.state).toBe("18 min avoided");
    expect(heroIncident.routeDetail).toContain("18 min");
    expect(heroIncident.routeDetail).toContain("best nearby compatible");
    expect(patientFeature?.description).toContain("avoid wasted trips");
    expect(patientFeature?.miniature.rows).toEqual([
      "Impact: 18 min avoided",
      "Clinic: Best nearby compatible",
      "Service: ARV pickup accepting",
    ]);
    expect(productSurfacePreviewRows["patient-reroute"]).toEqual([
      { label: "Impact", value: "18 min avoided", tone: "healthy" },
      { label: "Clinic", value: "Best nearby compatible", tone: "healthy" },
      { label: "Service", value: "ARV pickup accepting", tone: "healthy" },
    ]);
  });
});
