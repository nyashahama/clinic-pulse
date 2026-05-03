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
			router := apihttp.NewRouter(fakeStore{})
			req := httptest.NewRequest(http.MethodGet, tt.path, nil)
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
	router := apihttp.NewRouter(fakeStore{getClinicErr: pgx.ErrNoRows})
	req := httptest.NewRequest(http.MethodGet, "/v1/alternatives?clinicId=unknown-clinic&service=Primary%20care", nil)
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
	router := apihttp.NewRouter(fakeStore{
		clinic: source,
		clinics: []store.ClinicDetail{
			source,
			clinicDetail("far-degraded", "Far Degraded Clinic", -25.7600, 28.1600, "degraded", "fresh", "Primary care"),
			clinicDetail("near-operational", "Near Operational Clinic", -25.7410, 28.1310, "operational", "fresh", "Primary care"),
			clinicDetail("wrong-service", "Wrong Service Clinic", -25.7405, 28.1305, "operational", "fresh", "Pharmacy"),
		},
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/alternatives?clinicId=clinic-mamelodi-east&service=Primary%20care", nil)
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
			router := apihttp.NewRouter(tt.store)
			req := httptest.NewRequest(http.MethodGet, "/v1/alternatives?clinicId=clinic-1&service=Primary%20care", nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			assertInternalError(t, rec, storeErr)
		})
	}
}

func TestCreateReportReturnsCreatedReportStatusAndAuditEvent(t *testing.T) {
	reason := "Generator failed"
	staffPressure := "strained"
	stockPressure := "low"
	queuePressure := "moderate"
	submittedAt := time.Date(2026, 5, 2, 9, 15, 0, 0, time.UTC)
	receivedAt := time.Date(2026, 5, 2, 9, 16, 0, 0, time.UTC)
	reporterName := "Amina Nkosi"
	notes := "Using backup generator"
	var createInput store.CreateReportInput
	router := apihttp.NewRouter(fakeStore{
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
			ReviewState:    "accepted",
			OfflineCreated: true,
		},
		createStatus: store.CurrentStatus{
			ClinicID:       "clinic-1",
			Status:         "degraded",
			Reason:         &reason,
			Freshness:      "fresh",
			LastReportedAt: &submittedAt,
			UpdatedAt:      receivedAt,
		},
		createAuditEvent: store.AuditEvent{
			ID:        200,
			ClinicID:  "clinic-1",
			EventType: "report.submitted",
			Summary:   "Report submitted with degraded status.",
			CreatedAt: receivedAt,
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
	req := httptest.NewRequest(http.MethodPost, "/v1/reports", strings.NewReader(body))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusCreated, rec.Code, rec.Body.String())
	}

	var got struct {
		Report        store.Report        `json:"report"`
		CurrentStatus store.CurrentStatus `json:"currentStatus"`
		AuditEvent    store.AuditEvent    `json:"auditEvent"`
	}
	decodeJSON(t, rec, &got)
	if got.Report.ID != 100 || got.CurrentStatus.ClinicID != "clinic-1" || got.AuditEvent.ID != 200 {
		t.Fatalf("unexpected create report response: %#v", got)
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

func TestCreateReportReturnsBadRequestForInvalidJSON(t *testing.T) {
	router := apihttp.NewRouter(fakeStore{})
	req := httptest.NewRequest(http.MethodPost, "/v1/reports", strings.NewReader(`{"clinicId":`))
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
			router := apihttp.NewRouter(fakeStore{createCalls: &createCalls})
			req := httptest.NewRequest(http.MethodPost, "/v1/reports", strings.NewReader(tt.body))
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
	router := apihttp.NewRouter(fakeStore{})
	req := httptest.NewRequest(http.MethodPost, "/v1/reports", strings.NewReader(`{
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
			router := apihttp.NewRouter(fakeStore{
				createCalls: &createCalls,
				createErr:   errors.New("store should not be called"),
			})
			req := httptest.NewRequest(http.MethodPost, "/v1/reports", strings.NewReader(tt.body))
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
	router := apihttp.NewRouter(fakeStore{createErr: pgx.ErrNoRows})
	req := httptest.NewRequest(http.MethodPost, "/v1/reports", strings.NewReader(validReportJSON()))
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
	router := apihttp.NewRouter(fakeStore{createErr: storeErr})
	req := httptest.NewRequest(http.MethodPost, "/v1/reports", strings.NewReader(validReportJSON()))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertInternalError(t, rec, storeErr)
}

type fakeStore struct {
	clinics          []store.ClinicDetail
	clinic           store.ClinicDetail
	status           store.CurrentStatus
	reports          []store.Report
	auditEvents      []store.AuditEvent
	createReport     store.Report
	createStatus     store.CurrentStatus
	createAuditEvent store.AuditEvent
	createInput      *store.CreateReportInput
	createCalls      *int
	listErr          error
	getClinicErr     error
	statusErr        error
	reportsErr       error
	auditEventsErr   error
	createErr        error
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

func (f fakeStore) CreateReportTx(_ context.Context, input store.CreateReportInput) (store.Report, store.CurrentStatus, store.AuditEvent, error) {
	if f.createCalls != nil {
		*f.createCalls++
	}
	if f.createInput != nil {
		*f.createInput = input
	}
	return f.createReport, f.createStatus, f.createAuditEvent, f.createErr
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

func clinicDetail(id, name string, latitude, longitude float64, status, freshness string, services ...string) store.ClinicDetail {
	detail := store.ClinicDetail{
		Clinic: store.Clinic{
			ID:                 id,
			Name:               name,
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
