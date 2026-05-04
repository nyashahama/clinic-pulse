package service

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"testing"
	"time"

	"clinicpulse/services/api/internal/store"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

func TestSyncOfflineReportsCreatesPendingReports(t *testing.T) {
	now := time.Date(2026, 5, 3, 12, 0, 0, 0, time.UTC)
	fake := newFakeOfflineSyncStore()
	item := validOfflineSyncItem("offline-report-1")

	got := SyncOfflineReports(context.Background(), fake, validOfflineSyncActor(), []OfflineSyncItemInput{item}, now)

	if len(got.Results) != 1 {
		t.Fatalf("expected one result, got %#v", got.Results)
	}
	if got.Results[0].Result != "created" {
		t.Fatalf("expected created result, got %#v", got.Results[0])
	}
	if len(fake.created) != 1 {
		t.Fatalf("expected one created report, got %#v", fake.created)
	}
	if fake.created[0].ExternalID == nil || *fake.created[0].ExternalID != "offline-report-1" {
		t.Fatalf("expected client id to become report external id")
	}
	if !fake.created[0].OfflineCreated {
		t.Fatal("expected offline sync report to be marked offline-created")
	}
	if fake.created[0].ReviewState != "pending" {
		t.Fatalf("expected pending review state, got %q", fake.created[0].ReviewState)
	}
	if fake.created[0].Source != "field_worker" {
		t.Fatalf("expected field worker source, got %q", fake.created[0].Source)
	}
	if fake.created[0].SubmittedByUserID == nil || *fake.created[0].SubmittedByUserID != 42 {
		t.Fatalf("expected submitted user id 42, got %v", fake.created[0].SubmittedByUserID)
	}
	if fake.created[0].ReceivedAt != now {
		t.Fatalf("expected received at %v, got %v", now, fake.created[0].ReceivedAt)
	}
	if fake.created[0].AuditEvent == nil {
		t.Fatal("expected offline sync report to include a submission audit event")
	}
	if fake.created[0].AuditEvent.ActorUserID == nil || *fake.created[0].AuditEvent.ActorUserID != 42 {
		t.Fatalf("expected audit actor user id 42, got %#v", fake.created[0].AuditEvent.ActorUserID)
	}
	if fake.created[0].AuditEvent.Metadata["offlineCreated"] != true {
		t.Fatalf("expected offline submission audit metadata, got %#v", fake.created[0].AuditEvent.Metadata)
	}
	if len(fake.attempts) != 1 || fake.attempts[0].Result != "created" {
		t.Fatalf("expected created sync attempt, got %#v", fake.attempts)
	}
	if fake.attempts[0].ClientAttemptCount != item.ClientAttemptCount {
		t.Fatalf("expected client attempt count %d, got %d", item.ClientAttemptCount, fake.attempts[0].ClientAttemptCount)
	}
	if got.Summary.Created != 1 {
		t.Fatalf("expected created summary count, got %#v", got.Summary)
	}
}

func TestSyncOfflineReportsTreatsDuplicateSamePayloadAsSuccess(t *testing.T) {
	now := time.Date(2026, 5, 3, 12, 0, 0, 0, time.UTC)
	fake := newFakeOfflineSyncStore()
	item := validOfflineSyncItem("offline-report-duplicate")
	existing := reportFromOfflineItem(9, item)
	fake.existing["offline-report-duplicate"] = existing

	got := SyncOfflineReports(context.Background(), fake, validOfflineSyncActor(), []OfflineSyncItemInput{item}, now)

	if got.Results[0].Result != "duplicate" {
		t.Fatalf("expected duplicate result, got %#v", got.Results[0])
	}
	if got.Results[0].Report == nil || got.Results[0].Report.ID != existing.ID {
		t.Fatalf("expected existing report in result, got %#v", got.Results[0].Report)
	}
	if len(fake.created) != 0 {
		t.Fatalf("expected duplicate not to create report, got %#v", fake.created)
	}
	if len(fake.attempts) != 1 || fake.attempts[0].Result != "duplicate" {
		t.Fatalf("expected duplicate sync attempt, got %#v", fake.attempts)
	}
	if fake.attempts[0].ReportID == nil || *fake.attempts[0].ReportID != existing.ID {
		t.Fatalf("expected sync attempt to reference existing report, got %#v", fake.attempts[0])
	}
	if got.Summary.Duplicate != 1 {
		t.Fatalf("expected duplicate summary count, got %#v", got.Summary)
	}
}

func TestSyncOfflineReportsTreatsSamePendingPayloadWithNewClientIDAsDuplicate(t *testing.T) {
	now := time.Date(2026, 5, 3, 12, 0, 0, 0, time.UTC)
	fake := newFakeOfflineSyncStore()
	item := validOfflineSyncItem("offline-report-new-client-id")
	existingItem := item
	existingItem.ClientReportID = "offline-report-existing-client-id"
	existing := reportFromOfflineItem(12, existingItem)
	actor := validOfflineSyncActor()
	existing.SubmittedByUserID = &actor.UserID
	fake.pendingPayloadMatches = append(fake.pendingPayloadMatches, existing)

	got := SyncOfflineReports(context.Background(), fake, actor, []OfflineSyncItemInput{item}, now)

	if got.Results[0].Result != "duplicate" {
		t.Fatalf("expected semantic duplicate result, got %#v", got.Results[0])
	}
	if got.Results[0].Report == nil || got.Results[0].Report.ID != existing.ID {
		t.Fatalf("expected existing pending report in result, got %#v", got.Results[0].Report)
	}
	if len(fake.created) != 0 {
		t.Fatalf("expected semantic duplicate not to create report, got %#v", fake.created)
	}
	if len(fake.attempts) != 1 || fake.attempts[0].Result != "duplicate" {
		t.Fatalf("expected duplicate sync attempt, got %#v", fake.attempts)
	}
	if fake.attempts[0].ReportID == nil || *fake.attempts[0].ReportID != existing.ID {
		t.Fatalf("expected sync attempt to reference existing report, got %#v", fake.attempts[0])
	}
}

func TestSyncOfflineReportsTreatsDuplicateDifferentPayloadAsConflict(t *testing.T) {
	now := time.Date(2026, 5, 3, 12, 0, 0, 0, time.UTC)
	fake := newFakeOfflineSyncStore()
	item := validOfflineSyncItem("offline-report-conflict")
	existing := reportFromOfflineItem(10, item)
	existing.Status = "operational"
	item.Status = "degraded"
	fake.existing["offline-report-conflict"] = existing

	got := SyncOfflineReports(context.Background(), fake, validOfflineSyncActor(), []OfflineSyncItemInput{item}, now)

	if got.Results[0].Result != "conflict" {
		t.Fatalf("expected conflict result, got %#v", got.Results[0])
	}
	if got.Results[0].Error == nil || got.Results[0].Error.Code != "conflict" {
		t.Fatalf("expected conflict error, got %#v", got.Results[0].Error)
	}
	if len(fake.created) != 0 {
		t.Fatalf("expected conflict not to create report, got %#v", fake.created)
	}
	if len(fake.attempts) != 1 || fake.attempts[0].Result != "conflict" {
		t.Fatalf("expected conflict sync attempt, got %#v", fake.attempts)
	}
	if fake.attempts[0].ErrorCode == nil || *fake.attempts[0].ErrorCode != "conflict" {
		t.Fatalf("expected conflict attempt error code, got %#v", fake.attempts[0])
	}
	if got.Summary.Conflict != 1 {
		t.Fatalf("expected conflict summary count, got %#v", got.Summary)
	}
}

func TestSyncOfflineReportsHandlesExternalIDUniqueRaceAsDuplicate(t *testing.T) {
	now := time.Date(2026, 5, 3, 12, 0, 0, 0, time.UTC)
	fake := newFakeOfflineSyncStore()
	item := validOfflineSyncItem("offline-report-race-duplicate")
	existing := reportFromOfflineItem(15, item)
	fake.createErrors[item.ClientReportID] = &pgconn.PgError{
		Code:           "23505",
		ConstraintName: "reports_external_id_key",
	}
	fake.existingAfterCreateRace[item.ClientReportID] = existing

	got := SyncOfflineReports(context.Background(), fake, validOfflineSyncActor(), []OfflineSyncItemInput{item}, now)

	if got.Results[0].Result != "duplicate" {
		t.Fatalf("expected duplicate result after unique race, got %#v", got.Results[0])
	}
	if got.Results[0].Report == nil || got.Results[0].Report.ID != existing.ID {
		t.Fatalf("expected existing report in result, got %#v", got.Results[0].Report)
	}
	if len(fake.attempts) != 1 || fake.attempts[0].Result != "duplicate" {
		t.Fatalf("expected duplicate sync attempt, got %#v", fake.attempts)
	}
	if fake.attempts[0].ReportID == nil || *fake.attempts[0].ReportID != existing.ID {
		t.Fatalf("expected sync attempt to reference existing report, got %#v", fake.attempts[0])
	}
	if got.Summary.Duplicate != 1 || got.Summary.Failed != 0 {
		t.Fatalf("expected duplicate summary without failure, got %#v", got.Summary)
	}
}

func TestSyncOfflineReportsHandlesExternalIDUniqueRaceAsConflict(t *testing.T) {
	now := time.Date(2026, 5, 3, 12, 0, 0, 0, time.UTC)
	fake := newFakeOfflineSyncStore()
	item := validOfflineSyncItem("offline-report-race-conflict")
	existing := reportFromOfflineItem(16, item)
	existing.Status = "operational"
	item.Status = "degraded"
	fake.createErrors[item.ClientReportID] = &pgconn.PgError{
		Code:           "23505",
		ConstraintName: "reports_external_id_key",
	}
	fake.existingAfterCreateRace[item.ClientReportID] = existing

	got := SyncOfflineReports(context.Background(), fake, validOfflineSyncActor(), []OfflineSyncItemInput{item}, now)

	if got.Results[0].Result != "conflict" {
		t.Fatalf("expected conflict result after unique race, got %#v", got.Results[0])
	}
	if got.Results[0].Error == nil || got.Results[0].Error.Code != "conflict" {
		t.Fatalf("expected conflict error, got %#v", got.Results[0].Error)
	}
	if len(fake.attempts) != 1 || fake.attempts[0].Result != "conflict" {
		t.Fatalf("expected conflict sync attempt, got %#v", fake.attempts)
	}
	if fake.attempts[0].ReportID == nil || *fake.attempts[0].ReportID != existing.ID {
		t.Fatalf("expected sync attempt to reference existing report, got %#v", fake.attempts[0])
	}
	if got.Summary.Conflict != 1 || got.Summary.Failed != 0 {
		t.Fatalf("expected conflict summary without failure, got %#v", got.Summary)
	}
}

func TestSyncOfflineReportsReturnsPerItemValidationErrors(t *testing.T) {
	now := time.Date(2026, 5, 3, 12, 0, 0, 0, time.UTC)
	fake := newFakeOfflineSyncStore()
	missingClientID := validOfflineSyncItem("")
	invalidStatus := validOfflineSyncItem("offline-invalid-status")
	invalidStatus.Status = "closed"

	got := SyncOfflineReports(context.Background(), fake, validOfflineSyncActor(), []OfflineSyncItemInput{missingClientID, invalidStatus}, now)

	if len(got.Results) != 2 {
		t.Fatalf("expected two results, got %#v", got.Results)
	}
	if got.Results[0].Result != "validation_error" || got.Results[0].Error == nil || got.Results[0].Error.Code != "validation_error" {
		t.Fatalf("expected client id validation error, got %#v", got.Results[0])
	}
	if len(got.Results[0].Error.Fields) == 0 || got.Results[0].Error.Fields[0] != "clientReportId: clientReportId is required" {
		t.Fatalf("expected clientReportId field error, got %#v", got.Results[0].Error.Fields)
	}
	if got.Results[1].Result != "validation_error" || got.Results[1].Error == nil {
		t.Fatalf("expected report field validation error, got %#v", got.Results[1])
	}
	if !containsField(got.Results[1].Error.Fields, "status: status must be one of: operational, degraded, non_functional, unknown") {
		t.Fatalf("expected status field error, got %#v", got.Results[1].Error.Fields)
	}
	if len(fake.created) != 0 {
		t.Fatalf("expected invalid reports not to be created, got %#v", fake.created)
	}
	if len(fake.attempts) != 2 {
		t.Fatalf("expected validation sync attempts, got %#v", fake.attempts)
	}
	if fake.attempts[0].ExternalID != missingClientReportIDExternalID {
		t.Fatalf("expected missing client id sentinel external id, got %#v", fake.attempts[0])
	}
	if fake.attempts[0].ErrorCode == nil || *fake.attempts[0].ErrorCode != "validation_error" {
		t.Fatalf("expected validation attempt error code, got %#v", fake.attempts[0])
	}
	if got.Summary.Failed != 2 {
		t.Fatalf("expected failed summary count, got %#v", got.Summary)
	}
}

func TestSyncOfflineReportsRecordsBlankClientReportIDValidationWithSentinelExternalID(t *testing.T) {
	now := time.Date(2026, 5, 3, 12, 0, 0, 0, time.UTC)
	fake := newFakeOfflineSyncStore()
	fake.enforceAttemptConstraints = true
	item := validOfflineSyncItem("   ")

	got := SyncOfflineReports(context.Background(), fake, validOfflineSyncActor(), []OfflineSyncItemInput{item}, now)

	if got.Results[0].Result != "validation_error" {
		t.Fatalf("expected validation_error result, got %#v", got.Results[0])
	}
	if got.Results[0].Error == nil || got.Results[0].Error.Code != "validation_error" {
		t.Fatalf("expected validation error details, got %#v", got.Results[0].Error)
	}
	if len(fake.created) != 0 {
		t.Fatalf("expected blank client id not to create report, got %#v", fake.created)
	}
	if len(fake.attempts) != 1 {
		t.Fatalf("expected validation sync attempt, got %#v", fake.attempts)
	}
	if fake.attempts[0].ExternalID != missingClientReportIDExternalID {
		t.Fatalf("expected sentinel external id, got %#v", fake.attempts[0])
	}
	if fake.attempts[0].Result != "validation_error" {
		t.Fatalf("expected validation_error sync attempt, got %#v", fake.attempts[0])
	}
	if got.Summary.Failed != 1 {
		t.Fatalf("expected failed summary count, got %#v", got.Summary)
	}
}

func TestSyncOfflineReportsRejectsNegativeClientAttemptCountBeforeCreate(t *testing.T) {
	now := time.Date(2026, 5, 3, 12, 0, 0, 0, time.UTC)
	fake := newFakeOfflineSyncStore()
	fake.enforceAttemptConstraints = true
	item := validOfflineSyncItem("offline-negative-attempt")
	item.ClientAttemptCount = -1

	got := SyncOfflineReports(context.Background(), fake, validOfflineSyncActor(), []OfflineSyncItemInput{item}, now)

	if got.Results[0].Result != "validation_error" {
		t.Fatalf("expected validation_error result, got %#v", got.Results[0])
	}
	if got.Results[0].Error == nil || got.Results[0].Error.Code != "validation_error" {
		t.Fatalf("expected validation error details, got %#v", got.Results[0].Error)
	}
	if !containsField(got.Results[0].Error.Fields, "clientAttemptCount: clientAttemptCount must be greater than or equal to zero") {
		t.Fatalf("expected clientAttemptCount validation field, got %#v", got.Results[0].Error.Fields)
	}
	if len(fake.created) != 0 {
		t.Fatalf("expected negative attempt count not to create report, got %#v", fake.created)
	}
	if len(fake.attempts) != 1 || fake.attempts[0].ClientAttemptCount != 0 {
		t.Fatalf("expected validation attempt with normalized attempt count, got %#v", fake.attempts)
	}
}

func TestSyncOfflineReportsTreatsDuplicateWithPostgresMicrosecondPrecisionAsSuccess(t *testing.T) {
	now := time.Date(2026, 5, 3, 12, 0, 0, 0, time.UTC)
	fake := newFakeOfflineSyncStore()
	item := validOfflineSyncItem("offline-report-microsecond-duplicate")
	item.SubmittedAt = time.Date(2026, 5, 3, 11, 0, 0, 123456789, time.UTC)
	existing := reportFromOfflineItem(11, item)
	existing.SubmittedAt = item.SubmittedAt.Truncate(time.Microsecond)
	fake.existing[item.ClientReportID] = existing

	got := SyncOfflineReports(context.Background(), fake, validOfflineSyncActor(), []OfflineSyncItemInput{item}, now)

	if got.Results[0].Result != "duplicate" {
		t.Fatalf("expected duplicate result, got %#v", got.Results[0])
	}
	if len(fake.created) != 0 {
		t.Fatalf("expected duplicate not to create report, got %#v", fake.created)
	}
}

func TestSyncOfflineReportsWarnsWhenSubmittedBeforeCurrentStatus(t *testing.T) {
	now := time.Date(2026, 5, 3, 12, 0, 0, 0, time.UTC)
	fake := newFakeOfflineSyncStore()
	item := validOfflineSyncItem("offline-report-stale")
	lastReportedAt := item.SubmittedAt.Add(30 * time.Minute)
	fake.currentStatuses[item.ClinicID] = store.CurrentStatus{
		ClinicID:       item.ClinicID,
		Status:         "operational",
		LastReportedAt: &lastReportedAt,
	}

	got := SyncOfflineReports(context.Background(), fake, validOfflineSyncActor(), []OfflineSyncItemInput{item}, now)

	if got.Results[0].Result != "created" {
		t.Fatalf("expected created result, got %#v", got.Results[0])
	}
	if got.Results[0].Warning == nil || *got.Results[0].Warning == "" {
		t.Fatalf("expected stale current status warning, got %#v", got.Results[0].Warning)
	}
}

func TestSyncOfflineReportsContinuesAfterOneItemFails(t *testing.T) {
	now := time.Date(2026, 5, 3, 12, 0, 0, 0, time.UTC)
	fake := newFakeOfflineSyncStore()
	fake.createErrors["offline-report-fails"] = errors.New("database unavailable")
	failing := validOfflineSyncItem("offline-report-fails")
	next := validOfflineSyncItem("offline-report-succeeds")

	got := SyncOfflineReports(context.Background(), fake, validOfflineSyncActor(), []OfflineSyncItemInput{failing, next}, now)

	if len(got.Results) != 2 {
		t.Fatalf("expected two results, got %#v", got.Results)
	}
	if got.Results[0].Result != "server_error" || got.Results[0].Error == nil || got.Results[0].Error.Code != "server_error" {
		t.Fatalf("expected server error for first item, got %#v", got.Results[0])
	}
	if got.Results[1].Result != "created" {
		t.Fatalf("expected second item to be created, got %#v", got.Results[1])
	}
	if len(fake.attempts) != 2 {
		t.Fatalf("expected sync attempts for both items, got %#v", fake.attempts)
	}
	if fake.attempts[0].Result != "server_error" || fake.attempts[1].Result != "created" {
		t.Fatalf("expected server_error then created attempts, got %#v", fake.attempts)
	}
	if got.Summary.Created != 1 || got.Summary.Failed != 1 {
		t.Fatalf("expected one created and one failed summary count, got %#v", got.Summary)
	}
}

func TestSyncOfflineReportsSurfacesSyncAttemptPersistenceFailure(t *testing.T) {
	now := time.Date(2026, 5, 3, 12, 0, 0, 0, time.UTC)
	fake := newFakeOfflineSyncStore()
	fake.attemptErr = errors.New("attempt insert failed")
	item := validOfflineSyncItem("offline-report-attempt-fails")

	got := SyncOfflineReports(context.Background(), fake, validOfflineSyncActor(), []OfflineSyncItemInput{item}, now)

	if got.Results[0].Result != "server_error" {
		t.Fatalf("expected server_error result, got %#v", got.Results[0])
	}
	if got.Results[0].Error == nil || got.Results[0].Error.Code != "server_error" {
		t.Fatalf("expected server error details, got %#v", got.Results[0].Error)
	}
	if got.Results[0].Report == nil || got.Results[0].Report.ID == 0 {
		t.Fatalf("expected created report context to be preserved, got %#v", got.Results[0].Report)
	}
	if len(fake.created) != 1 {
		t.Fatalf("expected report create to have succeeded before attempt failure, got %#v", fake.created)
	}
	if len(fake.attempts) != 1 || fake.attempts[0].Result != "created" {
		t.Fatalf("expected original created attempt to be made, got %#v", fake.attempts)
	}
	if got.Summary.Failed != 1 {
		t.Fatalf("expected failed summary count, got %#v", got.Summary)
	}
}

func TestOfflineSyncInputsMarshalWithJSONTags(t *testing.T) {
	actorJSON, err := json.Marshal(OfflineSyncActor{
		UserID:         42,
		DisplayName:    "Nurse Example",
		Email:          "nurse@example.test",
		Role:           "field_worker",
		OrganisationID: ptr(int64(7)),
	})
	if err != nil {
		t.Fatalf("marshal actor: %v", err)
	}
	if got, want := string(actorJSON), `{"userId":42,"displayName":"Nurse Example","email":"nurse@example.test","role":"field_worker","organisationId":7}`; got != want {
		t.Fatalf("unexpected actor json: got %s want %s", got, want)
	}

	itemJSON, err := json.Marshal(OfflineSyncItemInput{
		ClientReportID:     "offline-report-1",
		ClinicID:           "clinic-1",
		Status:             "operational",
		Reason:             "Daily facility check",
		StaffPressure:      "normal",
		StockPressure:      "normal",
		QueuePressure:      "low",
		Notes:              "Opened on time",
		SubmittedAt:        time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC),
		QueuedAt:           ptr(time.Date(2026, 5, 3, 10, 30, 0, 0, time.UTC)),
		ClientAttemptCount: 2,
	})
	if err != nil {
		t.Fatalf("marshal item: %v", err)
	}
	var item map[string]any
	if err := json.Unmarshal(itemJSON, &item); err != nil {
		t.Fatalf("unmarshal item: %v", err)
	}
	for _, key := range []string{
		"clientReportId",
		"clinicId",
		"staffPressure",
		"stockPressure",
		"queuePressure",
		"submittedAt",
		"queuedAt",
		"clientAttemptCount",
	} {
		if _, ok := item[key]; !ok {
			t.Fatalf("expected item json key %q in %s", key, string(itemJSON))
		}
	}
}

func validOfflineSyncActor() OfflineSyncActor {
	orgID := int64(7)
	return OfflineSyncActor{
		UserID:         42,
		DisplayName:    "Nurse Example",
		Email:          "nurse@example.test",
		Role:           "field_worker",
		OrganisationID: &orgID,
	}
}

func validOfflineSyncItem(clientReportID string) OfflineSyncItemInput {
	queuedAt := time.Date(2026, 5, 3, 10, 30, 0, 0, time.UTC)
	return OfflineSyncItemInput{
		ClientReportID:     clientReportID,
		ClinicID:           "clinic-1",
		Status:             "operational",
		Reason:             "Daily facility check",
		StaffPressure:      "normal",
		StockPressure:      "normal",
		QueuePressure:      "low",
		Notes:              "Opened on time",
		SubmittedAt:        time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC),
		QueuedAt:           &queuedAt,
		ClientAttemptCount: 2,
	}
}

func reportFromOfflineItem(id int64, item OfflineSyncItemInput) store.Report {
	return store.Report{
		ID:            id,
		ExternalID:    &item.ClientReportID,
		ClinicID:      item.ClinicID,
		Status:        item.Status,
		Reason:        &item.Reason,
		StaffPressure: &item.StaffPressure,
		StockPressure: &item.StockPressure,
		QueuePressure: &item.QueuePressure,
		Notes:         &item.Notes,
		Source:        "field_worker",
		SubmittedAt:   item.SubmittedAt,
		ReviewState:   "pending",
	}
}

type fakeOfflineSyncStore struct {
	existing                  map[string]store.Report
	existingAfterCreateRace   map[string]store.Report
	externalIDLookupCount     map[string]int
	pendingPayloadMatches     []store.Report
	currentStatuses           map[string]store.CurrentStatus
	createErrors              map[string]error
	created                   []store.CreateReportInput
	attempts                  []store.CreateReportSyncAttemptInput
	attemptErr                error
	enforceAttemptConstraints bool
}

func newFakeOfflineSyncStore() *fakeOfflineSyncStore {
	return &fakeOfflineSyncStore{
		existing:                map[string]store.Report{},
		existingAfterCreateRace: map[string]store.Report{},
		externalIDLookupCount:   map[string]int{},
		currentStatuses:         map[string]store.CurrentStatus{},
		createErrors:            map[string]error{},
	}
}

func (f *fakeOfflineSyncStore) CreatePendingReportTx(_ context.Context, input store.CreateReportInput) (store.Report, error) {
	if input.ExternalID != nil {
		if err := f.createErrors[*input.ExternalID]; err != nil {
			return store.Report{}, err
		}
	}
	f.created = append(f.created, input)
	report := store.Report{
		ID:                int64(len(f.created)),
		ExternalID:        input.ExternalID,
		ClinicID:          input.ClinicID,
		ReporterName:      input.ReporterName,
		Source:            input.Source,
		OfflineCreated:    input.OfflineCreated,
		SubmittedAt:       input.SubmittedAt,
		ReceivedAt:        input.ReceivedAt,
		Status:            input.Status,
		Reason:            input.Reason,
		StaffPressure:     input.StaffPressure,
		StockPressure:     input.StockPressure,
		QueuePressure:     input.QueuePressure,
		Notes:             input.Notes,
		ReviewState:       input.ReviewState,
		SubmittedByUserID: input.SubmittedByUserID,
	}
	return report, nil
}

func (f *fakeOfflineSyncStore) GetReportByExternalID(_ context.Context, externalID string) (store.Report, error) {
	f.externalIDLookupCount[externalID]++
	if report, ok := f.existingAfterCreateRace[externalID]; ok && f.externalIDLookupCount[externalID] > 1 {
		return report, nil
	}
	report, ok := f.existing[externalID]
	if !ok {
		return store.Report{}, pgx.ErrNoRows
	}
	return report, nil
}

func (f *fakeOfflineSyncStore) GetPendingReportByPayload(_ context.Context, input store.CreateReportInput) (store.Report, error) {
	for _, report := range f.pendingPayloadMatches {
		if sameOfflineReportSemanticPayload(report, input) {
			return report, nil
		}
	}
	for index, created := range f.created {
		report := store.Report{
			ID:                int64(index + 1),
			ExternalID:        created.ExternalID,
			ClinicID:          created.ClinicID,
			ReporterName:      created.ReporterName,
			Source:            created.Source,
			OfflineCreated:    created.OfflineCreated,
			SubmittedAt:       created.SubmittedAt,
			ReceivedAt:        created.ReceivedAt,
			Status:            created.Status,
			Reason:            created.Reason,
			StaffPressure:     created.StaffPressure,
			StockPressure:     created.StockPressure,
			QueuePressure:     created.QueuePressure,
			Notes:             created.Notes,
			ReviewState:       created.ReviewState,
			SubmittedByUserID: created.SubmittedByUserID,
		}
		if sameOfflineReportSemanticPayload(report, input) {
			return report, nil
		}
	}
	return store.Report{}, pgx.ErrNoRows
}

func sameOfflineReportSemanticPayload(existing store.Report, input store.CreateReportInput) bool {
	return existing.ClinicID == input.ClinicID &&
		existing.Source == input.Source &&
		existing.Status == input.Status &&
		sameStringPtr(existing.Reason, input.Reason) &&
		sameStringPtr(existing.StaffPressure, input.StaffPressure) &&
		sameStringPtr(existing.StockPressure, input.StockPressure) &&
		sameStringPtr(existing.QueuePressure, input.QueuePressure) &&
		sameStringPtr(existing.Notes, input.Notes) &&
		sameInt64Ptr(existing.SubmittedByUserID, input.SubmittedByUserID)
}

func sameInt64Ptr(left *int64, right *int64) bool {
	if left == nil || right == nil {
		return left == right
	}
	return *left == *right
}

func (f *fakeOfflineSyncStore) GetCurrentStatus(_ context.Context, clinicID string) (store.CurrentStatus, error) {
	status, ok := f.currentStatuses[clinicID]
	if !ok {
		return store.CurrentStatus{}, pgx.ErrNoRows
	}
	return status, nil
}

func (f *fakeOfflineSyncStore) CreateReportSyncAttempt(_ context.Context, input store.CreateReportSyncAttemptInput) (store.ReportSyncAttempt, error) {
	if f.enforceAttemptConstraints {
		if strings.TrimSpace(input.ExternalID) == "" {
			return store.ReportSyncAttempt{}, errors.New("external_id is required")
		}
		if input.ClientAttemptCount < 0 {
			return store.ReportSyncAttempt{}, errors.New("client_attempt_count must be positive")
		}
	}
	f.attempts = append(f.attempts, input)
	if f.attemptErr != nil {
		return store.ReportSyncAttempt{}, f.attemptErr
	}
	return store.ReportSyncAttempt{ID: int64(len(f.attempts)), Result: input.Result}, nil
}
