import { describe, expect, it } from "vitest";

import { resolveNavCollapsibleOpen } from "@/lib/product/nav-collapsible-state";

describe("resolveNavCollapsibleOpen", () => {
  it("opens a nav group when its route becomes active", () => {
    expect(
      resolveNavCollapsibleOpen({
        active: true,
        activeSignature: "/district",
        closedActiveSignature: null,
        userOpen: false,
      }),
    ).toBe(true);
  });

  it("preserves the current open state while the route is inactive", () => {
    expect(
      resolveNavCollapsibleOpen({
        active: false,
        activeSignature: null,
        closedActiveSignature: null,
        userOpen: true,
      }),
    ).toBe(true);
    expect(
      resolveNavCollapsibleOpen({
        active: false,
        activeSignature: null,
        closedActiveSignature: null,
        userOpen: false,
      }),
    ).toBe(false);
  });

  it("allows the active nav group to stay closed after a user closes it", () => {
    expect(
      resolveNavCollapsibleOpen({
        active: true,
        activeSignature: "/district",
        closedActiveSignature: "/district",
        userOpen: false,
      }),
    ).toBe(false);
  });

  it("reopens a closed active nav group when a different route becomes active", () => {
    expect(
      resolveNavCollapsibleOpen({
        active: true,
        activeSignature: "/district/severity-queue",
        closedActiveSignature: "/district",
        userOpen: false,
      }),
    ).toBe(true);
  });
});
