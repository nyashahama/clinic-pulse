package store

import (
	"context"
	"database/sql"
	"errors"
	"os"
	"strconv"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
)

func TestReportReviewQueriesIntegration(t *testing.T) {
	databaseURL := os.Getenv("AUTH_STORE_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("set AUTH_STORE_TEST_DATABASE_URL to run report review store integration tests")
	}

	ctx := context.Background()
	store := newIntegrationStore(t, ctx, databaseURL)

	reporterID := insertIntegrationUser(t, ctx, store, "review-reporter@example.test", "Review Reporter", nil, nil)
	reviewerID := insertIntegrationUser(t, ctx, store, "reviewer@example.test", "District Reviewer", nil, nil)
	orgID := insertIntegrationOrganisation(t, ctx, store, "Review District", "review-district")
	insertIntegrationClinic(t, ctx, store, "clinic-review-accept", "Review Accept Clinic")
	insertIntegrationClinic(t, ctx, store, "clinic-review-reject", "Review Reject Clinic")
	insertIntegrationClinicInDistrict(t, ctx, store, "clinic-review-other-district", "Other District Clinic", "Other District")

	reason := "Power disruption"
	staffPressure := "strained"
	stockPressure := "low"
	queuePressure := "moderate"
	submittedAt := time.Date(2026, 5, 3, 10, 0, 0, 0, time.UTC)
	reporterRole := "reporter"
	reviewerRole := "district_manager"
	reportEntityType := "report"
	report, err := store.CreatePendingReportTx(ctx, CreateReportInput{
		ClinicID:          "clinic-review-accept",
		ReporterName:      stringPtr("Field Reporter"),
		Source:            "field_worker",
		SubmittedAt:       submittedAt,
		Status:            "degraded",
		Reason:            &reason,
		StaffPressure:     &staffPressure,
		StockPressure:     &stockPressure,
		QueuePressure:     &queuePressure,
		SubmittedByUserID: &reporterID,
		AuditEvent: &CreateAuditEventInput{
			ClinicID:       stringPtr("clinic-review-accept"),
			ActorName:      stringPtr("Review Reporter"),
			EventType:      "report.submitted",
			Summary:        "Report submitted for review.",
			ActorUserID:    &reporterID,
			ActorRole:      &reporterRole,
			OrganisationID: &orgID,
			EntityType:     &reportEntityType,
			Metadata: map[string]any{
				"reviewState": "pending",
				"status":      "degraded",
			},
		},
	})
	if err != nil {
		t.Fatalf("CreatePendingReportTx returned error: %v", err)
	}
	if report.ReviewState != "pending" || report.SubmittedByUserID == nil || *report.SubmittedByUserID != reporterID {
		t.Fatalf("unexpected pending report: %+v", report)
	}
	if _, err := store.GetCurrentStatus(ctx, "clinic-review-accept"); err != pgx.ErrNoRows {
		t.Fatalf("expected pending create not to update current status, got %v", err)
	}
	submissionAudit := assertIntegrationAuditEvent(t, ctx, store, "clinic-review-accept", "report.submitted")
	if submissionAudit.ActorUserID == nil || *submissionAudit.ActorUserID != reporterID {
		t.Fatalf("expected submission actor user id %d, got %+v", reporterID, submissionAudit.ActorUserID)
	}
	if submissionAudit.EntityID == nil || *submissionAudit.EntityID != strconv.FormatInt(report.ID, 10) {
		t.Fatalf("expected submission entity id %d, got %+v", report.ID, submissionAudit.EntityID)
	}
	if submissionAudit.Metadata["reviewState"] != "pending" {
		t.Fatalf("expected pending submission audit metadata, got %#v", submissionAudit.Metadata)
	}

	pending, err := store.ListPendingReports(ctx, ReportReviewScope{Role: "system_admin"})
	if err != nil {
		t.Fatalf("ListPendingReports returned error: %v", err)
	}
	if len(pending) == 0 || pending[0].ReviewState != "pending" {
		t.Fatalf("expected pending reports, got %+v", pending)
	}
	orgPending, err := store.ListPendingReports(ctx, ReportReviewScope{Role: "org_admin"})
	if err != nil {
		t.Fatalf("ListPendingReports org_admin returned error: %v", err)
	}
	if len(orgPending) == 0 {
		t.Fatal("expected org admin to see pending reports")
	}
	for _, scope := range []ReportReviewScope{
		{},
		{Role: "reporter"},
		{Role: "unknown"},
	} {
		got, err := store.ListPendingReports(ctx, scope)
		if err != nil {
			t.Fatalf("ListPendingReports denied scope %#v returned error: %v", scope, err)
		}
		if len(got) != 0 {
			t.Fatalf("expected denied scope %#v to see no pending reports, got %+v", scope, got)
		}
	}

	otherDistrictReport, err := store.CreatePendingReportTx(ctx, CreateReportInput{
		ClinicID:          "clinic-review-other-district",
		ReporterName:      stringPtr("Field Reporter"),
		Source:            "field_worker",
		SubmittedAt:       submittedAt,
		Status:            "degraded",
		Reason:            &reason,
		StaffPressure:     &staffPressure,
		StockPressure:     &stockPressure,
		QueuePressure:     &queuePressure,
		SubmittedByUserID: &reporterID,
	})
	if err != nil {
		t.Fatalf("CreatePendingReportTx other district fixture returned error: %v", err)
	}
	districtPending, err := store.ListPendingReports(ctx, ReportReviewScope{Role: "district_manager", District: stringPtr("Review District")})
	if err != nil {
		t.Fatalf("ListPendingReports scoped returned error: %v", err)
	}
	for _, got := range districtPending {
		if got.ID == otherDistrictReport.ID {
			t.Fatalf("district manager pending list included out-of-district report: %+v", districtPending)
		}
	}

	notes := "confirmed by district"
	accepted, status, err := store.ReviewReportTx(ctx, ReviewReportInput{
		ReportID:       report.ID,
		ReviewerUserID: reviewerID,
		OrganisationID: &orgID,
		Decision:       "accepted",
		Notes:          &notes,
		Scope:          ReportReviewScope{Role: "system_admin"},
		AuditEvent: &CreateAuditEventInput{
			ClinicID:       stringPtr("clinic-review-accept"),
			ActorName:      stringPtr("District Reviewer"),
			EventType:      "report.reviewed",
			Summary:        "Report accepted.",
			ActorUserID:    &reviewerID,
			ActorRole:      &reviewerRole,
			OrganisationID: &orgID,
			EntityType:     &reportEntityType,
			EntityID:       stringPtr(strconv.FormatInt(report.ID, 10)),
			Metadata: map[string]any{
				"decision": "accepted",
			},
		},
	})
	if err != nil {
		t.Fatalf("ReviewReportTx accept returned error: %v", err)
	}
	if accepted.ReviewState != "accepted" || accepted.ReviewedByUserID == nil || *accepted.ReviewedByUserID != reviewerID {
		t.Fatalf("unexpected accepted report: %+v", accepted)
	}
	if accepted.ReviewNotes == nil || *accepted.ReviewNotes != notes {
		t.Fatalf("expected review notes %q, got %+v", notes, accepted.ReviewNotes)
	}
	if status == nil || status.ClinicID != "clinic-review-accept" || status.Status != "degraded" {
		t.Fatalf("expected accepted review to update current status, got %+v", status)
	}
	assertIntegrationReviewRow(t, ctx, store, report.ID, reviewerID, orgID, "accepted", &notes)
	eventsAfterReview, err := store.ListClinicAuditEvents(ctx, "clinic-review-accept")
	if err != nil {
		t.Fatalf("ListClinicAuditEvents after review returned error: %v", err)
	}
	if len(eventsAfterReview) != 2 {
		t.Fatalf("expected submission and review audit rows, got %+v", eventsAfterReview)
	}
	var submissionAfterReview *AuditEvent
	var reviewAudit *AuditEvent
	for i := range eventsAfterReview {
		switch eventsAfterReview[i].EventType {
		case "report.submitted":
			submissionAfterReview = &eventsAfterReview[i]
		case "report.reviewed":
			reviewAudit = &eventsAfterReview[i]
		}
	}
	if submissionAfterReview == nil || reviewAudit == nil {
		t.Fatalf("expected submission and review audit events, got %+v", eventsAfterReview)
	}
	if submissionAfterReview.ID != submissionAudit.ID {
		t.Fatalf("expected original submission audit row to remain append-only, before=%+v after=%+v", submissionAudit, *submissionAfterReview)
	}
	if submissionAfterReview.Metadata["reviewState"] != "pending" || submissionAfterReview.Metadata["decision"] != nil {
		t.Fatalf("expected review not to mutate submission audit metadata, got %#v", submissionAfterReview.Metadata)
	}
	if reviewAudit.Metadata["decision"] != "accepted" {
		t.Fatalf("expected review decision metadata, got %#v", reviewAudit.Metadata)
	}
	if _, _, err := store.ReviewReportTx(ctx, ReviewReportInput{
		ReportID:       report.ID,
		ReviewerUserID: reviewerID,
		Decision:       "rejected",
		Scope:          ReportReviewScope{Role: "system_admin"},
	}); !errors.Is(err, ErrReportAlreadyReviewed) {
		t.Fatalf("expected ErrReportAlreadyReviewed, got %v", err)
	}
	if _, _, err := store.ReviewReportTx(ctx, ReviewReportInput{
		ReportID:       otherDistrictReport.ID,
		ReviewerUserID: reviewerID,
		Decision:       "accepted",
		Scope:          ReportReviewScope{Role: "district_manager", District: stringPtr("Review District")},
	}); !errors.Is(err, ErrReportReviewForbidden) {
		t.Fatalf("expected ErrReportReviewForbidden, got %v", err)
	}

	rejectReport, err := store.CreatePendingReportTx(ctx, CreateReportInput{
		ClinicID:          "clinic-review-reject",
		ReporterName:      stringPtr("Field Reporter"),
		Source:            "field_worker",
		SubmittedAt:       submittedAt,
		Status:            "non_functional",
		Reason:            &reason,
		StaffPressure:     &staffPressure,
		StockPressure:     &stockPressure,
		QueuePressure:     &queuePressure,
		SubmittedByUserID: &reporterID,
	})
	if err != nil {
		t.Fatalf("CreatePendingReportTx reject fixture returned error: %v", err)
	}
	rejected, rejectedStatus, err := store.ReviewReportTx(ctx, ReviewReportInput{
		ReportID:       rejectReport.ID,
		ReviewerUserID: reviewerID,
		OrganisationID: &orgID,
		Decision:       "rejected",
		Scope:          ReportReviewScope{Role: "org_admin"},
	})
	if err != nil {
		t.Fatalf("ReviewReportTx reject returned error: %v", err)
	}
	if rejected.ReviewState != "rejected" || rejectedStatus != nil {
		t.Fatalf("expected rejected report without current status, got %+v %+v", rejected, rejectedStatus)
	}
	assertIntegrationReviewRow(t, ctx, store, rejectReport.ID, reviewerID, orgID, "rejected", nil)
	if _, err := store.GetCurrentStatus(ctx, "clinic-review-reject"); err != pgx.ErrNoRows {
		t.Fatalf("expected rejected review not to update current status, got %v", err)
	}
}

func insertIntegrationClinic(t *testing.T, ctx context.Context, store Store, id string, name string) {
	t.Helper()
	insertIntegrationClinicInDistrict(t, ctx, store, id, name, "Review District")
}

func insertIntegrationClinicInDistrict(t *testing.T, ctx context.Context, store Store, id string, name string, district string) {
	t.Helper()

	if _, err := store.pool.Exec(ctx, `
INSERT INTO clinics (id, name, facility_code, province, district, facility_type, verification_status)
VALUES ($1, $2, $3, 'Gauteng', $4, 'clinic', 'verified')`, id, name, id+"-code", district); err != nil {
		t.Fatalf("insert clinic %s: %v", id, err)
	}
}

func stringPtr(value string) *string {
	return &value
}

func assertIntegrationReviewRow(t *testing.T, ctx context.Context, store Store, reportID int64, reviewerID int64, orgID int64, decision string, notes *string) {
	t.Helper()

	var gotReviewerID int64
	var gotOrgID int64
	var gotDecision string
	var gotNotes sql.NullString
	if err := store.pool.QueryRow(ctx, `
SELECT reviewer_user_id, organisation_id, decision, notes
FROM report_reviews
WHERE report_id = $1`, reportID).Scan(&gotReviewerID, &gotOrgID, &gotDecision, &gotNotes); err != nil {
		t.Fatalf("select report review row: %v", err)
	}
	if gotReviewerID != reviewerID || gotOrgID != orgID || gotDecision != decision {
		t.Fatalf("unexpected report review row: reviewer=%d org=%d decision=%q", gotReviewerID, gotOrgID, gotDecision)
	}
	if notes == nil {
		if gotNotes.Valid {
			t.Fatalf("expected nil review notes, got %q", gotNotes.String)
		}
		return
	}
	if !gotNotes.Valid || gotNotes.String != *notes {
		t.Fatalf("expected review notes %q, got %v", *notes, gotNotes)
	}
}

func assertIntegrationAuditEvent(t *testing.T, ctx context.Context, store Store, clinicID string, eventType string) AuditEvent {
	t.Helper()

	events, err := store.ListClinicAuditEvents(ctx, clinicID)
	if err != nil {
		t.Fatalf("ListClinicAuditEvents returned error: %v", err)
	}
	for _, event := range events {
		if event.EventType == eventType {
			return event
		}
	}
	t.Fatalf("expected audit event type %q, got %+v", eventType, events)
	return AuditEvent{}
}
