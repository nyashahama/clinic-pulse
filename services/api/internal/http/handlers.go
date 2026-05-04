package http

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net"
	nethttp "net/http"
	"net/netip"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"

	"clinicpulse/services/api/internal/auth"
	"clinicpulse/services/api/internal/service"
	"clinicpulse/services/api/internal/store"
)

const (
	sessionCookieName                   = "clinicpulse_session"
	sessionDuration                     = 12 * time.Hour
	dummyPasswordHash                   = "$2a$10$7EqJtq98hPqEX7fNZaFWoOhiYv4gfyJ5v5e26nnbuoJ6PmwKzJxYy"
	missingClientReportIDSyncExternalID = "missing-client-report-id"
)

type ClinicStore interface {
	ListClinics(ctx context.Context) ([]store.ClinicDetail, error)
	GetClinic(ctx context.Context, clinicID string) (store.ClinicDetail, error)
	GetCurrentStatus(ctx context.Context, clinicID string) (store.CurrentStatus, error)
	ListCurrentStatuses(ctx context.Context) ([]store.CurrentStatus, error)
	ListCurrentStatusesForReviewScope(ctx context.Context, scope store.ReportReviewScope) ([]store.CurrentStatus, error)
	UpdateCurrentStatusFreshness(ctx context.Context, clinicID string, freshness string, updatedAt time.Time, audit *store.CreateAuditEventInput) (store.CurrentStatus, bool, error)
	ListClinicReports(ctx context.Context, clinicID string) ([]store.Report, error)
	ListPendingReports(ctx context.Context, scope store.ReportReviewScope) ([]store.Report, error)
	ListClinicAuditEvents(ctx context.Context, clinicID string) ([]store.AuditEvent, error)
	CreateReportTx(ctx context.Context, input store.CreateReportInput) (store.Report, store.CurrentStatus, store.AuditEvent, error)
	CreatePendingReportTx(ctx context.Context, input store.CreateReportInput) (store.Report, error)
	GetPendingReportByPayload(ctx context.Context, input store.CreateReportInput) (store.Report, error)
	ReviewReportTx(ctx context.Context, input store.ReviewReportInput) (store.Report, *store.CurrentStatus, error)
	GetReportByExternalID(ctx context.Context, externalID string) (store.Report, error)
	CreateReportSyncAttempt(ctx context.Context, input store.CreateReportSyncAttemptInput) (store.ReportSyncAttempt, error)
	GetSyncSummarySince(ctx context.Context, since time.Time) (store.SyncSummary, error)
	GetSyncSummarySinceForReviewScope(ctx context.Context, since time.Time, scope store.ReportReviewScope) (store.SyncSummary, error)
	GetUserByEmail(ctx context.Context, email string) (store.User, error)
	CreateSessionWithAuditTx(ctx context.Context, input store.CreateSessionWithAuditInput) (store.Session, store.AuditEvent, error)
	GetSessionByTokenHash(ctx context.Context, tokenHash string) (store.Session, store.User, error)
	RevokeSession(ctx context.Context, tokenHash string) error
	ListMembershipsForUser(ctx context.Context, userID int64) ([]store.OrganisationMembership, error)
	GetPartnerAPIKeyByHash(ctx context.Context, keyHash string) (store.PartnerAPIKey, error)
	TouchPartnerAPIKey(ctx context.Context, keyID int64, ipAddress string, usedAt time.Time) error
}

type HandlerConfig struct {
	APIKeyPepper           string
	WebhookDeliveryEnabled bool
}

type Handler struct {
	store                  ClinicStore
	apiKeyPepper           string
	webhookDeliveryEnabled bool
}

func NewHandler(store ClinicStore, config HandlerConfig) Handler {
	return Handler{
		store:                  store,
		apiKeyPepper:           config.APIKeyPepper,
		webhookDeliveryEnabled: config.WebhookDeliveryEnabled,
	}
}

func Healthz(w nethttp.ResponseWriter, r *nethttp.Request) {
	RespondJSON(w, nethttp.StatusOK, map[string]string{
		"status":  "ok",
		"service": "clinicpulse-api",
	})
}

func (h Handler) ListClinics(w nethttp.ResponseWriter, r *nethttp.Request) {
	principal, ok := PrincipalFromContext(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}

	clinics, err := h.store.ListClinics(r.Context())
	if err != nil {
		respondStoreError(w, err, "failed to list clinics")
		return
	}
	clinics = filterClinicDetailsForOperationalRead(principal, clinics)
	if clinics == nil {
		clinics = []store.ClinicDetail{}
	}

	RespondJSON(w, nethttp.StatusOK, clinics)
}

func (h Handler) ListPartnerClinics(w nethttp.ResponseWriter, r *nethttp.Request) {
	principal, ok := PartnerPrincipalFromContext(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}
	clinics, err := h.store.ListClinics(r.Context())
	if err != nil {
		respondStoreError(w, err, "failed to list clinics")
		return
	}
	clinics = filterClinicDetailsForPartner(principal, clinics)
	RespondJSON(w, nethttp.StatusOK, sanitizePartnerClinicDetails(clinics))
}

func filterClinicDetailsForPartner(principal PartnerPrincipal, clinics []store.ClinicDetail) []store.ClinicDetail {
	if len(principal.AllowedDistricts) == 0 {
		return clinics
	}
	allowed := map[string]struct{}{}
	for _, district := range principal.AllowedDistricts {
		allowed[district] = struct{}{}
	}
	filtered := make([]store.ClinicDetail, 0, len(clinics))
	for _, clinic := range clinics {
		if _, ok := allowed[clinic.Clinic.District]; ok {
			filtered = append(filtered, clinic)
		}
	}
	return filtered
}

func sanitizePartnerClinicDetails(clinics []store.ClinicDetail) []publicClinicDetailResponse {
	if clinics == nil {
		return []publicClinicDetailResponse{}
	}
	result := make([]publicClinicDetailResponse, 0, len(clinics))
	for _, clinic := range clinics {
		result = append(result, publicClinicDetail(clinic))
	}
	return result
}

func (h Handler) GetClinic(w nethttp.ResponseWriter, r *nethttp.Request) {
	clinic, err := h.store.GetClinic(r.Context(), chi.URLParam(r, "clinicId"))
	if err != nil {
		respondStoreError(w, err, "clinic not found")
		return
	}
	principal, ok := PrincipalFromContext(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}
	if !canReadClinicOperationalRecords(principal, clinic.Clinic.District) {
		RespondError(w, nethttp.StatusForbidden, "forbidden", "forbidden")
		return
	}

	RespondJSON(w, nethttp.StatusOK, clinic)
}

func (h Handler) GetClinicStatus(w nethttp.ResponseWriter, r *nethttp.Request) {
	clinicID := chi.URLParam(r, "clinicId")
	clinic, err := h.store.GetClinic(r.Context(), clinicID)
	if err != nil {
		respondStoreError(w, err, "clinic not found")
		return
	}
	principal, ok := PrincipalFromContext(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}
	if !canReadClinicOperationalRecords(principal, clinic.Clinic.District) {
		RespondError(w, nethttp.StatusForbidden, "forbidden", "forbidden")
		return
	}

	status, err := h.store.GetCurrentStatus(r.Context(), clinicID)
	if err != nil {
		respondStoreError(w, err, "clinic status not found")
		return
	}

	RespondJSON(w, nethttp.StatusOK, status)
}

func (h Handler) ListClinicReports(w nethttp.ResponseWriter, r *nethttp.Request) {
	clinicID := chi.URLParam(r, "clinicId")
	clinic, err := h.store.GetClinic(r.Context(), clinicID)
	if err != nil {
		respondStoreError(w, err, "clinic not found")
		return
	}
	principal, ok := PrincipalFromContext(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}
	if !canReadClinicOperationalRecords(principal, clinic.Clinic.District) {
		RespondError(w, nethttp.StatusForbidden, "forbidden", "forbidden")
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

func (h Handler) ListPendingReports(w nethttp.ResponseWriter, r *nethttp.Request) {
	principal, ok := PrincipalFromContext(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}

	reports, err := h.store.ListPendingReports(r.Context(), reviewScopeForPrincipal(principal))
	if err != nil {
		respondStoreError(w, err, "failed to list pending reports")
		return
	}
	if reports == nil {
		reports = []store.Report{}
	}

	RespondJSON(w, nethttp.StatusOK, reports)
}

func (h Handler) ListClinicAuditEvents(w nethttp.ResponseWriter, r *nethttp.Request) {
	clinicID := chi.URLParam(r, "clinicId")
	clinic, err := h.store.GetClinic(r.Context(), clinicID)
	if err != nil {
		respondStoreError(w, err, "clinic not found")
		return
	}
	principal, ok := PrincipalFromContext(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}
	if !canReadClinicOperationalRecords(principal, clinic.Clinic.District) {
		RespondError(w, nethttp.StatusForbidden, "forbidden", "forbidden")
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

func (h Handler) ListAlternatives(w nethttp.ResponseWriter, r *nethttp.Request) {
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
	principal, ok := PrincipalFromContext(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}
	if !canReadClinicOperationalRecords(principal, source.Clinic.District) {
		RespondError(w, nethttp.StatusForbidden, "forbidden", "forbidden")
		return
	}

	candidates, err := h.store.ListClinics(r.Context())
	if err != nil {
		respondStoreError(w, err, "failed to list clinic alternatives")
		return
	}
	candidates = filterClinicDetailsForOperationalRead(principal, candidates)

	RespondJSON(w, nethttp.StatusOK, service.RankAlternatives(source, candidates, serviceName))
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
	if principal, ok := PrincipalFromContext(r.Context()); ok {
		input.StoreInput.SubmittedByUserID = &principal.UserID
		actor := auditActorForPrincipal(principal)
		input.Actor = &actor
		if principal.Role == "reporter" {
			input.StoreInput.Source = "field_worker"
			input.StoreInput.ReporterName = derivedReporterName(principal)
		}
	}
	report, err := service.CreateReport(r.Context(), h.store, input)
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
		Report: report,
	})
}

func (h Handler) ReviewReport(w nethttp.ResponseWriter, r *nethttp.Request) {
	reportID, err := strconv.ParseInt(chi.URLParam(r, "reportId"), 10, 64)
	if err != nil || reportID <= 0 {
		RespondError(w, nethttp.StatusNotFound, "not_found", "report not found")
		return
	}

	var payload reviewReportRequest
	if !decodeSingleJSON(w, r, &payload) {
		return
	}

	principal, ok := PrincipalFromContext(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}

	actor := auditActorForPrincipal(principal)
	report, status, err := service.ReviewReport(r.Context(), h.store, service.ReviewReportInput{
		ReportID:       reportID,
		ReviewerUserID: principal.UserID,
		OrganisationID: principal.OrganisationID,
		Decision:       payload.Decision,
		Notes:          payload.Notes,
		Scope:          reviewScopeForPrincipal(principal),
		Actor:          &actor,
	})
	if err != nil {
		var validationErr service.ValidationError
		if errors.As(err, &validationErr) {
			RespondError(w, nethttp.StatusBadRequest, "validation_error", "validation failed", validationErr.Fields...)
			return
		}
		if errors.Is(err, store.ErrReportAlreadyReviewed) {
			RespondError(w, nethttp.StatusConflict, "conflict", "report already reviewed")
			return
		}
		if errors.Is(err, store.ErrReportReviewForbidden) {
			RespondError(w, nethttp.StatusForbidden, "forbidden", "forbidden")
			return
		}
		respondStoreError(w, err, "report not found")
		return
	}

	RespondJSON(w, nethttp.StatusOK, reviewReportResponse{
		Report:        report,
		CurrentStatus: status,
	})
}

func (h Handler) SyncOfflineReports(w nethttp.ResponseWriter, r *nethttp.Request) {
	var payload offlineSyncRequest
	if !decodeSingleJSON(w, r, &payload) {
		return
	}

	principal, ok := PrincipalFromContext(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}

	actor := offlineSyncActorForPrincipal(principal)
	now := time.Now().UTC()
	result := service.OfflineSyncBatchResult{
		Results: make([]service.OfflineSyncResult, 0, len(payload.Items)),
	}
	for _, item := range payload.Items {
		input, fields := item.toServiceInput()
		if len(fields) > 0 {
			itemResult := h.offlineSyncValidationResult(r.Context(), actor, input, fields, now)
			result.Results = append(result.Results, itemResult)
			result.Summary.Failed++
			continue
		}

		itemResult := service.SyncOfflineReports(r.Context(), h.store, actor, []service.OfflineSyncItemInput{input}, now)
		result.Results = append(result.Results, itemResult.Results...)
		result.Summary.Created += itemResult.Summary.Created
		result.Summary.Duplicate += itemResult.Summary.Duplicate
		result.Summary.Conflict += itemResult.Summary.Conflict
		result.Summary.Failed += itemResult.Summary.Failed
	}

	RespondJSON(w, nethttp.StatusOK, result)
}

func (h Handler) offlineSyncValidationResult(ctx context.Context, actor service.OfflineSyncActor, input service.OfflineSyncItemInput, fields []string, now time.Time) service.OfflineSyncResult {
	itemResult := service.OfflineSyncResult{
		ClientReportID: input.ClientReportID,
		Result:         "validation_error",
		Error: &service.SyncItemError{
			Code:    "validation_error",
			Message: "offline report failed validation",
			Fields:  fields,
		},
	}

	submittedAt := input.SubmittedAt
	attempt := store.CreateReportSyncAttemptInput{
		ExternalID:         offlineSyncAttemptExternalID(input.ClientReportID),
		SubmittedByUserID:  offlineSyncActorUserID(actor),
		OrganisationID:     actor.OrganisationID,
		ClinicID:           input.ClinicID,
		Result:             itemResult.Result,
		ClientAttemptCount: normalizedOfflineSyncAttemptCount(input.ClientAttemptCount),
		QueuedAt:           input.QueuedAt,
		ReceivedAt:         now,
		ErrorCode:          &itemResult.Error.Code,
		ErrorMessage:       &itemResult.Error.Message,
		Metadata:           map[string]any{"fields": fields},
	}
	if !submittedAt.IsZero() {
		attempt.SubmittedAt = &submittedAt
	}
	if _, err := h.store.CreateReportSyncAttempt(ctx, attempt); err != nil {
		itemResult.Result = "server_error"
		itemResult.Error = &service.SyncItemError{
			Code:    "server_error",
			Message: "failed to record offline sync attempt",
		}
	}
	return itemResult
}

func normalizedOfflineSyncAttemptCount(count int) int {
	if count <= 0 {
		return 1
	}
	return count
}

func (h Handler) GetSyncSummary(w nethttp.ResponseWriter, r *nethttp.Request) {
	principal, ok := PrincipalFromContext(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}

	since := time.Now().UTC().Add(-24 * time.Hour)
	summary, err := h.store.GetSyncSummarySinceForReviewScope(r.Context(), since, reviewScopeForPrincipal(principal))
	if err != nil {
		RespondError(w, nethttp.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	RespondJSON(w, nethttp.StatusOK, summary)
}

func (h Handler) ReconcileStatusStaleness(w nethttp.ResponseWriter, r *nethttp.Request) {
	principal, ok := PrincipalFromContext(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}

	result, err := service.ReconcileStatusFreshnessForReviewScope(r.Context(), h.store, reviewScopeForPrincipal(principal), auditActorForPrincipal(principal), time.Now().UTC())
	if err != nil {
		RespondError(w, nethttp.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	RespondJSON(w, nethttp.StatusOK, result)
}

func (h Handler) Login(w nethttp.ResponseWriter, r *nethttp.Request) {
	var payload loginRequest
	if !decodeSingleJSON(w, r, &payload) {
		return
	}

	email := strings.ToLower(strings.TrimSpace(payload.Email))
	if email == "" || payload.Password == "" {
		RespondError(w, nethttp.StatusBadRequest, "validation_error", "validation failed", "email and password are required")
		return
	}

	user, err := h.store.GetUserByEmail(r.Context(), email)
	validLoginUser := false
	passwordHash := dummyPasswordHash
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			RespondError(w, nethttp.StatusInternalServerError, "internal_error", "internal server error")
			return
		}
	} else if user.DisabledAt == nil && user.PasswordHash != nil {
		validLoginUser = true
		passwordHash = *user.PasswordHash
	}

	ok, err := auth.VerifyPassword(payload.Password, passwordHash)
	if err != nil || !validLoginUser || !ok {
		respondUnauthorized(w)
		return
	}

	memberships, err := h.store.ListMembershipsForUser(r.Context(), user.ID)
	if err != nil {
		RespondError(w, nethttp.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	if memberships == nil {
		memberships = []store.OrganisationMembership{}
	}
	if len(memberships) == 0 {
		respondUnauthorized(w)
		return
	}

	token, err := auth.GenerateSessionToken()
	if err != nil {
		RespondError(w, nethttp.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	tokenHash, err := auth.HashSessionToken(token)
	if err != nil {
		RespondError(w, nethttp.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	expiresAt := time.Now().UTC().Add(sessionDuration)
	userAgent := optionalString(r.UserAgent())
	ipAddress := remoteIPAddress(r.RemoteAddr)
	principal, ok := PrincipalForMemberships(user, store.Session{}, memberships)
	if !ok {
		respondUnauthorized(w)
		return
	}
	session, err := service.CreateLoginSessionWithAudit(r.Context(), h.store, store.CreateSessionInput{
		UserID:    user.ID,
		TokenHash: tokenHash,
		ExpiresAt: expiresAt,
		UserAgent: userAgent,
		IPAddress: ipAddress,
	}, service.LoginAuditInput{
		Actor:     auditActorForPrincipal(principal),
		UserAgent: userAgent,
		IPAddress: ipAddress,
	})
	if err != nil {
		RespondError(w, nethttp.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	setSessionCookie(w, token, session.ExpiresAt, secureSessionCookie(r))
	RespondJSON(w, nethttp.StatusOK, authLoginResponse{
		User:        publicUser(user),
		Memberships: memberships,
	})
}

func (h Handler) Me(w nethttp.ResponseWriter, r *nethttp.Request) {
	if details, ok := authDetailsFromContext(r.Context()); ok {
		memberships := details.Memberships
		if memberships == nil {
			memberships = []store.OrganisationMembership{}
		}
		RespondJSON(w, nethttp.StatusOK, authMeResponse{
			User:        publicUser(details.User),
			Session:     publicSession(details.Session),
			Memberships: memberships,
		})
		return
	}

	cookie, err := r.Cookie(sessionCookieName)
	if err != nil || cookie.Value == "" {
		respondUnauthorized(w)
		return
	}

	tokenHash, err := auth.HashSessionToken(cookie.Value)
	if err != nil {
		respondUnauthorized(w)
		return
	}

	session, user, err := h.store.GetSessionByTokenHash(r.Context(), tokenHash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondUnauthorized(w)
			return
		}
		RespondError(w, nethttp.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	memberships, err := h.store.ListMembershipsForUser(r.Context(), user.ID)
	if err != nil {
		RespondError(w, nethttp.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	if memberships == nil {
		memberships = []store.OrganisationMembership{}
	}

	RespondJSON(w, nethttp.StatusOK, authMeResponse{
		User:        publicUser(user),
		Session:     publicSession(session),
		Memberships: memberships,
	})
}

func (h Handler) Logout(w nethttp.ResponseWriter, r *nethttp.Request) {
	if cookie, err := r.Cookie(sessionCookieName); err == nil {
		if tokenHash, err := auth.HashSessionToken(cookie.Value); err == nil {
			if err := h.store.RevokeSession(r.Context(), tokenHash); err != nil {
				RespondError(w, nethttp.StatusInternalServerError, "internal_error", "internal server error")
				return
			}
		}
	}

	clearSessionCookie(w, secureSessionCookie(r))
	w.WriteHeader(nethttp.StatusNoContent)
}

func respondStoreError(w nethttp.ResponseWriter, err error, notFoundMessage string) {
	if errors.Is(err, pgx.ErrNoRows) {
		RespondError(w, nethttp.StatusNotFound, "not_found", notFoundMessage)
		return
	}

	RespondError(w, nethttp.StatusInternalServerError, "internal_error", "internal server error")
}

func decodeSingleJSON(w nethttp.ResponseWriter, r *nethttp.Request, target any) bool {
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(target); err != nil {
		RespondError(w, nethttp.StatusBadRequest, "invalid_json", "invalid JSON request body")
		return false
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		RespondError(w, nethttp.StatusBadRequest, "invalid_json", "invalid JSON request body")
		return false
	}
	return true
}

func respondUnauthorized(w nethttp.ResponseWriter) {
	RespondError(w, nethttp.StatusUnauthorized, "unauthorized", "invalid credentials")
}

func setSessionCookie(w nethttp.ResponseWriter, token string, expiresAt time.Time, secure bool) {
	nethttp.SetCookie(w, &nethttp.Cookie{
		Name:     sessionCookieName,
		Value:    token,
		Path:     "/",
		Expires:  expiresAt,
		Secure:   secure,
		HttpOnly: true,
		SameSite: nethttp.SameSiteLaxMode,
	})
}

func clearSessionCookie(w nethttp.ResponseWriter, secure bool) {
	nethttp.SetCookie(w, &nethttp.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0).UTC(),
		MaxAge:   -1,
		Secure:   secure,
		HttpOnly: true,
		SameSite: nethttp.SameSiteLaxMode,
	})
}

func secureSessionCookie(r *nethttp.Request) bool {
	if r.TLS != nil {
		return true
	}
	return !isLocalDevHost(r.Host)
}

func isLocalDevHost(hostport string) bool {
	if hostport == "" {
		return false
	}

	host, _, err := net.SplitHostPort(hostport)
	if err != nil {
		host = hostport
	}
	host = strings.Trim(strings.ToLower(host), "[]")
	if host == "localhost" {
		return true
	}
	ip, err := netip.ParseAddr(host)
	if err != nil {
		return false
	}
	return ip.IsLoopback()
}

func optionalString(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}

func remoteIPAddress(remoteAddr string) *string {
	if remoteAddr == "" {
		return nil
	}

	host, _, err := net.SplitHostPort(remoteAddr)
	if err != nil {
		host = remoteAddr
	}
	ip, err := netip.ParseAddr(host)
	if err != nil {
		return nil
	}
	normalized := ip.String()
	return &normalized
}

func publicUser(user store.User) store.User {
	user.PasswordHash = nil
	return user
}

func publicSession(session store.Session) store.Session {
	session.TokenHash = ""
	return session
}

func reviewScopeForPrincipal(principal Principal) store.ReportReviewScope {
	return store.ReportReviewScope{
		Role:     principal.Role,
		District: principal.DistrictScope,
	}
}

func canReadClinicOperationalRecords(principal Principal, clinicDistrict string) bool {
	switch principal.Role {
	case "district_manager":
		return principal.DistrictScope != nil && strings.TrimSpace(*principal.DistrictScope) != "" && *principal.DistrictScope == clinicDistrict
	case "org_admin", "system_admin":
		return true
	default:
		return false
	}
}

func filterClinicDetailsForOperationalRead(principal Principal, clinics []store.ClinicDetail) []store.ClinicDetail {
	if principal.Role != "district_manager" {
		return clinics
	}
	if principal.DistrictScope == nil || strings.TrimSpace(*principal.DistrictScope) == "" {
		return []store.ClinicDetail{}
	}

	filtered := make([]store.ClinicDetail, 0, len(clinics))
	for _, clinic := range clinics {
		if clinic.Clinic.District == *principal.DistrictScope {
			filtered = append(filtered, clinic)
		}
	}
	return filtered
}

func auditActorForPrincipal(principal Principal) service.AuditActor {
	return service.AuditActor{
		UserID:         principal.UserID,
		Name:           principal.DisplayName,
		Role:           principal.Role,
		OrganisationID: principal.OrganisationID,
	}
}

func offlineSyncActorForPrincipal(principal Principal) service.OfflineSyncActor {
	return service.OfflineSyncActor{
		UserID:         principal.UserID,
		DisplayName:    principal.DisplayName,
		Email:          principal.Email,
		Role:           principal.Role,
		OrganisationID: principal.OrganisationID,
	}
}

func offlineSyncActorUserID(actor service.OfflineSyncActor) *int64 {
	if actor.UserID == 0 {
		return nil
	}
	return &actor.UserID
}

func offlineSyncAttemptExternalID(clientReportID string) string {
	if strings.TrimSpace(clientReportID) == "" {
		return missingClientReportIDSyncExternalID
	}
	return clientReportID
}

func derivedReporterName(principal Principal) *string {
	name := strings.TrimSpace(principal.DisplayName)
	if name == "" {
		name = strings.TrimSpace(principal.Email)
	}
	if name == "" {
		return nil
	}
	return &name
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
	Report        store.Report         `json:"report"`
	CurrentStatus *store.CurrentStatus `json:"currentStatus,omitempty"`
	AuditEvent    *store.AuditEvent    `json:"auditEvent,omitempty"`
}

type reviewReportRequest struct {
	Decision string  `json:"decision"`
	Notes    *string `json:"notes,omitempty"`
}

type reviewReportResponse struct {
	Report        store.Report         `json:"report"`
	CurrentStatus *store.CurrentStatus `json:"currentStatus,omitempty"`
}

type offlineSyncRequest struct {
	Items []offlineSyncItemRequest `json:"items"`
}

type offlineSyncItemRequest struct {
	ClientReportID string `json:"clientReportId"`
	ClinicID       string `json:"clinicId"`
	Status         string `json:"status"`
	Reason         string `json:"reason"`
	StaffPressure  string `json:"staffPressure"`
	StockPressure  string `json:"stockPressure"`
	QueuePressure  string `json:"queuePressure"`
	Notes          string `json:"notes"`
	SubmittedAt    string `json:"submittedAt"`
	QueuedAt       string `json:"queuedAt"`
	AttemptCount   int    `json:"attemptCount"`
}

func (p offlineSyncItemRequest) toServiceInput() (service.OfflineSyncItemInput, []string) {
	fields := []string(nil)
	submittedAt, ok := parseOfflineSyncTimestamp(p.SubmittedAt)
	if !ok {
		fields = append(fields, "submittedAt: submittedAt must be an RFC3339 timestamp")
	} else if submittedAt.IsZero() {
		fields = append(fields, "submittedAt: submittedAt is required")
	}

	var queuedAt *time.Time
	if strings.TrimSpace(p.QueuedAt) != "" {
		parsedQueuedAt, ok := parseOfflineSyncTimestamp(p.QueuedAt)
		if !ok {
			fields = append(fields, "queuedAt: queuedAt must be an RFC3339 timestamp")
		} else {
			queuedAt = &parsedQueuedAt
		}
	}

	return service.OfflineSyncItemInput{
		ClientReportID:     p.ClientReportID,
		ClinicID:           p.ClinicID,
		Status:             p.Status,
		Reason:             p.Reason,
		StaffPressure:      p.StaffPressure,
		StockPressure:      p.StockPressure,
		QueuePressure:      p.QueuePressure,
		Notes:              p.Notes,
		SubmittedAt:        submittedAt,
		QueuedAt:           queuedAt,
		ClientAttemptCount: p.AttemptCount,
	}, fields
}

func parseOfflineSyncTimestamp(value string) (time.Time, bool) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return time.Time{}, true
	}
	parsed, err := time.Parse(time.RFC3339, trimmed)
	if err != nil {
		return time.Time{}, false
	}
	return parsed, true
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type authLoginResponse struct {
	User        store.User                     `json:"user"`
	Memberships []store.OrganisationMembership `json:"memberships"`
}

type authMeResponse struct {
	User        store.User                     `json:"user"`
	Session     store.Session                  `json:"session"`
	Memberships []store.OrganisationMembership `json:"memberships"`
}
