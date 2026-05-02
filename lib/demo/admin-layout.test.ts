import { describe, expect, it } from "vitest";

import {
  adminManualLeadEntryMode,
  adminWorkspaceSections,
} from "@/lib/demo/admin-layout";

describe("adminWorkspaceSections", () => {
  it("makes pipeline and builder the primary admin workspace", () => {
    expect(adminWorkspaceSections).toEqual([
      "pipeline",
      "builder",
    ]);
  });

  it("keeps manual lead entry as a secondary modal action", () => {
    expect(adminManualLeadEntryMode).toBe("modal");
  });
});
