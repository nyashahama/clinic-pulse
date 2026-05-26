import { describe, expect, it } from "vitest";

import type { AdminUserAccessApiResponse } from "@/lib/demo/api-types";
import {
  buildAccessGovernanceViewModel,
  buildAccessUserDetailModel,
} from "@/lib/product/admin-access-governance";

const users: AdminUserAccessApiResponse[] = [
  {
    userId: 1,
    email: "system-admin@clinicpulse.local",
    displayName: "System Admin",
    role: "system_admin",
    organisationId: null,
    district: null,
    disabledAt: null,
    createdAt: "2026-05-01T08:00:00.000Z",
    lastSeenAt: null,
  },
  {
    userId: 2,
    email: "org-admin@clinicpulse.local",
    displayName: "Organisation Admin",
    role: "org_admin",
    organisationId: 1,
    district: null,
    disabledAt: null,
    createdAt: "2026-05-01T08:05:00.000Z",
    lastSeenAt: "2026-05-26T12:00:00.000Z",
  },
  {
    userId: 3,
    email: "district-manager@clinicpulse.local",
    displayName: "District Manager",
    role: "district_manager",
    organisationId: 1,
    district: null,
    disabledAt: null,
    createdAt: "2026-05-01T08:10:00.000Z",
    lastSeenAt: "2026-05-26T11:00:00.000Z",
  },
  {
    userId: 4,
    email: "reporter@clinicpulse.local",
    displayName: "Reporter",
    role: "reporter",
    organisationId: 1,
    district: "Tshwane North District",
    disabledAt: "2026-05-20T09:00:00.000Z",
    createdAt: "2026-05-01T08:20:00.000Z",
    lastSeenAt: "2026-05-21T09:00:00.000Z",
  },
  {
    userId: 5,
    email: "clear-reporter@clinicpulse.local",
    displayName: "Clear Reporter",
    role: "reporter",
    organisationId: 1,
    district: "Tshwane North District",
    disabledAt: null,
    createdAt: "2026-05-01T08:30:00.000Z",
    lastSeenAt: "2026-05-26T09:00:00.000Z",
  },
];

describe("buildAccessGovernanceViewModel", () => {
  it("turns admin users into an access governance packet", () => {
    const viewModel = buildAccessGovernanceViewModel(users, {
      detailReturnSource: "admin-access-review",
    });

    expect(viewModel.metrics).toEqual([
      {
        id: "users-in-scope",
        label: "Users in scope",
        value: "5",
        detail: "4 active; 1 disabled",
        tone: "info",
      },
      {
        id: "privileged-access",
        label: "Privileged access",
        value: "2",
        detail: "Organisation and system administrator accounts",
        tone: "attention",
      },
      {
        id: "review-load",
        label: "Needs review",
        value: "4",
        detail: "Privileged, disabled, stale, or unscoped access",
        tone: "attention",
      },
      {
        id: "session-evidence",
        label: "Session evidence",
        value: "4/5",
        detail: "1 account without a recent active session",
        tone: "attention",
      },
    ]);
    expect(viewModel.actions.map((action) => action.title)).toEqual([
      "Review privileged access",
      "Fix missing district scope",
      "Revoke stale sessions",
      "Maintain pilot roster",
    ]);
    expect(viewModel.reviewRows.map((row) => row.displayName)).toEqual([
      "System Admin",
      "Organisation Admin",
      "Reporter",
      "District Manager",
    ]);
    expect(viewModel.reviewRows[0]).toMatchObject({
      detailHref: "/admin/users-roles/1?from=admin-access-review",
      reviewState: "Review required",
      decisionHandoff: "Record access decision in audit evidence",
      reasons: ["System administrator access", "No recent session"],
    });
    expect(viewModel.reviewRows[1].reasons).toEqual([
      "Organisation administrator access",
    ]);
    expect(viewModel.sourceReferences.map((reference) => reference.source)).toEqual([
      "Logto console",
      "Infisical Permission Audit",
      "Supabase Audit Logs",
    ]);
  });
});

describe("buildAccessUserDetailModel", () => {
  it("builds a decision-ready detail model for a reviewed user", () => {
    const detailModel = buildAccessUserDetailModel(users[2], {
      usersHref: "/admin/users-roles",
      accessReviewHref: "/admin/access-review",
      auditEvidenceHref: "/admin/audit-evidence",
    });

    expect(detailModel.signals).toEqual([
      {
        id: "account-state",
        label: "Account state",
        value: "Active",
        detail: "Account can sign in unless sessions are revoked",
        tone: "clear",
      },
      {
        id: "role-scope",
        label: "Role scope",
        value: "District manager",
        detail: "Missing district scope",
        tone: "attention",
      },
      {
        id: "session-evidence",
        label: "Session evidence",
        value: "26 May 2026, 13:00",
        detail: "Latest active session signal",
        tone: "clear",
      },
      {
        id: "review-state",
        label: "Review state",
        value: "Review required",
        detail: "Missing district scope",
        tone: "attention",
      },
    ]);
    expect(detailModel.decisionActions).toEqual([
      {
        label: "Manage access",
        href: "/admin/users-roles",
        description: "Change role, district scope, lifecycle state, or sessions.",
      },
      {
        label: "Access review",
        href: "/admin/access-review",
        description: "Return to the review queue for other access exceptions.",
      },
      {
        label: "Audit evidence",
        href: "/admin/audit-evidence",
        description: "Use the audit trail as the decision record path.",
      },
    ]);
  });
}
);
