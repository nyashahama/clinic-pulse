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
        "/districts",
        "/districts/clinics/clinic-mabopane-station",
        searchParams(),
      ),
    ).toBe(true);
  });

  it("requires exact query matches for query-specific URLs", () => {
    expect(
      isDashboardNavUrlActive(
        "/districts?status=non_functional",
        "/districts",
        searchParams("status=non_functional"),
      ),
    ).toBe(true);
    expect(
      isDashboardNavUrlActive(
        "/districts?status=non_functional",
        "/districts",
        searchParams("status=functional"),
      ),
    ).toBe(false);
    expect(
      isDashboardNavUrlActive(
        "/districts?status=non_functional",
        "/districts/clinics/clinic-mabopane-station",
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
      isDashboardNavUrlActive("/districts#severity-queue", "/districts", searchParams()),
    ).toBe(false);
  });
});
