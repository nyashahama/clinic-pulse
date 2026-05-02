package http_test

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"

	apihttp "clinicpulse/services/api/internal/http"
	"clinicpulse/services/api/internal/store"
)

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

func TestListClinicsReturnsOK(t *testing.T) {
	updatedAt := time.Date(2026, 5, 1, 10, 0, 0, 0, time.UTC)
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
		}},
	})

	req := httptest.NewRequest(http.MethodGet, "/v1/clinics", nil)
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
	router := apihttp.NewRouter(fakeStore{})

	req := httptest.NewRequest(http.MethodGet, "/v1/clinics", nil)
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
	router := apihttp.NewRouter(fakeStore{listErr: storeErr})

	req := httptest.NewRequest(http.MethodGet, "/v1/clinics", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertInternalError(t, rec, storeErr)
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
			router := apihttp.NewRouter(tt.store)
			req := httptest.NewRequest(http.MethodGet, tt.path, nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			assertInternalError(t, rec, storeErr)
		})
	}
}

func TestGetClinicReturnsNotFoundForMissingClinic(t *testing.T) {
	router := apihttp.NewRouter(fakeStore{getClinicErr: pgx.ErrNoRows})

	req := httptest.NewRequest(http.MethodGet, "/v1/clinics/missing-clinic", nil)
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
	router := apihttp.NewRouter(fakeStore{
		status: store.CurrentStatus{
			ClinicID:  "clinic-1",
			Status:    "limited",
			Reason:    &reason,
			Freshness: "fresh",
			UpdatedAt: updatedAt,
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/v1/clinics/clinic-1/status", nil)
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
	router := apihttp.NewRouter(fakeStore{
		reports: []store.Report{
			{ID: 10, ClinicID: "clinic-1", Source: "ussd", SubmittedAt: firstSubmitted, ReceivedAt: firstSubmitted, Status: "open", ReviewState: "accepted"},
			{ID: 11, ClinicID: "clinic-1", Source: "web", SubmittedAt: secondSubmitted, ReceivedAt: secondSubmitted, Status: "limited", ReviewState: "accepted"},
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/v1/clinics/clinic-1/reports", nil)
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
	router := apihttp.NewRouter(fakeStore{getClinicErr: pgx.ErrNoRows})

	req := httptest.NewRequest(http.MethodGet, "/v1/clinics/unknown-clinic/reports", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNotFound, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"not_found"`) {
		t.Fatalf("expected not_found error code, got %q", rec.Body.String())
	}
}

func TestListClinicAuditEventsReturnsOrderedAuditEventJSON(t *testing.T) {
	firstCreated := time.Date(2026, 5, 1, 9, 30, 0, 0, time.UTC)
	secondCreated := time.Date(2026, 5, 1, 10, 30, 0, 0, time.UTC)
	router := apihttp.NewRouter(fakeStore{
		auditEvents: []store.AuditEvent{
			{ID: 20, ClinicID: "clinic-1", EventType: "report.submitted", Summary: "First report", CreatedAt: firstCreated},
			{ID: 21, ClinicID: "clinic-1", EventType: "status.changed", Summary: "Status changed", CreatedAt: secondCreated},
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/v1/clinics/clinic-1/audit-events", nil)
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
}

func TestListClinicAuditEventsReturnsNotFoundForUnknownClinic(t *testing.T) {
	router := apihttp.NewRouter(fakeStore{getClinicErr: pgx.ErrNoRows})

	req := httptest.NewRequest(http.MethodGet, "/v1/clinics/unknown-clinic/audit-events", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNotFound, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"not_found"`) {
		t.Fatalf("expected not_found error code, got %q", rec.Body.String())
	}
}

type fakeStore struct {
	clinics        []store.ClinicDetail
	clinic         store.ClinicDetail
	status         store.CurrentStatus
	reports        []store.Report
	auditEvents    []store.AuditEvent
	listErr        error
	getClinicErr   error
	statusErr      error
	reportsErr     error
	auditEventsErr error
}

func (f fakeStore) ListClinics(context.Context) ([]store.ClinicDetail, error) {
	return f.clinics, f.listErr
}

func (f fakeStore) GetClinic(context.Context, string) (store.ClinicDetail, error) {
	return f.clinic, f.getClinicErr
}

func (f fakeStore) GetCurrentStatus(context.Context, string) (store.CurrentStatus, error) {
	return f.status, f.statusErr
}

func (f fakeStore) ListClinicReports(context.Context, string) ([]store.Report, error) {
	return f.reports, f.reportsErr
}

func (f fakeStore) ListClinicAuditEvents(context.Context, string) ([]store.AuditEvent, error) {
	return f.auditEvents, f.auditEventsErr
}

func decodeJSON(t *testing.T, rec *httptest.ResponseRecorder, target any) {
	t.Helper()
	if err := json.Unmarshal(rec.Body.Bytes(), target); err != nil {
		t.Fatalf("failed to decode response %q: %v", rec.Body.String(), err)
	}
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
