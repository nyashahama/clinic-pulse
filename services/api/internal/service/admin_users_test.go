package service

import "testing"

func TestCanManageUserScopePreventsOrgAdminChangingSystemAdmin(t *testing.T) {
	organisationID := int64(10)
	actor := AdminActor{Role: "org_admin", OrganisationID: &organisationID}
	target := AdminUserAccess{Role: "system_admin"}

	if CanManageUserAccess(actor, target, AdminUserAccessChange{Role: "system_admin"}) {
		t.Fatal("expected org admin not to manage system admin access")
	}
}

func TestCanManageUserScopeAllowsOrgAdminInsideOrganisation(t *testing.T) {
	organisationID := int64(10)
	district := "Tshwane"
	actor := AdminActor{Role: "org_admin", OrganisationID: &organisationID}
	target := AdminUserAccess{Role: "reporter", OrganisationID: &organisationID}
	change := AdminUserAccessChange{Role: "district_manager", OrganisationID: &organisationID, District: &district}

	if !CanManageUserAccess(actor, target, change) {
		t.Fatal("expected org admin to manage access inside organisation")
	}
}
