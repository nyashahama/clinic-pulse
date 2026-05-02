import { describe, expect, it } from "vitest";

import { adminWorkspaceSections } from "@/lib/demo/admin-layout";

describe("adminWorkspaceSections", () => {
  it("keeps manual lead capture before builder content", () => {
    expect(adminWorkspaceSections).toEqual([
      "lead-capture",
      "pipeline",
      "builder",
    ]);
  });
});
