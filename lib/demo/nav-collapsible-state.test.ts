import { describe, expect, it } from "vitest";

import { resolveNavCollapsibleOpen } from "@/lib/demo/nav-collapsible-state";

describe("resolveNavCollapsibleOpen", () => {
  it("opens a nav group when its route becomes active", () => {
    expect(resolveNavCollapsibleOpen({ active: true, open: false })).toBe(true);
  });

  it("preserves the current open state while the route is inactive", () => {
    expect(resolveNavCollapsibleOpen({ active: false, open: true })).toBe(true);
    expect(resolveNavCollapsibleOpen({ active: false, open: false })).toBe(false);
  });
});
