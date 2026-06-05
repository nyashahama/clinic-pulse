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

func strOrZero(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}



