package store

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"clinicpulse/services/api/internal/store/db"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

func (s Store) GetCurrentStatus(ctx context.Context, clinicID string) (CurrentStatus, error) {
	result, err := s.db.GetCurrentStatus(ctx, clinicID)
	if err != nil {
		return CurrentStatus{}, err
	}
	return currentStatusFromRow(result), nil
}

func (s Store) ListCurrentStatuses(ctx context.Context) ([]CurrentStatus, error) {
	rows, err := s.db.ListCurrentStatuses(ctx)
	if err != nil {
		return nil, err
	}
	items := make([]CurrentStatus, len(rows))
	for i, r := range rows {
		items[i] = currentStatusFromListRow(r)
	}
	return items, nil
}

func (s Store) ListCurrentStatusesForReviewScope(ctx context.Context, scope ReportReviewScope) ([]CurrentStatus, error) {
	if scope.Role == "district_manager" && scope.District == nil {
		return []CurrentStatus{}, nil
	}
	district := ""
	if scope.District != nil {
		district = *scope.District
	}
	rows, err := s.db.ListCurrentStatusesForReviewScope(ctx, &db.ListCurrentStatusesForReviewScopeParams{
		Column1: scope.Role,
		Column2: district,
	})
	if err != nil {
		return nil, err
	}
	items := make([]CurrentStatus, len(rows))
	for i, r := range rows {
		items[i] = currentStatusFromReviewScopeRow(r)
	}
	return items, nil
}

func currentStatusFromRow(r *db.GetCurrentStatusRow) CurrentStatus {
	return CurrentStatus{
		ClinicID:        r.ClinicID,
		Status:          r.Status,
		Reason:          r.Reason,
		Freshness:       r.Freshness,
		LastReportedAt:  timestamptzPtr(r.LastReportedAt),
		ReporterName:    r.ReporterName,
		Source:          r.Source,
		StaffPressure:   r.StaffPressure,
		StockPressure:   r.StockPressure,
		QueuePressure:   r.QueuePressure,
		ConfidenceScore: float64Ptr(r.ConfidenceScore),
		UpdatedAt:       timestamptzTime(r.UpdatedAt),
	}
}

func currentStatusFromListRow(r *db.ListCurrentStatusesRow) CurrentStatus {
	return CurrentStatus{
		ClinicID:        r.ClinicID,
		Status:          r.Status,
		Reason:          r.Reason,
		Freshness:       r.Freshness,
		LastReportedAt:  timestamptzPtr(r.LastReportedAt),
		ReporterName:    r.ReporterName,
		Source:          r.Source,
		StaffPressure:   r.StaffPressure,
		StockPressure:   r.StockPressure,
		QueuePressure:   r.QueuePressure,
		ConfidenceScore: float64Ptr(r.ConfidenceScore),
		UpdatedAt:       timestamptzTime(r.UpdatedAt),
	}
}

func currentStatusFromReviewScopeRow(r *db.ListCurrentStatusesForReviewScopeRow) CurrentStatus {
	return CurrentStatus{
		ClinicID:        r.ClinicID,
		Status:          r.Status,
		Reason:          r.Reason,
		Freshness:       r.Freshness,
		LastReportedAt:  timestamptzPtr(r.LastReportedAt),
		ReporterName:    r.ReporterName,
		Source:          r.Source,
		StaffPressure:   r.StaffPressure,
		StockPressure:   r.StockPressure,
		QueuePressure:   r.QueuePressure,
		ConfidenceScore: float64Ptr(r.CurrentStatusConfidenceScore),
		UpdatedAt:       timestamptzTime(r.UpdatedAt),
	}
}

func (s Store) GetReportByExternalID(ctx context.Context, externalID string) (Report, error) {
	row, err := s.db.GetReportByExternalID(ctx, &externalID)
	if err != nil {
		return Report{}, err
	}
	return toReport(row)
}

func (s Store) GetPendingReportByPayload(ctx context.Context, input CreateReportInput) (Report, error) {
	normalized := normalizePendingCreateReportInput(input)
	row, err := s.db.GetPendingReportByPayload(ctx, &db.GetPendingReportByPayloadParams{
		ClinicID: normalized.ClinicID,
		Source:   normalized.Source,
		Status:   normalized.Status,
		Column4:  strOrZero(normalized.Reason),
		Column5:  strOrZero(normalized.StaffPressure),
		Column6:  strOrZero(normalized.StockPressure),
		Column7:  strOrZero(normalized.QueuePressure),
		Column8:  int64OrZero(normalized.SubmittedByUserID),
	})
	if err != nil {
		return Report{}, err
	}
	conv := db.GetReportByExternalIDRow(*row)
	return toReport(&conv)
}

func (s Store) GetRecentReportByPayload(ctx context.Context, input CreateReportInput, windowStart time.Time) (Report, error) {
	normalized := normalizePendingCreateReportInput(input)
	row, err := s.db.GetRecentReportByPayload(ctx, &db.GetRecentReportByPayloadParams{
		ClinicID:   normalized.ClinicID,
		Source:     normalized.Source,
		Status:     normalized.Status,
		Column4:    strOrZero(normalized.Reason),
		Column5:    strOrZero(normalized.StaffPressure),
		Column6:    strOrZero(normalized.StockPressure),
		Column7:    strOrZero(normalized.QueuePressure),
		Column8:    int64OrZero(normalized.SubmittedByUserID),
		ReceivedAt: pgtype.Timestamptz{Time: windowStart, Valid: true},
	})
	if err != nil {
		return Report{}, err
	}
	conv := db.GetReportByExternalIDRow(*row)
	return toReport(&conv)
}

func (s Store) ListClinicReports(ctx context.Context, clinicID string) ([]Report, error) {
	rows, err := s.db.ListClinicReports(ctx, clinicID)
	if err != nil {
		return nil, err
	}
	reports := make([]Report, len(rows))
	for i, row := range rows {
		conv := db.GetReportByExternalIDRow(*row)
		r, err := toReport(&conv)
		if err != nil {
			return nil, err
		}
		reports[i] = r
	}
	return reports, nil
}

func (s Store) ListPendingReports(ctx context.Context, scope ReportReviewScope) ([]Report, error) {
	if scope.Role == "district_manager" && scope.District == nil {
		return []Report{}, nil
	}
	district := ""
	if scope.District != nil {
		district = *scope.District
	}
	rows, err := s.db.ListPendingReports(ctx, &db.ListPendingReportsParams{
		Column1: scope.Role,
		Column2: district,
	})
	if err != nil {
		return nil, err
	}
	reports := make([]Report, len(rows))
	for i, row := range rows {
		r, err := toReportFromPendingRow(row)
		if err != nil {
			return nil, err
		}
		reports[i] = r
	}
	return reports, nil
}

func (s Store) GetSyncSummarySince(ctx context.Context, since time.Time) (SyncSummary, error) {
	row, err := s.db.SyncSummarySince(ctx, pgtype.Timestamptz{Time: since, Valid: true})
	if err != nil {
		return SyncSummary{}, err
	}
	return syncSummaryFromRow(since, row), nil
}

func (s Store) GetSyncSummarySinceForReviewScope(ctx context.Context, since time.Time, scope ReportReviewScope) (SyncSummary, error) {
	if scope.Role == "district_manager" && scope.District == nil {
		return SyncSummary{WindowStartedAt: since}, nil
	}
	if scope.Role == "reporter" && scope.UserID == nil {
		return SyncSummary{WindowStartedAt: since}, nil
	}
	district := ""
	if scope.District != nil {
		district = *scope.District
	}
	userID := int64(0)
	if scope.UserID != nil {
		userID = *scope.UserID
	}
	row, err := s.db.SyncSummarySinceForReviewScope(ctx, &db.SyncSummarySinceForReviewScopeParams{
		ReceivedAt: pgtype.Timestamptz{Time: since, Valid: true},
		Column2:    scope.Role,
		Column3:    district,
		Column4:    userID,
	})
	if err != nil {
		return SyncSummary{}, err
	}
	return syncSummaryFromReviewScopeRow(since, row), nil
}

func (s Store) CreateReportSyncAttempt(ctx context.Context, input CreateReportSyncAttemptInput) (ReportSyncAttempt, error) {
	normalized, err := normalizeCreateReportSyncAttemptInput(input)
	if err != nil {
		return ReportSyncAttempt{}, err
	}

	metadataJSON, err := json.Marshal(normalized.Metadata)
	if err != nil {
		return ReportSyncAttempt{}, err
	}

	queuedAt := pgtype.Timestamptz{Valid: false}
	if normalized.QueuedAt != nil {
		queuedAt = pgtype.Timestamptz{Time: *normalized.QueuedAt, Valid: true}
	}
	submittedAt := pgtype.Timestamptz{Valid: false}
	if normalized.SubmittedAt != nil {
		submittedAt = pgtype.Timestamptz{Time: *normalized.SubmittedAt, Valid: true}
	}

	row, err := s.db.InsertReportSyncAttempt(ctx, &db.InsertReportSyncAttemptParams{
		ExternalID:         normalized.ExternalID,
		ReportID:           normalized.ReportID,
		SubmittedByUserID:  normalized.SubmittedByUserID,
		OrganisationID:     normalized.OrganisationID,
		ClinicID:           nullableTrimmedStringArg(normalized.ClinicID),
		Result:             normalized.Result,
		ClientAttemptCount: int32(normalized.ClientAttemptCount),
		QueuedAt:           queuedAt,
		SubmittedAt:        submittedAt,
		ReceivedAt:         pgtype.Timestamptz{Time: normalized.ReceivedAt, Valid: true},
		ErrorCode:          normalized.ErrorCode,
		ErrorMessage:       normalized.ErrorMessage,
		Column13:           metadataJSON,
	})
	if err != nil {
		return ReportSyncAttempt{}, err
	}

	return toReportSyncAttempt(row)
}

func timestamptzPtr(t pgtype.Timestamptz) *time.Time {
	if !t.Valid {
		return nil
	}
	return &t.Time
}

func timestamptzTime(t pgtype.Timestamptz) time.Time {
	if !t.Valid {
		return time.Time{}
	}
	return t.Time
}

// Auth passthrough methods

func (s Store) GetUserByEmail(ctx context.Context, email string) (User, error) {
	row, err := s.db.GetUserByEmail(ctx, email)
	if err != nil {
		return User{}, err
	}
	return userFromRow(row.ID, row.Email, row.DisplayName, row.PasswordHash, row.DisabledAt, row.PasswordChangedAt, row.PasswordResetRequired, row.CreatedAt, row.UpdatedAt), nil
}

func (s Store) CreateUser(ctx context.Context, input CreateUserInput) (User, error) {
	row, err := s.db.CreateUser(ctx, &db.CreateUserParams{
		Email:                 strings.ToLower(strings.TrimSpace(input.Email)),
		DisplayName:           strings.TrimSpace(input.DisplayName),
		PasswordHash:          input.PasswordHash,
		PasswordResetRequired: input.PasswordResetRequired,
	})
	if err != nil {
		return User{}, err
	}
	return userFromRow(row.ID, row.Email, row.DisplayName, row.PasswordHash, row.DisabledAt, row.PasswordChangedAt, row.PasswordResetRequired, row.CreatedAt, row.UpdatedAt), nil
}

func (s Store) GetUserByID(ctx context.Context, userID int64) (User, error) {
	row, err := s.db.GetUserByID(ctx, userID)
	if err != nil {
		return User{}, err
	}
	return userFromRow(row.ID, row.Email, row.DisplayName, row.PasswordHash, row.DisabledAt, row.PasswordChangedAt, row.PasswordResetRequired, row.CreatedAt, row.UpdatedAt), nil
}

func (s Store) UpdateUserPassword(ctx context.Context, userID int64, passwordHash string) (User, error) {
	row, err := s.db.UpdateUserPassword(ctx, &db.UpdateUserPasswordParams{
		ID:           userID,
		PasswordHash: &passwordHash,
	})
	if err != nil {
		return User{}, err
	}
	return userFromRow(row.ID, row.Email, row.DisplayName, row.PasswordHash, row.DisabledAt, row.PasswordChangedAt, row.PasswordResetRequired, row.CreatedAt, row.UpdatedAt), nil
}

func (s Store) UpdateUserLifecycle(ctx context.Context, input UpdateUserLifecycleInput) (User, error) {
	if input.Disabled == nil {
		row, err := s.db.UpdateUserLifecycleName(ctx, &db.UpdateUserLifecycleNameParams{
			ID:          input.UserID,
			DisplayName: strOrZero(input.DisplayName),
			UpdatedAt:   pgtype.Timestamptz{Time: input.UpdatedAt, Valid: true},
		})
		if err != nil {
			return User{}, err
		}
		return userFromRow(row.ID, row.Email, row.DisplayName, row.PasswordHash, row.DisabledAt, row.PasswordChangedAt, row.PasswordResetRequired, row.CreatedAt, row.UpdatedAt), nil
	}

	row, err := s.db.UpdateUserLifecycle(ctx, &db.UpdateUserLifecycleParams{
		ID:          input.UserID,
		DisplayName: strOrZero(input.DisplayName),
		Column3:     *input.Disabled,
		UpdatedAt:   pgtype.Timestamptz{Time: input.UpdatedAt, Valid: true},
	})
	if err != nil {
		return User{}, err
	}
	return userFromRow(row.ID, row.Email, row.DisplayName, row.PasswordHash, row.DisabledAt, row.PasswordChangedAt, row.PasswordResetRequired, row.CreatedAt, row.UpdatedAt), nil
}

func (s Store) CreateSession(ctx context.Context, input CreateSessionInput) (Session, error) {
	normalized, err := normalizeCreateSessionInput(input)
	if err != nil {
		return Session{}, err
	}

	row, err := s.db.CreateSession(ctx, &db.CreateSessionParams{
		UserID:    normalized.UserID,
		TokenHash: normalized.TokenHash,
		ExpiresAt: pgtype.Timestamptz{Time: normalized.ExpiresAt, Valid: true},
		UserAgent: normalized.UserAgent,
		IpAddress: normalized.IPAddress,
	})
	if err != nil {
		return Session{}, err
	}
	return sessionFromCreateRow(row), nil
}

func (s Store) GetSessionByTokenHash(ctx context.Context, tokenHash string) (Session, User, error) {
	row, err := s.db.GetSessionByTokenHash(ctx, tokenHash)
	if err != nil {
		return Session{}, User{}, err
	}
	return sessionFromTokenHashRow(row), userFromGetSessionRow(row), nil
}

func (s Store) GetAdminUserAccessByUserID(ctx context.Context, userID int64) (AdminUserAccessRow, error) {
	row, err := s.db.GetAdminUserAccessByUserID(ctx, userID)
	if err != nil {
		return AdminUserAccessRow{}, err
	}
	return adminUserAccessFromRow(row), nil
}

func (s Store) ListAdminUserAccess(ctx context.Context, organisationID *int64) ([]AdminUserAccessRow, error) {
	rows, err := s.db.ListAdminUserAccess(ctx, organisationID)
	if err != nil {
		return nil, err
	}
	items := make([]AdminUserAccessRow, len(rows))
	for i, r := range rows {
		items[i] = adminUserAccessFromListRow(r)
	}
	return items, nil
}

func (s Store) ListPilotIngestionRuns(ctx context.Context, organisationID *int64, limit int) ([]PilotIngestionRun, error) {
	if limit <= 0 {
		limit = 50
	}
	rows, err := s.db.ListPilotIngestionRuns(ctx, &db.ListPilotIngestionRunsParams{
		OrganisationID: organisationID,
		Limit:          int32(limit),
	})
	if err != nil {
		return nil, err
	}

	runs := make([]PilotIngestionRun, len(rows))
	for i, row := range rows {
		run, err := toPilotIngestionRun(row)
		if err != nil {
			return nil, err
		}
		runs[i] = run
	}
	return runs, nil
}

func (s Store) DisableUser(ctx context.Context, userID int64, disabledAt time.Time) error {
	rowsAffected, err := s.db.DisableUser(ctx, &db.DisableUserParams{
		ID:         userID,
		DisabledAt: pgtype.Timestamptz{Time: disabledAt, Valid: true},
	})
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (s Store) EnableUser(ctx context.Context, userID int64) error {
	rowsAffected, err := s.db.EnableUser(ctx, userID)
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (s Store) RevokeSession(ctx context.Context, tokenHash string) error {
	return s.db.RevokeSession(ctx, tokenHash)
}

func (s Store) RevokeActiveSessionsForUser(ctx context.Context, userID int64) (int64, error) {
	return s.db.RevokeActiveSessionsForUser(ctx, userID)
}

func (s Store) ListMembershipsForUser(ctx context.Context, userID int64) ([]OrganisationMembership, error) {
	rows, err := s.db.ListMembershipsForUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	items := make([]OrganisationMembership, len(rows))
	for i, r := range rows {
		items[i] = membershipFromRow(r)
	}
	return items, nil
}

func userFromRow(id int64, email, displayName string, passwordHash *string, disabledAt, passwordChangedAt pgtype.Timestamptz, passwordResetRequired bool, createdAt, updatedAt pgtype.Timestamptz) User {
	return User{
		ID:                    id,
		Email:                 email,
		DisplayName:           displayName,
		PasswordHash:          passwordHash,
		DisabledAt:            timestamptzPtr(disabledAt),
		PasswordChangedAt:     timestamptzPtr(passwordChangedAt),
		PasswordResetRequired: passwordResetRequired,
		CreatedAt:             timestamptzTime(createdAt),
		UpdatedAt:             timestamptzTime(updatedAt),
	}
}

func sessionFromCreateRow(row *db.Session) Session {
	return Session{
		ID:         row.ID,
		UserID:     row.UserID,
		TokenHash:  row.TokenHash,
		CreatedAt:  timestamptzTime(row.CreatedAt),
		ExpiresAt:  timestamptzTime(row.ExpiresAt),
		RevokedAt:  timestamptzPtr(row.RevokedAt),
		LastSeenAt: timestamptzPtr(row.LastSeenAt),
		UserAgent:  row.UserAgent,
		IPAddress:  row.IpAddress,
	}
}

func sessionFromTokenHashRow(row *db.GetSessionByTokenHashRow) Session {
	return Session{
		ID:         row.SessionID,
		UserID:     row.SessionUserID,
		TokenHash:  row.SessionTokenHash,
		CreatedAt:  timestamptzTime(row.SessionCreatedAt),
		ExpiresAt:  timestamptzTime(row.SessionExpiresAt),
		RevokedAt:  timestamptzPtr(row.SessionRevokedAt),
		LastSeenAt: timestamptzPtr(row.SessionLastSeenAt),
		UserAgent:  row.SessionUserAgent,
		IPAddress:  row.SessionIpAddress,
	}
}

func userFromGetSessionRow(row *db.GetSessionByTokenHashRow) User {
	return User{
		ID:                    row.UserID,
		Email:                 row.UserEmail,
		DisplayName:           row.UserDisplayName,
		PasswordHash:          row.UserPasswordHash,
		DisabledAt:            timestamptzPtr(row.UserDisabledAt),
		PasswordChangedAt:     timestamptzPtr(row.UserPasswordChangedAt),
		PasswordResetRequired: row.UserPasswordResetRequired,
		CreatedAt:             timestamptzTime(row.UserCreatedAt),
		UpdatedAt:             timestamptzTime(row.UserUpdatedAt),
	}
}

func membershipFromCreatedRow(row *db.InsertOrganisationMembershipRow) OrganisationMembership {
	return OrganisationMembership{
		ID:             row.ID,
		UserID:         row.UserID,
		OrganisationID: row.OrganisationID,
		Role:           row.Role,
		District:       row.District,
		CreatedAt:      timestamptzTime(row.CreatedAt),
	}
}

func membershipFromRow(row *db.ListMembershipsForUserRow) OrganisationMembership {
	return OrganisationMembership{
		ID:             row.ID,
		UserID:         row.UserID,
		OrganisationID: row.OrganisationID,
		Role:           row.Role,
		District:       row.District,
		CreatedAt:      timestamptzTime(row.CreatedAt),
	}
}

func adminUserAccessFromRow(row *db.GetAdminUserAccessByUserIDRow) AdminUserAccessRow {
	return AdminUserAccessRow{
		UserID:         row.UserID,
		Email:          row.Email,
		DisplayName:    row.DisplayName,
		DisabledAt:     timestamptzPtr(row.DisabledAt),
		CreatedAt:      timestamptzTime(row.CreatedAt),
		Role:           row.Role,
		OrganisationID: row.OrganisationID,
		District:       row.District,
		LastSeenAt:     interfaceToTimePtr(row.LastSeenAt),
	}
}

func adminUserAccessFromListRow(row *db.ListAdminUserAccessRow) AdminUserAccessRow {
	return AdminUserAccessRow{
		UserID:         row.ID,
		Email:          row.Email,
		DisplayName:    row.DisplayName,
		DisabledAt:     timestamptzPtr(row.DisabledAt),
		CreatedAt:      timestamptzTime(row.CreatedAt),
		Role:           row.Role,
		OrganisationID: row.OrganisationID,
		District:       row.District,
		LastSeenAt:     interfaceToTimePtr(row.LastSeenAt),
	}
}

func interfaceToTimePtr(v interface{}) *time.Time {
	if v == nil {
		return nil
	}
	t, ok := v.(time.Time)
	if !ok {
		return nil
	}
	return &t
}

func (s Store) GetPartnerAPIKeyByHash(ctx context.Context, keyHash string) (PartnerAPIKey, error) {
	row, err := s.db.GetPartnerAPIKeyByHash(ctx, keyHash)
	if err != nil {
		return PartnerAPIKey{}, err
	}
	conv := db.InsertPartnerAPIKeyRow(*row)
	return toPartnerAPIKey(&conv)
}

func (s Store) ListPartnerAPIKeys(ctx context.Context, organisationID *int64) ([]PartnerAPIKey, error) {
	rows, err := s.db.ListPartnerAPIKeys(ctx, organisationID)
	if err != nil {
		return nil, err
	}
	items := make([]PartnerAPIKey, len(rows))
	for i, row := range rows {
		conv := db.InsertPartnerAPIKeyRow(*row)
		item, err := toPartnerAPIKey(&conv)
		if err != nil {
			return nil, err
		}
		items[i] = item
	}
	return items, nil
}

func (s Store) CreatePartnerAPIKey(ctx context.Context, input CreatePartnerAPIKeyInput) (PartnerAPIKey, error) {
	normalized, err := normalizeCreatePartnerAPIKeyInput(input)
	if err != nil {
		return PartnerAPIKey{}, err
	}
	scopesJSON, err := json.Marshal(normalized.Scopes)
	if err != nil {
		return PartnerAPIKey{}, err
	}
	allowedDistrictsJSON, err := json.Marshal(normalized.AllowedDistricts)
	if err != nil {
		return PartnerAPIKey{}, err
	}
	expiresAt := pgtype.Timestamptz{Valid: false}
	if normalized.ExpiresAt != nil {
		expiresAt = pgtype.Timestamptz{Time: *normalized.ExpiresAt, Valid: true}
	}
	row, err := s.db.InsertPartnerAPIKey(ctx, &db.InsertPartnerAPIKeyParams{
		OrganisationID:  normalized.OrganisationID,
		Name:            normalized.Name,
		Environment:     normalized.Environment,
		KeyPrefix:       normalized.KeyPrefix,
		KeyHash:         normalized.KeyHash,
		Column6:         scopesJSON,
		Column7:         allowedDistrictsJSON,
		ExpiresAt:       expiresAt,
		CreatedByUserID: normalized.CreatedByUserID,
		CreatedAt:       pgtype.Timestamptz{Time: normalized.CreatedAt, Valid: true},
	})
	if err != nil {
		return PartnerAPIKey{}, err
	}
	return toPartnerAPIKey(row)
}

func (s Store) TouchPartnerAPIKey(ctx context.Context, keyID int64, ipAddress string, usedAt time.Time) error {
	rowsAffected, err := s.db.TouchPartnerAPIKey(ctx, &db.TouchPartnerAPIKeyParams{
		ID:         keyID,
		Column2:    ipAddress,
		LastUsedAt: pgtype.Timestamptz{Time: usedAt, Valid: true},
	})
	if err != nil {
		return err
	}
	if rowsAffected > 0 {
		return nil
	}
	return s.partnerAPIKeyStateError(ctx, keyID, usedAt)
}

func (s Store) RevokePartnerAPIKey(ctx context.Context, keyID int64, revokedAt time.Time) error {
	rowsAffected, err := s.db.RevokePartnerAPIKey(ctx, &db.RevokePartnerAPIKeyParams{
		ID:        keyID,
		RevokedAt: pgtype.Timestamptz{Time: revokedAt, Valid: true},
	})
	if err != nil {
		return err
	}
	if rowsAffected > 0 {
		return nil
	}
	return s.partnerAPIKeyStateError(ctx, keyID, revokedAt)
}

func (s Store) CreatePartnerWebhookSubscription(ctx context.Context, input CreatePartnerWebhookSubscriptionInput) (PartnerWebhookSubscription, error) {
	normalized, err := normalizeCreatePartnerWebhookSubscriptionInput(input)
	if err != nil {
		return PartnerWebhookSubscription{}, err
	}
	eventTypesJSON, err := json.Marshal(normalized.EventTypes)
	if err != nil {
		return PartnerWebhookSubscription{}, err
	}
	lastTestMetadataJSON, err := json.Marshal(normalized.LastTestMetadata)
	if err != nil {
		return PartnerWebhookSubscription{}, err
	}
	row, err := s.db.InsertPartnerWebhookSubscription(ctx, &db.InsertPartnerWebhookSubscriptionParams{
		OrganisationID:  normalized.OrganisationID,
		Name:            normalized.Name,
		TargetUrl:       normalized.TargetURL,
		Column4:         eventTypesJSON,
		SecretHash:      normalized.SecretHash,
		Status:          normalized.Status,
		Column7:         lastTestMetadataJSON,
		CreatedByUserID: normalized.CreatedByUserID,
		CreatedAt:       pgtype.Timestamptz{Time: normalized.CreatedAt, Valid: true},
	})
	if err != nil {
		return PartnerWebhookSubscription{}, err
	}
	return toPartnerWebhookSubscription(row)
}

func (s Store) ListPartnerWebhookSubscriptions(ctx context.Context, organisationID *int64) ([]PartnerWebhookSubscription, error) {
	rows, err := s.db.ListPartnerWebhookSubscriptions(ctx, organisationID)
	if err != nil {
		return nil, err
	}
	items := make([]PartnerWebhookSubscription, len(rows))
	for i, row := range rows {
		item, err := toPartnerWebhookSubscription(row)
		if err != nil {
			return nil, err
		}
		items[i] = item
	}
	return items, nil
}

func (s Store) CreatePartnerWebhookEvent(ctx context.Context, input CreatePartnerWebhookEventInput) (PartnerWebhookEvent, error) {
	normalized, err := normalizeCreatePartnerWebhookEventInput(input)
	if err != nil {
		return PartnerWebhookEvent{}, err
	}
	payloadJSON, err := json.Marshal(normalized.Payload)
	if err != nil {
		return PartnerWebhookEvent{}, err
	}
	metadataJSON, err := json.Marshal(normalized.Metadata)
	if err != nil {
		return PartnerWebhookEvent{}, err
	}
	row, err := s.db.InsertPartnerWebhookEvent(ctx, &db.InsertPartnerWebhookEventParams{
		SubscriptionID: normalized.SubscriptionID,
		EventType:      normalized.EventType,
		Column3:        payloadJSON,
		Column4:        metadataJSON,
		Status:         normalized.Status,
		AttemptCount:   int32(normalized.AttemptCount),
		LastError:      normalized.LastError,
		CreatedAt:      pgtype.Timestamptz{Time: normalized.CreatedAt, Valid: true},
		DeliveredAt:    pgtype.Timestamptz{Time: time.Time{}, Valid: false},
	})
	if normalized.DeliveredAt != nil {
		row, err = s.db.InsertPartnerWebhookEvent(ctx, &db.InsertPartnerWebhookEventParams{
			SubscriptionID: normalized.SubscriptionID,
			EventType:      normalized.EventType,
			Column3:        payloadJSON,
			Column4:        metadataJSON,
			Status:         normalized.Status,
			AttemptCount:   int32(normalized.AttemptCount),
			LastError:      normalized.LastError,
			CreatedAt:      pgtype.Timestamptz{Time: normalized.CreatedAt, Valid: true},
			DeliveredAt:    pgtype.Timestamptz{Time: *normalized.DeliveredAt, Valid: true},
		})
		if err != nil {
			return PartnerWebhookEvent{}, err
		}
		return toPartnerWebhookEvent(row)
	}
	if err != nil {
		return PartnerWebhookEvent{}, err
	}
	return toPartnerWebhookEvent(row)
}

func (s Store) ListPartnerWebhookEvents(ctx context.Context, organisationID *int64) ([]PartnerWebhookEvent, error) {
	rows, err := s.db.ListPartnerWebhookEvents(ctx, organisationID)
	if err != nil {
		return nil, err
	}
	items := make([]PartnerWebhookEvent, len(rows))
	for i, row := range rows {
		item, err := toPartnerWebhookEvent(row)
		if err != nil {
			return nil, err
		}
		items[i] = item
	}
	return items, nil
}

func (s Store) CreatePartnerExportRun(ctx context.Context, input CreatePartnerExportRunInput) (PartnerExportRun, error) {
	normalized, err := normalizeCreatePartnerExportRunInput(input)
	if err != nil {
		return PartnerExportRun{}, err
	}
	scopeJSON, err := json.Marshal(normalized.Scope)
	if err != nil {
		return PartnerExportRun{}, err
	}
	recordCountsJSON, err := json.Marshal(normalized.RecordCounts)
	if err != nil {
		return PartnerExportRun{}, err
	}
	payloadJSON, err := json.Marshal(normalized.Payload)
	if err != nil {
		return PartnerExportRun{}, err
	}
	row, err := s.db.InsertPartnerExportRun(ctx, &db.InsertPartnerExportRunParams{
		OrganisationID:    normalized.OrganisationID,
		RequestedByUserID: normalized.RequestedByUserID,
		Format:            normalized.Format,
		Column4:           scopeJSON,
		Column5:           recordCountsJSON,
		Checksum:          normalized.Checksum,
		Column7:           payloadJSON,
		CreatedAt:         pgtype.Timestamptz{Time: normalized.CreatedAt, Valid: true},
	})
	if err != nil {
		return PartnerExportRun{}, err
	}
	return toPartnerExportRun(row)
}

func (s Store) GetPartnerExportRun(ctx context.Context, exportID int64) (PartnerExportRun, error) {
	row, err := s.db.GetPartnerExportRun(ctx, exportID)
	if err != nil {
		return PartnerExportRun{}, err
	}
	return toPartnerExportRun(row)
}

func (s Store) GetPartnerExportRunForOrganisation(ctx context.Context, organisationID *int64, exportID int64) (PartnerExportRun, error) {
	row, err := s.db.GetPartnerExportRunForOrganisation(ctx, &db.GetPartnerExportRunForOrganisationParams{
		ID:             exportID,
		OrganisationID: organisationID,
	})
	if err != nil {
		return PartnerExportRun{}, err
	}
	return toPartnerExportRun(row)
}

func (s Store) GetLatestPartnerExportRun(ctx context.Context, organisationID *int64) (PartnerExportRun, error) {
	row, err := s.db.GetLatestPartnerExportRun(ctx, organisationID)
	if err != nil {
		return PartnerExportRun{}, err
	}
	return toPartnerExportRun(row)
}

func (s Store) ListPartnerExportRuns(ctx context.Context, organisationID *int64) ([]PartnerExportRun, error) {
	rows, err := s.db.ListPartnerExportRuns(ctx, organisationID)
	if err != nil {
		return nil, err
	}
	items := make([]PartnerExportRun, len(rows))
	for i, row := range rows {
		item, err := toPartnerExportRun(row)
		if err != nil {
			return nil, err
		}
		items[i] = item
	}
	return items, nil
}

func (s Store) listPartnerExportRuns(ctx context.Context, organisationID *int64) ([]PartnerExportRun, error) {
	return s.ListPartnerExportRuns(ctx, organisationID)
}

func (s Store) UpsertIntegrationStatusCheck(ctx context.Context, input UpsertIntegrationStatusCheckInput) (IntegrationStatusCheck, error) {
	normalized, err := normalizeUpsertIntegrationStatusCheckInput(input)
	if err != nil {
		return IntegrationStatusCheck{}, err
	}
	metadataJSON, err := json.Marshal(normalized.Metadata)
	if err != nil {
		return IntegrationStatusCheck{}, err
	}
	row, err := s.db.UpsertIntegrationStatusCheck(ctx, &db.UpsertIntegrationStatusCheckParams{
		OrganisationID: normalized.OrganisationID,
		CheckName:      normalized.CheckName,
		Status:         normalized.Status,
		Summary:        normalized.Summary,
		Column5:        metadataJSON,
		CheckedAt:      pgtype.Timestamptz{Time: normalized.CheckedAt, Valid: true},
	})
	if err != nil {
		return IntegrationStatusCheck{}, err
	}
	return toIntegrationStatusCheck(row)
}

func (s Store) ListIntegrationStatusChecks(ctx context.Context, organisationID *int64) ([]IntegrationStatusCheck, error) {
	rows, err := s.db.ListIntegrationStatusChecks(ctx, organisationID)
	if err != nil {
		return nil, err
	}
	items := make([]IntegrationStatusCheck, len(rows))
	for i, row := range rows {
		item, err := toIntegrationStatusCheck(row)
		if err != nil {
			return nil, err
		}
		items[i] = item
	}
	return items, nil
}

func (s Store) CreateAuditEvent(ctx context.Context, input CreateAuditEventInput) (AuditEvent, error) {
	normalized := normalizeCreateAuditEventInput(input)
	metadataJSON, err := json.Marshal(normalized.Metadata)
	if err != nil {
		return AuditEvent{}, err
	}
	row, err := s.db.InsertAuditEvent(ctx, &db.InsertAuditEventParams{
		ExternalID:     normalized.ExternalID,
		ClinicID:       normalized.ClinicID,
		ActorName:      normalized.ActorName,
		EventType:      normalized.EventType,
		Summary:        normalized.Summary,
		CreatedAt:      pgtype.Timestamptz{Time: normalized.CreatedAt, Valid: true},
		ActorUserID:    normalized.ActorUserID,
		ActorRole:      normalized.ActorRole,
		OrganisationID: normalized.OrganisationID,
		EntityType:     normalized.EntityType,
		EntityID:       normalized.EntityID,
		Column12:       metadataJSON,
	})
	if err != nil {
		return AuditEvent{}, err
	}
	return toAuditEvent(row)
}

func (s Store) ListClinicAuditEvents(ctx context.Context, clinicID string) ([]AuditEvent, error) {
	rows, err := s.db.ListClinicAuditEvents(ctx, &clinicID)
	if err != nil {
		return nil, err
	}
	items := make([]AuditEvent, len(rows))
	for i, row := range rows {
		item, err := toAuditEvent(row)
		if err != nil {
			return nil, err
		}
		items[i] = item
	}
	return items, nil
}

func (s Store) ListAdminAuditEvents(ctx context.Context, organisationID *int64, limit int) ([]AdminAuditEventRow, error) {
	rows, err := s.db.ListAdminAuditEvents(ctx, &db.ListAdminAuditEventsParams{
		OrganisationID: organisationID,
		Limit:          int32(limit),
	})
	if err != nil {
		return nil, err
	}
	items := make([]AdminAuditEventRow, len(rows))
	for i, row := range rows {
		item, err := toAuditEvent(row)
		if err != nil {
			return nil, err
		}
		items[i] = item
	}
	return items, nil
}

func strOrZero(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func int64OrZero(i *int64) int64 {
	if i == nil {
		return 0
	}
	return *i
}
