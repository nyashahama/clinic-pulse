import { describe, expect, it } from "vitest";

import type {
  AdminAuditEventApiResponse,
  AdminUserAccessApiResponse,
} from "@/lib/workspace/api-types";
import { buildIdentityAuditDetailModel } from "@/lib/product/identity-audit-detail";

const activeUser: AdminUserAccessApiResponse = {
  userId: 3,
  email: "org-admin@clinicpulse.local",
  displayName: "Organisation Admin",
  createdAt: "2026-05-19T21:45:00.000Z",
  role: "org_admin",
  organisationId: 1,
  district: null,
  lastSeenAt: "2026-05-31T00:52:00.000Z",
};

const disabledUser: AdminUserAccessApiResponse = {
  ...activeUser,
  disabledAt: "2026-05-31T01:15:00.000Z",
};

const accessAuditEvent: AdminAuditEventApiResponse = {
  id: 461,
  clinicId: "",
  actorName: "System Admin",
  actorUserId: 2,
  actorRole: "system_admin",
  eventType: "auth.login.succeeded",
  summary: "User signed in.",
  entityType: "session",
  entityId: "452",
  organisationId: null,
  metadata: { ip: "127.0.0.1" },
  createdAt: "2026-05-31T00:53:00.000Z",
};

describe("buildIdentityAuditDetailModel", () => {
  it("builds a clear access evidence brief for active scoped users", () => {
    const model = buildIdentityAuditDetailModel({
      kind: "user",
      user: activeUser,
      returnHref: "/admin/users-roles",
    });

    expect(model.title).toBe("Identity access evidence brief");
    expect(model.caseBrief.title).toBe("Access packet");
    expect(model.description).toContain("No access review flags");
    expect(model.chips).toContainEqual({ label: "Clear", tone: "stable" });
    expect(model.decision.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: "/admin/users-roles",
          label: "Return to evidence queue",
          priority: "primary",
        }),
        expect.objectContaining({
          href: "/admin/access-review",
          label: "Open access review",
          priority: "secondary",
        }),
      ]),
    );
  });

  it("escalates disabled identities as critical access evidence", () => {
    const model = buildIdentityAuditDetailModel({
      kind: "user",
      user: disabledUser,
      returnHref: "/admin/users-roles",
    });

    expect(model.description).toContain("Account disabled");
    expect(model.metrics).toContainEqual(
      expect.objectContaining({
        label: "Account state",
        tone: "critical",
        value: "Disabled",
      }),
    );
    expect(model.decision.nextStepTone).toBe("critical");
  });

  it("builds an audit event brief with source metadata and security handoff", () => {
    const model = buildIdentityAuditDetailModel({
      kind: "audit-event",
      event: accessAuditEvent,
      returnHref: "/admin/audit-evidence",
    });

    expect(model.title).toBe("Audit event evidence brief");
    expect(model.caseBrief.title).toBe("Audit packet");
    expect(model.chips).toContainEqual({ label: "Access", tone: "info" });
    expect(model.jsonBlocks).toContainEqual({
      title: "Metadata",
      value: { ip: "127.0.0.1" },
    });
    expect(model.decision.actions).toContainEqual(
      expect.objectContaining({
        href: "/admin/security",
        label: "Open security posture",
        priority: "secondary",
      }),
    );
  });
});
