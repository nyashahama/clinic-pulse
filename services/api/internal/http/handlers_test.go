package http_test

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"

	"clinicpulse/services/api/internal/auth"
	apihttp "clinicpulse/services/api/internal/http"
	"clinicpulse/services/api/internal/store"
)

const defaultTestDistrict = "Tshwane North Demo District"

func TestHealthzReturnsOK(t *testing.T) {
	router := apihttp.NewRouter(fakeStore{})

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rec.Code)
	}

	if !strings.Contains(rec.Body.String(), `"status":"ok"`) {
		t.Fatalf("expected response to contain status ok, got %q", rec.Body.String())
	}
}

func TestReadyzChecksDatabase(t *testing.T) {
	router := apihttp.NewRouter(fakeStore{})

	req := httptest.NewRequest(http.MethodGet, "/readyz", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	var got map[string]string
	decodeJSON(t, rec, &got)
	if got["database"] != "ok" {
		t.Fatalf("expected database ok readiness response, got %#v", got)
	}
}

func TestReadyzReturnsUnavailableWhenDatabaseCheckFails(t *testing.T) {
	router := apihttp.NewRouter(fakeStore{readyErr: errors.New("database down")})

	req := httptest.NewRequest(http.MethodGet, "/readyz", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusServiceUnavailable, rec.Code, rec.Body.String())
	}
	var got map[string]string
	decodeJSON(t, rec, &got)
	if got["database"] != "unavailable" {
		t.Fatalf("expected unavailable database readiness response, got %#v", got)
	}
	if strings.Contains(rec.Body.String(), "database down") {
		t.Fatalf("expected readiness response not to leak store error, got %s", rec.Body.String())
	}
}

func TestRequestLoggerCapturesStatusAndRequestID(t *testing.T) {
	var logOutput bytes.Buffer
	logger := log.New(&logOutput, "", 0)
	handler := apihttp.RequestLogger(logger)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTeapot)
	}))
	req := httptest.NewRequest(http.MethodGet, "/logged", nil)
	req.Header.Set("X-Request-Id", "request-123")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusTeapot {
		t.Fatalf("expected status %d, got %d", http.StatusTeapot, rec.Code)
	}
	if rec.Header().Get("X-Request-Id") != "request-123" {
		t.Fatalf("expected response request id request-123, got %q", rec.Header().Get("X-Request-Id"))
	}
	logLine := logOutput.String()
	for _, want := range []string{
		"method=GET",
		"path=/logged",
		"status=418",
		"principal_type=anonymous",
		"request_id=request-123",
		"duration_ms=",
	} {
		if !strings.Contains(logLine, want) {
			t.Fatalf("expected log to contain %q, got %q", want, logLine)
		}
	}
}

func TestRequestLoggerGeneratesRequestID(t *testing.T) {
	var logOutput bytes.Buffer
	logger := log.New(&logOutput, "", 0)
	handler := apihttp.RequestLogger(logger)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))
	req := httptest.NewRequest(http.MethodGet, "/logged", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	requestID := rec.Header().Get("X-Request-Id")
	if requestID == "" {
		t.Fatal("expected generated request id response header")
	}
	if !strings.Contains(logOutput.String(), "request_id="+requestID) {
		t.Fatalf("expected log to include generated request id %q, got %q", requestID, logOutput.String())
	}
}

func TestRequestLoggerRejectsUnsafeRequestIDHeaders(t *testing.T) {
	tests := []struct {
		name       string
		requestID  string
		notInLog   []string
		notInReply []string
	}{
		{
			name:      "fake log fields",
			requestID: "abc status=500",
			notInLog: []string{
				"request_id=abc status=500",
				"status=500",
			},
			notInReply: []string{"abc status=500"},
		},
		{
			name:       "too long",
			requestID:  strings.Repeat("a", 129),
			notInLog:   []string{strings.Repeat("a", 129)},
			notInReply: []string{strings.Repeat("a", 129)},
		},
		{
			name:       "unsafe character",
			requestID:  "request/id-123",
			notInLog:   []string{"request/id-123"},
			notInReply: []string{"request/id-123"},
		},
		{
			name:       "too short",
			requestID:  "short",
			notInLog:   []string{"request_id=short"},
			notInReply: []string{"short"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var logOutput bytes.Buffer
			logger := log.New(&logOutput, "", 0)
			handler := apihttp.RequestLogger(logger)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusNoContent)
			}))
			req := httptest.NewRequest(http.MethodGet, "/logged", nil)
			req.Header.Set("X-Request-Id", tt.requestID)
			rec := httptest.NewRecorder()

			handler.ServeHTTP(rec, req)

			gotRequestID := rec.Header().Get("X-Request-Id")
			if !isSafeRequestIDForTest(gotRequestID) {
				t.Fatalf("expected safe replacement request id, got %q", gotRequestID)
			}
			if gotRequestID == tt.requestID {
				t.Fatalf("expected unsafe request id %q to be replaced", tt.requestID)
			}
			logLine := logOutput.String()
			if !strings.Contains(logLine, "request_id="+gotRequestID) {
				t.Fatalf("expected log to include replacement request id %q, got %q", gotRequestID, logLine)
			}
			for _, forbidden := range tt.notInLog {
				if strings.Contains(logLine, forbidden) {
					t.Fatalf("expected log not to contain %q, got %q", forbidden, logLine)
				}
			}
			for _, forbidden := range tt.notInReply {
				if strings.Contains(gotRequestID, forbidden) {
					t.Fatalf("expected response request id not to contain %q, got %q", forbidden, gotRequestID)
				}
			}
		})
	}
}

func TestRequestLoggerLogsPrincipalTypeAssignedDownstream(t *testing.T) {
	tests := []struct {
		name   string
		assign func(context.Context) context.Context
		want   string
	}{
		{
			name: "session",
			assign: func(ctx context.Context) context.Context {
				return apihttp.ContextWithPrincipal(ctx, apihttp.Principal{UserID: 42})
			},
			want: "principal_type=session",
		},
		{
			name: "partner",
			assign: func(ctx context.Context) context.Context {
				return apihttp.ContextWithPartnerPrincipal(ctx, apihttp.PartnerPrincipal{APIKeyID: 10})
			},
			want: "principal_type=partner",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var logOutput bytes.Buffer
			logger := log.New(&logOutput, "", 0)
			handler := apihttp.RequestLogger(logger)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				r = r.WithContext(tt.assign(r.Context()))
				w.WriteHeader(http.StatusNoContent)
			}))
			req := httptest.NewRequest(http.MethodGet, "/logged", nil)
			rec := httptest.NewRecorder()

			handler.ServeHTTP(rec, req)

			if rec.Code != http.StatusNoContent {
				t.Fatalf("expected status %d, got %d", http.StatusNoContent, rec.Code)
			}
			if !strings.Contains(logOutput.String(), tt.want) {
				t.Fatalf("expected log to contain %q, got %q", tt.want, logOutput.String())
			}
		})
	}
}

func TestRequestLoggerRouterMountedPrincipalType(t *testing.T) {
	t.Run("session", func(t *testing.T) {
		logOutput := captureDefaultLogger(t)
		router := newAuthenticatedTestRouter(t, fakeStore{
			clinics: []store.ClinicDetail{{Clinic: store.Clinic{ID: "clinic-1", District: defaultTestDistrict}}},
		})
		req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics", nil)
		rec := httptest.NewRecorder()

		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
		}
		if !strings.Contains(logOutput.String(), "principal_type=session") {
			t.Fatalf("expected authenticated session request log, got %q", logOutput.String())
		}
	})

	t.Run("partner", func(t *testing.T) {
		logOutput := captureDefaultLogger(t)
		secret, _, err := auth.GenerateAPIKey("demo")
		if err != nil {
			t.Fatalf("GenerateAPIKey returned error: %v", err)
		}
		hash, err := auth.HashAPIKey(secret, "")
		if err != nil {
			t.Fatalf("HashAPIKey returned error: %v", err)
		}
		router := apihttp.NewRouter(fakeStore{
			partnerAPIKey: validPartnerAPIKey(hash, []string{"clinics:read"}, nil),
			clinics:       []store.ClinicDetail{{Clinic: store.Clinic{ID: "clinic-1", District: defaultTestDistrict}}},
		})
		req := httptest.NewRequest(http.MethodGet, "/v1/partner/clinics", nil)
		req.Header.Set("Authorization", "Bearer "+secret)
		rec := httptest.NewRecorder()

		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
		}
		if !strings.Contains(logOutput.String(), "principal_type=partner") {
			t.Fatalf("expected authenticated partner request log, got %q", logOutput.String())
		}
	})
}

func TestRequestLoggerInvalidCredentialsRemainAnonymous(t *testing.T) {
	t.Run("invalid cookie", func(t *testing.T) {
		logOutput := captureDefaultLogger(t)
		router := apihttp.NewRouter(fakeStore{})
		req := httptest.NewRequest(http.MethodGet, "/v1/clinics", nil)
		req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: "not-a-valid-token"})
		rec := httptest.NewRecorder()

		router.ServeHTTP(rec, req)

		assertGenericUnauthorized(t, rec)
		if !strings.Contains(logOutput.String(), "principal_type=anonymous") {
			t.Fatalf("expected invalid cookie to log anonymous, got %q", logOutput.String())
		}
		if strings.Contains(logOutput.String(), "principal_type=session") {
			t.Fatalf("expected invalid cookie not to log session, got %q", logOutput.String())
		}
	})

	t.Run("invalid bearer", func(t *testing.T) {
		logOutput := captureDefaultLogger(t)
		secret, _, err := auth.GenerateAPIKey("demo")
		if err != nil {
			t.Fatalf("GenerateAPIKey returned error: %v", err)
		}
		router := apihttp.NewRouter(fakeStore{})
		req := httptest.NewRequest(http.MethodGet, "/v1/partner/clinics", nil)
		req.Header.Set("Authorization", "Bearer "+secret)
		rec := httptest.NewRecorder()

		router.ServeHTTP(rec, req)

		assertGenericUnauthorized(t, rec)
		if !strings.Contains(logOutput.String(), "principal_type=anonymous") {
			t.Fatalf("expected invalid bearer to log anonymous, got %q", logOutput.String())
		}
		if strings.Contains(logOutput.String(), "principal_type=partner") {
			t.Fatalf("expected invalid bearer not to log partner, got %q", logOutput.String())
		}
	})
}

func TestListClinicsReturnsOK(t *testing.T) {
	updatedAt := time.Date(2026, 5, 1, 10, 0, 0, 0, time.UTC)
	router := newAuthenticatedTestRouter(t, fakeStore{
		clinics: []store.ClinicDetail{{
			Clinic: store.Clinic{
				ID:                 "clinic-1",
				Name:               "Central Clinic",
				FacilityCode:       "C001",
				Province:           "Gauteng",
				District:           defaultTestDistrict,
				FacilityType:       "clinic",
				VerificationStatus: "verified",
				CreatedAt:          updatedAt,
				UpdatedAt:          updatedAt,
			},
		}},
	})

	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}

	var got []store.ClinicDetail
	decodeJSON(t, rec, &got)
	if len(got) != 1 || got[0].Clinic.ID != "clinic-1" || got[0].Clinic.Name != "Central Clinic" {
		t.Fatalf("unexpected clinics response: %#v", got)
	}
}

func TestListClinicsReturnsEmptyArrayForNilSlice(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{})

	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if strings.TrimSpace(rec.Body.String()) != "[]" {
		t.Fatalf("expected empty array response, got %q", rec.Body.String())
	}
}

func TestListClinicsReturnsInternalErrorForUnexpectedStoreError(t *testing.T) {
	storeErr := errors.New("database password leaked")
	router := newAuthenticatedTestRouter(t, fakeStore{listErr: storeErr})

	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertInternalError(t, rec, storeErr)
}

func TestPublicListClinicsWorksWithoutCookieAndSanitizesStatus(t *testing.T) {
	updatedAt := time.Date(2026, 5, 1, 10, 0, 0, 0, time.UTC)
	reportedAt := time.Date(2026, 5, 1, 9, 45, 0, 0, time.UTC)
	reporterName := "Nomsa Dlamini"
	source := "field_worker"
	reason := "Short staffed"
	router := apihttp.NewRouter(fakeStore{
		clinics: []store.ClinicDetail{{
			Clinic: store.Clinic{
				ID:                 "clinic-1",
				Name:               "Central Clinic",
				FacilityCode:       "C001",
				Province:           "Gauteng",
				District:           "Johannesburg",
				FacilityType:       "clinic",
				VerificationStatus: "verified",
				CreatedAt:          updatedAt,
				UpdatedAt:          updatedAt,
			},
			Services: []store.ClinicService{{
				ClinicID:            "clinic-1",
				ServiceName:         "Primary care",
				CurrentAvailability: "available",
			}},
			CurrentStatus: &store.CurrentStatus{
				ClinicID:       "clinic-1",
				Status:         "degraded",
				Reason:         &reason,
				Freshness:      "fresh",
				LastReportedAt: &reportedAt,
				ReporterName:   &reporterName,
				Source:         &source,
				UpdatedAt:      updatedAt,
			},
		}},
	})

	req := httptest.NewRequest(http.MethodGet, "/v1/public/clinics", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	assertPublicSafeResponse(t, rec.Body.String())

	var got []struct {
		Clinic        store.Clinic          `json:"clinic"`
		Services      []store.ClinicService `json:"services"`
		CurrentStatus *struct {
			ClinicID       string     `json:"clinicId"`
			Status         string     `json:"status"`
			Reason         *string    `json:"reason,omitempty"`
			Freshness      string     `json:"freshness"`
			LastReportedAt *time.Time `json:"lastReportedAt,omitempty"`
			UpdatedAt      time.Time  `json:"updatedAt"`
		} `json:"currentStatus,omitempty"`
	}
	decodeJSON(t, rec, &got)
	if len(got) != 1 || got[0].Clinic.ID != "clinic-1" || got[0].Services[0].ServiceName != "Primary care" {
		t.Fatalf("unexpected public clinics response: %#v", got)
	}
	if got[0].CurrentStatus == nil || got[0].CurrentStatus.ClinicID != "clinic-1" || got[0].CurrentStatus.Status != "degraded" {
		t.Fatalf("unexpected public status response: %#v", got[0].CurrentStatus)
	}
}

func TestPublicGetClinicWorksWithoutCookieAndSanitizesStatus(t *testing.T) {
	updatedAt := time.Date(2026, 5, 1, 10, 0, 0, 0, time.UTC)
	reporterName := "Nomsa Dlamini"
	source := "field_worker"
	router := apihttp.NewRouter(fakeStore{
		clinic: store.ClinicDetail{
			Clinic: store.Clinic{
				ID:                 "clinic-1",
				Name:               "Central Clinic",
				FacilityCode:       "C001",
				Province:           "Gauteng",
				District:           "Johannesburg",
				FacilityType:       "clinic",
				VerificationStatus: "verified",
				CreatedAt:          updatedAt,
				UpdatedAt:          updatedAt,
			},
			CurrentStatus: &store.CurrentStatus{
				ClinicID:     "clinic-1",
				Status:       "operational",
				Freshness:    "fresh",
				ReporterName: &reporterName,
				Source:       &source,
				UpdatedAt:    updatedAt,
			},
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/v1/public/clinics/clinic-1", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	assertPublicSafeResponse(t, rec.Body.String())
	if !strings.Contains(rec.Body.String(), `"id":"clinic-1"`) {
		t.Fatalf("expected public clinic detail in response, got %q", rec.Body.String())
	}
}

func TestPublicAlternativesWorksWithoutCookieAndSanitizesNestedClinics(t *testing.T) {
	reporterName := "Nomsa Dlamini"
	sourceLabel := "clinic_coordinator"
	source := clinicDetail("clinic-mamelodi-east", "Mamelodi East Clinic", -25.7400, 28.1300, "non_functional", "fresh", "Primary care")
	candidate := clinicDetail("near-operational", "Near Operational Clinic", -25.7410, 28.1310, "operational", "fresh", "Primary care")
	candidate.CurrentStatus.ReporterName = &reporterName
	candidate.CurrentStatus.Source = &sourceLabel
	router := apihttp.NewRouter(fakeStore{
		clinic:  source,
		clinics: []store.ClinicDetail{source, candidate},
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/public/alternatives?clinicId=clinic-mamelodi-east&service=Primary%20care", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	assertPublicSafeResponse(t, rec.Body.String())
	if !strings.Contains(rec.Body.String(), `"matchedService":"Primary care"`) {
		t.Fatalf("expected ranked public alternative response, got %q", rec.Body.String())
	}
}

func TestPartnerStatusEndpointRequiresStatusScopeAndSanitizesResponse(t *testing.T) {
	secret, _, err := auth.GenerateAPIKey("demo")
	if err != nil {
		t.Fatalf("GenerateAPIKey returned error: %v", err)
	}
	hash, err := auth.HashAPIKey(secret, "")
	if err != nil {
		t.Fatalf("HashAPIKey returned error: %v", err)
	}
	reporterName := "Nomsa Dlamini"
	source := "field_worker"
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	router := apihttp.NewRouter(fakeStore{
		partnerAPIKey: store.PartnerAPIKey{
			ID: 10, Name: "Demo partner", KeyHash: hash,
			Scopes:           []string{"status:read"},
			AllowedDistricts: []string{defaultTestDistrict},
		},
		clinic: store.ClinicDetail{Clinic: store.Clinic{ID: "clinic-1", District: defaultTestDistrict}},
		status: store.CurrentStatus{
			ClinicID: "clinic-1", Status: "degraded", Freshness: "fresh",
			ReporterName: &reporterName, Source: &source, UpdatedAt: now,
		},
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/partner/clinics/clinic-1/status", nil)
	req.Header.Set("Authorization", "Bearer "+secret)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	assertPublicSafeResponse(t, rec.Body.String())
	if strings.Contains(rec.Body.String(), "Nomsa") || strings.Contains(rec.Body.String(), "reporterName") {
		t.Fatalf("expected partner response to hide reporter identity, got %s", rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"sourceCategory":"field_worker"`) {
		t.Fatalf("expected partner source category, got %s", rec.Body.String())
	}
}

func TestPartnerEndpointRejectsMissingScope(t *testing.T) {
	secret, _, err := auth.GenerateAPIKey("demo")
	if err != nil {
		t.Fatalf("GenerateAPIKey returned error: %v", err)
	}
	hash, err := auth.HashAPIKey(secret, "")
	if err != nil {
		t.Fatalf("HashAPIKey returned error: %v", err)
	}
	router := apihttp.NewRouter(fakeStore{
		partnerAPIKey: store.PartnerAPIKey{ID: 10, Name: "Demo partner", KeyHash: hash, Scopes: []string{"clinics:read"}},
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/partner/clinics/clinic-1/status", nil)
	req.Header.Set("Authorization", "Bearer "+secret)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusForbidden, rec.Code, rec.Body.String())
	}
}

func TestPartnerLatestExportSanitizesResponse(t *testing.T) {
	secret, _, err := auth.GenerateAPIKey("demo")
	if err != nil {
		t.Fatalf("GenerateAPIKey returned error: %v", err)
	}
	hash, err := auth.HashAPIKey(secret, "")
	if err != nil {
		t.Fatalf("HashAPIKey returned error: %v", err)
	}
	userID := int64(42)
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	exportRun := store.PartnerExportRun{
		ID:                20,
		RequestedByUserID: &userID,
		Format:            "json",
		Scope:             map[string]any{"district": defaultTestDistrict, "secret": "raw-scope-secret"},
		RecordCounts:      map[string]any{"clinics": 3},
		Checksum:          "sha256:abc",
		Payload: map[string]any{
			"submittedByUserId": 42,
			"reviewedByUserId":  43,
			"rawSecret":         "export-payload-secret",
		},
		CreatedAt: now,
	}
	router := apihttp.NewRouter(fakeStore{
		partnerAPIKey:    validPartnerAPIKey(hash, []string{"exports:read"}, nil),
		partnerExportRun: exportRun,
		partnerReadinessSnapshot: store.PartnerReadinessSnapshot{
			ExportRuns: []store.PartnerExportRun{exportRun},
		},
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/partner/export/latest", nil)
	req.Header.Set("Authorization", "Bearer "+secret)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	assertPartnerSafeReadinessResponse(t, rec.Body.String())
	for _, forbidden := range []string{"requestedByUserId", "payload", "metadata", "submittedByUserId", "reviewedByUserId", "raw-scope-secret", "export-payload-secret"} {
		if strings.Contains(rec.Body.String(), forbidden) {
			t.Fatalf("expected partner export response to hide %q, got %s", forbidden, rec.Body.String())
		}
	}
	if !strings.Contains(rec.Body.String(), `"recordCounts":{"clinics":3}`) {
		t.Fatalf("expected record counts in partner export response, got %s", rec.Body.String())
	}
}

func TestPartnerLatestExportReturnsLatestAccessibleScopedRun(t *testing.T) {
	secret, _, err := auth.GenerateAPIKey("demo")
	if err != nil {
		t.Fatalf("GenerateAPIKey returned error: %v", err)
	}
	hash, err := auth.HashAPIKey(secret, "")
	if err != nil {
		t.Fatalf("HashAPIKey returned error: %v", err)
	}
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	inaccessibleLatest := store.PartnerExportRun{
		ID:           30,
		Format:       "json",
		Scope:        map[string]any{"district": "Johannesburg"},
		RecordCounts: map[string]any{"clinics": 9},
		Checksum:     "sha256:other-district",
		CreatedAt:    now.Add(2 * time.Minute),
	}
	allDistrictLatest := store.PartnerExportRun{
		ID:           29,
		Format:       "json",
		Scope:        map[string]any{},
		RecordCounts: map[string]any{"clinics": 20},
		Checksum:     "sha256:all-district",
		CreatedAt:    now.Add(time.Minute),
	}
	accessibleRun := store.PartnerExportRun{
		ID:           20,
		Format:       "json",
		Scope:        map[string]any{"district": defaultTestDistrict},
		RecordCounts: map[string]any{"clinics": 3},
		Checksum:     "sha256:allowed-district",
		CreatedAt:    now,
	}
	router := apihttp.NewRouter(fakeStore{
		partnerAPIKey:    validPartnerAPIKey(hash, []string{"exports:read"}, []string{defaultTestDistrict}),
		partnerExportRun: inaccessibleLatest,
		partnerReadinessSnapshot: store.PartnerReadinessSnapshot{
			ExportRuns: []store.PartnerExportRun{inaccessibleLatest, allDistrictLatest, accessibleRun},
		},
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/partner/export/latest", nil)
	req.Header.Set("Authorization", "Bearer "+secret)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	var got struct {
		ID       int64  `json:"id"`
		Checksum string `json:"checksum"`
	}
	decodeJSON(t, rec, &got)
	if got.ID != accessibleRun.ID || got.Checksum != accessibleRun.Checksum {
		t.Fatalf("expected latest accessible export %#v, got %#v", accessibleRun, got)
	}
}

func TestPartnerLatestExportDeniesAllDistrictRunForRestrictedKey(t *testing.T) {
	secret, _, err := auth.GenerateAPIKey("demo")
	if err != nil {
		t.Fatalf("GenerateAPIKey returned error: %v", err)
	}
	hash, err := auth.HashAPIKey(secret, "")
	if err != nil {
		t.Fatalf("HashAPIKey returned error: %v", err)
	}
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	allDistrictLatest := store.PartnerExportRun{
		ID:           31,
		Format:       "json",
		Scope:        map[string]any{},
		RecordCounts: map[string]any{"clinics": 20},
		Checksum:     "sha256:all-district",
		CreatedAt:    now,
	}
	router := apihttp.NewRouter(fakeStore{
		partnerAPIKey:    validPartnerAPIKey(hash, []string{"exports:read"}, []string{defaultTestDistrict}),
		partnerExportRun: allDistrictLatest,
		partnerReadinessSnapshot: store.PartnerReadinessSnapshot{
			ExportRuns: []store.PartnerExportRun{allDistrictLatest},
		},
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/partner/export/latest", nil)
	req.Header.Set("Authorization", "Bearer "+secret)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNotFound, rec.Code, rec.Body.String())
	}
}

func TestPartnerIntegrationStatusSanitizesRecomputedResponse(t *testing.T) {
	secret, _, err := auth.GenerateAPIKey("demo")
	if err != nil {
		t.Fatalf("GenerateAPIKey returned error: %v", err)
	}
	hash, err := auth.HashAPIKey(secret, "")
	if err != nil {
		t.Fatalf("HashAPIKey returned error: %v", err)
	}
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	tests := []struct {
		name  string
		store fakeStore
		want  string
	}{
		{
			name: "sanitized checks",
			store: fakeStore{
				partnerAPIKey: validPartnerAPIKey(hash, []string{"status:read"}, nil),
				integrationStatusChecks: []store.IntegrationStatusCheck{{
					ID:        30,
					CheckName: "webhook_delivery",
					Status:    "passing",
					Summary:   "Webhooks are healthy",
					Metadata: map[string]any{
						"secretToken":       "integration-secret-token",
						"submittedByUserId": 42,
						"reviewedByUserId":  43,
					},
					CheckedAt: now,
				}},
			},
			want: `"checkName":"api_key_active"`,
		},
		{
			name: "nil checks",
			store: fakeStore{
				partnerAPIKey: validPartnerAPIKey(hash, []string{"status:read"}, nil),
			},
			want: `"checkName":"api_key_active"`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(tt.store)
			req := httptest.NewRequest(http.MethodGet, "/v1/partner/integration-status", nil)
			req.Header.Set("Authorization", "Bearer "+secret)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
			}
			assertPartnerSafeReadinessResponse(t, rec.Body.String())
			for _, forbidden := range []string{"metadata", "submittedByUserId", "reviewedByUserId", "integration-secret-token"} {
				if strings.Contains(rec.Body.String(), forbidden) {
					t.Fatalf("expected partner integration response to hide %q, got %s", forbidden, rec.Body.String())
				}
			}
			if !strings.Contains(rec.Body.String(), tt.want) {
				t.Fatalf("expected %q in partner integration response, got %s", tt.want, rec.Body.String())
			}
		})
	}
}

func TestPartnerIntegrationStatusRecomputesChecksBeforeResponding(t *testing.T) {
	secret, _, err := auth.GenerateAPIKey("demo")
	if err != nil {
		t.Fatalf("GenerateAPIKey returned error: %v", err)
	}
	hash, err := auth.HashAPIKey(secret, "")
	if err != nil {
		t.Fatalf("HashAPIKey returned error: %v", err)
	}
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	upsertInputs := []store.UpsertIntegrationStatusCheckInput{}
	upsertedChecks := []store.IntegrationStatusCheck{}
	router := apihttp.NewRouter(fakeStore{
		partnerAPIKey: validPartnerAPIKey(hash, []string{"status:read"}, nil),
		partnerReadinessSnapshot: store.PartnerReadinessSnapshot{
			APIKeys: []store.PartnerAPIKey{validPartnerAPIKey(hash, []string{"status:read"}, nil)},
			ExportRuns: []store.PartnerExportRun{{
				ID:        1,
				Format:    "json",
				Scope:     map[string]any{"district": defaultTestDistrict},
				Checksum:  "sha256:export",
				CreatedAt: now,
			}},
			WebhookEvents: []store.PartnerWebhookEvent{{
				ID:             1,
				SubscriptionID: 1,
				EventType:      "clinicpulse.webhook_test",
				Status:         "preview_only",
				CreatedAt:      now,
			}},
		},
		currentStatuses: []store.CurrentStatus{{
			ClinicID:  "clinic-1",
			Status:    "operational",
			Freshness: "fresh",
			UpdatedAt: now,
		}},
		syncSummary:                        &store.SyncSummary{OfflineReportsReceived: 1},
		upsertIntegrationStatusCheckInputs: &upsertInputs,
		upsertIntegrationStatusChecks:      &upsertedChecks,
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/partner/integration-status", nil)
	req.Header.Set("Authorization", "Bearer "+secret)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	expectedNames := []string{
		"api_key_active",
		"export_generated",
		"webhook_test_recorded",
		"offline_sync_health_available",
		"stale_status_reconciliation_available",
		"deployment_env_configured",
	}
	if len(upsertInputs) != len(expectedNames) {
		t.Fatalf("expected %d upserted checks, got %#v", len(expectedNames), upsertInputs)
	}
	for _, name := range expectedNames {
		if !strings.Contains(rec.Body.String(), `"checkName":"`+name+`"`) {
			t.Fatalf("expected response to include recomputed check %q, got %s", name, rec.Body.String())
		}
	}
}

func TestAdminCanCreateListAndRevokePartnerAPIKey(t *testing.T) {
	orgID := int64(77)
	apiKeys := []store.PartnerAPIKey{}
	var createInput store.CreatePartnerAPIKeyInput
	var revokedKeyID int64
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		partnerAPIKeys:           &apiKeys,
		createPartnerAPIKeyInput: &createInput,
		revokedPartnerAPIKeyID:   &revokedKeyID,
		listPartnerAPIKeysOrgID:  new(int64),
		revokePartnerAPIKeyCalls: new(int),
	}), apihttp.WithAPIKeyPepper("test-pepper"))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/api-keys", strings.NewReader(`{
		"name":"Demo partner",
		"environment":"demo",
		"scopes":["clinics:read","exports:read"],
		"allowedDistricts":["Tshwane North Demo District"]
	}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusCreated, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"secret":"cp_demo_`) {
		t.Fatalf("expected one-time demo secret in create response, got %s", rec.Body.String())
	}
	if strings.Contains(rec.Body.String(), "keyHash") {
		t.Fatalf("expected create response not to expose key hash, got %s", rec.Body.String())
	}
	var created struct {
		APIKey store.PartnerAPIKey `json:"apiKey"`
		Secret string              `json:"secret"`
	}
	decodeJSON(t, rec, &created)
	if created.APIKey.ID != 1 || created.APIKey.KeyPrefix == "" {
		t.Fatalf("unexpected created API key response: %#v", created.APIKey)
	}
	if createInput.OrganisationID == nil || *createInput.OrganisationID != orgID {
		t.Fatalf("expected API key to be scoped to org %d, got %#v", orgID, createInput.OrganisationID)
	}
	wantHash, err := auth.HashAPIKey(created.Secret, "test-pepper")
	if err != nil {
		t.Fatalf("HashAPIKey returned error: %v", err)
	}
	if createInput.KeyHash != wantHash || createInput.KeyHash == created.Secret {
		t.Fatalf("expected stored API key hash to use pepper and not store raw secret, got input %#v", createInput)
	}

	req = newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/api-keys", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if strings.Contains(rec.Body.String(), `"secret"`) || strings.Contains(rec.Body.String(), created.Secret) || strings.Contains(rec.Body.String(), "keyHash") {
		t.Fatalf("expected list response not to expose raw or hashed secrets, got %s", rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"keyPrefix":"cp_demo_`) {
		t.Fatalf("expected list response to include key prefix, got %s", rec.Body.String())
	}

	req = newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/api-keys/1/revoke", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNoContent, rec.Code, rec.Body.String())
	}
	if revokedKeyID != 1 {
		t.Fatalf("expected API key 1 to be revoked, got %d", revokedKeyID)
	}
}

func TestAdminCreatePartnerAPIKeyValidatesNameAndExpiryBeforeStoreCall(t *testing.T) {
	orgID := int64(77)
	tests := []struct {
		name string
		body string
		want string
	}{
		{
			name: "missing name",
			body: `{"environment":"demo","scopes":["clinics:read"]}`,
			want: "name",
		},
		{
			name: "blank name",
			body: `{"name":"   ","environment":"demo","scopes":["clinics:read"]}`,
			want: "name",
		},
		{
			name: "already expired",
			body: `{"name":"Demo partner","environment":"demo","scopes":["clinics:read"],"expiresAt":"2020-01-01T00:00:00Z"}`,
			want: "expiresAt",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			createCalls := 0
			router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
				createPartnerAPIKeyCalls: &createCalls,
			}))
			req := newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/api-keys", strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
			}
			if createCalls != 0 {
				t.Fatalf("expected CreatePartnerAPIKey not to be called, got %d calls", createCalls)
			}
			if !strings.Contains(rec.Body.String(), `"code":"validation_error"`) || !strings.Contains(rec.Body.String(), tt.want) {
				t.Fatalf("expected validation error mentioning %q, got %s", tt.want, rec.Body.String())
			}
		})
	}
}

func TestAdminPartnerReadinessReturnsSnapshot(t *testing.T) {
	orgID := int64(77)
	readinessOrgID := int64(0)
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		partnerReadinessOrgID: &readinessOrgID,
		partnerReadinessSnapshot: store.PartnerReadinessSnapshot{
			APIKeys: []store.PartnerAPIKey{{
				ID:             1,
				OrganisationID: &orgID,
				Name:           "Demo partner",
				Environment:    "demo",
				KeyPrefix:      "cp_demo_abcd1234",
				KeyHash:        "raw-key-hash",
				Scopes:         []string{"clinics:read"},
				CreatedAt:      now,
				UpdatedAt:      now,
			}},
			IntegrationChecks: []store.IntegrationStatusCheck{{
				ID:             30,
				OrganisationID: &orgID,
				CheckName:      "webhook_delivery",
				Status:         "passing",
				Summary:        "Webhooks are healthy",
				Metadata:       map[string]any{"internal": "kept for admins"},
				CheckedAt:      now,
			}},
		},
	}))
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/partner-readiness", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if readinessOrgID != orgID {
		t.Fatalf("expected readiness snapshot scoped to org %d, got %d", orgID, readinessOrgID)
	}
	if !strings.Contains(rec.Body.String(), `"apiKeys"`) || !strings.Contains(rec.Body.String(), `"integrationChecks"`) {
		t.Fatalf("expected readiness response to include API keys and integration checks, got %s", rec.Body.String())
	}
	if strings.Contains(rec.Body.String(), "keyHash") || strings.Contains(rec.Body.String(), "raw-key-hash") {
		t.Fatalf("expected readiness response not to expose API key hashes, got %s", rec.Body.String())
	}
}

func TestAdminPartnerReadinessRecomputesChecksBeforeReturningSnapshot(t *testing.T) {
	orgID := int64(77)
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	upsertInputs := []store.UpsertIntegrationStatusCheckInput{}
	upsertedChecks := []store.IntegrationStatusCheck{}
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		partnerReadinessSnapshot: store.PartnerReadinessSnapshot{
			APIKeys: []store.PartnerAPIKey{{
				ID:             1,
				OrganisationID: &orgID,
				Name:           "Demo partner",
				Environment:    "demo",
				KeyPrefix:      "cp_demo_abcd1234",
				Scopes:         []string{"status:read", "exports:read"},
				CreatedAt:      now,
				UpdatedAt:      now,
			}},
			ExportRuns: []store.PartnerExportRun{{
				ID:             1,
				OrganisationID: &orgID,
				Format:         "json",
				Scope:          map[string]any{"district": defaultTestDistrict},
				Checksum:       "sha256:export",
				CreatedAt:      now,
			}},
			WebhookEvents: []store.PartnerWebhookEvent{{
				ID:             1,
				SubscriptionID: 1,
				EventType:      "clinicpulse.webhook_test",
				Status:         "preview_only",
				CreatedAt:      now,
			}},
		},
		currentStatuses: []store.CurrentStatus{{
			ClinicID:  "clinic-1",
			Status:    "operational",
			Freshness: "fresh",
			UpdatedAt: now,
		}},
		syncSummary:                        &store.SyncSummary{OfflineReportsReceived: 1},
		upsertIntegrationStatusCheckInputs: &upsertInputs,
		upsertIntegrationStatusChecks:      &upsertedChecks,
	}), apihttp.WithAPIKeyPepper("test-pepper"))
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/partner-readiness", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if len(upsertInputs) != 6 {
		t.Fatalf("expected readiness read to upsert 6 checks, got %#v", upsertInputs)
	}
	if !strings.Contains(rec.Body.String(), `"integrationChecks":[`) || !strings.Contains(rec.Body.String(), `"checkName":"api_key_active"`) {
		t.Fatalf("expected readiness response to include recomputed checks, got %s", rec.Body.String())
	}
	for _, input := range upsertInputs {
		if input.OrganisationID == nil || *input.OrganisationID != orgID {
			t.Fatalf("expected upserted checks scoped to org %d, got %#v", orgID, input)
		}
	}
}

func TestAdminPartnerWebhookCreateListAndTestDoesNotExposeSecret(t *testing.T) {
	orgID := int64(77)
	subscriptions := []store.PartnerWebhookSubscription{}
	events := []store.PartnerWebhookEvent{}
	var createInput store.CreatePartnerWebhookSubscriptionInput
	var eventInput store.CreatePartnerWebhookEventInput
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		partnerWebhookSubscriptions:           &subscriptions,
		partnerWebhookEvents:                  &events,
		createPartnerWebhookSubscriptionInput: &createInput,
		createPartnerWebhookEventInput:        &eventInput,
		listPartnerWebhookSubscriptionsOrgID:  new(int64),
		listPartnerWebhookEventsOrgID:         new(int64),
	}))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/webhooks", strings.NewReader(`{
		"name":"Status webhook",
		"targetUrl":"https://partner.example.test/webhooks/clinicpulse",
		"eventTypes":["clinic.status_changed"]
	}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusCreated, rec.Code, rec.Body.String())
	}
	var created struct {
		Subscription store.PartnerWebhookSubscription `json:"subscription"`
		Secret       string                           `json:"secret"`
	}
	decodeJSON(t, rec, &created)
	if created.Secret == "" || !strings.HasPrefix(created.Secret, "cp_whsec_") {
		t.Fatalf("expected one-time webhook secret, got %#v", created)
	}
	if createInput.SecretHash == "" || createInput.SecretHash == created.Secret {
		t.Fatalf("expected webhook secret hash to be stored without the raw secret, got %#v", createInput)
	}
	if strings.Contains(rec.Body.String(), "secretHash") {
		t.Fatalf("expected create response not to expose secret hash, got %s", rec.Body.String())
	}

	req = newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/webhooks", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if strings.Contains(rec.Body.String(), created.Secret) || strings.Contains(rec.Body.String(), `"secret"`) || strings.Contains(rec.Body.String(), "secretHash") {
		t.Fatalf("expected webhook list not to expose secrets, got %s", rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"subscriptions"`) || !strings.Contains(rec.Body.String(), `"events"`) {
		t.Fatalf("expected webhook list response shape, got %s", rec.Body.String())
	}

	req = newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/webhooks/1/test", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusCreated, rec.Code, rec.Body.String())
	}
	if eventInput.SubscriptionID != 1 || eventInput.Status != "preview_only" || eventInput.EventType != "clinicpulse.webhook_test" {
		t.Fatalf("unexpected webhook test event input: %#v", eventInput)
	}
	if strings.Contains(rec.Body.String(), created.Secret) || strings.Contains(rec.Body.String(), `"secret"`) {
		t.Fatalf("expected webhook test response not to expose secret, got %s", rec.Body.String())
	}
}

func TestAdminPartnerWebhookTestDeliveryEnabledIsExplicitlyNotImplemented(t *testing.T) {
	orgID := int64(77)
	subscriptions := []store.PartnerWebhookSubscription{{
		ID:             5,
		OrganisationID: &orgID,
		Name:           "Status webhook",
		TargetURL:      "https://partner.example.test/webhooks/clinicpulse",
		EventTypes:     []string{"clinic.status_changed"},
		Status:         "active",
	}}
	events := []store.PartnerWebhookEvent{}
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		partnerWebhookSubscriptions: &subscriptions,
		partnerWebhookEvents:        &events,
	}), apihttp.WithWebhookDeliveryEnabled(true))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/webhooks/5/test", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotImplemented {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNotImplemented, rec.Code, rec.Body.String())
	}
	if len(events) != 0 {
		t.Fatalf("expected no fake delivery event when delivery is enabled but not implemented, got %#v", events)
	}
	if !strings.Contains(rec.Body.String(), "not_implemented") {
		t.Fatalf("expected explicit not implemented response, got %s", rec.Body.String())
	}
}

func TestAdminPartnerWebhookTestDisabledSubscriptionDoesNotCreatePreviewEvent(t *testing.T) {
	orgID := int64(77)
	subscriptions := []store.PartnerWebhookSubscription{{
		ID:             5,
		OrganisationID: &orgID,
		Name:           "Status webhook",
		TargetURL:      "https://partner.example.test/webhooks/clinicpulse",
		EventTypes:     []string{"clinic.status_changed"},
		Status:         "disabled",
	}}
	events := []store.PartnerWebhookEvent{}
	createEventCalls := 0
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		partnerWebhookSubscriptions:    &subscriptions,
		partnerWebhookEvents:           &events,
		createPartnerWebhookEventCalls: &createEventCalls,
	}))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/webhooks/5/test", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusConflict {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusConflict, rec.Code, rec.Body.String())
	}
	if createEventCalls != 0 || len(events) != 0 {
		t.Fatalf("expected no webhook test event to be created, got calls=%d events=%#v", createEventCalls, events)
	}
	if !strings.Contains(rec.Body.String(), `"code":"conflict"`) || !strings.Contains(rec.Body.String(), "disabled") {
		t.Fatalf("expected conflict response mentioning disabled subscription, got %s", rec.Body.String())
	}
}

func TestAdminPartnerExportCreateAndGetUsesPayloadAndScopedStore(t *testing.T) {
	orgID := int64(77)
	exports := []store.PartnerExportRun{}
	var createInput store.CreatePartnerExportRunInput
	var getOrgID int64
	var getExportID int64
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		clinics: []store.ClinicDetail{{
			Clinic: store.Clinic{
				ID:       "clinic-1",
				Name:     "Central Clinic",
				District: defaultTestDistrict,
			},
			CurrentStatus: &store.CurrentStatus{
				ClinicID:  "clinic-1",
				Status:    "operational",
				Freshness: "fresh",
				UpdatedAt: now,
			},
		}},
		integrationStatusChecks: []store.IntegrationStatusCheck{{
			CheckName: "api_key_rotation",
			Status:    "passing",
			Summary:   "Keys are rotated",
			CheckedAt: now,
		}},
		partnerExportRuns:           &exports,
		createPartnerExportRunInput: &createInput,
		getPartnerExportRunOrgID:    &getOrgID,
		getPartnerExportRunID:       &getExportID,
	}))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/exports", strings.NewReader(`{
		"format":"json",
		"scope":{"district":"Tshwane North Demo District"}
	}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusCreated, rec.Code, rec.Body.String())
	}
	if createInput.OrganisationID == nil || *createInput.OrganisationID != orgID {
		t.Fatalf("expected export run scoped to org %d, got %#v", orgID, createInput.OrganisationID)
	}
	if createInput.Payload == nil || createInput.Checksum == "" || createInput.RecordCounts["clinics"] != 1 {
		t.Fatalf("expected backend export payload, checksum, and counts, got %#v", createInput)
	}
	if strings.Contains(rec.Body.String(), "reporterName") {
		t.Fatalf("expected export response payload to be partner-safe, got %s", rec.Body.String())
	}

	req = newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/exports/1", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if getOrgID != orgID || getExportID != 1 {
		t.Fatalf("expected scoped export lookup org=%d id=1, got org=%d id=%d", orgID, getOrgID, getExportID)
	}
	if !strings.Contains(rec.Body.String(), `"payload"`) || !strings.Contains(rec.Body.String(), `"checksum"`) {
		t.Fatalf("expected export lookup to return stored run, got %s", rec.Body.String())
	}
}

func TestDistrictManagerCanReadReadinessButCannotMutatePartnerResources(t *testing.T) {
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	router := newAuthenticatedTestRouter(t, fakeStore{
		partnerReadinessSnapshot: store.PartnerReadinessSnapshot{
			IntegrationChecks: []store.IntegrationStatusCheck{{
				CheckName: "readiness",
				Status:    "passing",
				Summary:   "Ready",
				CheckedAt: now,
			}},
		},
	})
	readReq := newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/partner-readiness", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, readReq)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected district manager readiness status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}

	tests := []struct {
		method string
		path   string
		body   string
	}{
		{method: http.MethodPost, path: "/v1/admin/api-keys", body: `{"name":"Demo","environment":"demo"}`},
		{method: http.MethodGet, path: "/v1/admin/api-keys"},
		{method: http.MethodPost, path: "/v1/admin/webhooks", body: `{"name":"Webhook","targetUrl":"https://example.test","eventTypes":[]}`},
		{method: http.MethodGet, path: "/v1/admin/webhooks"},
		{method: http.MethodPost, path: "/v1/admin/exports", body: `{"format":"json","scope":{}}`},
		{method: http.MethodGet, path: "/v1/admin/exports/1"},
	}
	for _, tt := range tests {
		req := newAuthenticatedRequest(t, tt.method, tt.path, strings.NewReader(tt.body))
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		if rec.Code != http.StatusForbidden {
			t.Fatalf("%s %s: expected status %d, got %d with body %s", tt.method, tt.path, http.StatusForbidden, rec.Code, rec.Body.String())
		}
	}
}

func TestAdminPartnerInvalidIDsAndBodiesReturnExpectedStatus(t *testing.T) {
	orgID := int64(77)
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		getPartnerExportRunErr: pgx.ErrNoRows,
	}))

	tests := []struct {
		name   string
		method string
		path   string
		body   string
		want   int
	}{
		{name: "invalid api key json", method: http.MethodPost, path: "/v1/admin/api-keys", body: `{"name":`, want: http.StatusBadRequest},
		{name: "invalid api key environment", method: http.MethodPost, path: "/v1/admin/api-keys", body: `{"name":"Demo","environment":"sandbox"}`, want: http.StatusBadRequest},
		{name: "invalid webhook json", method: http.MethodPost, path: "/v1/admin/webhooks", body: `{"name":`, want: http.StatusBadRequest},
		{name: "invalid export format", method: http.MethodPost, path: "/v1/admin/exports", body: `{"format":"xml","scope":{}}`, want: http.StatusBadRequest},
		{name: "invalid revoke id", method: http.MethodPost, path: "/v1/admin/api-keys/not-a-number/revoke", want: http.StatusNotFound},
		{name: "invalid webhook test id", method: http.MethodPost, path: "/v1/admin/webhooks/not-a-number/test", want: http.StatusNotFound},
		{name: "invalid export id", method: http.MethodGet, path: "/v1/admin/exports/not-a-number", want: http.StatusNotFound},
		{name: "missing export", method: http.MethodGet, path: "/v1/admin/exports/404", want: http.StatusNotFound},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := newAuthenticatedRequest(t, tt.method, tt.path, strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != tt.want {
				t.Fatalf("expected status %d, got %d with body %s", tt.want, rec.Code, rec.Body.String())
			}
		})
	}
}

func TestPartnerAlternativesFiltersCandidatesToAllowedDistricts(t *testing.T) {
	secret, _, err := auth.GenerateAPIKey("demo")
	if err != nil {
		t.Fatalf("GenerateAPIKey returned error: %v", err)
	}
	hash, err := auth.HashAPIKey(secret, "")
	if err != nil {
		t.Fatalf("HashAPIKey returned error: %v", err)
	}
	source := clinicDetail("clinic-source", "Source Clinic", -25.7400, 28.1300, "non_functional", "fresh", "Primary care")
	inScope := clinicDetail("clinic-in-scope", "In Scope Clinic", -25.7410, 28.1310, "operational", "fresh", "Primary care")
	outOfScope := clinicDetail("clinic-out-of-scope", "Out Of Scope Clinic", -25.7420, 28.1320, "operational", "fresh", "Primary care")
	outOfScope.Clinic.District = "Johannesburg"
	router := apihttp.NewRouter(fakeStore{
		partnerAPIKey: validPartnerAPIKey(hash, []string{"alternatives:read"}, []string{defaultTestDistrict}),
		clinic:        source,
		clinics:       []store.ClinicDetail{source, inScope, outOfScope},
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/partner/alternatives?clinicId=clinic-source&service=Primary%20care", nil)
	req.Header.Set("Authorization", "Bearer "+secret)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	assertPublicSafeResponse(t, rec.Body.String())
	if !strings.Contains(rec.Body.String(), `"id":"clinic-in-scope"`) {
		t.Fatalf("expected in-scope alternative, got %s", rec.Body.String())
	}
	if strings.Contains(rec.Body.String(), "clinic-out-of-scope") {
		t.Fatalf("expected out-of-scope candidate to be filtered, got %s", rec.Body.String())
	}
}

func TestRestrictedClinicRoutesStillRequireCookie(t *testing.T) {
	router := apihttp.NewRouter(fakeStore{})
	for _, path := range []string{
		"/v1/clinics",
		"/v1/clinics/clinic-1",
		"/v1/clinics/clinic-1/status",
		"/v1/clinics/clinic-1/reports",
		"/v1/clinics/clinic-1/audit-events",
		"/v1/alternatives?clinicId=clinic-1&service=Primary%20care",
	} {
		t.Run(path, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, path, nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			assertGenericUnauthorized(t, rec)
		})
	}
}

func TestUnexpectedStoreErrorsReturnInternalError(t *testing.T) {
	storeErr := errors.New("database password leaked")
	tests := []struct {
		name  string
		path  string
		store fakeStore
	}{
		{
			name:  "get clinic",
			path:  "/v1/clinics/clinic-1",
			store: fakeStore{getClinicErr: storeErr},
		},
		{
			name:  "get clinic status",
			path:  "/v1/clinics/clinic-1/status",
			store: fakeStore{statusErr: storeErr},
		},
		{
			name:  "list reports preflight",
			path:  "/v1/clinics/clinic-1/reports",
			store: fakeStore{getClinicErr: storeErr},
		},
		{
			name:  "list reports",
			path:  "/v1/clinics/clinic-1/reports",
			store: fakeStore{reportsErr: storeErr},
		},
		{
			name:  "list audit events preflight",
			path:  "/v1/clinics/clinic-1/audit-events",
			store: fakeStore{getClinicErr: storeErr},
		},
		{
			name:  "list audit events",
			path:  "/v1/clinics/clinic-1/audit-events",
			store: fakeStore{auditEventsErr: storeErr},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := newAuthenticatedTestRouter(t, tt.store)
			req := newAuthenticatedRequest(t, http.MethodGet, tt.path, nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			assertInternalError(t, rec, storeErr)
		})
	}
}

func TestGetClinicReturnsNotFoundForMissingClinic(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{getClinicErr: pgx.ErrNoRows})

	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics/missing-clinic", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNotFound, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"not_found"`) {
		t.Fatalf("expected not_found error code, got %q", rec.Body.String())
	}
}

func TestGetClinicStatusReturnsCurrentStatusJSON(t *testing.T) {
	updatedAt := time.Date(2026, 5, 1, 11, 0, 0, 0, time.UTC)
	reason := "Power outage"
	router := newAuthenticatedTestRouter(t, fakeStore{
		status: store.CurrentStatus{
			ClinicID:  "clinic-1",
			Status:    "limited",
			Reason:    &reason,
			Freshness: "fresh",
			UpdatedAt: updatedAt,
		},
	})

	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics/clinic-1/status", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}

	var got store.CurrentStatus
	decodeJSON(t, rec, &got)
	if got.ClinicID != "clinic-1" || got.Status != "limited" || got.Reason == nil || *got.Reason != reason {
		t.Fatalf("unexpected status response: %#v", got)
	}
}

func TestListClinicReportsReturnsOrderedReportJSON(t *testing.T) {
	firstSubmitted := time.Date(2026, 5, 1, 9, 0, 0, 0, time.UTC)
	secondSubmitted := time.Date(2026, 5, 1, 10, 0, 0, 0, time.UTC)
	router := newAuthenticatedTestRouter(t, fakeStore{
		reports: []store.Report{
			{ID: 10, ClinicID: "clinic-1", Source: "ussd", SubmittedAt: firstSubmitted, ReceivedAt: firstSubmitted, Status: "open", ReviewState: "accepted"},
			{ID: 11, ClinicID: "clinic-1", Source: "web", SubmittedAt: secondSubmitted, ReceivedAt: secondSubmitted, Status: "limited", ReviewState: "accepted"},
		},
	})

	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics/clinic-1/reports", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}

	var got []store.Report
	decodeJSON(t, rec, &got)
	if len(got) != 2 || got[0].ID != 10 || got[1].ID != 11 {
		t.Fatalf("unexpected reports response order: %#v", got)
	}
}

func TestListClinicReportsReturnsNotFoundForUnknownClinic(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{getClinicErr: pgx.ErrNoRows})

	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics/unknown-clinic/reports", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNotFound, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"not_found"`) {
		t.Fatalf("expected not_found error code, got %q", rec.Body.String())
	}
}

func TestClinicOperationalReadsDenyDistrictManagerOutsideDistrict(t *testing.T) {
	managerDistrict := defaultTestDistrict
	clinicDistrict := "Ekurhuleni East District"
	storeErr := errors.New("scoped read should not reach unscoped store list")
	now := time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC)
	memberships := []store.OrganisationMembership{{
		ID:        1,
		UserID:    42,
		Role:      "district_manager",
		District:  &managerDistrict,
		CreatedAt: now,
	}}

	tests := []struct {
		name  string
		path  string
		store fakeStore
	}{
		{
			name: "reports",
			path: "/v1/clinics/clinic-1/reports",
			store: fakeStore{
				clinic:     clinicDetailInDistrict("clinic-1", clinicDistrict),
				reportsErr: storeErr,
			},
		},
		{
			name: "audit events",
			path: "/v1/clinics/clinic-1/audit-events",
			store: fakeStore{
				clinic:         clinicDetailInDistrict("clinic-1", clinicDistrict),
				auditEventsErr: storeErr,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.store.memberships = memberships
			router := apihttp.NewRouter(authenticatedStore(t, "district_manager", tt.store))
			req := newAuthenticatedRequest(t, http.MethodGet, tt.path, nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusForbidden {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusForbidden, rec.Code, rec.Body.String())
			}
			if !strings.Contains(rec.Body.String(), `"code":"forbidden"`) {
				t.Fatalf("expected forbidden error code, got %q", rec.Body.String())
			}
		})
	}
}

func TestListClinicsScopesDistrictManagerToTheirDistrict(t *testing.T) {
	managerDistrict := defaultTestDistrict
	otherDistrict := "Ekurhuleni East District"
	router := apihttp.NewRouter(authenticatedStore(t, "district_manager", fakeStore{
		memberships: []store.OrganisationMembership{{
			ID:        1,
			UserID:    42,
			Role:      "district_manager",
			District:  &managerDistrict,
			CreatedAt: time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC),
		}},
		clinics: []store.ClinicDetail{
			clinicDetailInDistrict("clinic-in-scope", managerDistrict),
			clinicDetailInDistrict("clinic-out-of-scope", otherDistrict),
		},
	}))
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	var got []store.ClinicDetail
	decodeJSON(t, rec, &got)
	if len(got) != 1 || got[0].Clinic.ID != "clinic-in-scope" {
		t.Fatalf("expected only in-scope clinic, got %#v", got)
	}
}

func TestClinicOperationalReadsDenyDistrictManagerOutsideDistrictForDetailStatusAndAlternatives(t *testing.T) {
	managerDistrict := defaultTestDistrict
	clinicDistrict := "Ekurhuleni East District"
	now := time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC)
	memberships := []store.OrganisationMembership{{
		ID:        1,
		UserID:    42,
		Role:      "district_manager",
		District:  &managerDistrict,
		CreatedAt: now,
	}}

	tests := []struct {
		name string
		path string
	}{
		{name: "clinic detail", path: "/v1/clinics/clinic-1"},
		{name: "clinic status", path: "/v1/clinics/clinic-1/status"},
		{name: "alternatives", path: "/v1/alternatives?clinicId=clinic-1&service=Primary%20care"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(authenticatedStore(t, "district_manager", fakeStore{
				memberships: memberships,
				clinic:      clinicDetailInDistrict("clinic-1", clinicDistrict),
				clinics: []store.ClinicDetail{
					clinicDetailInDistrict("clinic-1", clinicDistrict),
					clinicDetailInDistrict("clinic-2", managerDistrict),
				},
			}))
			req := newAuthenticatedRequest(t, http.MethodGet, tt.path, nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusForbidden {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusForbidden, rec.Code, rec.Body.String())
			}
			if !strings.Contains(rec.Body.String(), `"code":"forbidden"`) {
				t.Fatalf("expected forbidden error code, got %q", rec.Body.String())
			}
		})
	}
}

func TestClinicOperationalReadsAllowAdminRolesAcrossDistricts(t *testing.T) {
	clinicDistrict := "Ekurhuleni East District"
	tests := []struct {
		name string
		role string
		path string
	}{
		{name: "org admin reports", role: "org_admin", path: "/v1/clinics/clinic-1/reports"},
		{name: "system admin reports", role: "system_admin", path: "/v1/clinics/clinic-1/reports"},
		{name: "org admin audit events", role: "org_admin", path: "/v1/clinics/clinic-1/audit-events"},
		{name: "system admin audit events", role: "system_admin", path: "/v1/clinics/clinic-1/audit-events"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(authenticatedStore(t, tt.role, fakeStore{
				clinic: clinicDetailInDistrict("clinic-1", clinicDistrict),
			}))
			req := newAuthenticatedRequest(t, http.MethodGet, tt.path, nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
			}
		})
	}
}

func TestClinicOperationalReadsDenyUnknownAndEmptyRoles(t *testing.T) {
	tests := []struct {
		name string
		role string
		path string
	}{
		{name: "empty reports", path: "/v1/clinics/clinic-1/reports"},
		{name: "unknown reports", role: "unknown", path: "/v1/clinics/clinic-1/reports"},
		{name: "empty audit events", path: "/v1/clinics/clinic-1/audit-events"},
		{name: "unknown audit events", role: "unknown", path: "/v1/clinics/clinic-1/audit-events"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(authenticatedStore(t, tt.role, fakeStore{
				clinic: clinicDetailInDistrict("clinic-1", defaultTestDistrict),
			}))
			req := newAuthenticatedRequest(t, http.MethodGet, tt.path, nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusForbidden {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusForbidden, rec.Code, rec.Body.String())
			}
		})
	}
}

func TestListClinicAuditEventsReturnsOrderedAuditEventJSON(t *testing.T) {
	firstCreated := time.Date(2026, 5, 1, 9, 30, 0, 0, time.UTC)
	secondCreated := time.Date(2026, 5, 1, 10, 30, 0, 0, time.UTC)
	actorUserID := int64(42)
	actorRole := "district_manager"
	organisationID := int64(7)
	entityType := "report"
	entityID := "100"
	router := newAuthenticatedTestRouter(t, fakeStore{
		auditEvents: []store.AuditEvent{
			{ID: 20, ClinicID: "clinic-1", EventType: "report.submitted", Summary: "First report", CreatedAt: firstCreated},
			{
				ID:             21,
				ClinicID:       "clinic-1",
				EventType:      "report.reviewed",
				Summary:        "Report accepted.",
				CreatedAt:      secondCreated,
				ActorUserID:    &actorUserID,
				ActorRole:      &actorRole,
				OrganisationID: &organisationID,
				EntityType:     &entityType,
				EntityID:       &entityID,
				Metadata:       map[string]any{"decision": "accepted"},
			},
		},
	})

	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics/clinic-1/audit-events", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}

	var got []store.AuditEvent
	decodeJSON(t, rec, &got)
	if len(got) != 2 || got[0].ID != 20 || got[1].ID != 21 {
		t.Fatalf("unexpected audit event response order: %#v", got)
	}
	if got[1].ActorUserID == nil || *got[1].ActorUserID != actorUserID || got[1].EntityID == nil || *got[1].EntityID != entityID {
		t.Fatalf("expected actor and entity fields in audit response, got %#v", got[1])
	}
	if got[1].Metadata["decision"] != "accepted" {
		t.Fatalf("expected decision metadata in audit response, got %#v", got[1].Metadata)
	}
}

func TestListClinicAuditEventsReturnsNotFoundForUnknownClinic(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{getClinicErr: pgx.ErrNoRows})

	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics/unknown-clinic/audit-events", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNotFound, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"not_found"`) {
		t.Fatalf("expected not_found error code, got %q", rec.Body.String())
	}
}

func TestAlternativesReturnsBadRequestForMissingQueryParams(t *testing.T) {
	tests := []struct {
		name string
		path string
	}{
		{name: "missing clinicId", path: "/v1/alternatives?service=Primary%20care"},
		{name: "missing service", path: "/v1/alternatives?clinicId=clinic-1"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := newAuthenticatedTestRouter(t, fakeStore{})
			req := newAuthenticatedRequest(t, http.MethodGet, tt.path, nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
			}
			if !strings.Contains(rec.Body.String(), `"code":"validation_error"`) {
				t.Fatalf("expected validation_error code, got %q", rec.Body.String())
			}
		})
	}
}

func TestAlternativesReturnsNotFoundForUnknownSourceClinic(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{getClinicErr: pgx.ErrNoRows})
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/alternatives?clinicId=unknown-clinic&service=Primary%20care", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNotFound, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"not_found"`) {
		t.Fatalf("expected not_found error code, got %q", rec.Body.String())
	}
}

func TestAlternativesReturnsRankedAlternatives(t *testing.T) {
	source := clinicDetail("clinic-mamelodi-east", "Mamelodi East Clinic", -25.7400, 28.1300, "non_functional", "fresh", "Primary care")
	router := newAuthenticatedTestRouter(t, fakeStore{
		clinic: source,
		clinics: []store.ClinicDetail{
			source,
			clinicDetail("far-degraded", "Far Degraded Clinic", -25.7600, 28.1600, "degraded", "fresh", "Primary care"),
			clinicDetail("near-operational", "Near Operational Clinic", -25.7410, 28.1310, "operational", "fresh", "Primary care"),
			clinicDetail("wrong-service", "Wrong Service Clinic", -25.7405, 28.1305, "operational", "fresh", "Pharmacy"),
		},
	})
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/alternatives?clinicId=clinic-mamelodi-east&service=Primary%20care", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}

	var got []struct {
		Clinic     store.ClinicDetail `json:"clinic"`
		DistanceKm float64            `json:"distanceKm"`
		RankReason string             `json:"rankReason"`
	}
	decodeJSON(t, rec, &got)

	if len(got) != 2 {
		t.Fatalf("expected 2 alternatives, got %#v", got)
	}
	if got[0].Clinic.Clinic.ID != "near-operational" || got[1].Clinic.Clinic.ID != "far-degraded" {
		t.Fatalf("unexpected alternatives order: %#v", got)
	}
	if got[0].DistanceKm <= 0 {
		t.Fatalf("expected positive distance, got %.3f", got[0].DistanceKm)
	}
	if got[0].RankReason == "" {
		t.Fatalf("expected rank reason in response, got %#v", got[0])
	}
}

func TestAlternativesReturnsInternalErrorForUnexpectedStoreErrors(t *testing.T) {
	storeErr := errors.New("database password leaked")
	tests := []struct {
		name  string
		store fakeStore
	}{
		{name: "get source clinic", store: fakeStore{getClinicErr: storeErr}},
		{name: "list candidates", store: fakeStore{listErr: storeErr}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := newAuthenticatedTestRouter(t, tt.store)
			req := newAuthenticatedRequest(t, http.MethodGet, "/v1/alternatives?clinicId=clinic-1&service=Primary%20care", nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			assertInternalError(t, rec, storeErr)
		})
	}
}

func TestCreateReportReturnsCreatedPendingReportWithoutStatusOrAuditEvent(t *testing.T) {
	reason := "Generator failed"
	staffPressure := "strained"
	stockPressure := "low"
	queuePressure := "moderate"
	submittedAt := time.Date(2026, 5, 2, 9, 15, 0, 0, time.UTC)
	receivedAt := time.Date(2026, 5, 2, 9, 16, 0, 0, time.UTC)
	reporterName := "Amina Nkosi"
	notes := "Using backup generator"
	var createInput store.CreateReportInput
	router := newAuthenticatedTestRouter(t, fakeStore{
		createReport: store.Report{
			ID:             100,
			ClinicID:       "clinic-1",
			Source:         "field_worker",
			SubmittedAt:    submittedAt,
			ReceivedAt:     receivedAt,
			Status:         "degraded",
			Reason:         &reason,
			StaffPressure:  &staffPressure,
			StockPressure:  &stockPressure,
			QueuePressure:  &queuePressure,
			ReviewState:    "pending",
			OfflineCreated: true,
		},
		createInput: &createInput,
	})
	body := `{
		"clinicId":"clinic-1",
		"status":"degraded",
		"staffPressure":"strained",
		"stockPressure":"low",
		"queuePressure":"moderate",
		"reason":"Generator failed",
		"source":"field_worker",
		"reporterName":"Amina Nkosi",
		"notes":"Using backup generator",
		"confidence":86,
		"offlineCreated":true,
		"submittedAt":"2026-05-02T09:15:00Z"
	}`
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(body))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusCreated, rec.Code, rec.Body.String())
	}

	var got struct {
		Report        store.Report         `json:"report"`
		CurrentStatus *store.CurrentStatus `json:"currentStatus,omitempty"`
		AuditEvent    *store.AuditEvent    `json:"auditEvent,omitempty"`
	}
	decodeJSON(t, rec, &got)
	if got.Report.ID != 100 || got.Report.ReviewState != "pending" || got.CurrentStatus != nil || got.AuditEvent != nil {
		t.Fatalf("unexpected create report response: %#v", got)
	}
	if strings.Contains(rec.Body.String(), "currentStatus") || strings.Contains(rec.Body.String(), "auditEvent") {
		t.Fatalf("expected create response not to claim status or audit event, got %s", rec.Body.String())
	}
	if createInput.ReviewState != "pending" {
		t.Fatalf("expected pending review state in store input, got %q", createInput.ReviewState)
	}
	if createInput.SubmittedAt != submittedAt {
		t.Fatalf("expected submittedAt %s, got %s", submittedAt, createInput.SubmittedAt)
	}
	if !createInput.OfflineCreated {
		t.Fatal("expected offlineCreated to map to store input")
	}
	if createInput.ReporterName == nil || *createInput.ReporterName != reporterName {
		t.Fatalf("expected reporterName %q, got %v", reporterName, createInput.ReporterName)
	}
	if createInput.Notes == nil || *createInput.Notes != notes {
		t.Fatalf("expected notes %q, got %v", notes, createInput.Notes)
	}
	if createInput.ConfidenceScore == nil || *createInput.ConfidenceScore != 0.86 {
		t.Fatalf("expected confidence score 0.86, got %v", createInput.ConfidenceScore)
	}
}

func TestCreateReportAssociatesAuthenticatedReporter(t *testing.T) {
	var createInput store.CreateReportInput
	router := newAuthenticatedTestRouter(t, fakeStore{
		createReport: store.Report{ID: 100, ClinicID: "clinic-1", ReviewState: "pending"},
		createInput:  &createInput,
	})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(validReportJSON()))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusCreated, rec.Code, rec.Body.String())
	}
	if createInput.SubmittedByUserID == nil || *createInput.SubmittedByUserID != 42 {
		t.Fatalf("expected submittedByUserId 42, got %v", createInput.SubmittedByUserID)
	}
}

func TestCreateReportDerivesAttributionForAuthenticatedReporter(t *testing.T) {
	for _, spoofedSource := range []string{"demo_control", "seed"} {
		t.Run(spoofedSource, func(t *testing.T) {
			var createInput store.CreateReportInput
			now := time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC)
			router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{
				sessionUser: store.User{
					ID:          42,
					Email:       "real-reporter@example.test",
					DisplayName: "Real Reporter",
					CreatedAt:   now,
					UpdatedAt:   now,
				},
				createReport: store.Report{ID: 100, ClinicID: "clinic-1", ReviewState: "pending"},
				createInput:  &createInput,
			}))
			body := `{
				"clinicId":"clinic-1",
				"status":"operational",
				"staffPressure":"normal",
				"stockPressure":"normal",
				"queuePressure":"low",
				"reason":"Daily facility check",
				"source":"` + spoofedSource + `",
				"reporterName":"Spoofed Manager"
			}`
			req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusCreated {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusCreated, rec.Code, rec.Body.String())
			}
			if createInput.Source != "field_worker" {
				t.Fatalf("expected reporter source field_worker, got %q", createInput.Source)
			}
			if createInput.ReporterName == nil || *createInput.ReporterName != "Real Reporter" {
				t.Fatalf("expected reporterName from authenticated principal, got %v", createInput.ReporterName)
			}
		})
	}
}

func TestCreateReportWritesSubmissionAuditWithAuthenticatedActor(t *testing.T) {
	var createInput store.CreateReportInput
	router := newAuthenticatedTestRouter(t, fakeStore{
		createReport: store.Report{ID: 100, ClinicID: "clinic-1", ReviewState: "pending"},
		createInput:  &createInput,
	})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(validReportJSON()))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusCreated, rec.Code, rec.Body.String())
	}
	if createInput.AuditEvent == nil {
		t.Fatal("expected submission audit event in store input")
	}
	if createInput.AuditEvent.ActorUserID == nil || *createInput.AuditEvent.ActorUserID != 42 {
		t.Fatalf("expected actor user id 42, got %v", createInput.AuditEvent.ActorUserID)
	}
	if createInput.AuditEvent.ActorRole == nil || *createInput.AuditEvent.ActorRole != "district_manager" {
		t.Fatalf("expected actor role district_manager, got %v", createInput.AuditEvent.ActorRole)
	}
}

func TestCreateReportReturnsBadRequestForInvalidJSON(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(`{"clinicId":`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"invalid_json"`) {
		t.Fatalf("expected invalid_json code, got %q", rec.Body.String())
	}
}

func TestCreateReportReturnsBadRequestForTrailingJSON(t *testing.T) {
	tests := []struct {
		name string
		body string
	}{
		{name: "second object", body: validReportJSON() + `{}`},
		{name: "trailing garbage", body: validReportJSON() + `garbage`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			createCalls := 0
			router := newAuthenticatedTestRouter(t, fakeStore{createCalls: &createCalls})
			req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
			}
			if !strings.Contains(rec.Body.String(), `"code":"invalid_json"`) {
				t.Fatalf("expected invalid_json code, got %q", rec.Body.String())
			}
			if createCalls != 0 {
				t.Fatalf("expected trailing JSON not to call store, got %d calls", createCalls)
			}
		})
	}
}

func TestCreateReportReturnsBadRequestForValidationFailures(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(`{
		"clinicId":"",
		"status":"closed",
		"staffPressure":"busy",
		"stockPressure":"empty",
		"queuePressure":"packed",
		"reason":"",
		"source":""
	}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
	}
	for _, message := range []string{
		"clinicId: clinicId is required",
		"status: status must be one of: operational, degraded, non_functional, unknown",
		"staffPressure: staffPressure must be one of: normal, strained, critical, unknown",
		"stockPressure: stockPressure must be one of: normal, low, stockout, unknown",
		"queuePressure: queuePressure must be one of: low, moderate, high, unknown",
		"reason: reason is required",
		"source: source must be one of: field_worker, clinic_coordinator, demo_control, seed",
	} {
		if !strings.Contains(rec.Body.String(), message) {
			t.Fatalf("expected validation message %q in response, got %q", message, rec.Body.String())
		}
	}
}

func TestCreateReportReturnsBadRequestForInvalidConfidence(t *testing.T) {
	tests := []struct {
		name        string
		body        string
		wantMessage string
	}{
		{
			name: "confidence above range",
			body: `{
				"clinicId":"clinic-1",
				"status":"operational",
				"staffPressure":"normal",
				"stockPressure":"normal",
				"queuePressure":"low",
				"reason":"Daily facility check",
				"source":"field_worker",
				"confidence":101
			}`,
			wantMessage: "confidence: confidence must be between 0 and 100",
		},
		{
			name: "confidence score above range",
			body: `{
				"clinicId":"clinic-1",
				"status":"operational",
				"staffPressure":"normal",
				"stockPressure":"normal",
				"queuePressure":"low",
				"reason":"Daily facility check",
				"source":"field_worker",
				"confidenceScore":1.01
			}`,
			wantMessage: "confidenceScore: confidenceScore must be between 0 and 1",
		},
		{
			name: "invalid confidence rejected even with valid confidence score",
			body: `{
				"clinicId":"clinic-1",
				"status":"operational",
				"staffPressure":"normal",
				"stockPressure":"normal",
				"queuePressure":"low",
				"reason":"Daily facility check",
				"source":"field_worker",
				"confidence":-1,
				"confidenceScore":0.8
			}`,
			wantMessage: "confidence: confidence must be between 0 and 100",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			createCalls := 0
			router := newAuthenticatedTestRouter(t, fakeStore{
				createCalls: &createCalls,
				createErr:   errors.New("store should not be called"),
			})
			req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
			}
			if !strings.Contains(rec.Body.String(), tt.wantMessage) {
				t.Fatalf("expected validation message %q in response, got %q", tt.wantMessage, rec.Body.String())
			}
			if createCalls != 0 {
				t.Fatalf("expected invalid confidence not to call store, got %d calls", createCalls)
			}
		})
	}
}

func TestCreateReportReturnsNotFoundForUnknownClinic(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{createErr: pgx.ErrNoRows})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(validReportJSON()))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNotFound, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"not_found"`) {
		t.Fatalf("expected not_found error code, got %q", rec.Body.String())
	}
}

func TestCreateReportReturnsInternalErrorForUnexpectedStoreError(t *testing.T) {
	storeErr := errors.New("database password leaked")
	router := newAuthenticatedTestRouter(t, fakeStore{createErr: storeErr})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(validReportJSON()))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertInternalError(t, rec, storeErr)
}

func TestListPendingReportsReturnsPendingReports(t *testing.T) {
	newer := time.Date(2026, 5, 3, 9, 0, 0, 0, time.UTC)
	older := time.Date(2026, 5, 3, 8, 0, 0, 0, time.UTC)
	router := newAuthenticatedTestRouter(t, fakeStore{
		pendingReports: []store.Report{
			{ID: 20, ClinicID: "clinic-1", ReviewState: "pending", ReceivedAt: newer},
			{ID: 19, ClinicID: "clinic-2", ReviewState: "pending", ReceivedAt: older},
		},
	})
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/reports/pending", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	var got []store.Report
	decodeJSON(t, rec, &got)
	if len(got) != 2 || got[0].ID != 20 || got[1].ID != 19 {
		t.Fatalf("unexpected pending reports response: %#v", got)
	}
}

func TestListPendingReportsPassesDistrictManagerScope(t *testing.T) {
	var scope store.ReportReviewScope
	district := "Tshwane North Demo District"
	router := apihttp.NewRouter(authenticatedStore(t, "district_manager", fakeStore{
		memberships: []store.OrganisationMembership{{
			ID:        1,
			UserID:    42,
			Role:      "district_manager",
			District:  &district,
			CreatedAt: time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC),
		}},
		pendingScope: &scope,
	}))
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/reports/pending", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if scope.Role != "district_manager" || scope.District == nil || *scope.District != district {
		t.Fatalf("unexpected pending scope: %#v", scope)
	}
}

func TestReporterCannotListPendingOrReviewReports(t *testing.T) {
	for _, tt := range []struct {
		name   string
		method string
		path   string
		body   string
	}{
		{name: "list pending", method: http.MethodGet, path: "/v1/reports/pending"},
		{name: "review", method: http.MethodPost, path: "/v1/reports/100/review", body: `{"decision":"accepted"}`},
	} {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{}))
			req := newAuthenticatedRequest(t, tt.method, tt.path, strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusForbidden {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusForbidden, rec.Code, rec.Body.String())
			}
		})
	}
}

func TestOfflineSyncRequiresReporterRoleOrHigher(t *testing.T) {
	body := strings.NewReader(validOfflineSyncJSON())
	for _, tt := range []struct {
		name     string
		role     string
		wantCode int
	}{
		{name: "reporter", role: "reporter", wantCode: http.StatusOK},
		{name: "district manager", role: "district_manager", wantCode: http.StatusOK},
		{name: "org admin", role: "org_admin", wantCode: http.StatusOK},
		{name: "system admin", role: "system_admin", wantCode: http.StatusOK},
		{name: "unknown role", role: "unknown", wantCode: http.StatusForbidden},
	} {
		t.Run(tt.name, func(t *testing.T) {
			createCalls := 0
			router := apihttp.NewRouter(authenticatedStore(t, tt.role, fakeStore{
				createReport:      store.Report{ID: 100, ClinicID: "clinic-1", Status: "degraded", ReviewState: "pending"},
				createCalls:       &createCalls,
				externalReportErr: pgx.ErrNoRows,
			}))
			req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/offline-sync", strings.NewReader(validOfflineSyncJSON()))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != tt.wantCode {
				t.Fatalf("expected status %d, got %d with body %s", tt.wantCode, rec.Code, rec.Body.String())
			}
			if tt.wantCode == http.StatusOK && createCalls != 1 {
				t.Fatalf("expected allowed role to create one report, got %d", createCalls)
			}
		})
	}

	router := apihttp.NewRouter(fakeStore{})
	req := httptest.NewRequest(http.MethodPost, "/v1/reports/offline-sync", body)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertGenericUnauthorized(t, rec)
}

func TestOfflineSyncReturnsPerItemResults(t *testing.T) {
	submittedAt := time.Date(2026, 5, 3, 8, 30, 0, 0, time.UTC)
	reason := "Queued while offline."
	staffPressure := "strained"
	stockPressure := "low"
	queuePressure := "high"
	notes := "Pharmacy queue overflow."
	var createInput store.CreateReportInput
	var syncAttemptInput store.CreateReportSyncAttemptInput
	router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{
		createReport: store.Report{
			ID:             100,
			ClinicID:       "clinic-1",
			Status:         "degraded",
			Reason:         &reason,
			StaffPressure:  &staffPressure,
			StockPressure:  &stockPressure,
			QueuePressure:  &queuePressure,
			Notes:          &notes,
			SubmittedAt:    submittedAt,
			ReviewState:    "pending",
			OfflineCreated: true,
		},
		createInput:       &createInput,
		syncAttemptInput:  &syncAttemptInput,
		externalReportErr: pgx.ErrNoRows,
	}))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/offline-sync", strings.NewReader(validOfflineSyncJSON()))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	var got struct {
		Results []struct {
			ClientReportID string        `json:"clientReportId"`
			Result         string        `json:"result"`
			Report         *store.Report `json:"report,omitempty"`
		} `json:"results"`
		Summary struct {
			Created   int `json:"created"`
			Duplicate int `json:"duplicate"`
			Conflict  int `json:"conflict"`
			Failed    int `json:"failed"`
		} `json:"summary"`
	}
	decodeJSON(t, rec, &got)
	if len(got.Results) != 1 || got.Results[0].ClientReportID != "offline-report-1" || got.Results[0].Result != "created" || got.Results[0].Report == nil || got.Results[0].Report.ID != 100 {
		t.Fatalf("unexpected offline sync results: %#v", got.Results)
	}
	if got.Summary.Created != 1 || got.Summary.Duplicate != 0 || got.Summary.Conflict != 0 || got.Summary.Failed != 0 {
		t.Fatalf("unexpected offline sync summary: %#v", got.Summary)
	}
	if createInput.ExternalID == nil || *createInput.ExternalID != "offline-report-1" || createInput.ClinicID != "clinic-1" || createInput.SubmittedAt != submittedAt {
		t.Fatalf("unexpected offline report create input: %#v", createInput)
	}
	if syncAttemptInput.ClientAttemptCount != 2 || syncAttemptInput.ExternalID != "offline-report-1" || syncAttemptInput.QueuedAt == nil {
		t.Fatalf("expected attemptCount to map to sync attempt input, got %#v", syncAttemptInput)
	}
}

func TestOfflineSyncContinuesAfterItemTimestampValidationError(t *testing.T) {
	submittedAt := time.Date(2026, 5, 3, 8, 30, 0, 0, time.UTC)
	var createInput store.CreateReportInput
	var syncAttemptInputs []store.CreateReportSyncAttemptInput
	createCalls := 0
	router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{
		createReport: store.Report{
			ID:             100,
			ClinicID:       "clinic-1",
			Status:         "degraded",
			SubmittedAt:    submittedAt,
			ReviewState:    "pending",
			OfflineCreated: true,
		},
		createCalls:       &createCalls,
		createInput:       &createInput,
		syncAttemptInputs: &syncAttemptInputs,
		externalReportErr: pgx.ErrNoRows,
	}))
	body := `{
		"items": [
			{
				"clientReportId": "offline-report-bad-time",
				"clinicId": "clinic-1",
				"status": "degraded",
				"reason": "Queued while offline.",
				"staffPressure": "strained",
				"stockPressure": "low",
				"queuePressure": "high",
				"submittedAt": "not-a-timestamp",
				"attemptCount": 1
			},
			{
				"clientReportId": "offline-report-1",
				"clinicId": "clinic-1",
				"status": "degraded",
				"reason": "Queued while offline.",
				"staffPressure": "strained",
				"stockPressure": "low",
				"queuePressure": "high",
				"submittedAt": "2026-05-03T08:30:00Z",
				"queuedAt": "2026-05-03T08:30:03Z",
				"attemptCount": 2
			}
		]
	}`
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/offline-sync", strings.NewReader(body))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	var got struct {
		Results []struct {
			ClientReportID string                 `json:"clientReportId"`
			Result         string                 `json:"result"`
			Report         *store.Report          `json:"report,omitempty"`
			Error          map[string]interface{} `json:"error,omitempty"`
		} `json:"results"`
		Summary struct {
			Created int `json:"created"`
			Failed  int `json:"failed"`
		} `json:"summary"`
	}
	decodeJSON(t, rec, &got)
	if len(got.Results) != 2 {
		t.Fatalf("expected two per-item results, got %#v", got.Results)
	}
	if got.Results[0].ClientReportID != "offline-report-bad-time" || got.Results[0].Result != "validation_error" || got.Results[0].Error["code"] != "validation_error" {
		t.Fatalf("expected first item validation_error, got %#v", got.Results[0])
	}
	if got.Results[1].ClientReportID != "offline-report-1" || got.Results[1].Result != "created" || got.Results[1].Report == nil || got.Results[1].Report.ID != 100 {
		t.Fatalf("expected second item created, got %#v", got.Results[1])
	}
	if got.Summary.Created != 1 || got.Summary.Failed != 1 {
		t.Fatalf("unexpected mixed batch summary: %#v", got.Summary)
	}
	if createCalls != 1 || createInput.ExternalID == nil || *createInput.ExternalID != "offline-report-1" {
		t.Fatalf("expected only valid item to create report, calls=%d input=%#v", createCalls, createInput)
	}
	if len(syncAttemptInputs) != 2 || syncAttemptInputs[0].Result != "validation_error" || syncAttemptInputs[1].Result != "created" {
		t.Fatalf("expected sync attempts for validation and created items, got %#v", syncAttemptInputs)
	}
}

func TestOfflineSyncTimestampValidationNormalizesNegativeAttemptCount(t *testing.T) {
	var syncAttemptInput store.CreateReportSyncAttemptInput
	router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{
		syncAttemptInput: &syncAttemptInput,
	}))
	body := `{"items":[{
		"clientReportId":"offline-report-bad-attempt",
		"clinicId":"clinic-1",
		"status":"degraded",
		"reason":"Queued while offline.",
		"staffPressure":"strained",
		"stockPressure":"low",
		"queuePressure":"high",
		"submittedAt":"not-a-timestamp",
		"attemptCount":-2
	}]}`
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/offline-sync", strings.NewReader(body))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	var got struct {
		Results []struct {
			Result string `json:"result"`
			Error  *struct {
				Code string `json:"code"`
			} `json:"error,omitempty"`
		} `json:"results"`
	}
	decodeJSON(t, rec, &got)
	if len(got.Results) != 1 || got.Results[0].Result != "validation_error" || got.Results[0].Error == nil || got.Results[0].Error.Code != "validation_error" {
		t.Fatalf("expected validation_error result, got %#v", got.Results)
	}
	if syncAttemptInput.ClientAttemptCount != 1 {
		t.Fatalf("expected normalized attempt count 1, got %#v", syncAttemptInput)
	}
}

func TestOfflineSyncTimestampValidationAllowsBlankClinicIDAttempt(t *testing.T) {
	var syncAttemptInput store.CreateReportSyncAttemptInput
	router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{
		syncAttemptInput: &syncAttemptInput,
	}))
	body := `{"items":[{
		"clientReportId":"offline-report-no-clinic",
		"clinicId":"",
		"status":"degraded",
		"reason":"Queued while offline.",
		"staffPressure":"strained",
		"stockPressure":"low",
		"queuePressure":"high",
		"submittedAt":"not-a-timestamp",
		"attemptCount":1
	}]}`
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/offline-sync", strings.NewReader(body))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	var got struct {
		Results []struct {
			Result string `json:"result"`
			Error  *struct {
				Code string `json:"code"`
			} `json:"error,omitempty"`
		} `json:"results"`
	}
	decodeJSON(t, rec, &got)
	if len(got.Results) != 1 || got.Results[0].Result != "validation_error" || got.Results[0].Error == nil || got.Results[0].Error.Code != "validation_error" {
		t.Fatalf("expected validation_error result, got %#v", got.Results)
	}
	if syncAttemptInput.ClinicID != "" {
		t.Fatalf("expected blank clinic id to be passed through for nullable ledger insert, got %#v", syncAttemptInput)
	}
}

func TestOfflineSyncRejectsInvalidJSON(t *testing.T) {
	for _, tt := range []struct {
		name string
		body string
	}{
		{name: "invalid", body: `{"items":`},
		{name: "trailing", body: validOfflineSyncJSON() + `{}`},
	} {
		t.Run(tt.name, func(t *testing.T) {
			createCalls := 0
			router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{createCalls: &createCalls}))
			req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/offline-sync", strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
			}
			if !strings.Contains(rec.Body.String(), `"code":"invalid_json"`) {
				t.Fatalf("expected invalid_json code, got %q", rec.Body.String())
			}
			if createCalls != 0 {
				t.Fatalf("expected invalid JSON not to call store, got %d calls", createCalls)
			}
		})
	}
}

func TestSyncSummaryRequiresDistrictManagerOrHigher(t *testing.T) {
	summary := store.SyncSummary{
		OfflineReportsReceived:    3,
		DuplicateSyncsHandled:     1,
		ConflictsNeedingAttention: 1,
		ValidationFailures:        1,
		PendingOfflineReports:     2,
	}
	for _, tt := range []struct {
		name     string
		role     string
		wantCode int
	}{
		{name: "district manager", role: "district_manager", wantCode: http.StatusOK},
		{name: "org admin", role: "org_admin", wantCode: http.StatusOK},
		{name: "system admin", role: "system_admin", wantCode: http.StatusOK},
		{name: "reporter", role: "reporter", wantCode: http.StatusForbidden},
	} {
		t.Run(tt.name, func(t *testing.T) {
			var since time.Time
			router := apihttp.NewRouter(authenticatedStore(t, tt.role, fakeStore{
				syncSummary:  &summary,
				summarySince: &since,
			}))
			req := newAuthenticatedRequest(t, http.MethodGet, "/v1/sync/summary", nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != tt.wantCode {
				t.Fatalf("expected status %d, got %d with body %s", tt.wantCode, rec.Code, rec.Body.String())
			}
			if tt.wantCode == http.StatusOK {
				var got store.SyncSummary
				decodeJSON(t, rec, &got)
				if got.OfflineReportsReceived != 3 || got.WindowStartedAt.IsZero() {
					t.Fatalf("unexpected sync summary response: %#v", got)
				}
				if age := time.Since(since); age < 23*time.Hour || age > 25*time.Hour {
					t.Fatalf("expected default summary window near 24 hours, got since %s", since)
				}
			}
		})
	}

	router := apihttp.NewRouter(fakeStore{})
	req := httptest.NewRequest(http.MethodGet, "/v1/sync/summary", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertGenericUnauthorized(t, rec)
}

func TestSyncSummaryPassesReviewScopeForDistrictManager(t *testing.T) {
	var scope store.ReportReviewScope
	router := apihttp.NewRouter(authenticatedStore(t, "district_manager", fakeStore{
		syncSummary:      &store.SyncSummary{OfflineReportsReceived: 1},
		syncSummaryScope: &scope,
	}))
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/sync/summary", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if scope.Role != "district_manager" || scope.District == nil || *scope.District != defaultTestDistrict {
		t.Fatalf("expected district-manager review scope, got %#v", scope)
	}
}

func TestReconcileStalenessRequiresDistrictManagerOrHigher(t *testing.T) {
	for _, tt := range []struct {
		name     string
		role     string
		wantCode int
	}{
		{name: "district manager", role: "district_manager", wantCode: http.StatusOK},
		{name: "org admin", role: "org_admin", wantCode: http.StatusOK},
		{name: "system admin", role: "system_admin", wantCode: http.StatusOK},
		{name: "reporter", role: "reporter", wantCode: http.StatusForbidden},
	} {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(authenticatedStore(t, tt.role, fakeStore{}))
			req := newAuthenticatedRequest(t, http.MethodPost, "/v1/status/reconcile-staleness", nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != tt.wantCode {
				t.Fatalf("expected status %d, got %d with body %s", tt.wantCode, rec.Code, rec.Body.String())
			}
		})
	}

	router := apihttp.NewRouter(fakeStore{})
	req := httptest.NewRequest(http.MethodPost, "/v1/status/reconcile-staleness", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertGenericUnauthorized(t, rec)
}

func TestReconcileStalenessPassesReviewScopeForDistrictManager(t *testing.T) {
	now := time.Now().UTC()
	lastReportedAt := now.Add(-24 * time.Hour)
	var scope store.ReportReviewScope
	router := apihttp.NewRouter(authenticatedStore(t, "district_manager", fakeStore{
		currentStatuses: []store.CurrentStatus{{
			ClinicID:       "clinic-1",
			Freshness:      "fresh",
			LastReportedAt: &lastReportedAt,
		}},
		currentStatusScope: &scope,
	}))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/status/reconcile-staleness", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if scope.Role != "district_manager" || scope.District == nil || *scope.District != defaultTestDistrict {
		t.Fatalf("expected district-manager review scope, got %#v", scope)
	}
}

func TestReconcileStalenessReturnsSummary(t *testing.T) {
	now := time.Now().UTC()
	lastReportedAt := now.Add(-24 * time.Hour)
	var updateInput store.CreateAuditEventInput
	var updateCalled bool
	router := apihttp.NewRouter(authenticatedStore(t, "district_manager", fakeStore{
		currentStatuses: []store.CurrentStatus{{
			ClinicID:       "clinic-1",
			Freshness:      "fresh",
			LastReportedAt: &lastReportedAt,
		}},
		updateFreshnessInput:  &updateInput,
		updateFreshnessCalled: &updateCalled,
	}))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/status/reconcile-staleness", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	var got struct {
		Checked                 int `json:"checked"`
		MarkedNeedsConfirmation int `json:"markedNeedsConfirmation"`
		MarkedStale             int `json:"markedStale"`
	}
	decodeJSON(t, rec, &got)
	if got.Checked != 1 || got.MarkedNeedsConfirmation != 0 || got.MarkedStale != 1 {
		t.Fatalf("unexpected reconcile response: %#v", got)
	}
	if !updateCalled {
		t.Fatal("expected freshness update to be called")
	}
	if updateInput.ActorUserID == nil || *updateInput.ActorUserID != 42 {
		t.Fatalf("expected authenticated actor in audit input, got %#v", updateInput.ActorUserID)
	}
	if updateInput.EventType != "clinic.status_marked_stale" || updateInput.Metadata["freshness"] != "stale" {
		t.Fatalf("unexpected audit input: %#v", updateInput)
	}
}

func TestReviewReportRequiresAuthenticatedPrincipal(t *testing.T) {
	router := apihttp.NewRouter(fakeStore{})
	req := httptest.NewRequest(http.MethodPost, "/v1/reports/100/review", strings.NewReader(`{"decision":"accepted"}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertGenericUnauthorized(t, rec)
}

func TestAcceptPendingReportReturnsUpdatedReportAndCurrentStatus(t *testing.T) {
	notes := "District verified"
	district := "Tshwane North Demo District"
	status := store.CurrentStatus{ClinicID: "clinic-1", Status: "degraded"}
	var reviewInput store.ReviewReportInput
	router := newAuthenticatedTestRouter(t, fakeStore{
		reviewReport: store.Report{ID: 100, ClinicID: "clinic-1", ReviewState: "accepted", Status: "degraded"},
		reviewStatus: &status,
		reviewInput:  &reviewInput,
		memberships: []store.OrganisationMembership{{
			ID:        1,
			UserID:    42,
			Role:      "district_manager",
			District:  &district,
			CreatedAt: time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC),
		}},
	})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/100/review", strings.NewReader(`{"decision":"accepted","notes":"  District verified  "}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	var got struct {
		Report        store.Report         `json:"report"`
		CurrentStatus *store.CurrentStatus `json:"currentStatus,omitempty"`
	}
	decodeJSON(t, rec, &got)
	if got.Report.ID != 100 || got.Report.ReviewState != "accepted" || got.CurrentStatus == nil || got.CurrentStatus.Status != "degraded" {
		t.Fatalf("unexpected review response: %#v", got)
	}
	if reviewInput.ReportID != 100 || reviewInput.Decision != "accepted" || reviewInput.ReviewerUserID != 42 {
		t.Fatalf("unexpected review input: %#v", reviewInput)
	}
	if reviewInput.Notes == nil || *reviewInput.Notes != notes {
		t.Fatalf("expected trimmed notes %q, got %v", notes, reviewInput.Notes)
	}
	if reviewInput.Scope.Role != "district_manager" {
		t.Fatalf("expected review scope role district_manager, got %#v", reviewInput.Scope)
	}
	if reviewInput.Scope.District == nil || *reviewInput.Scope.District != district {
		t.Fatalf("expected review scope district %q, got %#v", district, reviewInput.Scope)
	}
}

func TestReviewReportWritesDecisionAuditWithAuthenticatedActor(t *testing.T) {
	orgID := int64(7)
	notes := "District verified"
	district := "Tshwane North Demo District"
	var reviewInput store.ReviewReportInput
	router := apihttp.NewRouter(authenticatedStore(t, "district_manager", fakeStore{
		reviewReport: store.Report{ID: 100, ClinicID: "clinic-1", ReviewState: "accepted", Status: "degraded"},
		reviewInput:  &reviewInput,
		memberships: []store.OrganisationMembership{{
			ID:             1,
			OrganisationID: &orgID,
			UserID:         42,
			Role:           "district_manager",
			District:       &district,
			CreatedAt:      time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC),
		}},
	}))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/100/review", strings.NewReader(`{"decision":"accepted","notes":"District verified"}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if reviewInput.AuditEvent == nil {
		t.Fatal("expected review audit event in store input")
	}
	if reviewInput.AuditEvent.ActorUserID == nil || *reviewInput.AuditEvent.ActorUserID != 42 {
		t.Fatalf("expected actor user id 42, got %v", reviewInput.AuditEvent.ActorUserID)
	}
	if reviewInput.AuditEvent.OrganisationID == nil || *reviewInput.AuditEvent.OrganisationID != orgID {
		t.Fatalf("expected organisation id %d, got %v", orgID, reviewInput.AuditEvent.OrganisationID)
	}
	if reviewInput.AuditEvent.Metadata["decision"] != "accepted" || reviewInput.AuditEvent.Metadata["notes"] != notes {
		t.Fatalf("unexpected review audit metadata: %#v", reviewInput.AuditEvent.Metadata)
	}
}

func TestRejectPendingReportReturnsNoCurrentStatus(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{
		reviewReport: store.Report{ID: 100, ClinicID: "clinic-1", ReviewState: "rejected"},
	})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/100/review", strings.NewReader(`{"decision":"rejected"}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	var got struct {
		Report        store.Report         `json:"report"`
		CurrentStatus *store.CurrentStatus `json:"currentStatus,omitempty"`
	}
	decodeJSON(t, rec, &got)
	if got.Report.ID != 100 || got.Report.ReviewState != "rejected" || got.CurrentStatus != nil {
		t.Fatalf("unexpected review response: %#v", got)
	}
}

func TestReviewReportReturnsConflictForAlreadyReviewed(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{reviewErr: store.ErrReportAlreadyReviewed})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/100/review", strings.NewReader(`{"decision":"accepted"}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusConflict {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusConflict, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"conflict"`) {
		t.Fatalf("expected conflict error code, got %q", rec.Body.String())
	}
}

func TestReviewReportReturnsBadRequestForInvalidJSONAndDecision(t *testing.T) {
	for _, tt := range []struct {
		name string
		body string
		code string
	}{
		{name: "invalid json", body: `{"decision":`, code: "invalid_json"},
		{name: "trailing json", body: `{"decision":"accepted"} {}`, code: "invalid_json"},
		{name: "invalid decision", body: `{"decision":"maybe"}`, code: "validation_error"},
	} {
		t.Run(tt.name, func(t *testing.T) {
			router := newAuthenticatedTestRouter(t, fakeStore{})
			req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/100/review", strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
			}
			if !strings.Contains(rec.Body.String(), `"code":"`+tt.code+`"`) {
				t.Fatalf("expected %s error code, got %q", tt.code, rec.Body.String())
			}
		})
	}
}

func TestReviewReportReturnsBadRequestForWhitespaceOnlyNotes(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/100/review", strings.NewReader(`{"decision":"accepted","notes":"   "}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "notes: notes cannot be blank") {
		t.Fatalf("expected notes validation error, got %q", rec.Body.String())
	}
}

func TestReviewReportAllowsEmptyStringNotesAsNil(t *testing.T) {
	var reviewInput store.ReviewReportInput
	router := newAuthenticatedTestRouter(t, fakeStore{
		reviewReport: store.Report{ID: 100, ClinicID: "clinic-1", ReviewState: "accepted"},
		reviewInput:  &reviewInput,
	})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/100/review", strings.NewReader(`{"decision":"accepted","notes":""}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if reviewInput.Notes != nil {
		t.Fatalf("expected empty notes to become nil, got %q", *reviewInput.Notes)
	}
}

func TestReviewReportReturnsForbiddenForOutOfScopeDistrictManager(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{reviewErr: store.ErrReportReviewForbidden})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/100/review", strings.NewReader(`{"decision":"accepted"}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusForbidden, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"forbidden"`) {
		t.Fatalf("expected forbidden error code, got %q", rec.Body.String())
	}
}

func TestReviewReportReturnsNotFoundForMissingReport(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{reviewErr: pgx.ErrNoRows})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/404/review", strings.NewReader(`{"decision":"accepted"}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNotFound, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"not_found"`) {
		t.Fatalf("expected not_found error code, got %q", rec.Body.String())
	}
}

func TestLoginSuccessSetsSessionCookieAndReturnsUserMemberships(t *testing.T) {
	passwordHash := hashPasswordForTest(t, "correct-password")
	now := time.Date(2026, 5, 3, 8, 0, 0, 0, time.UTC)
	var getEmail string
	var createInput store.CreateSessionInput
	router := apihttp.NewRouter(fakeStore{
		user: store.User{
			ID:           42,
			Email:        "manager@example.test",
			DisplayName:  "Clinic Manager",
			PasswordHash: &passwordHash,
			CreatedAt:    now,
			UpdatedAt:    now,
		},
		createSession: store.Session{
			ID:        100,
			UserID:    42,
			CreatedAt: now,
			ExpiresAt: now.Add(12 * time.Hour),
		},
		memberships: []store.OrganisationMembership{
			{ID: 7, UserID: 42, Role: "district_manager", CreatedAt: now},
		},
		getUserEmail:       &getEmail,
		createSessionInput: &createInput,
	})
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(`{"email":" Manager@Example.Test ","password":"correct-password"}`))
	req.Header.Set("User-Agent", "ClinicPulse Test")
	req.RemoteAddr = "192.0.2.55:4321"
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	sessionCookie := findCookie(rec, "clinicpulse_session")
	if sessionCookie == nil {
		t.Fatalf("expected clinicpulse_session cookie, got %v", rec.Result().Cookies())
	}
	if sessionCookie.Value == "" {
		t.Fatal("expected non-empty plaintext session token cookie")
	}
	if !sessionCookie.HttpOnly {
		t.Fatalf("expected HttpOnly cookie, got %#v", sessionCookie)
	}
	if sessionCookie.Path != "/" {
		t.Fatalf("expected cookie path /, got %q", sessionCookie.Path)
	}
	if sessionCookie.SameSite != http.SameSiteLaxMode {
		t.Fatalf("expected SameSite=Lax, got %#v", sessionCookie.SameSite)
	}
	if time.Until(sessionCookie.Expires) <= 0 {
		t.Fatalf("expected future cookie expiry, got %s", sessionCookie.Expires)
	}
	if getEmail != "manager@example.test" {
		t.Fatalf("expected trimmed lower-case lookup email, got %q", getEmail)
	}
	if createInput.UserID != 42 || createInput.TokenHash == "" || createInput.ExpiresAt.IsZero() {
		t.Fatalf("expected populated session input, got %#v", createInput)
	}
	if createInput.TokenHash == sessionCookie.Value {
		t.Fatal("expected store token hash not to equal plaintext cookie token")
	}
	if createInput.UserAgent == nil || *createInput.UserAgent != "ClinicPulse Test" {
		t.Fatalf("expected captured user agent, got %#v", createInput.UserAgent)
	}
	if createInput.IPAddress == nil || *createInput.IPAddress != "192.0.2.55" {
		t.Fatalf("expected captured remote IP, got %#v", createInput.IPAddress)
	}

	var got struct {
		User        store.User                     `json:"user"`
		Memberships []store.OrganisationMembership `json:"memberships"`
	}
	decodeJSON(t, rec, &got)
	if got.User.ID != 42 || got.User.Email != "manager@example.test" || got.User.PasswordHash != nil {
		t.Fatalf("unexpected user response: %#v", got.User)
	}
	if len(got.Memberships) != 1 || got.Memberships[0].Role != "district_manager" {
		t.Fatalf("unexpected memberships response: %#v", got.Memberships)
	}
	if strings.Contains(rec.Body.String(), "correct-password") || strings.Contains(rec.Body.String(), passwordHash) || strings.Contains(rec.Body.String(), createInput.TokenHash) {
		t.Fatalf("expected auth secrets not to appear in response, got %q", rec.Body.String())
	}
}

func TestLoginSuccessWritesActorAuditEvent(t *testing.T) {
	passwordHash := hashPasswordForTest(t, "correct-password")
	now := time.Date(2026, 5, 3, 8, 0, 0, 0, time.UTC)
	orgID := int64(7)
	var auditInput store.CreateAuditEventInput
	auditCalls := 0
	createSessionCalls := 0
	router := apihttp.NewRouter(fakeStore{
		user: store.User{
			ID:           42,
			Email:        "manager@example.test",
			DisplayName:  "Clinic Manager",
			PasswordHash: &passwordHash,
			CreatedAt:    now,
			UpdatedAt:    now,
		},
		createSession: store.Session{
			ID:        100,
			UserID:    42,
			CreatedAt: now,
			ExpiresAt: now.Add(12 * time.Hour),
		},
		memberships: []store.OrganisationMembership{
			{ID: 7, OrganisationID: &orgID, UserID: 42, Role: "org_admin", CreatedAt: now},
		},
		auditInput:         &auditInput,
		auditCalls:         &auditCalls,
		createSessionCalls: &createSessionCalls,
	})
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(`{"email":"manager@example.test","password":"correct-password"}`))
	req.Header.Set("User-Agent", "ClinicPulse Test")
	req.RemoteAddr = "192.0.2.55:4321"
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if auditCalls != 1 {
		t.Fatalf("expected one audit event, got %d", auditCalls)
	}
	if createSessionCalls != 0 {
		t.Fatalf("expected login to use transactional session audit store method, got %d CreateSession calls", createSessionCalls)
	}
	if auditInput.EventType != "auth.login.succeeded" {
		t.Fatalf("expected auth.login.succeeded event type, got %q", auditInput.EventType)
	}
	if auditInput.ActorUserID == nil || *auditInput.ActorUserID != 42 {
		t.Fatalf("expected actor user id 42, got %v", auditInput.ActorUserID)
	}
	if auditInput.ActorRole == nil || *auditInput.ActorRole != "org_admin" {
		t.Fatalf("expected actor role org_admin, got %v", auditInput.ActorRole)
	}
	if auditInput.OrganisationID == nil || *auditInput.OrganisationID != orgID {
		t.Fatalf("expected organisation id %d, got %v", orgID, auditInput.OrganisationID)
	}
	if auditInput.EntityType == nil || *auditInput.EntityType != "session" {
		t.Fatalf("expected session entity type, got %v", auditInput.EntityType)
	}
	if auditInput.EntityID == nil || *auditInput.EntityID != "100" {
		t.Fatalf("expected session entity id 100, got %v", auditInput.EntityID)
	}
	if auditInput.Metadata["sessionId"] != int64(100) || auditInput.Metadata["userAgent"] != "ClinicPulse Test" || auditInput.Metadata["ipAddress"] != "192.0.2.55" {
		t.Fatalf("unexpected login audit metadata: %#v", auditInput.Metadata)
	}
}

func TestLoginAuditFailureDoesNotCreateSessionOnlyOrSetCookie(t *testing.T) {
	passwordHash := hashPasswordForTest(t, "correct-password")
	now := time.Date(2026, 5, 3, 8, 0, 0, 0, time.UTC)
	storeErr := errors.New("audit insert failed")
	createSessionCalls := 0
	sessionAuditCalls := 0
	router := apihttp.NewRouter(fakeStore{
		user: store.User{
			ID:           42,
			Email:        "manager@example.test",
			DisplayName:  "Clinic Manager",
			PasswordHash: &passwordHash,
			CreatedAt:    now,
			UpdatedAt:    now,
		},
		createSession: store.Session{
			ID:        100,
			UserID:    42,
			CreatedAt: now,
			ExpiresAt: now.Add(12 * time.Hour),
		},
		memberships: []store.OrganisationMembership{
			{ID: 7, UserID: 42, Role: "org_admin", CreatedAt: now},
		},
		createSessionCalls:          &createSessionCalls,
		createSessionWithAuditCalls: &sessionAuditCalls,
		createSessionWithAuditErr:   storeErr,
		auditErr:                    storeErr,
	})
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(`{"email":"manager@example.test","password":"correct-password"}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertInternalError(t, rec, storeErr)
	if createSessionCalls != 0 {
		t.Fatalf("expected audit failure not to use CreateSession-only path, got %d calls", createSessionCalls)
	}
	if sessionAuditCalls != 1 {
		t.Fatalf("expected transactional session audit path once, got %d calls", sessionAuditCalls)
	}
	if findCookie(rec, "clinicpulse_session") != nil {
		t.Fatalf("expected audit failure not to set session cookie, got %v", rec.Result().Cookies())
	}
}

func TestLoginSessionCookieSecureBehavior(t *testing.T) {
	tests := []struct {
		name       string
		target     string
		wantSecure bool
	}{
		{name: "localhost HTTP remains usable for local dev", target: "http://localhost:3000/v1/auth/login", wantSecure: false},
		{name: "loopback HTTP remains usable for local dev", target: "http://127.0.0.1:3000/v1/auth/login", wantSecure: false},
		{name: "production-like host uses secure cookie", target: "http://api.example.test/v1/auth/login", wantSecure: true},
		{name: "TLS request uses secure cookie", target: "https://localhost:3000/v1/auth/login", wantSecure: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(successfulLoginStore(t))
			req := httptest.NewRequest(http.MethodPost, tt.target, strings.NewReader(`{"email":"manager@example.test","password":"correct-password"}`))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
			}
			cookie := findCookie(rec, "clinicpulse_session")
			if cookie == nil {
				t.Fatalf("expected clinicpulse_session cookie, got %v", rec.Result().Cookies())
			}
			if cookie.Secure != tt.wantSecure {
				t.Fatalf("expected Secure=%t, got %#v", tt.wantSecure, cookie)
			}
		})
	}
}

func TestLoginReturnsBadRequestForInvalidOrTrailingJSON(t *testing.T) {
	tests := []struct {
		name string
		body string
	}{
		{name: "invalid json", body: `{"email":`},
		{name: "trailing object", body: `{"email":"manager@example.test","password":"password"}{}`},
		{name: "trailing garbage", body: `{"email":"manager@example.test","password":"password"} garbage`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(fakeStore{})
			req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
			}
			if !strings.Contains(rec.Body.String(), `"code":"invalid_json"`) {
				t.Fatalf("expected invalid_json code, got %q", rec.Body.String())
			}
		})
	}
}

func TestLoginReturnsBadRequestForMissingEmailOrPassword(t *testing.T) {
	tests := []struct {
		name string
		body string
	}{
		{name: "missing email", body: `{"password":"password"}`},
		{name: "blank email", body: `{"email":"  ","password":"password"}`},
		{name: "missing password", body: `{"email":"manager@example.test"}`},
		{name: "blank password", body: `{"email":"manager@example.test","password":""}`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(fakeStore{})
			req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
			}
			if !strings.Contains(rec.Body.String(), `"code":"validation_error"`) {
				t.Fatalf("expected validation_error code, got %q", rec.Body.String())
			}
		})
	}
}

func TestLoginReturnsGenericUnauthorizedForInvalidCredentials(t *testing.T) {
	validHash := hashPasswordForTest(t, "correct-password")
	disabledAt := time.Date(2026, 5, 3, 9, 0, 0, 0, time.UTC)
	tests := []struct {
		name  string
		store fakeStore
		body  string
	}{
		{
			name:  "missing user",
			store: fakeStore{getUserErr: pgx.ErrNoRows},
			body:  `{"email":"missing@example.test","password":"password"}`,
		},
		{
			name: "wrong password",
			store: fakeStore{user: store.User{
				ID:           42,
				Email:        "manager@example.test",
				PasswordHash: &validHash,
			}},
			body: `{"email":"manager@example.test","password":"wrong-password"}`,
		},
		{
			name: "disabled user",
			store: fakeStore{user: store.User{
				ID:           42,
				Email:        "manager@example.test",
				PasswordHash: &validHash,
				DisabledAt:   &disabledAt,
			}},
			body: `{"email":"manager@example.test","password":"correct-password"}`,
		},
		{
			name:  "user without password hash",
			store: fakeStore{user: store.User{ID: 42, Email: "manager@example.test"}},
			body:  `{"email":"manager@example.test","password":"correct-password"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			createSessionCalls := 0
			tt.store.createSessionCalls = &createSessionCalls
			router := apihttp.NewRouter(tt.store)
			req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			assertGenericUnauthorized(t, rec)
			if createSessionCalls != 0 {
				t.Fatalf("expected invalid credentials not to create a session, got %d calls", createSessionCalls)
			}
		})
	}
}

func TestLoginMembershipFailureReturnsInternalErrorWithoutCreatingSession(t *testing.T) {
	storeErr := errors.New("membership lookup failed")
	createSessionCalls := 0
	loginStore := successfulLoginStore(t)
	loginStore.membershipsErr = storeErr
	loginStore.createSessionCalls = &createSessionCalls
	router := apihttp.NewRouter(loginStore)
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(`{"email":"manager@example.test","password":"correct-password"}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertInternalError(t, rec, storeErr)
	if createSessionCalls != 0 {
		t.Fatalf("expected membership failure not to create a session, got %d calls", createSessionCalls)
	}
	if findCookie(rec, "clinicpulse_session") != nil {
		t.Fatalf("expected membership failure not to set session cookie, got %v", rec.Result().Cookies())
	}
}

func TestLoginNoMembershipReturnsUnauthorizedWithoutCreatingSession(t *testing.T) {
	createSessionCalls := 0
	loginStore := successfulLoginStore(t)
	loginStore.memberships = []store.OrganisationMembership{}
	loginStore.createSessionCalls = &createSessionCalls
	router := apihttp.NewRouter(loginStore)
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(`{"email":"manager@example.test","password":"correct-password"}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertGenericUnauthorized(t, rec)
	if createSessionCalls != 0 {
		t.Fatalf("expected no-membership login not to create a session, got %d calls", createSessionCalls)
	}
	if findCookie(rec, "clinicpulse_session") != nil {
		t.Fatalf("expected no-membership login not to set session cookie, got %v", rec.Result().Cookies())
	}
}

func TestAuthMeNoCookieReturnsUnauthorized(t *testing.T) {
	router := apihttp.NewRouter(fakeStore{})
	req := httptest.NewRequest(http.MethodGet, "/v1/auth/me", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertGenericUnauthorized(t, rec)
}

func TestAuthMeWithValidCookieReturnsUserSessionMemberships(t *testing.T) {
	token := sessionTokenForTest(t)
	tokenHash := hashSessionTokenForTest(t, token)
	now := time.Date(2026, 5, 3, 10, 0, 0, 0, time.UTC)
	var gotTokenHash string
	getSessionCalls := 0
	router := apihttp.NewRouter(fakeStore{
		session: store.Session{
			ID:        100,
			UserID:    42,
			TokenHash: tokenHash,
			CreatedAt: now,
			ExpiresAt: now.Add(12 * time.Hour),
		},
		sessionUser: store.User{
			ID:          42,
			Email:       "manager@example.test",
			DisplayName: "Clinic Manager",
			CreatedAt:   now,
			UpdatedAt:   now,
		},
		memberships: []store.OrganisationMembership{
			{ID: 7, UserID: 42, Role: "district_manager", CreatedAt: now},
		},
		getSessionTokenHash: &gotTokenHash,
		getSessionCalls:     &getSessionCalls,
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/auth/me", nil)
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: token})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if getSessionCalls != 1 {
		t.Fatalf("expected GetSessionByTokenHash to be called once, got %d", getSessionCalls)
	}
	if gotTokenHash != tokenHash {
		t.Fatalf("expected token hash %q, got %q", tokenHash, gotTokenHash)
	}

	var got struct {
		User        store.User                     `json:"user"`
		Session     store.Session                  `json:"session"`
		Memberships []store.OrganisationMembership `json:"memberships"`
	}
	decodeJSON(t, rec, &got)
	if got.User.ID != 42 || got.User.Email != "manager@example.test" {
		t.Fatalf("unexpected user response: %#v", got.User)
	}
	if got.Session.ID != 100 || got.Session.TokenHash != "" {
		t.Fatalf("unexpected session response: %#v", got.Session)
	}
	if len(got.Memberships) != 1 || got.Memberships[0].Role != "district_manager" {
		t.Fatalf("unexpected memberships response: %#v", got.Memberships)
	}
	if strings.Contains(rec.Body.String(), tokenHash) || strings.Contains(rec.Body.String(), token) {
		t.Fatalf("expected session secrets not to appear in response, got %q", rec.Body.String())
	}
}

func TestAuthMeMalformedCookieReturnsUnauthorized(t *testing.T) {
	getSessionCalls := 0
	router := apihttp.NewRouter(fakeStore{getSessionCalls: &getSessionCalls})
	req := httptest.NewRequest(http.MethodGet, "/v1/auth/me", nil)
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: "not-a-valid-token"})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertGenericUnauthorized(t, rec)
	if getSessionCalls != 0 {
		t.Fatalf("expected malformed token not to call store, got %d calls", getSessionCalls)
	}
}

func TestAuthMeUnknownExpiredRevokedOrDisabledSessionReturnsUnauthorized(t *testing.T) {
	token := sessionTokenForTest(t)
	getSessionCalls := 0
	router := apihttp.NewRouter(fakeStore{
		getSessionCalls: &getSessionCalls,
		getSessionErr:   pgx.ErrNoRows,
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/auth/me", nil)
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: token})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertGenericUnauthorized(t, rec)
	if getSessionCalls != 1 {
		t.Fatalf("expected valid-looking token to call store once, got %d calls", getSessionCalls)
	}
	for _, leaked := range []string{"unknown", "expired", "revoked", "disabled"} {
		if strings.Contains(strings.ToLower(rec.Body.String()), leaked) {
			t.Fatalf("expected generic unauthorized response, got %q", rec.Body.String())
		}
	}
}

func TestLogoutRevokesValidCookieHashAndClearsCookie(t *testing.T) {
	token := sessionTokenForTest(t)
	tokenHash := hashSessionTokenForTest(t, token)
	var revokedHash string
	router := apihttp.NewRouter(fakeStore{revokedTokenHash: &revokedHash})
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/logout", nil)
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: token})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNoContent, rec.Code, rec.Body.String())
	}
	if revokedHash != tokenHash {
		t.Fatalf("expected revoked hash %q, got %q", tokenHash, revokedHash)
	}
	assertSessionCookieCleared(t, rec)
}

func TestLogoutMissingOrMalformedCookieClearsAndSucceeds(t *testing.T) {
	tests := []struct {
		name   string
		cookie *http.Cookie
	}{
		{name: "missing cookie"},
		{name: "malformed cookie", cookie: &http.Cookie{Name: "clinicpulse_session", Value: "bad-token"}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			revokeCalls := 0
			router := apihttp.NewRouter(fakeStore{revokeCalls: &revokeCalls})
			req := httptest.NewRequest(http.MethodPost, "/v1/auth/logout", nil)
			if tt.cookie != nil {
				req.AddCookie(tt.cookie)
			}
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusNoContent {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusNoContent, rec.Code, rec.Body.String())
			}
			if revokeCalls != 0 {
				t.Fatalf("expected no revoke call, got %d", revokeCalls)
			}
			assertSessionCookieCleared(t, rec)
		})
	}
}

func TestLogoutClearCookieSecureBehaviorMatchesRequest(t *testing.T) {
	token := sessionTokenForTest(t)
	tests := []struct {
		name       string
		target     string
		wantSecure bool
	}{
		{name: "localhost HTTP clear cookie remains local-dev compatible", target: "http://localhost:3000/v1/auth/logout", wantSecure: false},
		{name: "production-like host clear cookie is secure", target: "http://api.example.test/v1/auth/logout", wantSecure: true},
		{name: "TLS clear cookie is secure", target: "https://localhost:3000/v1/auth/logout", wantSecure: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(fakeStore{})
			req := httptest.NewRequest(http.MethodPost, tt.target, nil)
			req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: token})
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusNoContent {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusNoContent, rec.Code, rec.Body.String())
			}
			cookie := findCookie(rec, "clinicpulse_session")
			if cookie == nil {
				t.Fatalf("expected clinicpulse_session clear cookie, got %v", rec.Result().Cookies())
			}
			if cookie.Secure != tt.wantSecure {
				t.Fatalf("expected Secure=%t, got %#v", tt.wantSecure, cookie)
			}
		})
	}
}

type fakeStore struct {
	clinics                               []store.ClinicDetail
	clinic                                store.ClinicDetail
	status                                store.CurrentStatus
	reports                               []store.Report
	pendingReports                        []store.Report
	auditEvents                           []store.AuditEvent
	currentStatuses                       []store.CurrentStatus
	createReport                          store.Report
	createStatus                          store.CurrentStatus
	createAuditEvent                      store.AuditEvent
	reviewReport                          store.Report
	reviewStatus                          *store.CurrentStatus
	user                                  store.User
	createSession                         store.Session
	createSessionAudit                    store.AuditEvent
	externalReport                        store.Report
	pendingPayloadReport                  store.Report
	syncAttempt                           store.ReportSyncAttempt
	session                               store.Session
	sessionUser                           store.User
	memberships                           []store.OrganisationMembership
	syncSummary                           *store.SyncSummary
	partnerAPIKey                         store.PartnerAPIKey
	partnerAPIKeys                        *[]store.PartnerAPIKey
	partnerWebhookSubscriptions           *[]store.PartnerWebhookSubscription
	partnerWebhookEvents                  *[]store.PartnerWebhookEvent
	partnerExportRuns                     *[]store.PartnerExportRun
	partnerExportRun                      store.PartnerExportRun
	partnerReadinessSnapshot              store.PartnerReadinessSnapshot
	integrationStatusChecks               []store.IntegrationStatusCheck
	upsertIntegrationStatusCheckInputs    *[]store.UpsertIntegrationStatusCheckInput
	upsertIntegrationStatusChecks         *[]store.IntegrationStatusCheck
	createInput                           *store.CreateReportInput
	createPartnerAPIKeyInput              *store.CreatePartnerAPIKeyInput
	createPartnerWebhookSubscriptionInput *store.CreatePartnerWebhookSubscriptionInput
	createPartnerWebhookEventInput        *store.CreatePartnerWebhookEventInput
	createPartnerExportRunInput           *store.CreatePartnerExportRunInput
	reviewInput                           *store.ReviewReportInput
	syncAttemptInput                      *store.CreateReportSyncAttemptInput
	syncAttemptInputs                     *[]store.CreateReportSyncAttemptInput
	updateFreshnessInput                  *store.CreateAuditEventInput
	updateFreshnessCalled                 *bool
	listPartnerAPIKeysOrgID               *int64
	listPartnerWebhookSubscriptionsOrgID  *int64
	listPartnerWebhookEventsOrgID         *int64
	partnerReadinessOrgID                 *int64
	getPartnerExportRunOrgID              *int64
	getPartnerExportRunID                 *int64
	revokedPartnerAPIKeyID                *int64
	pendingScope                          *store.ReportReviewScope
	currentStatusScope                    *store.ReportReviewScope
	syncSummaryScope                      *store.ReportReviewScope
	summarySince                          *time.Time
	getUserEmail                          *string
	createSessionInput                    *store.CreateSessionInput
	sessionAuditInput                     *store.CreateSessionWithAuditInput
	auditInput                            *store.CreateAuditEventInput
	getSessionTokenHash                   *string
	revokedTokenHash                      *string
	createCalls                           *int
	createPartnerAPIKeyCalls              *int
	createPartnerWebhookEventCalls        *int
	createSessionCalls                    *int
	createSessionWithAuditCalls           *int
	auditCalls                            *int
	revokePartnerAPIKeyCalls              *int
	getSessionCalls                       *int
	revokeCalls                           *int
	partnerTouchCalls                     *int
	partnerTouchErr                       error
	listErr                               error
	getClinicErr                          error
	statusErr                             error
	reportsErr                            error
	pendingReportsErr                     error
	auditEventsErr                        error
	currentStatusesErr                    error
	createErr                             error
	updateFreshnessErr                    error
	reviewErr                             error
	getUserErr                            error
	createSessionErr                      error
	createSessionWithAuditErr             error
	auditErr                              error
	externalReportErr                     error
	pendingPayloadErr                     error
	syncAttemptErr                        error
	syncSummaryErr                        error
	getSessionErr                         error
	revokeErr                             error
	membershipsErr                        error
	partnerKeyErr                         error
	createPartnerAPIKeyErr                error
	listPartnerAPIKeysErr                 error
	revokePartnerAPIKeyErr                error
	createPartnerWebhookSubscriptionErr   error
	listPartnerWebhookSubscriptionsErr    error
	createPartnerWebhookEventErr          error
	listPartnerWebhookEventsErr           error
	createPartnerExportRunErr             error
	getPartnerExportRunErr                error
	partnerReadinessErr                   error
	partnerExportRunErr                   error
	integrationStatusChecksErr            error
	upsertIntegrationStatusCheckErr       error
	readyErr                              error
}

func (f fakeStore) Ready(context.Context) error {
	return f.readyErr
}

func (f fakeStore) ListClinics(context.Context) ([]store.ClinicDetail, error) {
	return f.clinics, f.listErr
}

func (f fakeStore) GetClinic(_ context.Context, clinicID string) (store.ClinicDetail, error) {
	if f.clinic.Clinic.ID == "" {
		return clinicDetailInDistrict(clinicID, defaultTestDistrict), f.getClinicErr
	}
	return f.clinic, f.getClinicErr
}

func (f fakeStore) GetCurrentStatus(context.Context, string) (store.CurrentStatus, error) {
	return f.status, f.statusErr
}

func (f fakeStore) ListClinicReports(context.Context, string) ([]store.Report, error) {
	return f.reports, f.reportsErr
}

func (f fakeStore) ListPendingReports(_ context.Context, scope store.ReportReviewScope) ([]store.Report, error) {
	if f.pendingScope != nil {
		*f.pendingScope = scope
	}
	return f.pendingReports, f.pendingReportsErr
}

func (f fakeStore) ListClinicAuditEvents(context.Context, string) ([]store.AuditEvent, error) {
	return f.auditEvents, f.auditEventsErr
}

func (f fakeStore) ListCurrentStatuses(context.Context) ([]store.CurrentStatus, error) {
	return f.currentStatuses, f.currentStatusesErr
}

func (f fakeStore) ListCurrentStatusesForReviewScope(_ context.Context, scope store.ReportReviewScope) ([]store.CurrentStatus, error) {
	if f.currentStatusScope != nil {
		*f.currentStatusScope = scope
	}
	return f.currentStatuses, f.currentStatusesErr
}

func (f fakeStore) UpdateCurrentStatusFreshness(_ context.Context, clinicID string, freshness string, updatedAt time.Time, audit *store.CreateAuditEventInput) (store.CurrentStatus, bool, error) {
	if f.updateFreshnessCalled != nil {
		*f.updateFreshnessCalled = true
	}
	if f.updateFreshnessInput != nil && audit != nil {
		*f.updateFreshnessInput = *audit
	}
	return store.CurrentStatus{ClinicID: clinicID, Freshness: freshness, UpdatedAt: updatedAt}, true, f.updateFreshnessErr
}

func (f fakeStore) CreateReportTx(_ context.Context, input store.CreateReportInput) (store.Report, store.CurrentStatus, store.AuditEvent, error) {
	if f.createCalls != nil {
		*f.createCalls++
	}
	if f.createInput != nil {
		*f.createInput = input
	}
	return f.createReport, f.createStatus, f.createAuditEvent, f.createErr
}

func (f fakeStore) CreatePendingReportTx(_ context.Context, input store.CreateReportInput) (store.Report, error) {
	if f.createCalls != nil {
		*f.createCalls++
	}
	if f.createInput != nil {
		*f.createInput = input
	}
	return f.createReport, f.createErr
}

func (f fakeStore) GetReportByExternalID(context.Context, string) (store.Report, error) {
	return f.externalReport, f.externalReportErr
}

func (f fakeStore) GetPendingReportByPayload(context.Context, store.CreateReportInput) (store.Report, error) {
	if f.pendingPayloadErr != nil {
		return store.Report{}, f.pendingPayloadErr
	}
	if f.pendingPayloadReport.ID == 0 {
		return store.Report{}, pgx.ErrNoRows
	}
	return f.pendingPayloadReport, nil
}

func (f fakeStore) CreateReportSyncAttempt(_ context.Context, input store.CreateReportSyncAttemptInput) (store.ReportSyncAttempt, error) {
	if f.syncAttemptInput != nil {
		*f.syncAttemptInput = input
	}
	if f.syncAttemptInputs != nil {
		*f.syncAttemptInputs = append(*f.syncAttemptInputs, input)
	}
	return f.syncAttempt, f.syncAttemptErr
}

func (f fakeStore) GetSyncSummarySince(_ context.Context, since time.Time) (store.SyncSummary, error) {
	if f.summarySince != nil {
		*f.summarySince = since
	}
	if f.syncSummary != nil {
		summary := *f.syncSummary
		summary.WindowStartedAt = since
		return summary, f.syncSummaryErr
	}
	return store.SyncSummary{WindowStartedAt: since}, f.syncSummaryErr
}

func (f fakeStore) GetSyncSummarySinceForReviewScope(_ context.Context, since time.Time, scope store.ReportReviewScope) (store.SyncSummary, error) {
	if f.summarySince != nil {
		*f.summarySince = since
	}
	if f.syncSummaryScope != nil {
		*f.syncSummaryScope = scope
	}
	if f.syncSummary != nil {
		summary := *f.syncSummary
		summary.WindowStartedAt = since
		return summary, f.syncSummaryErr
	}
	return store.SyncSummary{WindowStartedAt: since}, f.syncSummaryErr
}

func (f fakeStore) ReviewReportTx(_ context.Context, input store.ReviewReportInput) (store.Report, *store.CurrentStatus, error) {
	if f.reviewInput != nil {
		*f.reviewInput = input
	}
	return f.reviewReport, f.reviewStatus, f.reviewErr
}

func (f fakeStore) GetUserByEmail(_ context.Context, email string) (store.User, error) {
	if f.getUserEmail != nil {
		*f.getUserEmail = email
	}
	return f.user, f.getUserErr
}

func (f fakeStore) CreateSession(_ context.Context, input store.CreateSessionInput) (store.Session, error) {
	if f.createSessionCalls != nil {
		*f.createSessionCalls++
	}
	if f.createSessionInput != nil {
		*f.createSessionInput = input
	}
	session := f.createSession
	session.UserID = input.UserID
	session.TokenHash = input.TokenHash
	session.ExpiresAt = input.ExpiresAt
	session.UserAgent = input.UserAgent
	session.IPAddress = input.IPAddress
	return session, f.createSessionErr
}

func (f fakeStore) CreateSessionWithAuditTx(_ context.Context, input store.CreateSessionWithAuditInput) (store.Session, store.AuditEvent, error) {
	if f.createSessionWithAuditCalls != nil {
		*f.createSessionWithAuditCalls++
	}
	if f.createSessionInput != nil {
		*f.createSessionInput = input.Session
	}
	session := f.createSession
	session.UserID = input.Session.UserID
	session.TokenHash = input.Session.TokenHash
	session.ExpiresAt = input.Session.ExpiresAt
	session.UserAgent = input.Session.UserAgent
	session.IPAddress = input.Session.IPAddress
	auditInput := input.AuditEvent
	entityType := "session"
	auditInput.EntityType = &entityType
	entityID := strconv.FormatInt(session.ID, 10)
	auditInput.EntityID = &entityID
	if auditInput.Metadata == nil {
		auditInput.Metadata = map[string]any{}
	}
	auditInput.Metadata["sessionId"] = session.ID
	if f.sessionAuditInput != nil {
		*f.sessionAuditInput = store.CreateSessionWithAuditInput{
			Session:    input.Session,
			AuditEvent: auditInput,
		}
	}
	if f.auditCalls != nil {
		*f.auditCalls++
	}
	if f.auditInput != nil {
		*f.auditInput = auditInput
	}
	return session, f.createSessionAudit, f.createSessionWithAuditErr
}

func (f fakeStore) CreateAuditEvent(_ context.Context, input store.CreateAuditEventInput) (store.AuditEvent, error) {
	if f.auditCalls != nil {
		*f.auditCalls++
	}
	if f.auditInput != nil {
		*f.auditInput = input
	}
	return f.createAuditEvent, f.auditErr
}

func (f fakeStore) GetSessionByTokenHash(_ context.Context, tokenHash string) (store.Session, store.User, error) {
	if f.getSessionCalls != nil {
		*f.getSessionCalls++
	}
	if f.getSessionTokenHash != nil {
		*f.getSessionTokenHash = tokenHash
	}
	return f.session, f.sessionUser, f.getSessionErr
}

func (f fakeStore) RevokeSession(_ context.Context, tokenHash string) error {
	if f.revokeCalls != nil {
		*f.revokeCalls++
	}
	if f.revokedTokenHash != nil {
		*f.revokedTokenHash = tokenHash
	}
	return f.revokeErr
}

func (f fakeStore) ListMembershipsForUser(context.Context, int64) ([]store.OrganisationMembership, error) {
	return f.memberships, f.membershipsErr
}

func (f fakeStore) GetPartnerAPIKeyByHash(_ context.Context, keyHash string) (store.PartnerAPIKey, error) {
	if f.partnerKeyErr != nil {
		return store.PartnerAPIKey{}, f.partnerKeyErr
	}
	if f.partnerAPIKey.ID == 0 {
		return store.PartnerAPIKey{}, pgx.ErrNoRows
	}
	if f.partnerAPIKey.KeyHash != keyHash {
		return store.PartnerAPIKey{}, pgx.ErrNoRows
	}
	return f.partnerAPIKey, nil
}

func (f fakeStore) CreatePartnerAPIKey(_ context.Context, input store.CreatePartnerAPIKeyInput) (store.PartnerAPIKey, error) {
	if f.createPartnerAPIKeyCalls != nil {
		*f.createPartnerAPIKeyCalls++
	}
	if f.createPartnerAPIKeyInput != nil {
		*f.createPartnerAPIKeyInput = input
	}
	if f.createPartnerAPIKeyErr != nil {
		return store.PartnerAPIKey{}, f.createPartnerAPIKeyErr
	}
	apiKey := store.PartnerAPIKey{
		ID:               1,
		OrganisationID:   input.OrganisationID,
		Name:             input.Name,
		Environment:      input.Environment,
		KeyPrefix:        input.KeyPrefix,
		KeyHash:          input.KeyHash,
		Scopes:           input.Scopes,
		AllowedDistricts: input.AllowedDistricts,
		ExpiresAt:        input.ExpiresAt,
		CreatedByUserID:  input.CreatedByUserID,
		CreatedAt:        input.CreatedAt,
		UpdatedAt:        input.CreatedAt,
	}
	if f.partnerAPIKeys != nil {
		apiKey.ID = int64(len(*f.partnerAPIKeys) + 1)
		*f.partnerAPIKeys = append(*f.partnerAPIKeys, apiKey)
	}
	return apiKey, nil
}

func (f fakeStore) ListPartnerAPIKeys(_ context.Context, organisationID *int64) ([]store.PartnerAPIKey, error) {
	if f.listPartnerAPIKeysOrgID != nil && organisationID != nil {
		*f.listPartnerAPIKeysOrgID = *organisationID
	}
	if f.listPartnerAPIKeysErr != nil {
		return nil, f.listPartnerAPIKeysErr
	}
	if f.partnerAPIKeys != nil {
		return *f.partnerAPIKeys, nil
	}
	return nil, nil
}

func (f fakeStore) RevokePartnerAPIKey(_ context.Context, keyID int64, revokedAt time.Time) error {
	if f.revokePartnerAPIKeyCalls != nil {
		*f.revokePartnerAPIKeyCalls++
	}
	if f.revokedPartnerAPIKeyID != nil {
		*f.revokedPartnerAPIKeyID = keyID
	}
	if f.revokePartnerAPIKeyErr != nil {
		return f.revokePartnerAPIKeyErr
	}
	if f.partnerAPIKeys != nil {
		for index := range *f.partnerAPIKeys {
			if (*f.partnerAPIKeys)[index].ID == keyID {
				(*f.partnerAPIKeys)[index].RevokedAt = &revokedAt
				(*f.partnerAPIKeys)[index].UpdatedAt = revokedAt
				return nil
			}
		}
		return pgx.ErrNoRows
	}
	return nil
}

func (f fakeStore) TouchPartnerAPIKey(context.Context, int64, string, time.Time) error {
	if f.partnerTouchCalls != nil {
		*f.partnerTouchCalls++
	}
	return f.partnerTouchErr
}

func (f fakeStore) GetPartnerReadinessSnapshot(_ context.Context, organisationID *int64) (store.PartnerReadinessSnapshot, error) {
	if f.partnerReadinessOrgID != nil && organisationID != nil {
		*f.partnerReadinessOrgID = *organisationID
	}
	snapshot := f.partnerReadinessSnapshot
	if f.upsertIntegrationStatusChecks != nil {
		snapshot.IntegrationChecks = *f.upsertIntegrationStatusChecks
	}
	return snapshot, f.partnerReadinessErr
}

func (f fakeStore) CreatePartnerWebhookSubscription(_ context.Context, input store.CreatePartnerWebhookSubscriptionInput) (store.PartnerWebhookSubscription, error) {
	if f.createPartnerWebhookSubscriptionInput != nil {
		*f.createPartnerWebhookSubscriptionInput = input
	}
	if f.createPartnerWebhookSubscriptionErr != nil {
		return store.PartnerWebhookSubscription{}, f.createPartnerWebhookSubscriptionErr
	}
	subscription := store.PartnerWebhookSubscription{
		ID:               1,
		OrganisationID:   input.OrganisationID,
		Name:             input.Name,
		TargetURL:        input.TargetURL,
		EventTypes:       input.EventTypes,
		SecretHash:       input.SecretHash,
		Status:           input.Status,
		LastTestMetadata: input.LastTestMetadata,
		CreatedByUserID:  input.CreatedByUserID,
		CreatedAt:        input.CreatedAt,
		UpdatedAt:        input.CreatedAt,
	}
	if f.partnerWebhookSubscriptions != nil {
		subscription.ID = int64(len(*f.partnerWebhookSubscriptions) + 1)
		*f.partnerWebhookSubscriptions = append(*f.partnerWebhookSubscriptions, subscription)
	}
	return subscription, nil
}

func (f fakeStore) ListPartnerWebhookSubscriptions(_ context.Context, organisationID *int64) ([]store.PartnerWebhookSubscription, error) {
	if f.listPartnerWebhookSubscriptionsOrgID != nil && organisationID != nil {
		*f.listPartnerWebhookSubscriptionsOrgID = *organisationID
	}
	if f.listPartnerWebhookSubscriptionsErr != nil {
		return nil, f.listPartnerWebhookSubscriptionsErr
	}
	if f.partnerWebhookSubscriptions != nil {
		return *f.partnerWebhookSubscriptions, nil
	}
	return nil, nil
}

func (f fakeStore) CreatePartnerWebhookEvent(_ context.Context, input store.CreatePartnerWebhookEventInput) (store.PartnerWebhookEvent, error) {
	if f.createPartnerWebhookEventCalls != nil {
		*f.createPartnerWebhookEventCalls++
	}
	if f.createPartnerWebhookEventInput != nil {
		*f.createPartnerWebhookEventInput = input
	}
	if f.createPartnerWebhookEventErr != nil {
		return store.PartnerWebhookEvent{}, f.createPartnerWebhookEventErr
	}
	event := store.PartnerWebhookEvent{
		ID:             1,
		SubscriptionID: input.SubscriptionID,
		EventType:      input.EventType,
		Payload:        input.Payload,
		Metadata:       input.Metadata,
		Status:         input.Status,
		AttemptCount:   input.AttemptCount,
		LastError:      input.LastError,
		CreatedAt:      input.CreatedAt,
		DeliveredAt:    input.DeliveredAt,
	}
	if f.partnerWebhookEvents != nil {
		event.ID = int64(len(*f.partnerWebhookEvents) + 1)
		*f.partnerWebhookEvents = append(*f.partnerWebhookEvents, event)
	}
	return event, nil
}

func (f fakeStore) ListPartnerWebhookEvents(_ context.Context, organisationID *int64) ([]store.PartnerWebhookEvent, error) {
	if f.listPartnerWebhookEventsOrgID != nil && organisationID != nil {
		*f.listPartnerWebhookEventsOrgID = *organisationID
	}
	if f.listPartnerWebhookEventsErr != nil {
		return nil, f.listPartnerWebhookEventsErr
	}
	if f.partnerWebhookEvents != nil {
		return *f.partnerWebhookEvents, nil
	}
	return nil, nil
}

func (f fakeStore) CreatePartnerExportRun(_ context.Context, input store.CreatePartnerExportRunInput) (store.PartnerExportRun, error) {
	if f.createPartnerExportRunInput != nil {
		*f.createPartnerExportRunInput = input
	}
	if f.createPartnerExportRunErr != nil {
		return store.PartnerExportRun{}, f.createPartnerExportRunErr
	}
	exportRun := store.PartnerExportRun{
		ID:                1,
		OrganisationID:    input.OrganisationID,
		RequestedByUserID: input.RequestedByUserID,
		Format:            input.Format,
		Scope:             input.Scope,
		RecordCounts:      input.RecordCounts,
		Checksum:          input.Checksum,
		Payload:           input.Payload,
		CreatedAt:         input.CreatedAt,
	}
	if f.partnerExportRuns != nil {
		exportRun.ID = int64(len(*f.partnerExportRuns) + 1)
		*f.partnerExportRuns = append(*f.partnerExportRuns, exportRun)
	}
	return exportRun, nil
}

func (f fakeStore) GetPartnerExportRunForOrganisation(_ context.Context, organisationID *int64, exportID int64) (store.PartnerExportRun, error) {
	if f.getPartnerExportRunOrgID != nil && organisationID != nil {
		*f.getPartnerExportRunOrgID = *organisationID
	}
	if f.getPartnerExportRunID != nil {
		*f.getPartnerExportRunID = exportID
	}
	if f.getPartnerExportRunErr != nil {
		return store.PartnerExportRun{}, f.getPartnerExportRunErr
	}
	if f.partnerExportRuns != nil {
		for _, exportRun := range *f.partnerExportRuns {
			if exportRun.ID != exportID {
				continue
			}
			if organisationID != nil && (exportRun.OrganisationID == nil || *exportRun.OrganisationID != *organisationID) {
				return store.PartnerExportRun{}, pgx.ErrNoRows
			}
			return exportRun, nil
		}
		return store.PartnerExportRun{}, pgx.ErrNoRows
	}
	if f.partnerExportRun.ID != 0 {
		return f.partnerExportRun, nil
	}
	return store.PartnerExportRun{}, pgx.ErrNoRows
}

func (f fakeStore) GetLatestPartnerExportRun(context.Context, *int64) (store.PartnerExportRun, error) {
	return f.partnerExportRun, f.partnerExportRunErr
}

func (f fakeStore) UpsertIntegrationStatusCheck(_ context.Context, input store.UpsertIntegrationStatusCheckInput) (store.IntegrationStatusCheck, error) {
	if f.upsertIntegrationStatusCheckInputs != nil {
		*f.upsertIntegrationStatusCheckInputs = append(*f.upsertIntegrationStatusCheckInputs, input)
	}
	if f.upsertIntegrationStatusCheckErr != nil {
		return store.IntegrationStatusCheck{}, f.upsertIntegrationStatusCheckErr
	}
	check := store.IntegrationStatusCheck{
		ID:             int64(len(f.integrationStatusChecks) + 1),
		OrganisationID: input.OrganisationID,
		CheckName:      input.CheckName,
		Status:         input.Status,
		Summary:        input.Summary,
		Metadata:       input.Metadata,
		CheckedAt:      input.CheckedAt,
	}
	if f.upsertIntegrationStatusChecks != nil {
		check.ID = int64(len(*f.upsertIntegrationStatusChecks) + 1)
		*f.upsertIntegrationStatusChecks = append(*f.upsertIntegrationStatusChecks, check)
	}
	return check, nil
}

func (f fakeStore) ListIntegrationStatusChecks(context.Context, *int64) ([]store.IntegrationStatusCheck, error) {
	if f.upsertIntegrationStatusChecks != nil {
		return *f.upsertIntegrationStatusChecks, f.integrationStatusChecksErr
	}
	return f.integrationStatusChecks, f.integrationStatusChecksErr
}

func validReportJSON() string {
	return `{
		"clinicId":"clinic-1",
		"status":"operational",
		"staffPressure":"normal",
		"stockPressure":"normal",
		"queuePressure":"low",
		"reason":"Daily facility check",
		"source":"field_worker"
	}`
}

func validOfflineSyncJSON() string {
	return `{
		"items": [{
			"clientReportId": "offline-report-1",
			"clinicId": "clinic-1",
			"status": "degraded",
			"reason": "Queued while offline.",
			"staffPressure": "strained",
			"stockPressure": "low",
			"queuePressure": "high",
			"notes": "Pharmacy queue overflow.",
			"submittedAt": "2026-05-03T08:30:00Z",
			"queuedAt": "2026-05-03T08:30:03Z",
			"attemptCount": 2
		}]
	}`
}

func decodeJSON(t *testing.T, rec *httptest.ResponseRecorder, target any) {
	t.Helper()
	if err := json.Unmarshal(rec.Body.Bytes(), target); err != nil {
		t.Fatalf("failed to decode response %q: %v", rec.Body.String(), err)
	}
}

func captureDefaultLogger(t *testing.T) *bytes.Buffer {
	t.Helper()
	var output bytes.Buffer
	logger := log.Default()
	previousWriter := logger.Writer()
	previousFlags := logger.Flags()
	previousPrefix := logger.Prefix()
	logger.SetOutput(&output)
	logger.SetFlags(0)
	logger.SetPrefix("")
	t.Cleanup(func() {
		logger.SetOutput(previousWriter)
		logger.SetFlags(previousFlags)
		logger.SetPrefix(previousPrefix)
	})
	return &output
}

func isSafeRequestIDForTest(value string) bool {
	if len(value) < 8 || len(value) > 128 {
		return false
	}
	for _, char := range value {
		if char >= 'a' && char <= 'z' {
			continue
		}
		if char >= 'A' && char <= 'Z' {
			continue
		}
		if char >= '0' && char <= '9' {
			continue
		}
		if char == '.' || char == '_' || char == '-' {
			continue
		}
		return false
	}
	return true
}

func assertInternalError(t *testing.T, rec *httptest.ResponseRecorder, storeErr error) {
	t.Helper()
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusInternalServerError, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"internal_error"`) {
		t.Fatalf("expected internal_error code, got %q", rec.Body.String())
	}
	if strings.Contains(rec.Body.String(), storeErr.Error()) {
		t.Fatalf("expected response not to leak store error, got %q", rec.Body.String())
	}
}

func assertGenericUnauthorized(t *testing.T, rec *httptest.ResponseRecorder) {
	t.Helper()
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusUnauthorized, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"unauthorized"`) {
		t.Fatalf("expected unauthorized code, got %q", rec.Body.String())
	}
	for _, leaked := range []string{"disabled", "password", "missing", "hash", "malformed"} {
		if strings.Contains(strings.ToLower(rec.Body.String()), leaked) {
			t.Fatalf("expected generic unauthorized response, got %q", rec.Body.String())
		}
	}
}

func assertPublicSafeResponse(t *testing.T, body string) {
	t.Helper()

	var payload any
	if err := json.Unmarshal([]byte(body), &payload); err != nil {
		t.Fatalf("failed to decode public response %q: %v", body, err)
	}
	forbiddenKeys := map[string]struct{}{
		"reporterName": {},
		"source":       {},
		"auditEvent":   {},
		"auditEvents":  {},
		"reviewState":  {},
		"notes":        {},
	}
	assertNoForbiddenJSONKeys(t, payload, forbiddenKeys)
}

func assertPartnerSafeReadinessResponse(t *testing.T, body string) {
	t.Helper()

	var payload any
	if err := json.Unmarshal([]byte(body), &payload); err != nil {
		t.Fatalf("failed to decode partner response %q: %v", body, err)
	}
	forbiddenKeys := map[string]struct{}{
		"requestedByUserId": {},
		"payload":           {},
		"metadata":          {},
		"submittedByUserId": {},
		"reviewedByUserId":  {},
	}
	assertNoForbiddenJSONKeys(t, payload, forbiddenKeys)
}

func assertNoForbiddenJSONKeys(t *testing.T, value any, forbiddenKeys map[string]struct{}) {
	t.Helper()
	switch typed := value.(type) {
	case map[string]any:
		for key, child := range typed {
			if _, forbidden := forbiddenKeys[key]; forbidden {
				t.Fatalf("expected public response not to contain JSON key %q", key)
			}
			assertNoForbiddenJSONKeys(t, child, forbiddenKeys)
		}
	case []any:
		for _, child := range typed {
			assertNoForbiddenJSONKeys(t, child, forbiddenKeys)
		}
	}
}

func assertSessionCookieCleared(t *testing.T, rec *httptest.ResponseRecorder) {
	t.Helper()
	cookie := findCookie(rec, "clinicpulse_session")
	if cookie == nil {
		t.Fatalf("expected clinicpulse_session clear cookie, got %v", rec.Result().Cookies())
	}
	if cookie.Value != "" {
		t.Fatalf("expected cleared cookie value, got %q", cookie.Value)
	}
	if cookie.Path != "/" {
		t.Fatalf("expected cleared cookie path /, got %q", cookie.Path)
	}
	if cookie.MaxAge >= 0 {
		t.Fatalf("expected MaxAge < 0, got %d", cookie.MaxAge)
	}
	if time.Until(cookie.Expires) >= 0 {
		t.Fatalf("expected expired cookie date, got %s", cookie.Expires)
	}
}

func findCookie(rec *httptest.ResponseRecorder, name string) *http.Cookie {
	for _, cookie := range rec.Result().Cookies() {
		if cookie.Name == name {
			return cookie
		}
	}
	return nil
}

func successfulLoginStore(t *testing.T) fakeStore {
	t.Helper()
	passwordHash := hashPasswordForTest(t, "correct-password")
	now := time.Date(2026, 5, 3, 8, 0, 0, 0, time.UTC)
	return fakeStore{
		user: store.User{
			ID:           42,
			Email:        "manager@example.test",
			DisplayName:  "Clinic Manager",
			PasswordHash: &passwordHash,
			CreatedAt:    now,
			UpdatedAt:    now,
		},
		createSession: store.Session{
			ID:        100,
			UserID:    42,
			CreatedAt: now,
			ExpiresAt: now.Add(12 * time.Hour),
		},
		memberships: []store.OrganisationMembership{
			{ID: 7, UserID: 42, Role: "district_manager", CreatedAt: now},
		},
	}
}

func hashPasswordForTest(t *testing.T, plaintext string) string {
	t.Helper()
	hash, err := auth.HashPassword(plaintext)
	if err != nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}
	return hash
}

func sessionTokenForTest(t *testing.T) string {
	t.Helper()
	token, err := auth.GenerateSessionToken()
	if err != nil {
		t.Fatalf("GenerateSessionToken returned error: %v", err)
	}
	return token
}

func hashSessionTokenForTest(t *testing.T, token string) string {
	t.Helper()
	hash, err := auth.HashSessionToken(token)
	if err != nil {
		t.Fatalf("HashSessionToken returned error: %v", err)
	}
	return hash
}

func authenticatedStore(t *testing.T, role string, f fakeStore) fakeStore {
	t.Helper()
	now := time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC)
	if f.session.ID == 0 {
		f.session = store.Session{
			ID:        100,
			UserID:    42,
			CreatedAt: now,
			ExpiresAt: now.Add(12 * time.Hour),
		}
	}
	if f.sessionUser.ID == 0 {
		f.sessionUser = store.User{
			ID:          f.session.UserID,
			Email:       "auth-user@example.test",
			DisplayName: "Authenticated User",
			CreatedAt:   now,
			UpdatedAt:   now,
		}
	}
	if f.memberships == nil {
		var district *string
		if role == "district_manager" {
			district = stringPtr(defaultTestDistrict)
		}
		f.memberships = []store.OrganisationMembership{{
			ID:        1,
			UserID:    f.sessionUser.ID,
			Role:      role,
			District:  district,
			CreatedAt: now,
		}}
	}
	return f
}

func authenticatedAdminStore(t *testing.T, role string, orgID int64, f fakeStore) fakeStore {
	t.Helper()
	now := time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC)
	if f.session.ID == 0 {
		f.session = store.Session{
			ID:        100,
			UserID:    42,
			CreatedAt: now,
			ExpiresAt: now.Add(12 * time.Hour),
		}
	}
	if f.sessionUser.ID == 0 {
		f.sessionUser = store.User{
			ID:          f.session.UserID,
			Email:       "admin@example.test",
			DisplayName: "Admin User",
			CreatedAt:   now,
			UpdatedAt:   now,
		}
	}
	f.memberships = []store.OrganisationMembership{{
		ID:             1,
		UserID:         f.sessionUser.ID,
		OrganisationID: &orgID,
		Role:           role,
		CreatedAt:      now,
	}}
	return f
}

func newAuthenticatedTestRouter(t *testing.T, f fakeStore) http.Handler {
	t.Helper()
	return apihttp.NewRouter(authenticatedStore(t, "district_manager", f))
}

func newAuthenticatedRequest(t *testing.T, method string, target string, body io.Reader) *http.Request {
	t.Helper()
	req := httptest.NewRequest(method, target, body)
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: sessionTokenForTest(t)})
	return req
}

func clinicDetail(id, name string, latitude, longitude float64, status, freshness string, services ...string) store.ClinicDetail {
	detail := store.ClinicDetail{
		Clinic: store.Clinic{
			ID:                 id,
			Name:               name,
			District:           defaultTestDistrict,
			Latitude:           &latitude,
			Longitude:          &longitude,
			FacilityType:       "clinic",
			VerificationStatus: "verified",
		},
		CurrentStatus: &store.CurrentStatus{
			ClinicID:  id,
			Status:    status,
			Freshness: freshness,
		},
	}

	for _, serviceName := range services {
		detail.Services = append(detail.Services, store.ClinicService{
			ClinicID:            id,
			ServiceName:         serviceName,
			CurrentAvailability: "available",
		})
	}

	return detail
}

func clinicDetailInDistrict(id string, district string) store.ClinicDetail {
	return store.ClinicDetail{
		Clinic: store.Clinic{
			ID:                 id,
			District:           district,
			FacilityType:       "clinic",
			VerificationStatus: "verified",
		},
	}
}
