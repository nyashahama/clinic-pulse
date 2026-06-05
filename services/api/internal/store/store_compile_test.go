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
	var _ func(Store, context.Context, *int64) ([]AdminUserAccessRow, error) = Store.ListAdminUserAccess
	var _ func(Store, context.Context, *int64, int) ([]AdminAuditEventRow, error) = Store.ListAdminAuditEvents
	var _ func(Store, context.Context, *int64, int) ([]PilotIngestionRun, error) = Store.ListPilotIngestionRuns
	var _ func(Store, context.Context, CreateAuditEventInput) (AuditEvent, error) = Store.CreateAuditEvent
	var _ func(Store, context.Context, CreateReportInput) (Report, CurrentStatus, AuditEvent, error) = Store.CreateReportTx
	var _ func(Store, context.Context, CreateReportInput) (Report, error) = Store.CreatePendingReportTx
	var _ func(Store, context.Context, CreateReportInput) (Report, error) = Store.GetPendingReportByPayload
	var _ func(Store, context.Context, CreateReportInput, time.Time) (Report, error) = Store.GetRecentReportByPayload
	var _ func(Store, context.Context, ReportReviewScope) ([]Report, error) = Store.ListPendingReports
	var _ func(Store, context.Context, ReviewReportInput) (Report, *CurrentStatus, error) = Store.ReviewReportTx
	var _ func(Store, context.Context, string) (User, error) = Store.GetUserByEmail
	var _ func(Store, context.Context, CreateAdminUserWithAccessInput) (User, OrganisationMembership, AuditEvent, error) = Store.CreateAdminUserWithAccessTx
	var _ func(Store, context.Context, CreateSessionInput) (Session, error) = Store.CreateSession
	var _ func(Store, context.Context, CreateSessionWithAuditInput) (Session, AuditEvent, error) = Store.CreateSessionWithAuditTx
	var _ func(Store, context.Context, string) (Session, User, error) = Store.GetSessionByTokenHash
	var _ func(Store, context.Context, string) error = Store.RevokeSession
	var _ func(Store, context.Context, int64) ([]OrganisationMembership, error) = Store.ListMembershipsForUser
	var _ func(Store) = Store.Close
}

func TestListAdminAuditEventsSQLOrdersRecentEventsAndLimits(t *testing.T) {
	t.Parallel()

	if !strings.Contains(listAdminAuditEventsSQL, "ORDER BY created_at DESC, id DESC") {
		t.Fatal("expected admin audit event SQL to order newest events first")
	}
	if !strings.Contains(listAdminAuditEventsSQL, "LIMIT $2") {
		t.Fatal("expected admin audit event SQL to use caller-provided limit parameter")
	}
}

func TestListPilotIngestionRunsSQLScopesOrganisationAndLimits(t *testing.T) {
	t.Parallel()

	if !strings.Contains(listPilotIngestionRunsSQL, "WHERE $1::bigint IS NULL OR organisation_id = $1") {
		t.Fatal("expected pilot ingestion runs SQL to scope by organisation id when present")
	}
	if !strings.Contains(listPilotIngestionRunsSQL, "ORDER BY started_at DESC, id DESC") {
		t.Fatal("expected pilot ingestion runs SQL to order newest runs first")
	}
	if !strings.Contains(listPilotIngestionRunsSQL, "LIMIT $2") {
		t.Fatal("expected pilot ingestion runs SQL to apply caller limit")
	}
}

func TestOfflineSyncStoreMethodSignatures(t *testing.T) {
	t.Parallel()

	var _ func(Store, context.Context, string) (Report, error) = Store.GetReportByExternalID
	var _ func(Store, context.Context, CreateReportInput) (Report, error) = Store.GetPendingReportByPayload
	var _ func(Store, context.Context, CreateReportInput, time.Time) (Report, error) = Store.GetRecentReportByPayload
	var _ func(Store, context.Context, CreateReportSyncAttemptInput) (ReportSyncAttempt, error) = Store.CreateReportSyncAttempt
	var _ func(Store, context.Context, time.Time) (SyncSummary, error) = Store.GetSyncSummarySince
	var _ func(Store, context.Context, time.Time, ReportReviewScope) (SyncSummary, error) = Store.GetSyncSummarySinceForReviewScope
	var _ func(Store, context.Context) ([]CurrentStatus, error) = Store.ListCurrentStatuses
	var _ func(Store, context.Context, ReportReviewScope) ([]CurrentStatus, error) = Store.ListCurrentStatusesForReviewScope
	var _ func(Store, context.Context, string, string, time.Time, *CreateAuditEventInput) (CurrentStatus, bool, error) = Store.UpdateCurrentStatusFreshness
}

func TestRecentReportByPayloadSQLUsesDuplicateWindowWithoutReviewStateFilter(t *testing.T) {
	t.Parallel()

	if !strings.Contains(getRecentReportByPayloadSQL, "WHERE received_at >= $9") {
		t.Fatal("expected recent duplicate lookup to constrain the report window")
	}
	if strings.Contains(getRecentReportByPayloadSQL, "review_state = 'pending'") {
		t.Fatal("expected recent duplicate lookup to include reviewed reports")
	}
	if !strings.Contains(getRecentReportByPayloadSQL, "submitted_by_user_id IS NOT DISTINCT FROM $8::bigint") {
		t.Fatal("expected recent duplicate lookup to scope duplicates to the same reporter")
	}
}

func TestReportDuplicatePayloadSQLIgnoresNotes(t *testing.T) {
	t.Parallel()

	for name, query := range map[string]string{
		"pending": getPendingReportByPayloadSQL,
		"recent":  getRecentReportByPayloadSQL,
	} {
		t.Run(name, func(t *testing.T) {
			if strings.Contains(query, "notes IS NOT DISTINCT") {
				t.Fatal("expected duplicate lookup to ignore note changes within the same operational signal")
			}
		})
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
