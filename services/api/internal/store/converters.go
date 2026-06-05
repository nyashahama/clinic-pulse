package store

import (
	"time"

	"clinicpulse/services/api/internal/store/db"
)

func toReportSyncAttempt(row *db.ReportSyncAttempt) (ReportSyncAttempt, error) {
	attempt := ReportSyncAttempt{
		ID:                 row.ID,
		ExternalID:         row.ExternalID,
		ReportID:           row.ReportID,
		SubmittedByUserID:  row.SubmittedByUserID,
		OrganisationID:     row.OrganisationID,
		Result:             row.Result,
		ClientAttemptCount: int(row.ClientAttemptCount),
		QueuedAt:           timestamptzPtr(row.QueuedAt),
		SubmittedAt:        timestamptzPtr(row.SubmittedAt),
		ReceivedAt:         timestamptzTime(row.ReceivedAt),
		ErrorCode:          row.ErrorCode,
		ErrorMessage:       row.ErrorMessage,
	}
	if row.ClinicID != nil {
		attempt.ClinicID = *row.ClinicID
	}
	if err := unmarshalMap(row.Metadata, &attempt.Metadata); err != nil {
		return ReportSyncAttempt{}, err
	}
	return attempt, nil
}

func toPilotIngestionRun(row *db.PilotIngestionRun) (PilotIngestionRun, error) {
	run := PilotIngestionRun{
		ID:              row.ID,
		OrganisationID:  row.OrganisationID,
		SourceName:      row.SourceName,
		SourceReference: row.SourceReference,
		Status:          row.Status,
		RecordsReceived: int(row.RecordsReceived),
		RecordsImported: int(row.RecordsImported),
		RecordsRejected: int(row.RecordsRejected),
		ActorUserID:     row.ActorUserID,
		StartedAt:       timestamptzTime(row.StartedAt),
		CompletedAt:     timestamptzPtr(row.CompletedAt),
	}
	if err := unmarshalStringSlice(row.ValidationErrors, &run.ValidationErrors); err != nil {
		return PilotIngestionRun{}, err
	}
	return run, nil
}

func syncSummaryFromRow(since time.Time, row *db.SyncSummarySinceRow) SyncSummary {
	s := SyncSummary{
		WindowStartedAt:             since,
		OfflineReportsReceived:      int(row.CreatedCount),
		DuplicateSyncsHandled:       int(row.DuplicateCount),
		ConflictsNeedingAttention:   int(row.ConflictCount),
		ValidationFailures:          int(row.ValidationErrorCount),
		PendingOfflineReports:       int(row.PendingCount),
		NeedsConfirmationClinics:    int(row.NeedsConfirmationCount),
		StaleClinics:                int(row.StaleCount),
	}
	if row.TotalCount > 0 {
		s.MedianCurrentStatusAgeHours = &row.MedianCurrentStatusAgeHours
	}
	return s
}

func syncSummaryFromReviewScopeRow(since time.Time, row *db.SyncSummarySinceForReviewScopeRow) SyncSummary {
	s := SyncSummary{
		WindowStartedAt:             since,
		OfflineReportsReceived:      int(row.CreatedCount),
		DuplicateSyncsHandled:       int(row.DuplicateCount),
		ConflictsNeedingAttention:   int(row.ConflictCount),
		ValidationFailures:          int(row.ValidationErrorCount),
		PendingOfflineReports:       int(row.PendingCount),
		NeedsConfirmationClinics:    int(row.NeedsConfirmationCount),
		StaleClinics:                int(row.StaleCount),
	}
	if row.TotalCount > 0 {
		s.MedianCurrentStatusAgeHours = &row.MedianCurrentStatusAgeHours
	}
	return s
}
