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

func ReconcileStatusFreshness(ctx context.Context, store StalenessStore, actor AuditActor, now time.Time) (StalenessReconciliationResult, error) {
	statuses, err := store.ListCurrentStatuses(ctx)
	if err != nil {
		return StalenessReconciliationResult{}, err
	}

	result := StalenessReconciliationResult{Checked: len(statuses)}
	for _, status := range statuses {
		ageFrom := status.UpdatedAt
		if status.LastReportedAt != nil {
			ageFrom = *status.LastReportedAt
		}
		freshness := FreshnessForStatusAge(now.Sub(ageFrom))
		if freshness == status.Freshness {
			continue
		}

		audit := stalenessTransitionAudit(status.ClinicID, freshness, actor)
		_, updated, err := store.UpdateCurrentStatusFreshness(ctx, status.ClinicID, freshness, now, &audit)
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

func stalenessTransitionAudit(clinicID string, freshness string, actor AuditActor) store.CreateAuditEventInput {
	return auditEventWithActor(store.CreateAuditEventInput{
		ClinicID:  &clinicID,
		EventType: "clinic.status_marked_stale",
		Summary:   "Clinic status freshness changed to " + freshness + ".",
		Metadata:  map[string]any{"freshness": freshness},
	}, actor)
}
