package http

import (
	nethttp "net/http"

	"github.com/go-chi/chi/v5"
)

func NewRouter(store ClinicStore) nethttp.Handler {
	router := chi.NewRouter()
	handler := NewHandler(store)
	requireAuth := RequireAuth(store)
	reporterOrHigher := RequireRole("reporter", "district_manager", "org_admin", "system_admin")
	districtManagerOrHigher := RequireRole("district_manager", "org_admin", "system_admin")

	router.Get("/healthz", Healthz)
	router.Post("/v1/auth/login", handler.Login)
	router.Post("/v1/auth/logout", handler.Logout)
	router.With(requireAuth).Get("/v1/auth/me", handler.Me)
	router.Get("/v1/public/alternatives", handler.ListPublicAlternatives)
	router.Get("/v1/public/clinics", handler.ListPublicClinics)
	router.Get("/v1/public/clinics/{clinicId}", handler.GetPublicClinic)
	router.With(requireAuth).Get("/v1/alternatives", handler.ListAlternatives)
	router.With(requireAuth).Get("/v1/clinics", handler.ListClinics)
	router.With(requireAuth).Get("/v1/clinics/{clinicId}", handler.GetClinic)
	router.With(requireAuth).Get("/v1/clinics/{clinicId}/status", handler.GetClinicStatus)
	router.With(requireAuth, districtManagerOrHigher).Get("/v1/clinics/{clinicId}/reports", handler.ListClinicReports)
	router.With(requireAuth, districtManagerOrHigher).Get("/v1/clinics/{clinicId}/audit-events", handler.ListClinicAuditEvents)
	router.With(requireAuth, districtManagerOrHigher).Get("/v1/reports/pending", handler.ListPendingReports)
	router.With(requireAuth, reporterOrHigher).Post("/v1/reports", handler.CreateReport)
	router.With(requireAuth, districtManagerOrHigher).Post("/v1/reports/{reportId}/review", handler.ReviewReport)

	return router
}
