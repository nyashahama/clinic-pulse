package http

import (
	"encoding/json"
	nethttp "net/http"
	"regexp"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"clinicpulse/services/api/internal/service"
	"clinicpulse/services/api/internal/store"
)

var (
	emailRegex = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)
	dateRegex  = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)
	timeRegex  = regexp.MustCompile(`^([01]\d|2[0-3]):[0-5]\d$`)
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

type walkthroughRequestPayload struct {
	Name            string `json:"name"`
	WorkEmail       string `json:"work_email"`
	Organization    string `json:"organization"`
	Role            string `json:"role"`
	Interest        string `json:"interest"`
	Note            string `json:"note"`
	RequestedDate   string `json:"requested_date"`
	RequestedTime   string `json:"requested_time"`
	DurationMinutes int    `json:"duration_minutes"`
}

var walkthroughInterests = map[string]struct{}{
	"clinic_operator": {}, "government": {}, "ngo": {}, "investor": {}, "other": {},
}

func (h Handler) CreateWalkthroughRequest(w nethttp.ResponseWriter, r *nethttp.Request) {
	var payload walkthroughRequestPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		RespondError(w, nethttp.StatusBadRequest, "invalid_json", "invalid request body")
		return
	}

	var fields []string
	name := strings.TrimSpace(payload.Name)
	workEmail := strings.TrimSpace(payload.WorkEmail)
	organization := strings.TrimSpace(payload.Organization)
	role := strings.TrimSpace(payload.Role)
	note := strings.TrimSpace(payload.Note)
	interest := strings.TrimSpace(payload.Interest)
	requestedTime := strings.TrimSpace(payload.RequestedTime)

	if name == "" {
		fields = append(fields, "name")
	}
	if !emailRegex.MatchString(workEmail) {
		fields = append(fields, "work_email")
	}
	if organization == "" {
		fields = append(fields, "organization")
	}
	if role == "" {
		fields = append(fields, "role")
	}
	if _, ok := walkthroughInterests[interest]; !ok {
		fields = append(fields, "interest")
	}
	if !dateRegex.MatchString(strings.TrimSpace(payload.RequestedDate)) {
		fields = append(fields, "requested_date")
	}
	if !timeRegex.MatchString(requestedTime) {
		fields = append(fields, "requested_time")
	}
	if payload.DurationMinutes != 30 && payload.DurationMinutes != 45 {
		fields = append(fields, "duration_minutes")
	}

	if len(fields) > 0 {
		RespondError(w, nethttp.StatusBadRequest, "validation_error", "validation failed", fields...)
		return
	}

	requestedDate, err := time.Parse("2006-01-02", strings.TrimSpace(payload.RequestedDate))
	if err != nil {
		RespondError(w, nethttp.StatusBadRequest, "validation_error", "validation failed", "requested_date")
		return
	}
	if requestedDate.Before(time.Now().UTC().Truncate(24 * time.Hour)) {
		RespondError(w, nethttp.StatusBadRequest, "validation_error", "validation failed", "requested_date")
		return
	}

	created, err := h.store.CreateWalkthroughRequest(r.Context(), store.CreateWalkthroughRequestInput{
		Name:            name,
		WorkEmail:       workEmail,
		Organization:    organization,
		Role:            role,
		Interest:        interest,
		Note:            note,
		RequestedDate:   requestedDate,
		RequestedTime:   requestedTime,
		DurationMinutes: payload.DurationMinutes,
	})
	if err != nil {
		respondStoreError(w, err, "failed to create walkthrough request")
		return
	}

	RespondJSON(w, nethttp.StatusCreated, created)
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
