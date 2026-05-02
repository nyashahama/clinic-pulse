package store

import (
	"context"
	"errors"
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
	var _ func(Store, context.Context, CreateReportInput) (Report, CurrentStatus, AuditEvent, error) = Store.CreateReportTx
	var _ func(Store) = Store.Close
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
