package http

import (
	"context"
	"errors"
	nethttp "net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"

	"clinicpulse/services/api/internal/store"
)

type ClinicStore interface {
	ListClinics(ctx context.Context) ([]store.ClinicDetail, error)
	GetClinic(ctx context.Context, clinicID string) (store.ClinicDetail, error)
	GetCurrentStatus(ctx context.Context, clinicID string) (store.CurrentStatus, error)
	ListClinicReports(ctx context.Context, clinicID string) ([]store.Report, error)
	ListClinicAuditEvents(ctx context.Context, clinicID string) ([]store.AuditEvent, error)
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

func respondStoreError(w nethttp.ResponseWriter, err error, notFoundMessage string) {
	if errors.Is(err, pgx.ErrNoRows) {
		RespondError(w, nethttp.StatusNotFound, "not_found", notFoundMessage)
		return
	}

	RespondError(w, nethttp.StatusInternalServerError, "internal_error", "internal server error")
}
