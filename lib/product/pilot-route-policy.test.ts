import { describe, expect, it } from "vitest";

import { pilotRoutePolicyFor, pilotCriticalRoutes } from "@/lib/product/pilot-route-policy";

describe("pilot route policy", () => {
  it("tracks pilot-critical field, district, and admin routes", () => {
    expect(pilotCriticalRoutes).toContain("/field/submit-report");
    expect(pilotCriticalRoutes).toContain("/field/sync-queue");
    expect(pilotCriticalRoutes).toContain("/district");
    expect(pilotCriticalRoutes).toContain("/admin/data-ingestion");
    expect(pilotCriticalRoutes).toContain("/admin/audit-evidence");
  });

  it("requires pilot-critical placeholders to be completed or hidden", () => {
    expect(pilotRoutePolicyFor("/field/sync-queue")).toEqual({
      route: "/field/sync-queue",
      pilotCritical: true,
      allowedOutcomes: ["complete", "hide"],
    });
  });

  it("allows demo-only routes to stay marked as sandbox", () => {
    expect(pilotRoutePolicyFor("/district/interventions")).toEqual({
      route: "/district/interventions",
      pilotCritical: false,
      allowedOutcomes: ["demo_sandbox", "hide"],
    });
  });
});
