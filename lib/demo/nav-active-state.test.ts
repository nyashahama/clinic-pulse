import { describe, expect, it } from "vitest";

import { isDashboardNavUrlActive } from "@/lib/demo/nav-active-state";

function searchParams(query = "") {
  return {
    toString: () => query,
  };
}

describe("isDashboardNavUrlActive", () => {
  it("marks an exact base route active", () => {
    expect(isDashboardNavUrlActive("/admin", "/admin", searchParams())).toBe(true);
  });

  it("marks a subpath active for its base route", () => {
    expect(
      isDashboardNavUrlActive(
        "/demo",
        "/demo/clinics/clinic-mamelodi-east",
        searchParams(),
      ),
    ).toBe(true);
  });

  it("requires exact query matches for query-specific URLs", () => {
    expect(
      isDashboardNavUrlActive(
        "/demo?status=non_functional",
        "/demo",
        searchParams("status=non_functional"),
      ),
    ).toBe(true);
    expect(
      isDashboardNavUrlActive(
        "/demo?status=non_functional",
        "/demo",
        searchParams("status=functional"),
      ),
    ).toBe(false);
    expect(
      isDashboardNavUrlActive(
        "/demo?status=non_functional",
        "/demo/clinics/clinic-mamelodi-east",
        searchParams("status=non_functional"),
      ),
    ).toBe(false);
  });

  it("does not mark same-page admin hash anchors active from the base path", () => {
    expect(
      isDashboardNavUrlActive("/admin#users-roles", "/admin", searchParams()),
    ).toBe(false);
  });

  it("does not mark same-page field hash anchors active from the base path", () => {
    expect(
      isDashboardNavUrlActive("/field#drafts-sync", "/field", searchParams()),
    ).toBe(false);
  });

  it("does not mark same-page demo hash anchors active from the base path", () => {
    expect(
      isDashboardNavUrlActive("/demo#severity-queue", "/demo", searchParams()),
    ).toBe(false);
  });
});
