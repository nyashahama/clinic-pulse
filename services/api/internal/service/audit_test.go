package service

import (
	"context"
	"testing"

	"clinicpulse/services/api/internal/store"
)

func TestCreateReportAttachesSubmissionAuditWithActorContext(t *testing.T) {
	orgID := int64(7)
	actor := AuditActor{
		UserID:         42,
		Name:           "Field Reporter",
		Role:           "reporter",
		OrganisationID: &orgID,
	}
	creator := &fakeReportCreator{
		report: store.Report{ID: 101, ClinicID: "clinic-1", ReviewState: "pending"},
	}
	input := validReportInput()
	input.Actor = &actor

	if _, err := CreateReport(context.Background(), creator, input); err != nil {
		t.Fatalf("CreateReport returned error: %v", err)
	}

	event := creator.input.AuditEvent
	if event == nil {
		t.Fatal("expected create report input to include an audit event")
	}
	if event.EventType != "report.submitted" {
		t.Fatalf("expected report.submitted event type, got %q", event.EventType)
	}
	if event.ActorUserID == nil || *event.ActorUserID != 42 {
		t.Fatalf("expected actor user id 42, got %v", event.ActorUserID)
	}
	if event.ActorRole == nil || *event.ActorRole != "reporter" {
		t.Fatalf("expected actor role reporter, got %v", event.ActorRole)
	}
	if event.OrganisationID == nil || *event.OrganisationID != orgID {
		t.Fatalf("expected organisation id %d, got %v", orgID, event.OrganisationID)
	}
	if event.ClinicID == nil || *event.ClinicID != "clinic-1" {
		t.Fatalf("expected clinic id clinic-1, got %v", event.ClinicID)
	}
	if event.EntityType == nil || *event.EntityType != "report" {
		t.Fatalf("expected report entity type, got %v", event.EntityType)
	}
	if event.EntityID != nil {
		t.Fatalf("expected store to fill report entity id after insert, got %v", event.EntityID)
	}
	if event.Metadata["status"] != "operational" || event.Metadata["reviewState"] != "pending" {
		t.Fatalf("unexpected submission audit metadata: %#v", event.Metadata)
	}
}

func TestReviewReportAttachesDecisionAuditMetadata(t *testing.T) {
	orgID := int64(7)
	notes := "district verified"
	actor := AuditActor{
		UserID:         42,
		Name:           "District Reviewer",
		Role:           "district_manager",
		OrganisationID: &orgID,
	}
	reviewer := &fakeReportReviewer{
		report: store.Report{ID: 100, ClinicID: "clinic-1", ReviewState: "accepted"},
	}
	input := ReviewReportInput{
		ReportID:       100,
		ReviewerUserID: 42,
		OrganisationID: &orgID,
		Decision:       "accepted",
		Notes:          &notes,
		Scope:          store.ReportReviewScope{Role: "district_manager"},
		Actor:          &actor,
	}

	if _, _, err := ReviewReport(context.Background(), reviewer, input); err != nil {
		t.Fatalf("ReviewReport returned error: %v", err)
	}

	event := reviewer.input.AuditEvent
	if event == nil {
		t.Fatal("expected review report input to include an audit event")
	}
	if event.EventType != "report.reviewed" {
		t.Fatalf("expected report.reviewed event type, got %q", event.EventType)
	}
	if event.ActorUserID == nil || *event.ActorUserID != 42 {
		t.Fatalf("expected actor user id 42, got %v", event.ActorUserID)
	}
	if event.EntityType == nil || *event.EntityType != "report" {
		t.Fatalf("expected report entity type, got %v", event.EntityType)
	}
	if event.EntityID == nil || *event.EntityID != "100" {
		t.Fatalf("expected report entity id 100, got %v", event.EntityID)
	}
	if event.Metadata["decision"] != "accepted" || event.Metadata["notes"] != notes {
		t.Fatalf("unexpected review audit metadata: %#v", event.Metadata)
	}
	if _, ok := event.Metadata["currentStatusUpdated"]; ok {
		t.Fatalf("expected review audit not to claim current status update, got %#v", event.Metadata)
	}
}

func TestRecordLoginSuccessWritesActorAuditEvent(t *testing.T) {
	orgID := int64(7)
	userAgent := "ClinicPulse Test"
	ipAddress := "192.0.2.55"
	writer := &fakeAuditWriter{}

	if _, err := RecordLoginSuccess(context.Background(), writer, LoginAuditInput{
		Actor: AuditActor{
			UserID:         42,
			Name:           "Clinic Manager",
			Role:           "org_admin",
			OrganisationID: &orgID,
		},
		SessionID: 100,
		UserAgent: &userAgent,
		IPAddress: &ipAddress,
	}); err != nil {
		t.Fatalf("RecordLoginSuccess returned error: %v", err)
	}

	if !writer.called {
		t.Fatal("expected audit writer to be called")
	}
	event := writer.input
	if event.EventType != "auth.login.succeeded" {
		t.Fatalf("expected auth.login.succeeded event type, got %q", event.EventType)
	}
	if event.ClinicID != nil {
		t.Fatalf("expected login audit not to be scoped to a clinic, got %v", event.ClinicID)
	}
	if event.ActorUserID == nil || *event.ActorUserID != 42 {
		t.Fatalf("expected actor user id 42, got %v", event.ActorUserID)
	}
	if event.ActorRole == nil || *event.ActorRole != "org_admin" {
		t.Fatalf("expected actor role org_admin, got %v", event.ActorRole)
	}
	if event.OrganisationID == nil || *event.OrganisationID != orgID {
		t.Fatalf("expected organisation id %d, got %v", orgID, event.OrganisationID)
	}
	if event.EntityType == nil || *event.EntityType != "session" {
		t.Fatalf("expected session entity type, got %v", event.EntityType)
	}
	if event.EntityID == nil || *event.EntityID != "100" {
		t.Fatalf("expected session entity id 100, got %v", event.EntityID)
	}
	if event.Metadata["sessionId"] != int64(100) || event.Metadata["userAgent"] != userAgent || event.Metadata["ipAddress"] != ipAddress {
		t.Fatalf("unexpected login audit metadata: %#v", event.Metadata)
	}
}

type fakeAuditWriter struct {
	called bool
	input  store.CreateAuditEventInput
	event  store.AuditEvent
	err    error
}

func (f *fakeAuditWriter) CreateAuditEvent(_ context.Context, input store.CreateAuditEventInput) (store.AuditEvent, error) {
	f.called = true
	f.input = input
	return f.event, f.err
}
