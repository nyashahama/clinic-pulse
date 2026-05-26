export type AccessReviewSourceReference = {
  source: string;
  href: string;
  sourcePath: string;
  role: string;
  licenseUse: "adaptable" | "reference-only";
};

export const accessReviewSourceReferences: AccessReviewSourceReference[] = [
  {
    source: "Infisical Permission Audit",
    href: "https://github.com/Infisical/infisical",
    sourcePath: "frontend/src/views/PermissionAuditSheet/PermissionAuditSheet.tsx",
    role:
      "Effective-access search, state filtering, and exportable audit evidence for access review decisions.",
    licenseUse: "adaptable",
  },
  {
    source: "Supabase Team Settings",
    href: "https://github.com/supabase/supabase",
    sourcePath:
      "apps/studio/components/interfaces/Organization/TeamSettings/MembersView.tsx",
    role:
      "Team member roster with search, role visibility, MFA status, invitations, and limited-access notices.",
    licenseUse: "adaptable",
  },
  {
    source: "Logto user roles",
    href: "https://github.com/logto-io/logto",
    sourcePath: "packages/console/src/pages/UserDetails/UserRoles/index.tsx",
    role:
      "User-specific role assignment table with search, pagination, assignment actions, and removal confirmation.",
    licenseUse: "reference-only",
  },
  {
    source: "Unkey roles table",
    href: "https://github.com/unkeyed/unkey",
    sourcePath:
      "web/apps/dashboard/components/roles-table/columns/create-roles-columns.tsx",
    role:
      "Selectable role rows with assigned-key and assigned-permission counts for risk prioritisation.",
    licenseUse: "reference-only",
  },
  {
    source: "Twenty role assignment",
    href: "https://github.com/twentyhq/twenty",
    sourcePath:
      "packages/twenty-front/src/modules/settings/roles/role-assignment/components/SettingsRoleAssignmentTable.tsx",
    role:
      "Assigned target search across members, agents, and API keys with compact role-target rows.",
    licenseUse: "reference-only",
  },
];
