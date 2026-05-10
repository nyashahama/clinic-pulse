import { describe, expect, it } from "vitest";

import { getMembershipHomeHref, getRoleHomeHref } from "@/lib/auth/role-home";
import type { AuthMembership, AuthRole } from "@/lib/auth/api";

function membership(role: AuthRole, overrides: Partial<AuthMembership> = {}): AuthMembership {
  return {
    id: overrides.id ?? 1,
    organisationId: overrides.organisationId ?? 1,
    userId: overrides.userId ?? 1,
    role,
    district: overrides.district,
    createdAt: overrides.createdAt ?? "2026-05-10T00:00:00.000Z",
    ...overrides,
  };
}

describe("role home routing", () => {
  it("sends district managers to the product district workspace", () => {
    expect(getRoleHomeHref("district_manager")).toBe("/district");
  });

  it("uses the district workspace for the highest ranked district membership", () => {
    expect(
      getMembershipHomeHref([
        membership("reporter", { id: 10 }),
        membership("district_manager", { id: 20 }),
      ]),
    ).toBe("/district");
  });

  it("keeps admin and reporter homes stable", () => {
    expect(getRoleHomeHref("reporter")).toBe("/field");
    expect(getRoleHomeHref("org_admin")).toBe("/admin");
    expect(getRoleHomeHref("system_admin")).toBe("/admin");
  });
});
