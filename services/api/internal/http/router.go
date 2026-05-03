package http

import (
	nethttp "net/http"

	"github.com/go-chi/chi/v5"
)

func NewRouter(store ClinicStore) nethttp.Handler {
	router := chi.NewRouter()
	handler := NewHandler(store)

	router.Get("/healthz", Healthz)
	router.Get("/v1/alternatives", handler.ListAlternatives)
	router.Get("/v1/clinics", handler.ListClinics)
	router.Get("/v1/clinics/{clinicId}", handler.GetClinic)
	router.Get("/v1/clinics/{clinicId}/status", handler.GetClinicStatus)
	router.Get("/v1/clinics/{clinicId}/reports", handler.ListClinicReports)
	router.Get("/v1/clinics/{clinicId}/audit-events", handler.ListClinicAuditEvents)
	router.Post("/v1/reports", handler.CreateReport)

	return router
}
