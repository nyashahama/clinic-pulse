package service

import (
	"context"
	"testing"
	"time"

	"clinicpulse/services/api/internal/store"
)

func TestReconcileStatusFreshnessMarksNeedsConfirmationAfterTwelveHours(t *testing.T) {
	now := fixedStalenessNow()
	lastReportedAt := now.Add(-12 * time.Hour)
	fake := &fakeStalenessStore{
		statuses: []store.CurrentStatus{{
			ClinicID:       "clinic-1",
			Freshness:      "fresh",
			LastReportedAt: &lastReportedAt,
		}},
	}

	result, err := ReconcileStatusFreshness(context.Background(), fake, AuditActor{}, now)
	if err != nil {
		t.Fatalf("ReconcileStatusFreshness returned error: %v", err)
	}

	if result.Checked != 1 || result.MarkedNeedsConfirmation != 1 || result.MarkedStale != 0 {
		t.Fatalf("unexpected reconciliation result: %#v", result)
	}
	if len(fake.updates) != 1 || fake.updates[0].freshness != "needs_confirmation" {
		t.Fatalf("expected one needs_confirmation update, got %#v", fake.updates)
	}
}

func TestReconcileStatusFreshnessMarksStaleAfterTwentyFourHours(t *testing.T) {
	now := fixedStalenessNow()
	lastReportedAt := now.Add(-24 * time.Hour)
	fake := &fakeStalenessStore{
		statuses: []store.CurrentStatus{{
			ClinicID:       "clinic-1",
			Freshness:      "needs_confirmation",
			LastReportedAt: &lastReportedAt,
		}},
	}

	result, err := ReconcileStatusFreshness(context.Background(), fake, AuditActor{}, now)
	if err != nil {
		t.Fatalf("ReconcileStatusFreshness returned error: %v", err)
	}

	if result.Checked != 1 || result.MarkedNeedsConfirmation != 0 || result.MarkedStale != 1 {
		t.Fatalf("unexpected reconciliation result: %#v", result)
	}
	if len(fake.updates) != 1 || fake.updates[0].freshness != "stale" {
		t.Fatalf("expected one stale update, got %#v", fake.updates)
	}
}

func TestReconcileStatusFreshnessDoesNotRewriteAlreadyCorrectFreshness(t *testing.T) {
	now := fixedStalenessNow()
	freshReportedAt := now.Add(-11*time.Hour - 59*time.Minute)
	confirmationReportedAt := now.Add(-12 * time.Hour)
	staleReportedAt := now.Add(-25 * time.Hour)
	fake := &fakeStalenessStore{
		statuses: []store.CurrentStatus{
			{ClinicID: "fresh-clinic", Freshness: "fresh", LastReportedAt: &freshReportedAt},
			{ClinicID: "confirm-clinic", Freshness: "needs_confirmation", LastReportedAt: &confirmationReportedAt},
			{ClinicID: "stale-clinic", Freshness: "stale", LastReportedAt: &staleReportedAt},
		},
	}

	result, err := ReconcileStatusFreshness(context.Background(), fake, AuditActor{}, now)
	if err != nil {
		t.Fatalf("ReconcileStatusFreshness returned error: %v", err)
	}

	if result.Checked != 3 || result.MarkedNeedsConfirmation != 0 || result.MarkedStale != 0 {
		t.Fatalf("unexpected reconciliation result: %#v", result)
	}
	if len(fake.updates) != 0 {
		t.Fatalf("expected no updates, got %#v", fake.updates)
	}
}

func TestReconcileStatusFreshnessSkipsNilLastReportedAt(t *testing.T) {
	now := fixedStalenessNow()
	fake := &fakeStalenessStore{
		statuses: []store.CurrentStatus{{
			ClinicID:  "clinic-1",
			Freshness: "fresh",
			UpdatedAt: now.Add(-48 * time.Hour),
		}},
	}

	result, err := ReconcileStatusFreshness(context.Background(), fake, AuditActor{}, now)
	if err != nil {
		t.Fatalf("ReconcileStatusFreshness returned error: %v", err)
	}

	if result.Checked != 1 || result.MarkedNeedsConfirmation != 0 || result.MarkedStale != 0 {
		t.Fatalf("unexpected reconciliation result: %#v", result)
	}
	if len(fake.updates) != 0 {
		t.Fatalf("expected nil LastReportedAt row not to update, got %#v", fake.updates)
	}
}

func TestReconcileStatusFreshnessDoesNotMoveBackToFresh(t *testing.T) {
	now := fixedStalenessNow()
	recentReportedAt := now.Add(-2 * time.Hour)
	fake := &fakeStalenessStore{
		statuses: []store.CurrentStatus{
			{ClinicID: "confirm-clinic", Freshness: "needs_confirmation", LastReportedAt: &recentReportedAt},
			{ClinicID: "stale-clinic", Freshness: "stale", LastReportedAt: &recentReportedAt},
		},
	}

	result, err := ReconcileStatusFreshness(context.Background(), fake, AuditActor{}, now)
	if err != nil {
		t.Fatalf("ReconcileStatusFreshness returned error: %v", err)
	}

	if result.Checked != 2 || result.MarkedNeedsConfirmation != 0 || result.MarkedStale != 0 {
		t.Fatalf("unexpected reconciliation result: %#v", result)
	}
	if len(fake.updates) != 0 {
		t.Fatalf("expected no downgrade to fresh, got %#v", fake.updates)
	}
}

func TestReconcileStatusFreshnessWritesAuditForTransitions(t *testing.T) {
	now := fixedStalenessNow()
	orgID := int64(7)
	lastReportedAt := now.Add(-24 * time.Hour)
	actor := AuditActor{
		UserID:         42,
		Name:           "District Manager",
		Role:           "district_manager",
		OrganisationID: &orgID,
	}
	fake := &fakeStalenessStore{
		statuses: []store.CurrentStatus{{
			ClinicID:       "clinic-1",
			Freshness:      "fresh",
			LastReportedAt: &lastReportedAt,
		}},
	}

	result, err := ReconcileStatusFreshness(context.Background(), fake, actor, now)
	if err != nil {
		t.Fatalf("ReconcileStatusFreshness returned error: %v", err)
	}

	if result.Checked != 1 || result.MarkedStale != 1 {
		t.Fatalf("unexpected reconciliation result: %#v", result)
	}
	if len(fake.updates) != 1 || fake.updates[0].audit == nil {
		t.Fatalf("expected one audited update, got %#v", fake.updates)
	}
	audit := fake.updates[0].audit
	if audit.ClinicID == nil || *audit.ClinicID != "clinic-1" {
		t.Fatalf("expected clinic audit for clinic-1, got %#v", audit.ClinicID)
	}
	if audit.EventType != "clinic.status_marked_stale" {
		t.Fatalf("expected clinic.status_marked_stale event, got %q", audit.EventType)
	}
	if audit.Summary != "Clinic status freshness changed to stale." {
		t.Fatalf("unexpected audit summary %q", audit.Summary)
	}
	if audit.ActorUserID == nil || *audit.ActorUserID != 42 {
		t.Fatalf("expected actor user id 42, got %v", audit.ActorUserID)
	}
	if audit.ActorRole == nil || *audit.ActorRole != "district_manager" {
		t.Fatalf("expected actor role district_manager, got %v", audit.ActorRole)
	}
	if audit.OrganisationID == nil || *audit.OrganisationID != orgID {
		t.Fatalf("expected organisation id %d, got %v", orgID, audit.OrganisationID)
	}
	if audit.Metadata["freshness"] != "stale" {
		t.Fatalf("unexpected audit metadata: %#v", audit.Metadata)
	}
}

func TestReconcileStatusFreshnessForReviewScopeListsOnlyScopedStatuses(t *testing.T) {
	now := fixedStalenessNow()
	lastReportedAt := now.Add(-24 * time.Hour)
	district := "Review District"
	scope := store.ReportReviewScope{Role: "district_manager", District: &district}
	fake := &fakeStalenessStore{
		statuses: []store.CurrentStatus{{
			ClinicID:       "clinic-in-district",
			Freshness:      "fresh",
			LastReportedAt: &lastReportedAt,
		}},
	}

	result, err := ReconcileStatusFreshnessForReviewScope(context.Background(), fake, scope, AuditActor{}, now)
	if err != nil {
		t.Fatalf("ReconcileStatusFreshnessForReviewScope returned error: %v", err)
	}

	if fake.scope == nil || fake.scope.Role != "district_manager" || fake.scope.District == nil || *fake.scope.District != district {
		t.Fatalf("expected store to receive review scope %#v, got %#v", scope, fake.scope)
	}
	if result.Checked != 1 || result.MarkedStale != 1 {
		t.Fatalf("unexpected reconciliation result: %#v", result)
	}
	if len(fake.updates) != 1 || fake.updates[0].clinicID != "clinic-in-district" {
		t.Fatalf("expected only scoped status to be reconciled, got %#v", fake.updates)
	}
}

func fixedStalenessNow() time.Time {
	return time.Date(2026, 5, 3, 12, 0, 0, 0, time.UTC)
}

type fakeStalenessStore struct {
	statuses  []store.CurrentStatus
	updates   []stalenessUpdate
	scope     *store.ReportReviewScope
	listErr   error
	updateErr error
}

type stalenessUpdate struct {
	clinicID  string
	freshness string
	updatedAt time.Time
	audit     *store.CreateAuditEventInput
}

func (f *fakeStalenessStore) ListCurrentStatuses(context.Context) ([]store.CurrentStatus, error) {
	return f.statuses, f.listErr
}

func (f *fakeStalenessStore) ListCurrentStatusesForReviewScope(_ context.Context, scope store.ReportReviewScope) ([]store.CurrentStatus, error) {
	f.scope = &scope
	return f.statuses, f.listErr
}

func (f *fakeStalenessStore) UpdateCurrentStatusFreshness(_ context.Context, clinicID string, freshness string, updatedAt time.Time, audit *store.CreateAuditEventInput) (store.CurrentStatus, bool, error) {
	if f.updateErr != nil {
		return store.CurrentStatus{}, false, f.updateErr
	}
	f.updates = append(f.updates, stalenessUpdate{
		clinicID:  clinicID,
		freshness: freshness,
		updatedAt: updatedAt,
		audit:     audit,
	})
	return store.CurrentStatus{ClinicID: clinicID, Freshness: freshness, UpdatedAt: updatedAt}, true, nil
}
