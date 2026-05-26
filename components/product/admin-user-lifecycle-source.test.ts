import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("AdminUserLifecycle source", () => {
  it("exposes admin account lifecycle controls", () => {
    const componentPath = join(
      process.cwd(),
      "components/product/admin-user-lifecycle.tsx",
    );

    expect(
      existsSync(componentPath),
      "expected the admin lifecycle component to exist",
    ).toBe(true);

    const source = readFileSync(componentPath, "utf8");

    expect(source).toContain("Create pilot user");
    expect(source).toContain("Disable or enable users");
    expect(source).toContain("Revoke active sessions");
    expect(source).toContain("Temporary password");
  });

  it("guards action parsing and transient password state", () => {
    const componentSource = readFileSync(
      join(process.cwd(), "components/product/admin-user-lifecycle.tsx"),
      "utf8",
    );
    const actionSource = readFileSync(
      join(process.cwd(), "app/(demo)/admin/users-roles/actions.ts"),
      "utf8",
    );
    const createUserBlock = componentSource.slice(
      componentSource.indexOf("async function createUser"),
      componentSource.indexOf("async function setDisabled"),
    );

    expect(componentSource).not.toContain(["@/lib", "demo"].join("/") + "/");
    expect(createUserBlock).toContain("setTemporaryPassword(null)");
    expect(componentSource).toContain("overflow-x-auto");
    expect(actionSource).toContain('typeof value !== "string"');
    expect(actionSource).toContain("Invalid organisation ID.");
  });

  it("wires all lifecycle actions into the users and roles page", () => {
    const pageSource = readFileSync(
      join(process.cwd(), "app/(demo)/admin/users-roles/page.tsx"),
      "utf8",
    );

    expect(pageSource).toContain("createPilotUserAction");
    expect(pageSource).toContain("setUserDisabledAction");
    expect(pageSource).toContain("updateUserAccessAction");
    expect(pageSource).toContain("revokeUserSessionsAction");
    expect(pageSource).toContain("AccessGovernanceWorkspace");
    expect(pageSource).toContain("buildAccessGovernanceViewModel");
  });
});
