package http

import (
	nethttp "net/http"

	"github.com/go-chi/chi/v5"
)

type RouterConfig struct {
	APIKeyPepper           string
	WebhookDeliveryEnabled bool
}

type RouterOption func(*RouterConfig)

func WithAPIKeyPepper(value string) RouterOption {
	return func(config *RouterConfig) {
		config.APIKeyPepper = value
	}
}

func WithWebhookDeliveryEnabled(value bool) RouterOption {
	return func(config *RouterConfig) {
		config.WebhookDeliveryEnabled = value
	}
}

func NewRouter(store ClinicStore, options ...RouterOption) nethttp.Handler {
	config := RouterConfig{}
	for _, option := range options {
		option(&config)
	}

	router := chi.NewRouter()
	handler := NewHandler(store, HandlerConfig{
		APIKeyPepper:           config.APIKeyPepper,
		WebhookDeliveryEnabled: config.WebhookDeliveryEnabled,
	})
	requireAuth := RequireAuth(store)
	partnerAuth := RequirePartnerAPIKey(store, config.APIKeyPepper)
	reporterOrHigher := RequireRole("reporter", "district_manager", "org_admin", "system_admin")
	districtManagerOrHigher := RequireRole("district_manager", "org_admin", "system_admin")

	router.Get("/healthz", Healthz)
	router.Post("/v1/auth/login", handler.Login)
	router.Post("/v1/auth/logout", handler.Logout)
	router.With(requireAuth).Get("/v1/auth/me", handler.Me)
	router.Get("/v1/public/alternatives", handler.ListPublicAlternatives)
	router.Get("/v1/public/clinics", handler.ListPublicClinics)
	router.Get("/v1/public/clinics/{clinicId}", handler.GetPublicClinic)
	router.With(partnerAuth, RequirePartnerScope("clinics:read")).Get("/v1/partner/clinics", handler.ListPartnerClinics)
	router.With(requireAuth, districtManagerOrHigher).Get("/v1/alternatives", handler.ListAlternatives)
	router.With(requireAuth, districtManagerOrHigher).Get("/v1/clinics", handler.ListClinics)
	router.With(requireAuth, districtManagerOrHigher).Get("/v1/clinics/{clinicId}", handler.GetClinic)
	router.With(requireAuth, districtManagerOrHigher).Get("/v1/clinics/{clinicId}/status", handler.GetClinicStatus)
	router.With(requireAuth, districtManagerOrHigher).Get("/v1/clinics/{clinicId}/reports", handler.ListClinicReports)
	router.With(requireAuth, districtManagerOrHigher).Get("/v1/clinics/{clinicId}/audit-events", handler.ListClinicAuditEvents)
	router.With(requireAuth, districtManagerOrHigher).Get("/v1/reports/pending", handler.ListPendingReports)
	router.With(requireAuth, districtManagerOrHigher).Post("/v1/status/reconcile-staleness", handler.ReconcileStatusStaleness)
	router.With(requireAuth, reporterOrHigher).Post("/v1/reports", handler.CreateReport)
	router.With(requireAuth, reporterOrHigher).Post("/v1/reports/offline-sync", handler.SyncOfflineReports)
	router.With(requireAuth, districtManagerOrHigher).Post("/v1/reports/{reportId}/review", handler.ReviewReport)
	router.With(requireAuth, districtManagerOrHigher).Get("/v1/sync/summary", handler.GetSyncSummary)

	return router
}
