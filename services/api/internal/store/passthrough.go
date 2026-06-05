package store

import (
	"context"
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
