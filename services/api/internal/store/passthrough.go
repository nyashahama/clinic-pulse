package store

import (
	"context"
	"encoding/json"
	"time"

	"clinicpulse/services/api/internal/store/db"

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
		ClinicID:           &normalized.ClinicID,
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
