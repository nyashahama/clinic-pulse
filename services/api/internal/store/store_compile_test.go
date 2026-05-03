package store

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func TestStorePublicAPICompiles(t *testing.T) {
	t.Parallel()

	var _ func(context.Context, string) (*pgxpool.Pool, error) = Open
	var _ func(*pgxpool.Pool) Store = New
	var _ func(Store, context.Context) ([]ClinicDetail, error) = Store.ListClinics
	var _ func(Store, context.Context, string) (ClinicDetail, error) = Store.GetClinic
	var _ func(Store, context.Context, string) (CurrentStatus, error) = Store.GetCurrentStatus
	var _ func(Store, context.Context, string) ([]Report, error) = Store.ListClinicReports
	var _ func(Store, context.Context, string) ([]AuditEvent, error) = Store.ListClinicAuditEvents
	var _ func(Store, context.Context, CreateAuditEventInput) (AuditEvent, error) = Store.CreateAuditEvent
	var _ func(Store, context.Context, CreateReportInput) (Report, CurrentStatus, AuditEvent, error) = Store.CreateReportTx
	var _ func(Store, context.Context, CreateReportInput) (Report, error) = Store.CreatePendingReportTx
	var _ func(Store, context.Context, ReportReviewScope) ([]Report, error) = Store.ListPendingReports
	var _ func(Store, context.Context, ReviewReportInput) (Report, *CurrentStatus, error) = Store.ReviewReportTx
	var _ func(Store, context.Context, string) (User, error) = Store.GetUserByEmail
	var _ func(Store, context.Context, CreateSessionInput) (Session, error) = Store.CreateSession
	var _ func(Store, context.Context, CreateSessionWithAuditInput) (Session, AuditEvent, error) = Store.CreateSessionWithAuditTx
	var _ func(Store, context.Context, string) (Session, User, error) = Store.GetSessionByTokenHash
	var _ func(Store, context.Context, string) error = Store.RevokeSession
	var _ func(Store, context.Context, int64) ([]OrganisationMembership, error) = Store.ListMembershipsForUser
	var _ func(Store) = Store.Close
}

func TestOfflineSyncStoreMethodSignatures(t *testing.T) {
	t.Parallel()

	var _ func(Store, context.Context, string) (Report, error) = Store.GetReportByExternalID
	var _ func(Store, context.Context, CreateReportSyncAttemptInput) (ReportSyncAttempt, error) = Store.CreateReportSyncAttempt
	var _ func(Store, context.Context, time.Time) (SyncSummary, error) = Store.GetSyncSummarySince
	var _ func(Store, context.Context, time.Time, ReportReviewScope) (SyncSummary, error) = Store.GetSyncSummarySinceForReviewScope
	var _ func(Store, context.Context) ([]CurrentStatus, error) = Store.ListCurrentStatuses
	var _ func(Store, context.Context, ReportReviewScope) ([]CurrentStatus, error) = Store.ListCurrentStatusesForReviewScope
	var _ func(Store, context.Context, string, string, time.Time, *CreateAuditEventInput) (CurrentStatus, bool, error) = Store.UpdateCurrentStatusFreshness
}

func TestSyncSummarySinceScopesPendingOfflineReportsToWindow(t *testing.T) {
	t.Parallel()

	start := strings.Index(syncSummarySinceSQL, "pending_offline AS")
	end := strings.Index(syncSummarySinceSQL, "current_status_counts AS")
	if start == -1 || end == -1 || end <= start {
		t.Fatal("expected sync summary SQL to include pending_offline before current_status_counts")
	}
	pendingOfflineCTE := syncSummarySinceSQL[start:end]
	if !strings.Contains(pendingOfflineCTE, "AND received_at >= $1") {
		t.Fatal("expected pending_offline CTE to filter reports by the summary window")
	}
}

func TestSyncSummaryForReviewScopeSQLScopesClinicRowsForDistrictManagers(t *testing.T) {
	t.Parallel()

	if !strings.Contains(syncSummarySinceForReviewScopeSQL, "LEFT JOIN clinics") {
		t.Fatal("expected sync attempt counts to join clinics so district summaries can scope by clinic district")
	}
	if !strings.Contains(syncSummarySinceForReviewScopeSQL, "report_sync_attempts.clinic_id IS NOT NULL") {
		t.Fatal("expected district summaries to exclude sync attempts without clinic ids")
	}
	if !strings.Contains(syncSummarySinceForReviewScopeSQL, "JOIN clinics ON clinics.id = reports.clinic_id") {
		t.Fatal("expected pending offline reports to join clinics for district scope")
	}
	if !strings.Contains(syncSummarySinceForReviewScopeSQL, "JOIN clinics ON clinics.id = current_status.clinic_id") {
		t.Fatal("expected current status counts to join clinics for district scope")
	}
	if !strings.Contains(syncSummarySinceForReviewScopeSQL, "($2 = 'district_manager' AND $3::text IS NOT NULL AND clinics.district = $3)") {
		t.Fatal("expected review scope role and district parameters in scoped summary SQL")
	}
}

func TestListCurrentStatusesForReviewScopeSQLScopesByClinicDistrict(t *testing.T) {
	t.Parallel()

	if !strings.Contains(listCurrentStatusesForReviewScopeSQL, "JOIN clinics ON clinics.id = current_status.clinic_id") {
		t.Fatal("expected scoped current status list to join clinics")
	}
	if !strings.Contains(listCurrentStatusesForReviewScopeSQL, "($1 = 'district_manager' AND $2::text IS NOT NULL AND clinics.district = $2)") {
		t.Fatal("expected district manager current status scope predicate")
	}
	if !strings.Contains(listCurrentStatusesForReviewScopeSQL, "$1 IN ('org_admin', 'system_admin')") {
		t.Fatal("expected org/system admins to retain all-district current status access")
	}
}

func TestNormalizeCreateReportInputDoesNotInventRequiredReportFields(t *testing.T) {
	t.Parallel()

	input := CreateReportInput{}

	normalized := normalizeCreateReportInput(input)

	if normalized.Source != "" {
		t.Fatalf("expected source to remain empty, got %q", normalized.Source)
	}
	if normalized.Status != "" {
		t.Fatalf("expected status to remain empty, got %q", normalized.Status)
	}
}

func TestCreateReportTxRejectsNonAcceptedReportsBeforeDatabaseWork(t *testing.T) {
	t.Parallel()

	_, _, _, err := Store{}.CreateReportTx(context.Background(), CreateReportInput{
		ClinicID:    "clinic-id",
		ReviewState: "pending",
	})

	if !errors.Is(err, ErrReportNotAccepted) {
		t.Fatalf("expected ErrReportNotAccepted, got %v", err)
	}
}

func TestCreatePendingReportTxRejectsAcceptedReportsBeforeDatabaseWork(t *testing.T) {
	t.Parallel()

	_, err := Store{}.CreatePendingReportTx(context.Background(), CreateReportInput{
		ClinicID:    "clinic-id",
		ReviewState: "accepted",
	})

	if !errors.Is(err, ErrReportNotPending) {
		t.Fatalf("expected ErrReportNotPending, got %v", err)
	}
}

func TestReviewReportTxRejectsInvalidDecisionBeforeDatabaseWork(t *testing.T) {
	t.Parallel()

	_, _, err := Store{}.ReviewReportTx(context.Background(), ReviewReportInput{
		ReportID:       1,
		ReviewerUserID: 42,
		Decision:       "maybe",
	})

	if !errors.Is(err, ErrInvalidReviewDecision) {
		t.Fatalf("expected ErrInvalidReviewDecision, got %v", err)
	}
}

func TestCreateReportSyncAttemptRejectsInvalidResultBeforeDatabaseWork(t *testing.T) {
	t.Parallel()

	_, err := Store{}.CreateReportSyncAttempt(context.Background(), CreateReportSyncAttemptInput{
		ExternalID: "offline-sync-invalid-result",
		ClinicID:   "clinic-id",
		Result:     "unexpected",
	})

	if !errors.Is(err, ErrInvalidSyncAttemptResult) {
		t.Fatalf("expected ErrInvalidSyncAttemptResult, got %v", err)
	}
}

func TestReviewScopeCanAccessDistrictUsesExplicitAllowlist(t *testing.T) {
	t.Parallel()

	district := "Tshwane North Demo District"

	tests := []struct {
		name  string
		scope ReportReviewScope
		want  bool
	}{
		{name: "district manager matching district", scope: ReportReviewScope{Role: "district_manager", District: &district}, want: true},
		{name: "district manager missing district", scope: ReportReviewScope{Role: "district_manager"}, want: false},
		{name: "system admin", scope: ReportReviewScope{Role: "system_admin"}, want: true},
		{name: "org admin", scope: ReportReviewScope{Role: "org_admin"}, want: true},
		{name: "empty role denied", scope: ReportReviewScope{}, want: false},
		{name: "unknown role denied", scope: ReportReviewScope{Role: "reporter"}, want: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := reviewScopeCanAccessDistrict(tt.scope, district); got != tt.want {
				t.Fatalf("expected access %t, got %t", tt.want, got)
			}
		})
	}
}

func TestCreateSessionRejectsCIDRIPAddressBeforeDatabaseWork(t *testing.T) {
	t.Parallel()

	ipAddress := "192.0.2.10/24"

	_, err := Store{}.CreateSession(context.Background(), CreateSessionInput{
		UserID:    1,
		TokenHash: strings.Repeat("a", 64),
		ExpiresAt: time.Now().Add(time.Hour),
		IPAddress: &ipAddress,
	})

	if !errors.Is(err, ErrInvalidSessionIPAddress) {
		t.Fatalf("expected ErrInvalidSessionIPAddress, got %v", err)
	}
}

func TestNormalizeCreateReportInputAppliesStoreOwnedDefaults(t *testing.T) {
	t.Parallel()

	normalized := normalizeCreateReportInput(CreateReportInput{})

	if normalized.ReviewState != "accepted" {
		t.Fatalf("expected review state accepted, got %q", normalized.ReviewState)
	}
	if normalized.ConfidenceScore == nil || *normalized.ConfidenceScore != 0.75 {
		t.Fatalf("expected confidence score 0.75, got %v", normalized.ConfidenceScore)
	}
	if normalized.Freshness != "fresh" {
		t.Fatalf("expected freshness fresh, got %q", normalized.Freshness)
	}
	if normalized.SubmittedAt.IsZero() {
		t.Fatal("expected submitted at default")
	}
	if normalized.ReceivedAt.IsZero() {
		t.Fatal("expected received at default")
	}
	if time.Since(normalized.SubmittedAt) > time.Minute {
		t.Fatalf("expected submitted at to default to current time, got %s", normalized.SubmittedAt)
	}
}
