package http_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"

	"clinicpulse/services/api/internal/auth"
	apihttp "clinicpulse/services/api/internal/http"
	"clinicpulse/services/api/internal/store"
)

func TestProtectedRouteMissingCookieReturnsUnauthorized(t *testing.T) {
	router := apihttp.NewRouter(fakeStore{})
	req := httptest.NewRequest(http.MethodGet, "/v1/clinics", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertGenericUnauthorized(t, rec)
}

func TestPartnerRouteAcceptsValidAPIKey(t *testing.T) {
	secret, _, err := auth.GenerateAPIKey("demo")
	if err != nil {
		t.Fatalf("GenerateAPIKey returned error: %v", err)
	}
	hash, err := auth.HashAPIKey(secret, "")
	if err != nil {
		t.Fatalf("HashAPIKey returned error: %v", err)
	}
	updatedAt := time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC)
	touchCalls := 0
	router := apihttp.NewRouter(fakeStore{
		partnerAPIKey: store.PartnerAPIKey{
			ID:               10,
			Name:             "Demo partner",
			Environment:      "demo",
			KeyHash:          hash,
			Scopes:           []string{"clinics:read"},
			AllowedDistricts: []string{defaultTestDistrict},
			CreatedAt:        updatedAt,
			UpdatedAt:        updatedAt,
		},
		partnerTouchCalls: &touchCalls,
		clinics: []store.ClinicDetail{{
			Clinic: store.Clinic{
				ID:                 "clinic-1",
				Name:               "Central Clinic",
				District:           defaultTestDistrict,
				FacilityType:       "clinic",
				VerificationStatus: "verified",
			},
		}},
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/partner/clinics", nil)
	req.Header.Set("Authorization", "Bearer "+secret)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if touchCalls != 1 {
		t.Fatalf("expected partner key touch call, got %d", touchCalls)
	}
	assertPublicSafeResponse(t, rec.Body.String())
}

func TestPartnerRouteRejectsMissingInvalidRevokedAndExpiredKeys(t *testing.T) {
	validSecret, _, err := auth.GenerateAPIKey("demo")
	if err != nil {
		t.Fatalf("GenerateAPIKey returned error: %v", err)
	}
	hash, err := auth.HashAPIKey(validSecret, "")
	if err != nil {
		t.Fatalf("HashAPIKey returned error: %v", err)
	}
	now := time.Now().UTC()
	revokedAt := now.Add(-time.Hour)
	expiredAt := now.Add(-time.Minute)

	tests := []struct {
		name          string
		authorization string
		store         fakeStore
	}{
		{
			name: "missing",
		},
		{
			name:          "invalid",
			authorization: "Bearer not-a-key",
			store:         fakeStore{partnerKeyErr: pgx.ErrNoRows},
		},
		{
			name:          "revoked",
			authorization: "Bearer " + validSecret,
			store: fakeStore{partnerAPIKey: store.PartnerAPIKey{
				ID:        10,
				KeyHash:   hash,
				Scopes:    []string{"clinics:read"},
				RevokedAt: &revokedAt,
			}},
		},
		{
			name:          "expired",
			authorization: "Bearer " + validSecret,
			store: fakeStore{partnerAPIKey: store.PartnerAPIKey{
				ID:        10,
				KeyHash:   hash,
				Scopes:    []string{"clinics:read"},
				ExpiresAt: &expiredAt,
			}},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(tt.store)
			req := httptest.NewRequest(http.MethodGet, "/v1/partner/clinics", nil)
			if tt.authorization != "" {
				req.Header.Set("Authorization", tt.authorization)
			}
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			assertGenericUnauthorized(t, rec)
		})
	}
}

func TestProtectedRouteMalformedCookieReturnsUnauthorizedWithoutStoreCall(t *testing.T) {
	getSessionCalls := 0
	router := apihttp.NewRouter(fakeStore{getSessionCalls: &getSessionCalls})
	req := httptest.NewRequest(http.MethodGet, "/v1/clinics", nil)
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: "not-a-valid-token"})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertGenericUnauthorized(t, rec)
	if getSessionCalls != 0 {
		t.Fatalf("expected malformed token not to call store, got %d calls", getSessionCalls)
	}
}

func TestProtectedReadRouteAllowsValidCookieWithMembership(t *testing.T) {
	token := sessionTokenForTest(t)
	now := time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC)
	router := apihttp.NewRouter(fakeStore{
		session: store.Session{ID: 100, UserID: 42, ExpiresAt: now.Add(12 * time.Hour)},
		sessionUser: store.User{
			ID:          42,
			Email:       "manager@example.test",
			DisplayName: "Clinic Manager",
		},
		memberships: []store.OrganisationMembership{
			{ID: 7, UserID: 42, Role: "district_manager", CreatedAt: now},
		},
		clinics: []store.ClinicDetail{{Clinic: store.Clinic{ID: "clinic-1", Name: "Central Clinic"}}},
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/clinics", nil)
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: token})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
}

func TestProtectedRouteNoMembershipReturnsUnauthorized(t *testing.T) {
	token := sessionTokenForTest(t)
	router := apihttp.NewRouter(fakeStore{
		session:     store.Session{ID: 100, UserID: 42},
		sessionUser: store.User{ID: 42, Email: "user@example.test"},
		memberships: []store.OrganisationMembership{},
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/clinics", nil)
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: token})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertGenericUnauthorized(t, rec)
}

func TestAuthenticatedReporterCanPostReport(t *testing.T) {
	token := sessionTokenForTest(t)
	now := time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC)
	router := apihttp.NewRouter(fakeStore{
		session:     store.Session{ID: 100, UserID: 42, ExpiresAt: now.Add(12 * time.Hour)},
		sessionUser: store.User{ID: 42, Email: "reporter@example.test"},
		memberships: []store.OrganisationMembership{
			{ID: 7, OrganisationID: int64Ptr(1), UserID: 42, Role: "reporter", CreatedAt: now},
		},
		createReport:     store.Report{ID: 100, ClinicID: "clinic-1", Source: "field_worker", Status: "operational"},
		createStatus:     store.CurrentStatus{ClinicID: "clinic-1", Status: "operational"},
		createAuditEvent: store.AuditEvent{ID: 200, ClinicID: "clinic-1", EventType: "report.submitted"},
	})
	req := httptest.NewRequest(http.MethodPost, "/v1/reports", strings.NewReader(validReportJSON()))
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: token})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusCreated, rec.Code, rec.Body.String())
	}
}

func TestReporterCannotReadOperationalStreams(t *testing.T) {
	tests := []struct {
		name string
		path string
	}{
		{name: "alternatives", path: "/v1/alternatives?clinicId=clinic-1&service=Primary%20care"},
		{name: "clinics", path: "/v1/clinics"},
		{name: "clinic detail", path: "/v1/clinics/clinic-1"},
		{name: "clinic status", path: "/v1/clinics/clinic-1/status"},
		{name: "reports", path: "/v1/clinics/clinic-1/reports"},
		{name: "audit events", path: "/v1/clinics/clinic-1/audit-events"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{}))
			req := newAuthenticatedRequest(t, http.MethodGet, tt.path, nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusForbidden {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusForbidden, rec.Code, rec.Body.String())
			}
		})
	}
}

func TestOperationalStreamReadAllowsDistrictManagerOrgAdminAndSystemAdmin(t *testing.T) {
	for _, role := range []string{"district_manager", "org_admin", "system_admin"} {
		t.Run(role, func(t *testing.T) {
			router := apihttp.NewRouter(authenticatedStore(t, role, fakeStore{
				reports: []store.Report{{ID: 100, ClinicID: "clinic-1"}},
			}))
			req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics/clinic-1/reports", nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
			}
		})
	}
}

func TestRequireRoleRejectsAuthenticatedInsufficientRole(t *testing.T) {
	called := false
	handler := apihttp.RequireRole("org_admin")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusNoContent)
	}))
	req := httptest.NewRequest(http.MethodGet, "/strict", nil)
	req = req.WithContext(apihttp.ContextWithPrincipal(req.Context(), apihttp.Principal{
		UserID: 42,
		Email:  "reporter@example.test",
		Role:   "reporter",
	}))
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusForbidden, rec.Code, rec.Body.String())
	}
	if called {
		t.Fatal("expected insufficient role not to call next handler")
	}
}

func TestRequireRoleRejectsUnauthenticated(t *testing.T) {
	handler := apihttp.RequireRole("org_admin")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("expected unauthenticated request not to call next handler")
	}))
	req := httptest.NewRequest(http.MethodGet, "/strict", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	assertGenericUnauthorized(t, rec)
}

func TestPrincipalRolePrecedenceChoosesHighestRoleDeterministically(t *testing.T) {
	now := time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC)
	memberships := []store.OrganisationMembership{
		{ID: 30, OrganisationID: int64Ptr(20), UserID: 42, Role: "reporter", CreatedAt: now},
		{ID: 20, OrganisationID: int64Ptr(20), UserID: 42, Role: "district_manager", District: stringPtr("Zulu"), CreatedAt: now},
		{ID: 10, OrganisationID: int64Ptr(10), UserID: 42, Role: "district_manager", District: stringPtr("Alpha"), CreatedAt: now},
		{ID: 40, OrganisationID: nil, UserID: 42, Role: "system_admin", CreatedAt: now},
	}

	principal, ok := apihttp.PrincipalForMemberships(store.User{
		ID:          42,
		Email:       "admin@example.test",
		DisplayName: "Admin User",
	}, store.Session{ID: 100}, memberships)

	if !ok {
		t.Fatal("expected principal to be selected")
	}
	if principal.Role != "system_admin" || principal.OrganisationID != nil || principal.DistrictScope != nil {
		t.Fatalf("unexpected principal: %#v", principal)
	}
}

func TestPrincipalRolePrecedenceTieBreaksByOrganisationDistrictAndID(t *testing.T) {
	now := time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC)
	memberships := []store.OrganisationMembership{
		{ID: 20, OrganisationID: int64Ptr(2), UserID: 42, Role: "district_manager", District: stringPtr("Zulu"), CreatedAt: now},
		{ID: 10, OrganisationID: int64Ptr(1), UserID: 42, Role: "district_manager", District: stringPtr("Beta"), CreatedAt: now},
		{ID: 30, OrganisationID: int64Ptr(1), UserID: 42, Role: "district_manager", District: stringPtr("Alpha"), CreatedAt: now},
	}

	principal, ok := apihttp.PrincipalForMemberships(store.User{ID: 42}, store.Session{ID: 100}, memberships)

	if !ok {
		t.Fatal("expected principal to be selected")
	}
	if principal.OrganisationID == nil || *principal.OrganisationID != 1 {
		t.Fatalf("expected organisation 1, got %#v", principal.OrganisationID)
	}
	if principal.DistrictScope == nil || *principal.DistrictScope != "Alpha" {
		t.Fatalf("expected district Alpha, got %#v", principal.DistrictScope)
	}
}

func TestContextPrincipalHelpers(t *testing.T) {
	ctx := context.Background()
	if _, ok := apihttp.PrincipalFromContext(ctx); ok {
		t.Fatal("expected empty context not to contain principal")
	}

	want := apihttp.Principal{UserID: 42, Email: "user@example.test", Role: "reporter"}
	got, ok := apihttp.PrincipalFromContext(apihttp.ContextWithPrincipal(ctx, want))
	if !ok {
		t.Fatal("expected context to contain principal")
	}
	if got.UserID != want.UserID || got.Email != want.Email || got.Role != want.Role {
		t.Fatalf("unexpected principal: %#v", got)
	}
}

func TestPublicRoutesDoNotRequireCookie(t *testing.T) {
	tests := []struct {
		name       string
		method     string
		path       string
		body       string
		wantStatus int
	}{
		{name: "healthz", method: http.MethodGet, path: "/healthz", wantStatus: http.StatusOK},
		{name: "login", method: http.MethodPost, path: "/v1/auth/login", body: `{"email":`, wantStatus: http.StatusBadRequest},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(fakeStore{})
			req := httptest.NewRequest(tt.method, tt.path, strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != tt.wantStatus {
				t.Fatalf("expected status %d, got %d with body %s", tt.wantStatus, rec.Code, rec.Body.String())
			}
		})
	}
}

func int64Ptr(value int64) *int64 {
	return &value
}

func stringPtr(value string) *string {
	return &value
}
