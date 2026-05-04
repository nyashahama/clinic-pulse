package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"clinicpulse/services/api/internal/store"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// missingClientReportIDExternalID is the ledger sentinel used when a received
// offline item fails validation before providing a nonblank client report id.
const missingClientReportIDExternalID = "missing-client-report-id"

type OfflineSyncStore interface {
	CreatePendingReportTx(ctx context.Context, input store.CreateReportInput) (store.Report, error)
	GetReportByExternalID(ctx context.Context, externalID string) (store.Report, error)
	GetPendingReportByPayload(ctx context.Context, input store.CreateReportInput) (store.Report, error)
	GetCurrentStatus(ctx context.Context, clinicID string) (store.CurrentStatus, error)
	CreateReportSyncAttempt(ctx context.Context, input store.CreateReportSyncAttemptInput) (store.ReportSyncAttempt, error)
}

type OfflineSyncActor struct {
	UserID         int64  `json:"userId"`
	DisplayName    string `json:"displayName"`
	Email          string `json:"email"`
	Role           string `json:"role"`
	OrganisationID *int64 `json:"organisationId,omitempty"`
}

type OfflineSyncItemInput struct {
	ClientReportID     string     `json:"clientReportId"`
	ClinicID           string     `json:"clinicId"`
	Status             string     `json:"status"`
	Reason             string     `json:"reason"`
	StaffPressure      string     `json:"staffPressure"`
	StockPressure      string     `json:"stockPressure"`
	QueuePressure      string     `json:"queuePressure"`
	Notes              string     `json:"notes,omitempty"`
	SubmittedAt        time.Time  `json:"submittedAt"`
	QueuedAt           *time.Time `json:"queuedAt,omitempty"`
	ClientAttemptCount int        `json:"clientAttemptCount"`
}

type OfflineSyncResult struct {
	ClientReportID string         `json:"clientReportId"`
	Result         string         `json:"result"`
	Report         *store.Report  `json:"report,omitempty"`
	Warning        *string        `json:"warning,omitempty"`
	Error          *SyncItemError `json:"error,omitempty"`
}

type SyncItemError struct {
	Code    string   `json:"code"`
	Message string   `json:"message"`
	Fields  []string `json:"fields,omitempty"`
}

type OfflineSyncSummaryResult struct {
	Created   int `json:"created"`
	Duplicate int `json:"duplicate"`
	Conflict  int `json:"conflict"`
	Failed    int `json:"failed"`
}

type OfflineSyncBatchResult struct {
	Results []OfflineSyncResult      `json:"results"`
	Summary OfflineSyncSummaryResult `json:"summary"`
}

func SyncOfflineReports(
	ctx context.Context,
	syncStore OfflineSyncStore,
	actor OfflineSyncActor,
	items []OfflineSyncItemInput,
	now time.Time,
) OfflineSyncBatchResult {
	result := OfflineSyncBatchResult{
		Results: make([]OfflineSyncResult, 0, len(items)),
	}

	for _, item := range items {
		itemResult := syncOfflineReport(ctx, syncStore, actor, item, now)
		result.Results = append(result.Results, itemResult)
		switch itemResult.Result {
		case "created":
			result.Summary.Created++
		case "duplicate":
			result.Summary.Duplicate++
		case "conflict":
			result.Summary.Conflict++
		default:
			result.Summary.Failed++
		}
	}

	return result
}

func syncOfflineReport(
	ctx context.Context,
	syncStore OfflineSyncStore,
	actor OfflineSyncActor,
	item OfflineSyncItemInput,
	now time.Time,
) OfflineSyncResult {
	storeInput := offlineItemStoreInput(item, actor, now)
	result := OfflineSyncResult{ClientReportID: item.ClientReportID}

	if strings.TrimSpace(item.ClientReportID) == "" {
		result.Result = "validation_error"
		result.Error = &SyncItemError{
			Code:    "validation_error",
			Message: "offline report failed validation",
			Fields:  []string{fieldMessage("clientReportId", "clientReportId is required")},
		}
		return resultWithSyncAttempt(ctx, syncStore, actor, item, now, result, nil)
	}
	if item.ClientAttemptCount < 0 {
		result.Result = "validation_error"
		result.Error = &SyncItemError{
			Code:    "validation_error",
			Message: "offline report failed validation",
			Fields:  []string{fieldMessage("clientAttemptCount", "clientAttemptCount must be greater than or equal to zero")},
		}
		return resultWithSyncAttempt(ctx, syncStore, actor, item, now, result, nil)
	}

	if err := ValidateCreateReportInputAt(ReportInput{StoreInput: storeInput}, now); err != nil {
		result.Result = "validation_error"
		result.Error = syncValidationError(err)
		return resultWithSyncAttempt(ctx, syncStore, actor, item, now, result, nil)
	}

	existing, err := syncStore.GetReportByExternalID(ctx, item.ClientReportID)
	if err == nil {
		result = offlineSyncExistingReportResult(ctx, syncStore, item, storeInput, existing)
		return resultWithSyncAttempt(ctx, syncStore, actor, item, now, result, &existing.ID)
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		result.Result = "server_error"
		result.Error = &SyncItemError{
			Code:    "server_error",
			Message: "failed to check existing offline report",
		}
		return resultWithSyncAttempt(ctx, syncStore, actor, item, now, result, nil)
	}

	existingPending, err := syncStore.GetPendingReportByPayload(ctx, storeInput)
	if err == nil {
		result = offlineSyncPendingDuplicateResult(ctx, syncStore, item, existingPending)
		return resultWithSyncAttempt(ctx, syncStore, actor, item, now, result, &existingPending.ID)
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		result.Result = "server_error"
		result.Error = &SyncItemError{
			Code:    "server_error",
			Message: "failed to check pending offline duplicates",
		}
		return resultWithSyncAttempt(ctx, syncStore, actor, item, now, result, nil)
	}

	storeInput.AuditEvent = ptr(ReportSubmissionAudit(storeInput, offlineSyncAuditActor(actor)))
	report, err := syncStore.CreatePendingReportTx(ctx, storeInput)
	if err != nil {
		if isReportExternalIDUniqueViolation(err) {
			existing, lookupErr := syncStore.GetReportByExternalID(ctx, item.ClientReportID)
			if lookupErr == nil {
				result = offlineSyncExistingReportResult(ctx, syncStore, item, storeInput, existing)
				return resultWithSyncAttempt(ctx, syncStore, actor, item, now, result, &existing.ID)
			}
		}
		result.Result = "server_error"
		result.Error = &SyncItemError{
			Code:    "server_error",
			Message: "failed to create offline report",
		}
		return resultWithSyncAttempt(ctx, syncStore, actor, item, now, result, nil)
	}

	result.Result = "created"
	result.Report = &report
	result.Warning = offlineCurrentStatusWarning(ctx, syncStore, item)
	return resultWithSyncAttempt(ctx, syncStore, actor, item, now, result, &report.ID)
}

func offlineSyncPendingDuplicateResult(
	ctx context.Context,
	syncStore OfflineSyncStore,
	item OfflineSyncItemInput,
	existing store.Report,
) OfflineSyncResult {
	return OfflineSyncResult{
		ClientReportID: item.ClientReportID,
		Result:         "duplicate",
		Report:         &existing,
		Warning:        offlineCurrentStatusWarning(ctx, syncStore, item),
	}
}

func offlineSyncExistingReportResult(
	ctx context.Context,
	syncStore OfflineSyncStore,
	item OfflineSyncItemInput,
	input store.CreateReportInput,
	existing store.Report,
) OfflineSyncResult {
	result := OfflineSyncResult{
		ClientReportID: item.ClientReportID,
		Report:         &existing,
	}
	if sameOfflineReportPayload(existing, input) {
		result.Result = "duplicate"
		result.Warning = offlineCurrentStatusWarning(ctx, syncStore, item)
		return result
	}

	result.Result = "conflict"
	result.Error = &SyncItemError{
		Code:    "conflict",
		Message: "client report id already exists with a different payload",
	}
	return result
}

func offlineItemStoreInput(item OfflineSyncItemInput, actor OfflineSyncActor, now time.Time) store.CreateReportInput {
	externalID := item.ClientReportID
	reason := item.Reason
	staffPressure := item.StaffPressure
	stockPressure := item.StockPressure
	queuePressure := item.QueuePressure
	input := store.CreateReportInput{
		ExternalID:        &externalID,
		ClinicID:          item.ClinicID,
		ReporterName:      offlineReporterName(actor),
		Source:            "field_worker",
		OfflineCreated:    true,
		SubmittedAt:       item.SubmittedAt,
		ReceivedAt:        now,
		Status:            item.Status,
		Reason:            &reason,
		StaffPressure:     &staffPressure,
		StockPressure:     &stockPressure,
		QueuePressure:     &queuePressure,
		ReviewState:       "pending",
		SubmittedByUserID: offlineActorUserID(actor),
	}
	if item.Notes != "" {
		notes := item.Notes
		input.Notes = &notes
	}
	return input
}

func offlineReporterName(actor OfflineSyncActor) *string {
	name := strings.TrimSpace(actor.DisplayName)
	if name == "" {
		name = strings.TrimSpace(actor.Email)
	}
	if name == "" {
		return nil
	}
	return &name
}

func offlineActorUserID(actor OfflineSyncActor) *int64 {
	if actor.UserID == 0 {
		return nil
	}
	return &actor.UserID
}

func offlineSyncAuditActor(actor OfflineSyncActor) AuditActor {
	name := strings.TrimSpace(actor.DisplayName)
	if name == "" {
		name = strings.TrimSpace(actor.Email)
	}
	return AuditActor{
		UserID:         actor.UserID,
		Name:           name,
		Role:           actor.Role,
		OrganisationID: actor.OrganisationID,
	}
}

func syncValidationError(err error) *SyncItemError {
	itemErr := &SyncItemError{
		Code:    "validation_error",
		Message: "offline report failed validation",
	}
	var validationErr ValidationError
	if errors.As(err, &validationErr) {
		itemErr.Fields = validationErr.Fields
		return itemErr
	}
	itemErr.Message = err.Error()
	return itemErr
}

func offlineCurrentStatusWarning(ctx context.Context, syncStore OfflineSyncStore, item OfflineSyncItemInput) *string {
	currentStatus, err := syncStore.GetCurrentStatus(ctx, item.ClinicID)
	if err != nil || currentStatus.LastReportedAt == nil {
		return nil
	}
	if currentStatus.LastReportedAt.After(item.SubmittedAt) {
		warning := "current clinic status is newer than this offline report"
		return &warning
	}
	return nil
}

func resultWithSyncAttempt(
	ctx context.Context,
	syncStore OfflineSyncStore,
	actor OfflineSyncActor,
	item OfflineSyncItemInput,
	now time.Time,
	result OfflineSyncResult,
	reportID *int64,
) OfflineSyncResult {
	if err := recordOfflineSyncAttempt(ctx, syncStore, actor, item, now, result, reportID); err != nil {
		result.Result = "server_error"
		result.Error = &SyncItemError{
			Code:    "server_error",
			Message: "failed to record offline sync attempt",
		}
	}
	return result
}

func recordOfflineSyncAttempt(
	ctx context.Context,
	syncStore OfflineSyncStore,
	actor OfflineSyncActor,
	item OfflineSyncItemInput,
	now time.Time,
	result OfflineSyncResult,
	reportID *int64,
) error {
	submittedAt := item.SubmittedAt
	input := store.CreateReportSyncAttemptInput{
		ExternalID:         syncAttemptExternalID(item.ClientReportID),
		ReportID:           reportID,
		SubmittedByUserID:  offlineActorUserID(actor),
		OrganisationID:     actor.OrganisationID,
		ClinicID:           item.ClinicID,
		Result:             result.Result,
		ClientAttemptCount: normalizedClientAttemptCount(item.ClientAttemptCount),
		QueuedAt:           item.QueuedAt,
		SubmittedAt:        &submittedAt,
		ReceivedAt:         now,
	}
	if result.Error != nil {
		input.ErrorCode = &result.Error.Code
		input.ErrorMessage = &result.Error.Message
		if len(result.Error.Fields) > 0 {
			input.Metadata = map[string]any{"fields": result.Error.Fields}
		}
	}
	_, err := syncStore.CreateReportSyncAttempt(ctx, input)
	return err
}

func syncAttemptExternalID(clientReportID string) string {
	if strings.TrimSpace(clientReportID) == "" {
		return missingClientReportIDExternalID
	}
	return clientReportID
}

func isReportExternalIDUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) {
		return false
	}

	return pgErr.Code == "23505" && pgErr.ConstraintName == "reports_external_id_key"
}

func sameOfflineReportPayload(existing store.Report, input store.CreateReportInput) bool {
	return existing.ClinicID == input.ClinicID &&
		existing.Status == input.Status &&
		sameStringPtr(existing.Reason, input.Reason) &&
		sameStringPtr(existing.StaffPressure, input.StaffPressure) &&
		sameStringPtr(existing.StockPressure, input.StockPressure) &&
		sameStringPtr(existing.QueuePressure, input.QueuePressure) &&
		sameStringPtr(existing.Notes, input.Notes) &&
		samePostgresTimestamp(existing.SubmittedAt, input.SubmittedAt)
}

func sameStringPtr(left *string, right *string) bool {
	if left == nil || right == nil {
		return left == right
	}
	return *left == *right
}

func normalizedClientAttemptCount(count int) int {
	if count < 0 {
		return 0
	}
	return count
}

func samePostgresTimestamp(left time.Time, right time.Time) bool {
	return left.Truncate(time.Microsecond).Equal(right.Truncate(time.Microsecond))
}
