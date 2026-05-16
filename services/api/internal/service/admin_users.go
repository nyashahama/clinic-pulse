package service

import "strings"

type AdminActor struct {
	UserID         int64
	Role           string
	OrganisationID *int64
}

type AdminUserAccess struct {
	UserID         int64
	Role           string
	OrganisationID *int64
	District       *string
}

type AdminUserAccessChange struct {
	Role           string
	OrganisationID *int64
	District       *string
}

func CanManageUserAccess(actor AdminActor, target AdminUserAccess, change AdminUserAccessChange) bool {
	if len(ValidateAdminUserAccessChange(change)) > 0 {
		return false
	}
	if actor.Role == "system_admin" {
		return true
	}
	if actor.Role != "org_admin" || actor.OrganisationID == nil {
		return false
	}
	if target.Role == "system_admin" || change.Role == "system_admin" {
		return false
	}
	if change.OrganisationID == nil || *change.OrganisationID != *actor.OrganisationID {
		return false
	}
	if target.OrganisationID != nil && *target.OrganisationID != *actor.OrganisationID {
		return false
	}
	return change.Role == "org_admin" || change.Role == "district_manager" || change.Role == "reporter"
}

func ValidateAdminUserAccessChange(change AdminUserAccessChange) []string {
	fields := []string(nil)
	role := strings.TrimSpace(change.Role)
	districtProvided := change.District != nil
	districtSet := districtProvided && strings.TrimSpace(*change.District) != ""

	if role == "" {
		return append(fields, "role: role is required")
	}
	if change.OrganisationID != nil && *change.OrganisationID <= 0 {
		fields = append(fields, "organisationId: organisationId must be positive")
	}

	switch role {
	case "system_admin":
		if change.OrganisationID != nil {
			fields = append(fields, "organisationId: organisationId must be omitted for system_admin")
		}
		if districtProvided {
			fields = append(fields, "district: district must be omitted for system_admin")
		}
	case "org_admin", "reporter":
		if change.OrganisationID == nil {
			fields = append(fields, "organisationId: organisationId is required")
		}
		if districtProvided {
			fields = append(fields, "district: district must be omitted for org_admin and reporter")
		}
	case "district_manager":
		if change.OrganisationID == nil {
			fields = append(fields, "organisationId: organisationId is required")
		}
		if !districtSet {
			fields = append(fields, "district: district is required")
		}
	default:
		fields = append(fields, "role: role must be one of: system_admin, org_admin, district_manager, reporter")
	}

	return fields
}
