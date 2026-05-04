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
	orgAdminOrSystemAdmin := RequireRole("org_admin", "system_admin")

	router.Get("/healthz", Healthz)
	router.Post("/v1/auth/login", handler.Login)
	router.Post("/v1/auth/logout", handler.Logout)
	router.With(requireAuth).Get("/v1/auth/me", handler.Me)
	router.Get("/v1/public/alternatives", handler.ListPublicAlternatives)
	router.Get("/v1/public/clinics", handler.ListPublicClinics)
	router.Get("/v1/public/clinics/{clinicId}", handler.GetPublicClinic)
	router.With(partnerAuth, RequirePartnerScope("clinics:read")).Get("/v1/partner/clinics", handler.ListPartnerClinics)
	router.With(partnerAuth, RequirePartnerScope("status:read")).Get("/v1/partner/clinics/{clinicId}/status", handler.GetPartnerClinicStatus)
	router.With(partnerAuth, RequirePartnerScope("alternatives:read")).Get("/v1/partner/alternatives", handler.ListPartnerAlternatives)
	router.With(partnerAuth, RequirePartnerScope("exports:read")).Get("/v1/partner/export/latest", handler.GetPartnerLatestExport)
	router.With(partnerAuth, RequirePartnerScope("status:read")).Get("/v1/partner/integration-status", handler.GetPartnerIntegrationStatus)
	router.With(requireAuth, districtManagerOrHigher).Get("/v1/admin/partner-readiness", handler.GetAdminPartnerReadiness)
	router.With(requireAuth, orgAdminOrSystemAdmin).Post("/v1/admin/api-keys", handler.CreateAdminPartnerAPIKey)
	router.With(requireAuth, orgAdminOrSystemAdmin).Get("/v1/admin/api-keys", handler.ListAdminPartnerAPIKeys)
	router.With(requireAuth, orgAdminOrSystemAdmin).Post("/v1/admin/api-keys/{keyId}/revoke", handler.RevokeAdminPartnerAPIKey)
	router.With(requireAuth, orgAdminOrSystemAdmin).Get("/v1/admin/webhooks", handler.ListAdminPartnerWebhooks)
	router.With(requireAuth, orgAdminOrSystemAdmin).Post("/v1/admin/webhooks", handler.CreateAdminPartnerWebhook)
	router.With(requireAuth, orgAdminOrSystemAdmin).Post("/v1/admin/webhooks/{subscriptionId}/test", handler.CreateAdminPartnerWebhookTestEvent)
	router.With(requireAuth, orgAdminOrSystemAdmin).Post("/v1/admin/exports", handler.CreateAdminPartnerExport)
	router.With(requireAuth, orgAdminOrSystemAdmin).Get("/v1/admin/exports/{exportId}", handler.GetAdminPartnerExport)
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
