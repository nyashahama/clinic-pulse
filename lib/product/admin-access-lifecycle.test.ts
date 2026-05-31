import { describe, expect, it } from "vitest";

import {
  buildAdminAccessLifecycleModel,
  filterAccessPermissionResources,
  filterAccessReviewSubjects,
} from "@/lib/product/admin-access-lifecycle";

const users = [
  {
    userId: 1,
    email: "org-admin@example.test",
    displayName: "Org Admin",
    createdAt: "2026-05-29T10:00:00.000Z",
    role: "org_admin",
    organisationId: 1,
    district: null,
    lastSeenAt: "2026-05-31T08:00:00.000Z",
  },
  {
    userId: 2,
    email: "district-manager@example.test",
    displayName: "District Manager",
    createdAt: "2026-05-29T11:00:00.000Z",
    role: "district_manager",
    organisationId: 1,
    district: null,
    lastSeenAt: "2026-05-30T08:00:00.000Z",
  },
  {
    userId: 3,
    email: "field-reporter@example.test",
    displayName: "Field Reporter",
    createdAt: "2026-05-29T12:00:00.000Z",
    role: "reporter",
    organisationId: 1,
    district: "Tshwane North District",
    lastSeenAt: null,
    disabledAt: "2026-05-31T07:00:00.000Z",
  },
];

describe("buildAdminAccessLifecycleModel", () => {
  it("builds an effective-access cockpit model with review-first subject ordering", () => {
    const model = buildAdminAccessLifecycleModel(users);

    expect(model.defaultSubjectId).toBe("user-2");
    expect(model.subjects.map((subject) => subject.id)).toEqual([
      "user-2",
      "user-3",
      "user-1",
    ]);
    expect(model.summary).toMatchObject({
      totalUsers: 3,
      privilegedUsers: 1,
      reviewSubjects: 2,
      staleSessions: 1,
    });
    expect(model.evidenceLinks.map((link) => [link.label, link.href])).toEqual([
      ["Access review", "/admin/access-review"],
      ["Users and roles", "/admin/users-roles"],
      ["Audit evidence", "/admin/audit-evidence"],
      ["Security posture", "/admin/security"],
    ]);
  });

  it("summarizes role assignment and selected principal permissions", () => {
    const model = buildAdminAccessLifecycleModel(users);

    expect(model.roleSummaries.map((role) => [role.role, role.assignedCount])).toEqual([
      ["org_admin", 1],
      ["district_manager", 1],
      ["reporter", 1],
      ["system_admin", 0],
    ]);

    const selected = model.subjects.find((subject) => subject.id === model.defaultSubjectId);
    expect(selected?.reviewReasons).toEqual(["Missing district scope"]);
    expect(selected?.permissionResources.map((resource) => resource.label)).toEqual([
      "Field reporting",
      "District operations",
      "Organisation governance",
      "Partner handoff",
      "Platform administration",
    ]);
    expect(
      selected?.permissionResources
        .flatMap((resource) => resource.actions)
        .filter((action) => action.state === "conditional")
      .map((action) => action.label),
    ).toContain("Manage district clinic state");
  });

  it("filters principals and permission evidence for the access review workspace", () => {
    const model = buildAdminAccessLifecycleModel(users);
    const selected = model.subjects.find((subject) => subject.id === "user-2");

    expect(filterAccessReviewSubjects(model.subjects, "field reporter")).toEqual([
      expect.objectContaining({ id: "user-3" }),
    ]);

    expect(selected).toBeDefined();
    const conditionalResources = filterAccessPermissionResources(selected!, {
      query: "district",
      state: "conditional",
    });
    expect(conditionalResources.flatMap((resource) => resource.actions)).toEqual([
      expect.objectContaining({ label: "Review field report evidence", state: "conditional" }),
      expect.objectContaining({ label: "Manage district clinic state", state: "conditional" }),
    ]);
    expect(conditionalResources.every((resource) => resource.conditionalCount > 0)).toBe(true);
  });
});
