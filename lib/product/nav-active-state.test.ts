import { describe, expect, it } from "vitest";

import { isDashboardNavUrlActive } from "@/lib/product/nav-active-state";

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
        "/district",
        "/district/clinics/clinic-mabopane-station",
        searchParams(),
      ),
    ).toBe(true);
  });

  it("requires exact query matches for query-specific URLs", () => {
    expect(
      isDashboardNavUrlActive(
        "/district?status=non_functional",
        "/district",
        searchParams("status=non_functional"),
      ),
    ).toBe(true);
    expect(
      isDashboardNavUrlActive(
        "/district?status=non_functional",
        "/district",
        searchParams("status=functional"),
      ),
    ).toBe(false);
    expect(
      isDashboardNavUrlActive(
        "/district?status=non_functional",
        "/district/clinics/clinic-mabopane-station",
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

  it("does not mark same-page district hash anchors active from the base path", () => {
    expect(
      isDashboardNavUrlActive("/district#severity-queue", "/district", searchParams()),
    ).toBe(false);
  });
});
