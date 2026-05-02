package http

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	nethttp "net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"

	"clinicpulse/services/api/internal/service"
	"clinicpulse/services/api/internal/store"
)

type ClinicStore interface {
	ListClinics(ctx context.Context) ([]store.ClinicDetail, error)
	GetClinic(ctx context.Context, clinicID string) (store.ClinicDetail, error)
	GetCurrentStatus(ctx context.Context, clinicID string) (store.CurrentStatus, error)
	ListClinicReports(ctx context.Context, clinicID string) ([]store.Report, error)
	ListClinicAuditEvents(ctx context.Context, clinicID string) ([]store.AuditEvent, error)
	CreateReportTx(ctx context.Context, input store.CreateReportInput) (store.Report, store.CurrentStatus, store.AuditEvent, error)
}

type Handler struct {
	store ClinicStore
}

func NewHandler(store ClinicStore) Handler {
	return Handler{store: store}
}

func Healthz(w nethttp.ResponseWriter, r *nethttp.Request) {
	RespondJSON(w, nethttp.StatusOK, map[string]string{
		"status":  "ok",
		"service": "clinicpulse-api",
	})
}

func (h Handler) ListClinics(w nethttp.ResponseWriter, r *nethttp.Request) {
	clinics, err := h.store.ListClinics(r.Context())
	if err != nil {
		respondStoreError(w, err, "failed to list clinics")
		return
	}
	if clinics == nil {
		clinics = []store.ClinicDetail{}
	}

	RespondJSON(w, nethttp.StatusOK, clinics)
}

func (h Handler) GetClinic(w nethttp.ResponseWriter, r *nethttp.Request) {
	clinic, err := h.store.GetClinic(r.Context(), chi.URLParam(r, "clinicId"))
	if err != nil {
		respondStoreError(w, err, "clinic not found")
		return
	}

	RespondJSON(w, nethttp.StatusOK, clinic)
}

func (h Handler) GetClinicStatus(w nethttp.ResponseWriter, r *nethttp.Request) {
	status, err := h.store.GetCurrentStatus(r.Context(), chi.URLParam(r, "clinicId"))
	if err != nil {
		respondStoreError(w, err, "clinic status not found")
		return
	}

	RespondJSON(w, nethttp.StatusOK, status)
}

func (h Handler) ListClinicReports(w nethttp.ResponseWriter, r *nethttp.Request) {
	clinicID := chi.URLParam(r, "clinicId")
	if _, err := h.store.GetClinic(r.Context(), clinicID); err != nil {
		respondStoreError(w, err, "clinic not found")
		return
	}

	reports, err := h.store.ListClinicReports(r.Context(), clinicID)
	if err != nil {
		respondStoreError(w, err, "failed to list clinic reports")
		return
	}
	if reports == nil {
		reports = []store.Report{}
	}

	RespondJSON(w, nethttp.StatusOK, reports)
}

func (h Handler) ListClinicAuditEvents(w nethttp.ResponseWriter, r *nethttp.Request) {
	clinicID := chi.URLParam(r, "clinicId")
	if _, err := h.store.GetClinic(r.Context(), clinicID); err != nil {
		respondStoreError(w, err, "clinic not found")
		return
	}

	events, err := h.store.ListClinicAuditEvents(r.Context(), clinicID)
	if err != nil {
		respondStoreError(w, err, "failed to list clinic audit events")
		return
	}
	if events == nil {
		events = []store.AuditEvent{}
	}

	RespondJSON(w, nethttp.StatusOK, events)
}

func (h Handler) CreateReport(w nethttp.ResponseWriter, r *nethttp.Request) {
	var payload createReportRequest
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&payload); err != nil {
		RespondError(w, nethttp.StatusBadRequest, "invalid_json", "invalid JSON request body")
		return
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		RespondError(w, nethttp.StatusBadRequest, "invalid_json", "invalid JSON request body")
		return
	}

	input := payload.toReportInput()
	report, status, event, err := service.CreateReport(r.Context(), h.store, input)
	if err != nil {
		var validationErr service.ValidationError
		if errors.As(err, &validationErr) {
			RespondError(w, nethttp.StatusBadRequest, "validation_error", "validation failed", validationErr.Fields...)
			return
		}
		respondStoreError(w, err, "clinic not found")
		return
	}

	RespondJSON(w, nethttp.StatusCreated, createReportResponse{
		Report:        report,
		CurrentStatus: status,
		AuditEvent:    event,
	})
}

func respondStoreError(w nethttp.ResponseWriter, err error, notFoundMessage string) {
	if errors.Is(err, pgx.ErrNoRows) {
		RespondError(w, nethttp.StatusNotFound, "not_found", notFoundMessage)
		return
	}

	RespondError(w, nethttp.StatusInternalServerError, "internal_error", "internal server error")
}

type createReportRequest struct {
	ExternalID      *string    `json:"externalId,omitempty"`
	ClinicID        string     `json:"clinicId"`
	Status          string     `json:"status"`
	StaffPressure   string     `json:"staffPressure"`
	StockPressure   string     `json:"stockPressure"`
	QueuePressure   string     `json:"queuePressure"`
	Reason          string     `json:"reason"`
	Source          string     `json:"source"`
	ReporterName    *string    `json:"reporterName,omitempty"`
	Confidence      *int       `json:"confidence,omitempty"`
	ConfidenceScore *float64   `json:"confidenceScore,omitempty"`
	OfflineCreated  bool       `json:"offlineCreated,omitempty"`
	SubmittedAt     *time.Time `json:"submittedAt,omitempty"`
	Notes           *string    `json:"notes,omitempty"`
}

func (p createReportRequest) toReportInput() service.ReportInput {
	storeInput := store.CreateReportInput{
		ExternalID:     p.ExternalID,
		ClinicID:       p.ClinicID,
		ReporterName:   p.ReporterName,
		Source:         p.Source,
		OfflineCreated: p.OfflineCreated,
		Status:         p.Status,
		Reason:         &p.Reason,
		StaffPressure:  &p.StaffPressure,
		StockPressure:  &p.StockPressure,
		QueuePressure:  &p.QueuePressure,
		Notes:          p.Notes,
	}
	if p.SubmittedAt != nil {
		storeInput.SubmittedAt = *p.SubmittedAt
	}

	return service.ReportInput{
		StoreInput:      storeInput,
		Confidence:      p.Confidence,
		ConfidenceScore: p.ConfidenceScore,
	}
}

type createReportResponse struct {
	Report        store.Report        `json:"report"`
	CurrentStatus store.CurrentStatus `json:"currentStatus"`
	AuditEvent    store.AuditEvent    `json:"auditEvent"`
}
