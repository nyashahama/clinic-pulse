package http

import (
	"context"
	"errors"
	nethttp "net/http"
	"sort"

	"github.com/jackc/pgx/v5"

	"clinicpulse/services/api/internal/auth"
	"clinicpulse/services/api/internal/store"
)

type contextKey string

const (
	principalContextKey   contextKey = "principal"
	authDetailsContextKey contextKey = "authDetails"
)

type Principal struct {
	UserID         int64
	Email          string
	DisplayName    string
	OrganisationID *int64
	Role           string
	DistrictScope  *string
	SessionID      int64
}

type authDetails struct {
	Session     store.Session
	User        store.User
	Memberships []store.OrganisationMembership
}

func RequireAuth(clinicStore ClinicStore) func(nethttp.Handler) nethttp.Handler {
	return func(next nethttp.Handler) nethttp.Handler {
		return nethttp.HandlerFunc(func(w nethttp.ResponseWriter, r *nethttp.Request) {
			cookie, err := r.Cookie(sessionCookieName)
			if err != nil || cookie.Value == "" {
				respondUnauthorized(w)
				return
			}

			tokenHash, err := auth.HashSessionToken(cookie.Value)
			if err != nil {
				respondUnauthorized(w)
				return
			}

			session, user, err := clinicStore.GetSessionByTokenHash(r.Context(), tokenHash)
			if err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					respondUnauthorized(w)
					return
				}
				RespondError(w, nethttp.StatusInternalServerError, "internal_error", "internal server error")
				return
			}

			memberships, err := clinicStore.ListMembershipsForUser(r.Context(), user.ID)
			if err != nil {
				RespondError(w, nethttp.StatusInternalServerError, "internal_error", "internal server error")
				return
			}

			principal, ok := PrincipalForMemberships(user, session, memberships)
			if !ok {
				respondUnauthorized(w)
				return
			}

			ctx := ContextWithPrincipal(r.Context(), principal)
			ctx = context.WithValue(ctx, authDetailsContextKey, authDetails{
				Session:     session,
				User:        user,
				Memberships: memberships,
			})
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireRole(roles ...string) func(nethttp.Handler) nethttp.Handler {
	allowed := make(map[string]struct{}, len(roles))
	for _, role := range roles {
		allowed[role] = struct{}{}
	}

	return func(next nethttp.Handler) nethttp.Handler {
		return nethttp.HandlerFunc(func(w nethttp.ResponseWriter, r *nethttp.Request) {
			principal, ok := PrincipalFromContext(r.Context())
			if !ok {
				respondUnauthorized(w)
				return
			}
			if _, ok := allowed[principal.Role]; !ok {
				RespondError(w, nethttp.StatusForbidden, "forbidden", "forbidden")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func PrincipalFromContext(ctx context.Context) (Principal, bool) {
	principal, ok := ctx.Value(principalContextKey).(Principal)
	return principal, ok
}

func ContextWithPrincipal(ctx context.Context, principal Principal) context.Context {
	markRequestPrincipalType(ctx, "session")
	return context.WithValue(ctx, principalContextKey, principal)
}

func authDetailsFromContext(ctx context.Context) (authDetails, bool) {
	details, ok := ctx.Value(authDetailsContextKey).(authDetails)
	return details, ok
}

func PrincipalForMemberships(user store.User, session store.Session, memberships []store.OrganisationMembership) (Principal, bool) {
	if len(memberships) == 0 {
		return Principal{}, false
	}

	sorted := append([]store.OrganisationMembership(nil), memberships...)
	sort.SliceStable(sorted, func(i, j int) bool {
		left := sorted[i]
		right := sorted[j]
		if roleRank(left.Role) != roleRank(right.Role) {
			return roleRank(left.Role) > roleRank(right.Role)
		}
		if compareNullableInt64(left.OrganisationID, right.OrganisationID) != 0 {
			return compareNullableInt64(left.OrganisationID, right.OrganisationID) < 0
		}
		if compareNullableString(left.District, right.District) != 0 {
			return compareNullableString(left.District, right.District) < 0
		}
		return left.ID < right.ID
	})

	membership := sorted[0]
	return Principal{
		UserID:         user.ID,
		Email:          user.Email,
		DisplayName:    user.DisplayName,
		OrganisationID: membership.OrganisationID,
		Role:           membership.Role,
		DistrictScope:  membership.District,
		SessionID:      session.ID,
	}, true
}

func roleRank(role string) int {
	switch role {
	case "system_admin":
		return 4
	case "org_admin":
		return 3
	case "district_manager":
		return 2
	case "reporter":
		return 1
	default:
		return 0
	}
}

func compareNullableInt64(left, right *int64) int {
	if left == nil && right == nil {
		return 0
	}
	if left == nil {
		return -1
	}
	if right == nil {
		return 1
	}
	if *left < *right {
		return -1
	}
	if *left > *right {
		return 1
	}
	return 0
}

func compareNullableString(left, right *string) int {
	if left == nil && right == nil {
		return 0
	}
	if left == nil {
		return -1
	}
	if right == nil {
		return 1
	}
	if *left < *right {
		return -1
	}
	if *left > *right {
		return 1
	}
	return 0
}
