import { describe, expect, it } from "vitest";

import { getLoginHref, getSafeAuthReturnPath } from "./redirects";

describe("auth redirect helpers", () => {
  it("keeps internal protected return paths", () => {
    expect(getSafeAuthReturnPath("/admin/reporting-coverage")).toBe(
      "/admin/reporting-coverage",
    );
    expect(getLoginHref("/admin/reporting-coverage")).toBe(
      "/login?next=%2Fadmin%2Freporting-coverage",
    );
  });

  it("rejects unsafe or auth-looping return paths", () => {
    for (const value of [
      "",
      "https://evil.example/admin",
      "//evil.example/admin",
      "/login",
      "/login?next=/admin",
      "/register",
      "/change-password",
      "/admin\\reporting-coverage",
    ]) {
      expect(getSafeAuthReturnPath(value)).toBeNull();
    }
  });
});
