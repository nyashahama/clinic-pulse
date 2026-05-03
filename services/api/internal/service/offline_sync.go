package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"clinicpulse/services/api/internal/store"
	"github.com/jackc/pgx/v5"
)

type OfflineSyncStore interface {
	CreatePendingReportTx(ctx context.Context, input store.CreateReportInput) (store.Report, error)
	GetReportByExternalID(ctx context.Context, externalID string) (store.Report, error)
	GetCurrentStatus(ctx context.Context, clinicID string) (store.CurrentStatus, error)
	CreateReportSyncAttempt(ctx context.Context, input store.CreateReportSyncAttemptInput) (store.ReportSyncAttempt, error)
}

type OfflineSyncActor struct {
	UserID         int64
	DisplayName    string
	Email          string
	Role           string
	OrganisationID *int64
}

type OfflineSyncItemInput struct {
	ClientReportID     string
	ClinicID           string
	Status             string
	Reason             string
	StaffPressure      string
	StockPressure      string
	QueuePressure      string
	Notes              string
	SubmittedAt        time.Time
	QueuedAt           *time.Time
	ClientAttemptCount int
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
		recordOfflineSyncAttempt(ctx, syncStore, actor, item, now, result, nil)
		return result
	}

	if err := ValidateCreateReportInputAt(ReportInput{StoreInput: storeInput}, now); err != nil {
		result.Result = "validation_error"
		result.Error = syncValidationError(err)
		recordOfflineSyncAttempt(ctx, syncStore, actor, item, now, result, nil)
		return result
	}

	existing, err := syncStore.GetReportByExternalID(ctx, item.ClientReportID)
	if err == nil {
		if sameOfflineReportPayload(existing, storeInput) {
			result.Result = "duplicate"
			result.Report = &existing
			result.Warning = offlineCurrentStatusWarning(ctx, syncStore, item)
			recordOfflineSyncAttempt(ctx, syncStore, actor, item, now, result, &existing.ID)
			return result
		}
		result.Result = "conflict"
		result.Report = &existing
		result.Error = &SyncItemError{
			Code:    "conflict",
			Message: "client report id already exists with a different payload",
		}
		recordOfflineSyncAttempt(ctx, syncStore, actor, item, now, result, &existing.ID)
		return result
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		result.Result = "server_error"
		result.Error = &SyncItemError{
			Code:    "server_error",
			Message: "failed to check existing offline report",
		}
		recordOfflineSyncAttempt(ctx, syncStore, actor, item, now, result, nil)
		return result
	}

	report, err := syncStore.CreatePendingReportTx(ctx, storeInput)
	if err != nil {
		result.Result = "server_error"
		result.Error = &SyncItemError{
			Code:    "server_error",
			Message: "failed to create offline report",
		}
		recordOfflineSyncAttempt(ctx, syncStore, actor, item, now, result, nil)
		return result
	}

	result.Result = "created"
	result.Report = &report
	result.Warning = offlineCurrentStatusWarning(ctx, syncStore, item)
	recordOfflineSyncAttempt(ctx, syncStore, actor, item, now, result, &report.ID)
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

func recordOfflineSyncAttempt(
	ctx context.Context,
	syncStore OfflineSyncStore,
	actor OfflineSyncActor,
	item OfflineSyncItemInput,
	now time.Time,
	result OfflineSyncResult,
	reportID *int64,
) {
	submittedAt := item.SubmittedAt
	input := store.CreateReportSyncAttemptInput{
		ExternalID:         item.ClientReportID,
		ReportID:           reportID,
		SubmittedByUserID:  offlineActorUserID(actor),
		OrganisationID:     actor.OrganisationID,
		ClinicID:           item.ClinicID,
		Result:             result.Result,
		ClientAttemptCount: item.ClientAttemptCount,
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
	_, _ = syncStore.CreateReportSyncAttempt(ctx, input)
}

func sameOfflineReportPayload(existing store.Report, input store.CreateReportInput) bool {
	return existing.ClinicID == input.ClinicID &&
		existing.Status == input.Status &&
		sameStringPtr(existing.Reason, input.Reason) &&
		sameStringPtr(existing.StaffPressure, input.StaffPressure) &&
		sameStringPtr(existing.StockPressure, input.StockPressure) &&
		sameStringPtr(existing.QueuePressure, input.QueuePressure) &&
		sameStringPtr(existing.Notes, input.Notes) &&
		existing.SubmittedAt.Equal(input.SubmittedAt)
}

func sameStringPtr(left *string, right *string) bool {
	if left == nil || right == nil {
		return left == right
	}
	return *left == *right
}
