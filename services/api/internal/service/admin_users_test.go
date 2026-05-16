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

func TestValidateAdminUserAccessChangeRoleScopeMatrix(t *testing.T) {
	organisationID := int64(10)
	district := "Tshwane"

	tests := []struct {
		name   string
		change AdminUserAccessChange
		valid  bool
	}{
		{
			name:   "system admin global",
			change: AdminUserAccessChange{Role: "system_admin"},
			valid:  true,
		},
		{
			name:   "org admin organisation scoped",
			change: AdminUserAccessChange{Role: "org_admin", OrganisationID: &organisationID},
			valid:  true,
		},
		{
			name:   "reporter organisation scoped",
			change: AdminUserAccessChange{Role: "reporter", OrganisationID: &organisationID},
			valid:  true,
		},
		{
			name:   "district manager district scoped",
			change: AdminUserAccessChange{Role: "district_manager", OrganisationID: &organisationID, District: &district},
			valid:  true,
		},
		{
			name:   "system admin with organisation",
			change: AdminUserAccessChange{Role: "system_admin", OrganisationID: &organisationID},
			valid:  false,
		},
		{
			name:   "system admin with district",
			change: AdminUserAccessChange{Role: "system_admin", District: &district},
			valid:  false,
		},
		{
			name:   "org admin without organisation",
			change: AdminUserAccessChange{Role: "org_admin"},
			valid:  false,
		},
		{
			name:   "org admin with district",
			change: AdminUserAccessChange{Role: "org_admin", OrganisationID: &organisationID, District: &district},
			valid:  false,
		},
		{
			name:   "reporter without organisation",
			change: AdminUserAccessChange{Role: "reporter"},
			valid:  false,
		},
		{
			name:   "reporter with district",
			change: AdminUserAccessChange{Role: "reporter", OrganisationID: &organisationID, District: &district},
			valid:  false,
		},
		{
			name:   "district manager without organisation",
			change: AdminUserAccessChange{Role: "district_manager", District: &district},
			valid:  false,
		},
		{
			name:   "district manager without district",
			change: AdminUserAccessChange{Role: "district_manager", OrganisationID: &organisationID},
			valid:  false,
		},
		{
			name:   "unknown role",
			change: AdminUserAccessChange{Role: "owner", OrganisationID: &organisationID},
			valid:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fields := ValidateAdminUserAccessChange(tt.change)
			if tt.valid && len(fields) > 0 {
				t.Fatalf("expected valid change, got fields %v", fields)
			}
			if !tt.valid && len(fields) == 0 {
				t.Fatal("expected validation fields for invalid change")
			}
		})
	}
}

func TestCanManageUserAccessRejectsInvalidRoleScopeMatrix(t *testing.T) {
	organisationID := int64(10)
	actor := AdminActor{Role: "system_admin"}
	target := AdminUserAccess{Role: "reporter", OrganisationID: &organisationID}

	if CanManageUserAccess(actor, target, AdminUserAccessChange{Role: "district_manager", OrganisationID: &organisationID}) {
		t.Fatal("expected invalid district manager scope to be rejected")
	}
}
