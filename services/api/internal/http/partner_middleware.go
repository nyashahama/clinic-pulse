package http

import (
	"context"
	"errors"
	nethttp "net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"

	"clinicpulse/services/api/internal/auth"
	"clinicpulse/services/api/internal/store"
)

type partnerPrincipalContextKeyType string

const partnerPrincipalContextKey partnerPrincipalContextKeyType = "partnerPrincipal"

type PartnerPrincipal struct {
	APIKeyID         int64
	OrganisationID   *int64
	Name             string
	Environment      string
	Scopes           []string
	AllowedDistricts []string
}

func RequirePartnerAPIKey(clinicStore ClinicStore, pepper string) func(nethttp.Handler) nethttp.Handler {
	return func(next nethttp.Handler) nethttp.Handler {
		return nethttp.HandlerFunc(func(w nethttp.ResponseWriter, r *nethttp.Request) {
			secret := bearerToken(r.Header.Get("Authorization"))
			if secret == "" {
				respondUnauthorized(w)
				return
			}
			keyHash, err := auth.HashAPIKey(secret, pepper)
			if err != nil {
				respondUnauthorized(w)
				return
			}
			key, err := clinicStore.GetPartnerAPIKeyByHash(r.Context(), keyHash)
			if err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					respondUnauthorized(w)
					return
				}
				RespondError(w, nethttp.StatusInternalServerError, "internal_error", "internal server error")
				return
			}
			now := time.Now().UTC()
			if key.RevokedAt != nil || (key.ExpiresAt != nil && !key.ExpiresAt.After(now)) {
				respondUnauthorized(w)
				return
			}
			if err := clinicStore.TouchPartnerAPIKey(r.Context(), key.ID, remoteIPAddressValue(r.RemoteAddr), now); err != nil {
				if errors.Is(err, pgx.ErrNoRows) || errors.Is(err, store.ErrPartnerAPIKeyRevoked) || errors.Is(err, store.ErrPartnerAPIKeyExpired) {
					respondUnauthorized(w)
					return
				}
				RespondError(w, nethttp.StatusInternalServerError, "internal_error", "internal server error")
				return
			}
			next.ServeHTTP(w, r.WithContext(ContextWithPartnerPrincipal(r.Context(), PartnerPrincipal{
				APIKeyID:         key.ID,
				OrganisationID:   key.OrganisationID,
				Name:             key.Name,
				Environment:      key.Environment,
				Scopes:           key.Scopes,
				AllowedDistricts: key.AllowedDistricts,
			})))
		})
	}
}

func RequirePartnerScope(scope string) func(nethttp.Handler) nethttp.Handler {
	return func(next nethttp.Handler) nethttp.Handler {
		return nethttp.HandlerFunc(func(w nethttp.ResponseWriter, r *nethttp.Request) {
			principal, ok := PartnerPrincipalFromContext(r.Context())
			if !ok {
				respondUnauthorized(w)
				return
			}
			for _, candidate := range principal.Scopes {
				if candidate == scope {
					next.ServeHTTP(w, r)
					return
				}
			}
			RespondError(w, nethttp.StatusForbidden, "forbidden", "forbidden")
		})
	}
}

func ContextWithPartnerPrincipal(ctx context.Context, principal PartnerPrincipal) context.Context {
	return context.WithValue(ctx, partnerPrincipalContextKey, principal)
}

func PartnerPrincipalFromContext(ctx context.Context) (PartnerPrincipal, bool) {
	principal, ok := ctx.Value(partnerPrincipalContextKey).(PartnerPrincipal)
	return principal, ok
}

func bearerToken(header string) string {
	const prefix = "Bearer "
	if !strings.HasPrefix(header, prefix) {
		return ""
	}
	token := strings.TrimPrefix(header, prefix)
	if token == "" || strings.TrimSpace(token) != token {
		return ""
	}
	return token
}

func remoteIPAddressValue(remoteAddr string) string {
	if value := remoteIPAddress(remoteAddr); value != nil {
		return *value
	}
	return ""
}
