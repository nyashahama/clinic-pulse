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

func toReport(row *db.GetReportByExternalIDRow) (Report, error) {
	r := Report{
		ID:                row.ID,
		ExternalID:        row.ExternalID,
		ClinicID:          row.ClinicID,
		ReporterName:      row.ReporterName,
		Source:            row.Source,
		OfflineCreated:    row.OfflineCreated,
		SubmittedAt:       timestamptzTime(row.SubmittedAt),
		ReceivedAt:        timestamptzTime(row.ReceivedAt),
		Status:            row.Status,
		Reason:            row.Reason,
		StaffPressure:     row.StaffPressure,
		StockPressure:     row.StockPressure,
		QueuePressure:     row.QueuePressure,
		Notes:             row.Notes,
		ReviewState:       row.ReviewState,
		ConfidenceScore:   &row.ConfidenceScore,
		SubmittedByUserID: row.SubmittedByUserID,
		ReviewedByUserID:  row.ReviewedByUserID,
		ReviewedAt:        timestamptzPtr(row.ReviewedAt),
		ReviewNotes:       row.ReviewNotes,
	}
	if err := unmarshalMap(row.VisitVerification, &r.VisitVerification); err != nil {
		return Report{}, err
	}
	return r, nil
}

func toReportFromPendingRow(row *db.ListPendingReportsRow) (Report, error) {
	r := Report{
		ID:                row.ID,
		ExternalID:        row.ExternalID,
		ClinicID:          row.ClinicID,
		ReporterName:      row.ReporterName,
		Source:            row.Source,
		OfflineCreated:    row.OfflineCreated,
		SubmittedAt:       timestamptzTime(row.SubmittedAt),
		ReceivedAt:        timestamptzTime(row.ReceivedAt),
		Status:            row.Status,
		Reason:            row.Reason,
		StaffPressure:     row.StaffPressure,
		StockPressure:     row.StockPressure,
		QueuePressure:     row.QueuePressure,
		Notes:             row.Notes,
		ReviewState:       row.ReviewState,
		ConfidenceScore:   &row.ReportsConfidenceScore,
		SubmittedByUserID: row.SubmittedByUserID,
		ReviewedByUserID:  row.ReviewedByUserID,
		ReviewedAt:        timestamptzPtr(row.ReviewedAt),
		ReviewNotes:       row.ReviewNotes,
	}
	if err := unmarshalMap(row.VisitVerification, &r.VisitVerification); err != nil {
		return Report{}, err
	}
	return r, nil
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

func toPartnerAPIKey(row *db.InsertPartnerAPIKeyRow) (PartnerAPIKey, error) {
	key := PartnerAPIKey{
		ID:              row.ID,
		OrganisationID:  row.OrganisationID,
		Name:            row.Name,
		Environment:     row.Environment,
		KeyPrefix:       row.KeyPrefix,
		KeyHash:         row.KeyHash,
		ExpiresAt:       timestamptzPtr(row.ExpiresAt),
		RevokedAt:       timestamptzPtr(row.RevokedAt),
		LastUsedAt:      timestamptzPtr(row.LastUsedAt),
		CreatedByUserID: row.CreatedByUserID,
		CreatedAt:       timestamptzTime(row.CreatedAt),
		UpdatedAt:       timestamptzTime(row.UpdatedAt),
	}
	if row.LastUsedIp != "" {
		key.LastUsedIP = &row.LastUsedIp
	}
	if err := unmarshalStringSlice(row.Scopes, &key.Scopes); err != nil {
		return PartnerAPIKey{}, err
	}
	if err := unmarshalStringSlice(row.AllowedDistricts, &key.AllowedDistricts); err != nil {
		return PartnerAPIKey{}, err
	}
	return key, nil
}

func toPartnerWebhookSubscription(row *db.PartnerWebhookSubscription) (PartnerWebhookSubscription, error) {
	sub := PartnerWebhookSubscription{
		ID:              row.ID,
		OrganisationID:  row.OrganisationID,
		Name:            row.Name,
		TargetURL:       row.TargetUrl,
		SecretHash:      row.SecretHash,
		Status:          row.Status,
		LastTestedAt:    timestamptzPtr(row.LastTestedAt),
		LastTestStatus:  row.LastTestStatus,
		LastError:       row.LastError,
		CreatedByUserID: row.CreatedByUserID,
		CreatedAt:       timestamptzTime(row.CreatedAt),
		UpdatedAt:       timestamptzTime(row.UpdatedAt),
	}
	if err := unmarshalStringSlice(row.EventTypes, &sub.EventTypes); err != nil {
		return PartnerWebhookSubscription{}, err
	}
	if err := unmarshalMap(row.LastTestMetadata, &sub.LastTestMetadata); err != nil {
		return PartnerWebhookSubscription{}, err
	}
	return sub, nil
}

func toPartnerWebhookEvent(row *db.PartnerWebhookEvent) (PartnerWebhookEvent, error) {
	event := PartnerWebhookEvent{
		ID:             row.ID,
		SubscriptionID: row.SubscriptionID,
		EventType:      row.EventType,
		Status:         row.Status,
		AttemptCount:   int(row.AttemptCount),
		LastError:      row.LastError,
		CreatedAt:      timestamptzTime(row.CreatedAt),
		DeliveredAt:    timestamptzPtr(row.DeliveredAt),
	}
	if err := unmarshalMap(row.Payload, &event.Payload); err != nil {
		return PartnerWebhookEvent{}, err
	}
	if err := unmarshalMap(row.Metadata, &event.Metadata); err != nil {
		return PartnerWebhookEvent{}, err
	}
	return event, nil
}

func toPartnerExportRun(row *db.PartnerExportRun) (PartnerExportRun, error) {
	run := PartnerExportRun{
		ID:                row.ID,
		OrganisationID:    row.OrganisationID,
		RequestedByUserID: row.RequestedByUserID,
		Format:            row.Format,
		Checksum:          row.Checksum,
		CreatedAt:         timestamptzTime(row.CreatedAt),
	}
	if err := unmarshalMap(row.Scope, &run.Scope); err != nil {
		return PartnerExportRun{}, err
	}
	if err := unmarshalMap(row.RecordCounts, &run.RecordCounts); err != nil {
		return PartnerExportRun{}, err
	}
	if err := unmarshalMap(row.Payload, &run.Payload); err != nil {
		return PartnerExportRun{}, err
	}
	return run, nil
}

func toIntegrationStatusCheck(row *db.IntegrationStatusCheck) (IntegrationStatusCheck, error) {
	check := IntegrationStatusCheck{
		ID:             row.ID,
		OrganisationID: row.OrganisationID,
		CheckName:      row.CheckName,
		Status:         row.Status,
		Summary:        row.Summary,
		CheckedAt:      timestamptzTime(row.CheckedAt),
	}
	if err := unmarshalMap(row.Metadata, &check.Metadata); err != nil {
		return IntegrationStatusCheck{}, err
	}
	return check, nil
}

func toAuditEvent(row *db.AuditEvent) (AuditEvent, error) {
	event := AuditEvent{
		ID:             row.ID,
		ExternalID:     row.ExternalID,
		ActorName:      row.ActorName,
		EventType:      row.EventType,
		Summary:        row.Summary,
		CreatedAt:      timestamptzTime(row.CreatedAt),
		ActorUserID:    row.ActorUserID,
		ActorRole:      row.ActorRole,
		OrganisationID: row.OrganisationID,
		EntityType:     row.EntityType,
		EntityID:       row.EntityID,
	}
	if row.ClinicID != nil {
		event.ClinicID = *row.ClinicID
	}
	if err := unmarshalMap(row.Metadata, &event.Metadata); err != nil {
		return AuditEvent{}, err
	}
	return event, nil
}
