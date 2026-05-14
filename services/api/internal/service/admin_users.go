package service

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
