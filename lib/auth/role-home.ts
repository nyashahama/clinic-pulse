import type { AuthMembership, AuthRole } from "@/lib/auth/api";

const ROLE_HOME_HREFS: Record<AuthRole, string> = {
  system_admin: "/admin",
  org_admin: "/admin",
  district_manager: "/district",
  reporter: "/field",
};

const ROLE_RANK: Record<AuthRole, number> = {
  system_admin: 4,
  org_admin: 3,
  district_manager: 2,
  reporter: 1,
};

export function getRoleHomeHref(role: AuthRole) {
  return ROLE_HOME_HREFS[role];
}

export function selectHighestMembershipRole(memberships: AuthMembership[]) {
  return [...memberships]
    .sort((left, right) => ROLE_RANK[right.role] - ROLE_RANK[left.role])[0]?.role;
}

export function getMembershipHomeHref(memberships: AuthMembership[]) {
  const role = selectHighestMembershipRole(memberships);

  return role ? getRoleHomeHref(role) : "/district";
}
