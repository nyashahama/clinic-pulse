package http_test

import (
	"context"
	"encoding/json"
	"errors"
	"io"
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
	router := newAuthenticatedTestRouter(t, fakeStore{
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

func TestListClinicAuditEventsReturnsOrderedAuditEventJSON(t *testing.T) {
	firstCreated := time.Date(2026, 5, 1, 9, 30, 0, 0, time.UTC)
	secondCreated := time.Date(2026, 5, 1, 10, 30, 0, 0, time.UTC)
	router := newAuthenticatedTestRouter(t, fakeStore{
		auditEvents: []store.AuditEvent{
			{ID: 20, ClinicID: "clinic-1", EventType: "report.submitted", Summary: "First report", CreatedAt: firstCreated},
			{ID: 21, ClinicID: "clinic-1", EventType: "status.changed", Summary: "Status changed", CreatedAt: secondCreated},
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
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(body))
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
	clinics             []store.ClinicDetail
	clinic              store.ClinicDetail
	status              store.CurrentStatus
	reports             []store.Report
	auditEvents         []store.AuditEvent
	createReport        store.Report
	createStatus        store.CurrentStatus
	createAuditEvent    store.AuditEvent
	user                store.User
	createSession       store.Session
	session             store.Session
	sessionUser         store.User
	memberships         []store.OrganisationMembership
	createInput         *store.CreateReportInput
	getUserEmail        *string
	createSessionInput  *store.CreateSessionInput
	getSessionTokenHash *string
	revokedTokenHash    *string
	createCalls         *int
	createSessionCalls  *int
	getSessionCalls     *int
	revokeCalls         *int
	listErr             error
	getClinicErr        error
	statusErr           error
	reportsErr          error
	auditEventsErr      error
	createErr           error
	getUserErr          error
	createSessionErr    error
	getSessionErr       error
	revokeErr           error
	membershipsErr      error
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
		f.memberships = []store.OrganisationMembership{{
			ID:        1,
			UserID:    f.sessionUser.ID,
			Role:      role,
			CreatedAt: now,
		}}
	}
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
