import { describe, expect, it } from "vitest";

import {
  adminManualLeadEntryMode,
  adminWorkspaceSections,
} from "@/lib/demo/admin-layout";

describe("adminWorkspaceSections", () => {
  it("renders the admin workspace in one vertical workflow", () => {
    expect(adminWorkspaceSections).toEqual([
      "pipeline",
      "export",
      "builder",
      "roadmap",
      "notes",
    ]);
  });

  it("keeps manual lead entry as a secondary modal action", () => {
    expect(adminManualLeadEntryMode).toBe("modal");
  });
});
