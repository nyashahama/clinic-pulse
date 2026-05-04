package service

import (
	"context"
	"time"

	"clinicpulse/services/api/internal/store"
)

type StalenessStore interface {
	ListCurrentStatuses(ctx context.Context) ([]store.CurrentStatus, error)
	UpdateCurrentStatusFreshness(ctx context.Context, clinicID string, freshness string, updatedAt time.Time, audit *store.CreateAuditEventInput) (store.CurrentStatus, bool, error)
}

type ReviewScopedStalenessStore interface {
	StalenessStore
	ListCurrentStatusesForReviewScope(ctx context.Context, scope store.ReportReviewScope) ([]store.CurrentStatus, error)
}

type StalenessReconciliationResult struct {
	Checked                 int `json:"checked"`
	MarkedNeedsConfirmation int `json:"markedNeedsConfirmation"`
	MarkedStale             int `json:"markedStale"`
}

func FreshnessForStatusAge(age time.Duration) string {
	switch {
	case age >= 24*time.Hour:
		return "stale"
	case age >= 12*time.Hour:
		return "needs_confirmation"
	default:
		return "fresh"
	}
}

func ReconcileStatusFreshness(ctx context.Context, stalenessStore StalenessStore, actor AuditActor, now time.Time) (StalenessReconciliationResult, error) {
	statuses, err := stalenessStore.ListCurrentStatuses(ctx)
	if err != nil {
		return StalenessReconciliationResult{}, err
	}

	return reconcileStatuses(ctx, stalenessStore, statuses, actor, now)
}

func ReconcileStatusFreshnessForReviewScope(ctx context.Context, stalenessStore ReviewScopedStalenessStore, scope store.ReportReviewScope, actor AuditActor, now time.Time) (StalenessReconciliationResult, error) {
	statuses, err := stalenessStore.ListCurrentStatusesForReviewScope(ctx, scope)
	if err != nil {
		return StalenessReconciliationResult{}, err
	}

	return reconcileStatuses(ctx, stalenessStore, statuses, actor, now)
}

func reconcileStatuses(ctx context.Context, stalenessStore StalenessStore, statuses []store.CurrentStatus, actor AuditActor, now time.Time) (StalenessReconciliationResult, error) {
	result := StalenessReconciliationResult{Checked: len(statuses)}
	for _, status := range statuses {
		if status.LastReportedAt == nil {
			continue
		}
		freshness := FreshnessForStatusAge(now.Sub(*status.LastReportedAt))
		if !shouldEscalateFreshness(status.Freshness, freshness) {
			continue
		}

		audit := stalenessTransitionAudit(status.ClinicID, freshness, actor)
		_, updated, err := stalenessStore.UpdateCurrentStatusFreshness(ctx, status.ClinicID, freshness, now, &audit)
		if err != nil {
			return StalenessReconciliationResult{}, err
		}
		if !updated {
			continue
		}
		switch freshness {
		case "needs_confirmation":
			result.MarkedNeedsConfirmation++
		case "stale":
			result.MarkedStale++
		}
	}

	return result, nil
}

func shouldEscalateFreshness(current string, next string) bool {
	switch current {
	case "fresh":
		return next == "needs_confirmation" || next == "stale"
	case "needs_confirmation":
		return next == "stale"
	default:
		return false
	}
}

func stalenessTransitionAudit(clinicID string, freshness string, actor AuditActor) store.CreateAuditEventInput {
	return auditEventWithActor(store.CreateAuditEventInput{
		ClinicID:  &clinicID,
		EventType: "clinic.status_marked_stale",
		Summary:   "Clinic status freshness changed to " + freshness + ".",
		Metadata:  map[string]any{"freshness": freshness},
	}, actor)
}
