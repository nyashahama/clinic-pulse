package http

import (
	nethttp "net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"clinicpulse/services/api/internal/service"
	"clinicpulse/services/api/internal/store"
)

type publicClinicDetailResponse struct {
	Clinic        store.Clinic                 `json:"clinic"`
	Services      []store.ClinicService        `json:"services"`
	CurrentStatus *publicCurrentStatusResponse `json:"currentStatus,omitempty"`
}

type publicCurrentStatusResponse struct {
	ClinicID        string     `json:"clinicId"`
	Status          string     `json:"status"`
	Reason          *string    `json:"reason,omitempty"`
	Freshness       string     `json:"freshness"`
	LastReportedAt  *time.Time `json:"lastReportedAt,omitempty"`
	StaffPressure   *string    `json:"staffPressure,omitempty"`
	StockPressure   *string    `json:"stockPressure,omitempty"`
	QueuePressure   *string    `json:"queuePressure,omitempty"`
	ConfidenceScore *float64   `json:"confidenceScore,omitempty"`
	UpdatedAt       time.Time  `json:"updatedAt"`
}

type publicAlternativeResponse struct {
	Clinic         publicClinicDetailResponse `json:"clinic"`
	DistanceKm     *float64                   `json:"distanceKm"`
	ReasonCode     string                     `json:"reasonCode"`
	RankReason     string                     `json:"rankReason"`
	MatchedService string                     `json:"matchedService"`
}

func (h Handler) ListPublicClinics(w nethttp.ResponseWriter, r *nethttp.Request) {
	clinics, err := h.store.ListClinics(r.Context())
	if err != nil {
		respondStoreError(w, err, "failed to list clinics")
		return
	}
	if clinics == nil {
		clinics = []store.ClinicDetail{}
	}

	RespondJSON(w, nethttp.StatusOK, publicClinicDetails(clinics))
}

func (h Handler) GetPublicClinic(w nethttp.ResponseWriter, r *nethttp.Request) {
	clinic, err := h.store.GetClinic(r.Context(), chi.URLParam(r, "clinicId"))
	if err != nil {
		respondStoreError(w, err, "clinic not found")
		return
	}

	RespondJSON(w, nethttp.StatusOK, publicClinicDetail(clinic))
}

func (h Handler) ListPublicAlternatives(w nethttp.ResponseWriter, r *nethttp.Request) {
	clinicID := strings.TrimSpace(r.URL.Query().Get("clinicId"))
	serviceName := strings.TrimSpace(r.URL.Query().Get("service"))
	if clinicID == "" {
		RespondError(w, nethttp.StatusBadRequest, "validation_error", "validation failed", "clinicId: clinicId is required")
		return
	}
	if serviceName == "" {
		RespondError(w, nethttp.StatusBadRequest, "validation_error", "validation failed", "service: service is required")
		return
	}

	source, err := h.store.GetClinic(r.Context(), clinicID)
	if err != nil {
		respondStoreError(w, err, "clinic not found")
		return
	}

	candidates, err := h.store.ListClinics(r.Context())
	if err != nil {
		respondStoreError(w, err, "failed to list clinic alternatives")
		return
	}

	RespondJSON(w, nethttp.StatusOK, publicAlternatives(service.RankAlternatives(source, candidates, serviceName)))
}

func (h Handler) CreatePublicDemoLead(w nethttp.ResponseWriter, r *nethttp.Request) {
	var payload createDemoLeadRequest
	if !decodeDemoLeadJSON(w, r, &payload) {
		return
	}

	lead, err := h.store.CreateDemoLead(r.Context(), store.CreateDemoLeadInput{
		Name:         payload.Name,
		WorkEmail:    payload.WorkEmail,
		Organization: payload.Organization,
		Role:         payload.Role,
		Interest:     payload.Interest,
		Note:         payload.Note,
		Status:       "new",
		Source:       "public_booking",
		CreatedAt:    time.Now().UTC(),
	})
	if err != nil {
		respondDemoLeadMutationError(w, err, "failed to create demo lead")
		return
	}

	RespondJSON(w, nethttp.StatusCreated, lead)
}

func publicClinicDetails(clinics []store.ClinicDetail) []publicClinicDetailResponse {
	responses := make([]publicClinicDetailResponse, 0, len(clinics))
	for _, clinic := range clinics {
		responses = append(responses, publicClinicDetail(clinic))
	}
	return responses
}

func publicClinicDetail(clinic store.ClinicDetail) publicClinicDetailResponse {
	return publicClinicDetailResponse{
		Clinic:        clinic.Clinic,
		Services:      clinic.Services,
		CurrentStatus: publicCurrentStatus(clinic.CurrentStatus),
	}
}

func publicCurrentStatus(status *store.CurrentStatus) *publicCurrentStatusResponse {
	if status == nil {
		return nil
	}

	return &publicCurrentStatusResponse{
		ClinicID:        status.ClinicID,
		Status:          status.Status,
		Reason:          status.Reason,
		Freshness:       status.Freshness,
		LastReportedAt:  status.LastReportedAt,
		StaffPressure:   status.StaffPressure,
		StockPressure:   status.StockPressure,
		QueuePressure:   status.QueuePressure,
		ConfidenceScore: status.ConfidenceScore,
		UpdatedAt:       status.UpdatedAt,
	}
}

func publicAlternatives(alternatives []service.Alternative) []publicAlternativeResponse {
	responses := make([]publicAlternativeResponse, 0, len(alternatives))
	for _, alternative := range alternatives {
		responses = append(responses, publicAlternativeResponse{
			Clinic:         publicClinicDetail(alternative.Clinic),
			DistanceKm:     alternative.DistanceKm,
			ReasonCode:     alternative.ReasonCode,
			RankReason:     alternative.RankReason,
			MatchedService: alternative.MatchedService,
		})
	}
	return responses
}
