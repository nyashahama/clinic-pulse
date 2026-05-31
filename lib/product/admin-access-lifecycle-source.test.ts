import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("admin access lifecycle source", () => {
  it("presents access review as an effective-access workspace", () => {
    const pageSource = readFileSync("app/(demo)/admin/access-review/page.tsx", "utf8");
    const workspaceSource = readFileSync(
      "components/product/access-review-workspace.tsx",
      "utf8",
    );
    const source = `${pageSource}\n${workspaceSource}`;

    expect(source).toContain("Effective access cockpit");
    expect(source).toContain("Effective access workspace");
    expect(source).toContain("Permission audit matrix");
    expect(source).toContain("Selected principal packet");
    expect(source).toContain("Principal review queue");
    expect(source).toContain("Search principals");
    expect(source).toContain("Search actions and grant sources");
    expect(source).toContain("buildAdminUserDetailHref(subject.userId, returnSource)");
    expect(source).not.toContain("Access review command centre");
  });

  it("presents users and roles as the lifecycle side of the access cockpit", () => {
    const source = readFileSync("app/(demo)/admin/users-roles/page.tsx", "utf8");

    expect(source).toContain("Access lifecycle cockpit");
    expect(source).toContain("Role assignment map");
    expect(source).toContain("Lifecycle controls");
    expect(source).toContain("Effective access baseline");
    expect(source).toContain("Permission baseline");
    expect(source).not.toContain("Users and roles command centre");
  });

  it("keeps the shared access model out of demo-only modules", () => {
    const source = readFileSync("lib/product/admin-access-lifecycle.ts", "utf8");

    expect(source).toContain("buildAdminAccessLifecycleModel");
    expect(source).toContain("permissionResources");
    expect(source).toContain("roleSummaries");
    expect(source).not.toContain(["@/lib", "demo"].join("/") + "/");
  });
});
