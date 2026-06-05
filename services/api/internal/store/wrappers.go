package store

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"clinicpulse/services/api/internal/store/db"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
)

func (s Store) ListClinics(ctx context.Context) ([]ClinicDetail, error) {
	clinicRows, err := s.db.ListClinics(ctx)
	if err != nil {
		return nil, err
	}

	details := make([]ClinicDetail, 0, len(clinicRows))
	for _, row := range clinicRows {
		clinic := clinicFromListRow(row)

		services, err := s.listClinicServices(ctx, clinic.ID)
		if err != nil {
			return nil, err
		}

		status, err := s.GetCurrentStatus(ctx, clinic.ID)
		if err != nil && err != pgx.ErrNoRows {
			return nil, err
		}

		detail := ClinicDetail{Clinic: clinic, Services: services}
		if err == nil {
			detail.CurrentStatus = &status
		}
		details = append(details, detail)
	}

	return details, nil
}

func (s Store) GetClinic(ctx context.Context, clinicID string) (ClinicDetail, error) {
	row, err := s.db.GetClinic(ctx, clinicID)
	if err != nil {
		return ClinicDetail{}, err
	}

	clinic := clinicFromRow(row)

	services, err := s.listClinicServices(ctx, clinic.ID)
	if err != nil {
		return ClinicDetail{}, err
	}

	status, err := s.GetCurrentStatus(ctx, clinic.ID)
	if err != nil && err != pgx.ErrNoRows {
		return ClinicDetail{}, err
	}

	detail := ClinicDetail{Clinic: clinic, Services: services}
	if err == nil {
		detail.CurrentStatus = &status
	}

	return detail, nil
}

func (s Store) GetPartnerReadinessSnapshot(ctx context.Context, organisationID *int64) (PartnerReadinessSnapshot, error) {
	apiKeys, err := s.ListPartnerAPIKeys(ctx, organisationID)
	if err != nil {
		return PartnerReadinessSnapshot{}, err
	}
	webhookSubscriptions, err := s.ListPartnerWebhookSubscriptions(ctx, organisationID)
	if err != nil {
		return PartnerReadinessSnapshot{}, err
	}
	webhookEvents, err := s.ListPartnerWebhookEvents(ctx, organisationID)
	if err != nil {
		return PartnerReadinessSnapshot{}, err
	}
	exportRuns, err := s.listPartnerExportRuns(ctx, organisationID)
	if err != nil {
		return PartnerReadinessSnapshot{}, err
	}
	integrationChecks, err := s.ListIntegrationStatusChecks(ctx, organisationID)
	if err != nil {
		return PartnerReadinessSnapshot{}, err
	}

	return PartnerReadinessSnapshot{
		APIKeys:              nonNilPartnerAPIKeys(apiKeys),
		WebhookSubscriptions: nonNilPartnerWebhookSubscriptions(webhookSubscriptions),
		WebhookEvents:        nonNilPartnerWebhookEvents(webhookEvents),
		ExportRuns:           nonNilPartnerExportRuns(exportRuns),
		IntegrationChecks:    nonNilIntegrationStatusChecks(integrationChecks),
	}, nil
}

func (s Store) UpdateCurrentStatusFreshness(ctx context.Context, clinicID string, freshness string, updatedAt time.Time, audit *CreateAuditEventInput) (CurrentStatus, bool, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return CurrentStatus{}, false, err
	}
	defer tx.Rollback(ctx)

	q := s.db.WithTx(tx)

	current, err := q.GetCurrentStatusForUpdate(ctx, clinicID)
	if err != nil {
		return CurrentStatus{}, false, err
	}
	if current.Freshness == freshness {
		if err := tx.Commit(ctx); err != nil {
			return CurrentStatus{}, false, err
		}
		return currentStatusFromTxRow(current), false, nil
	}

	updated, err := q.UpdateCurrentStatusFreshness(ctx, &db.UpdateCurrentStatusFreshnessParams{
		ClinicID:  clinicID,
		Freshness: freshness,
		UpdatedAt: pgtype.Timestamptz{Time: updatedAt, Valid: true},
	})
	if err != nil {
		return CurrentStatus{}, false, err
	}

	if audit != nil {
		auditInput := *audit
		if auditInput.ClinicID == nil {
			auditInput.ClinicID = &clinicID
		}
		if auditInput.CreatedAt.IsZero() {
			auditInput.CreatedAt = updatedAt
		}
		normalized := normalizeCreateAuditEventInput(auditInput)
		metadataJSON, err := json.Marshal(normalized.Metadata)
		if err != nil {
			return CurrentStatus{}, false, err
		}
		_, err = q.InsertAuditEvent(ctx, &db.InsertAuditEventParams{
			ExternalID:     normalized.ExternalID,
			ClinicID:       normalized.ClinicID,
			ActorName:      normalized.ActorName,
			EventType:      normalized.EventType,
			Summary:        normalized.Summary,
			CreatedAt:      pgtype.Timestamptz{Time: normalized.CreatedAt, Valid: true},
			ActorUserID:    normalized.ActorUserID,
			ActorRole:      normalized.ActorRole,
			OrganisationID: normalized.OrganisationID,
			EntityType:     normalized.EntityType,
			EntityID:       normalized.EntityID,
			Column12:       metadataJSON,
		})
		if err != nil {
			return CurrentStatus{}, false, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return CurrentStatus{}, false, err
	}

	return currentStatusFromFreshnessRow(updated), true, nil
}

func (s Store) CreateReportTx(ctx context.Context, input CreateReportInput) (Report, CurrentStatus, AuditEvent, error) {
	normalized := normalizeCreateReportInput(input)
	if normalized.ReviewState != "accepted" {
		return Report{}, CurrentStatus{}, AuditEvent{}, ErrReportNotAccepted
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Report{}, CurrentStatus{}, AuditEvent{}, err
	}
	defer tx.Rollback(ctx)

	q := s.db.WithTx(tx)

	if _, err := q.VerifyClinicExists(ctx, normalized.ClinicID); err != nil {
		return Report{}, CurrentStatus{}, AuditEvent{}, err
	}

	reportRow, err := q.InsertReport(ctx, &db.InsertReportParams{
		ExternalID:        normalized.ExternalID,
		ClinicID:          normalized.ClinicID,
		ReporterName:      normalized.ReporterName,
		Source:            normalized.Source,
		OfflineCreated:    normalized.OfflineCreated,
		SubmittedAt:       pgtype.Timestamptz{Time: normalized.SubmittedAt, Valid: true},
		ReceivedAt:        pgtype.Timestamptz{Time: normalized.ReceivedAt, Valid: true},
		Status:            normalized.Status,
		Reason:            normalized.Reason,
		StaffPressure:     normalized.StaffPressure,
		StockPressure:     normalized.StockPressure,
		QueuePressure:     normalized.QueuePressure,
		Notes:             normalized.Notes,
		ReviewState:       normalized.ReviewState,
		ConfidenceScore:   float64PtrToNumeric(normalized.ConfidenceScore),
		VisitVerification: marshalMapOrEmpty(normalized.VisitVerification),
		SubmittedByUserID: normalized.SubmittedByUserID,
	})
	if err != nil {
		return Report{}, CurrentStatus{}, AuditEvent{}, err
	}

	conv := db.GetReportByExternalIDRow(*reportRow)
	report, err := toReport(&conv)
	if err != nil {
		return Report{}, CurrentStatus{}, AuditEvent{}, err
	}

	var currentStatus CurrentStatus
	statusRow, err := q.UpsertCurrentStatus(ctx, &db.UpsertCurrentStatusParams{
		ClinicID:        normalized.ClinicID,
		Status:          normalized.Status,
		Reason:          normalized.Reason,
		Freshness:       normalized.Freshness,
		LastReportedAt:  pgtype.Timestamptz{Time: normalized.SubmittedAt, Valid: true},
		ReporterName:    normalized.ReporterName,
		Source:          &normalized.Source,
		StaffPressure:   normalized.StaffPressure,
		StockPressure:   normalized.StockPressure,
		QueuePressure:   normalized.QueuePressure,
		ConfidenceScore: float64PtrToNumeric(normalized.ConfidenceScore),
		UpdatedAt:       pgtype.Timestamptz{Time: normalized.ReceivedAt, Valid: true},
	})
	if err == pgx.ErrNoRows {
		existingRow, getErr := q.GetCurrentStatus(ctx, normalized.ClinicID)
		if getErr != nil {
			return Report{}, CurrentStatus{}, AuditEvent{}, getErr
		}
		currentStatus = currentStatusFromRow(existingRow)
	} else if err != nil {
		return Report{}, CurrentStatus{}, AuditEvent{}, err
	} else {
		currentStatus = currentStatusFromUpsertRow(statusRow)
	}

	auditInput := acceptedReportAuditEventInput(normalized)
	if normalized.AuditEvent != nil {
		auditInput = *normalized.AuditEvent
	}
	auditInput = auditEventForReport(auditInput, report, normalized.ReceivedAt)
	normalizedAudit := normalizeCreateAuditEventInput(auditInput)
	metadataJSON, err := json.Marshal(normalizedAudit.Metadata)
	if err != nil {
		return Report{}, CurrentStatus{}, AuditEvent{}, err
	}
	aeRow, err := q.InsertAuditEvent(ctx, &db.InsertAuditEventParams{
		ExternalID:     normalizedAudit.ExternalID,
		ClinicID:       normalizedAudit.ClinicID,
		ActorName:      normalizedAudit.ActorName,
		EventType:      normalizedAudit.EventType,
		Summary:        normalizedAudit.Summary,
		CreatedAt:      pgtype.Timestamptz{Time: normalizedAudit.CreatedAt, Valid: true},
		ActorUserID:    normalizedAudit.ActorUserID,
		ActorRole:      normalizedAudit.ActorRole,
		OrganisationID: normalizedAudit.OrganisationID,
		EntityType:     normalizedAudit.EntityType,
		EntityID:       normalizedAudit.EntityID,
		Column12:       metadataJSON,
	})
	if err != nil {
		return Report{}, CurrentStatus{}, AuditEvent{}, err
	}
	auditEvent, err := toAuditEvent(aeRow)
	if err != nil {
		return Report{}, CurrentStatus{}, AuditEvent{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Report{}, CurrentStatus{}, AuditEvent{}, err
	}

	return report, currentStatus, auditEvent, nil
}

func (s Store) CreatePendingReportTx(ctx context.Context, input CreateReportInput) (Report, error) {
	normalized := normalizePendingCreateReportInput(input)
	if normalized.ReviewState != "pending" {
		return Report{}, ErrReportNotPending
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Report{}, err
	}
	defer tx.Rollback(ctx)

	q := s.db.WithTx(tx)

	if _, err := q.VerifyClinicExists(ctx, normalized.ClinicID); err != nil {
		return Report{}, err
	}

	reportRow, err := q.InsertReport(ctx, &db.InsertReportParams{
		ExternalID:        normalized.ExternalID,
		ClinicID:          normalized.ClinicID,
		ReporterName:      normalized.ReporterName,
		Source:            normalized.Source,
		OfflineCreated:    normalized.OfflineCreated,
		SubmittedAt:       pgtype.Timestamptz{Time: normalized.SubmittedAt, Valid: true},
		ReceivedAt:        pgtype.Timestamptz{Time: normalized.ReceivedAt, Valid: true},
		Status:            normalized.Status,
		Reason:            normalized.Reason,
		StaffPressure:     normalized.StaffPressure,
		StockPressure:     normalized.StockPressure,
		QueuePressure:     normalized.QueuePressure,
		Notes:             normalized.Notes,
		ReviewState:       normalized.ReviewState,
		ConfidenceScore:   float64PtrToNumeric(normalized.ConfidenceScore),
		VisitVerification: marshalMapOrEmpty(normalized.VisitVerification),
		SubmittedByUserID: normalized.SubmittedByUserID,
	})
	if err != nil {
		return Report{}, err
	}

	conv := db.GetReportByExternalIDRow(*reportRow)
	report, err := toReport(&conv)
	if err != nil {
		return Report{}, err
	}

	if normalized.AuditEvent != nil {
		auditInput := auditEventForReport(*normalized.AuditEvent, report, normalized.ReceivedAt)
		normalizedAudit := normalizeCreateAuditEventInput(auditInput)
		metadataJSON, err := json.Marshal(normalizedAudit.Metadata)
		if err != nil {
			return Report{}, err
		}
		if _, err := q.InsertAuditEvent(ctx, &db.InsertAuditEventParams{
			ExternalID:     normalizedAudit.ExternalID,
			ClinicID:       normalizedAudit.ClinicID,
			ActorName:      normalizedAudit.ActorName,
			EventType:      normalizedAudit.EventType,
			Summary:        normalizedAudit.Summary,
			CreatedAt:      pgtype.Timestamptz{Time: normalizedAudit.CreatedAt, Valid: true},
			ActorUserID:    normalizedAudit.ActorUserID,
			ActorRole:      normalizedAudit.ActorRole,
			OrganisationID: normalizedAudit.OrganisationID,
			EntityType:     normalizedAudit.EntityType,
			EntityID:       normalizedAudit.EntityID,
			Column12:       metadataJSON,
		}); err != nil {
			return Report{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return Report{}, err
	}

	return report, nil
}

func (s Store) ReviewReportTx(ctx context.Context, input ReviewReportInput) (Report, *CurrentStatus, error) {
	if input.Decision != "accepted" && input.Decision != "rejected" {
		return Report{}, nil, ErrInvalidReviewDecision
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Report{}, nil, err
	}
	defer tx.Rollback(ctx)

	q := s.db.WithTx(tx)

	lockedRow, err := q.GetReportForReview(ctx, input.ReportID)
	if err != nil {
		return Report{}, nil, err
	}

	district, err := q.GetClinicDistrict(ctx, lockedRow.ClinicID)
	if err != nil {
		return Report{}, nil, err
	}
	if !reviewScopeCanAccessDistrict(input.Scope, district) {
		return Report{}, nil, ErrReportReviewForbidden
	}
	if lockedRow.ReviewState != "pending" {
		return Report{}, nil, ErrReportAlreadyReviewed
	}

	reviewedAt := time.Now().UTC()
	if err := q.InsertReportReview(ctx, &db.InsertReportReviewParams{
		ReportID:       input.ReportID,
		ReviewerUserID: input.ReviewerUserID,
		OrganisationID: input.OrganisationID,
		Decision:       input.Decision,
		Notes:          input.Notes,
		CreatedAt:      pgtype.Timestamptz{Time: reviewedAt, Valid: true},
	}); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return Report{}, nil, ErrReportAlreadyReviewed
		}
		return Report{}, nil, err
	}

	reportRow, err := q.UpdateReportReviewState(ctx, &db.UpdateReportReviewStateParams{
		ID:               input.ReportID,
		ReviewState:      input.Decision,
		ReviewedByUserID: &input.ReviewerUserID,
		ReviewedAt:       pgtype.Timestamptz{Time: reviewedAt, Valid: true},
		ReviewNotes:      input.Notes,
	})
	if err != nil {
		return Report{}, nil, err
	}

	conv := db.GetReportByExternalIDRow(*reportRow)
	report, err := toReport(&conv)
	if err != nil {
		return Report{}, nil, err
	}

	var status *CurrentStatus
	if input.Decision == "accepted" {
		statusRow, err := q.UpsertCurrentStatus(ctx, &db.UpsertCurrentStatusParams{
			ClinicID:        report.ClinicID,
			Status:          report.Status,
			Reason:          report.Reason,
			Freshness:       "fresh",
			LastReportedAt:  pgtype.Timestamptz{Time: report.SubmittedAt, Valid: true},
			ReporterName:    report.ReporterName,
			Source:          &report.Source,
			StaffPressure:   report.StaffPressure,
			StockPressure:   report.StockPressure,
			QueuePressure:   report.QueuePressure,
			ConfidenceScore: float64PtrToNumeric(report.ConfidenceScore),
			UpdatedAt:       pgtype.Timestamptz{Time: reviewedAt, Valid: true},
		})
		if err == pgx.ErrNoRows {
			existingRow, getErr := q.GetCurrentStatus(ctx, report.ClinicID)
			if getErr != nil {
				return Report{}, nil, getErr
			}
			s := currentStatusFromRow(existingRow)
			status = &s
		} else if err != nil {
			return Report{}, nil, err
		} else {
			s := currentStatusFromUpsertRow(statusRow)
			status = &s
		}
	}

	if input.AuditEvent != nil {
		auditInput := auditEventForReport(*input.AuditEvent, report, reviewedAt)
		normalizedAudit := normalizeCreateAuditEventInput(auditInput)
		metadataJSON, err := json.Marshal(normalizedAudit.Metadata)
		if err != nil {
			return Report{}, nil, err
		}
		if _, err := q.InsertAuditEvent(ctx, &db.InsertAuditEventParams{
			ExternalID:     normalizedAudit.ExternalID,
			ClinicID:       normalizedAudit.ClinicID,
			ActorName:      normalizedAudit.ActorName,
			EventType:      normalizedAudit.EventType,
			Summary:        normalizedAudit.Summary,
			CreatedAt:      pgtype.Timestamptz{Time: normalizedAudit.CreatedAt, Valid: true},
			ActorUserID:    normalizedAudit.ActorUserID,
			ActorRole:      normalizedAudit.ActorRole,
			OrganisationID: normalizedAudit.OrganisationID,
			EntityType:     normalizedAudit.EntityType,
			EntityID:       normalizedAudit.EntityID,
			Column12:       metadataJSON,
		}); err != nil {
			return Report{}, nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return Report{}, nil, err
	}

	return report, status, nil
}

func (s Store) partnerAPIKeyStateError(ctx context.Context, keyID int64, at time.Time) error {
	state, err := s.db.GetPartnerAPIKeyState(ctx, keyID)
	if err != nil {
		return err
	}
	if state.RevokedAt.Valid {
		return ErrPartnerAPIKeyRevoked
	}
	if state.ExpiresAt.Valid && !state.ExpiresAt.Time.After(at) {
		return ErrPartnerAPIKeyExpired
	}
	return pgx.ErrNoRows
}

func (s Store) listClinicServices(ctx context.Context, clinicID string) ([]ClinicService, error) {
	rows, err := s.db.ListClinicServices(ctx, clinicID)
	if err != nil {
		return nil, err
	}
	services := make([]ClinicService, len(rows))
	for i, row := range rows {
		services[i] = clinicServiceFromRow(row)
	}
	return services, nil
}

func (s Store) CreateAdminUserWithAccessTx(ctx context.Context, input CreateAdminUserWithAccessInput) (User, OrganisationMembership, AuditEvent, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return User{}, OrganisationMembership{}, AuditEvent{}, err
	}
	defer tx.Rollback(ctx)

	q := s.db.WithTx(tx)

	userRow, err := q.CreateUser(ctx, &db.CreateUserParams{
		Email:                 strings.ToLower(strings.TrimSpace(input.User.Email)),
		DisplayName:           strings.TrimSpace(input.User.DisplayName),
		PasswordHash:          input.User.PasswordHash,
		PasswordResetRequired: input.User.PasswordResetRequired,
	})
	if err != nil {
		return User{}, OrganisationMembership{}, AuditEvent{}, err
	}

	user := userFromRow(userRow.ID, userRow.Email, userRow.DisplayName, userRow.PasswordHash, userRow.DisabledAt, userRow.PasswordChangedAt, userRow.PasswordResetRequired, userRow.CreatedAt, userRow.UpdatedAt)

	access := input.Access
	membershipRow, err := q.InsertOrganisationMembership(ctx, &db.InsertOrganisationMembershipParams{
		UserID:         user.ID,
		OrganisationID: access.OrganisationID,
		Role:           access.Role,
		District:       access.District,
	})
	if err != nil {
		return User{}, OrganisationMembership{}, AuditEvent{}, err
	}

	membership := membershipFromCreatedRow(membershipRow)

	auditInput := adminUserCreatedAuditEvent(input.AuditEvent, user)
	normalized := normalizeCreateAuditEventInput(auditInput)
	metadataJSON, err := json.Marshal(normalized.Metadata)
	if err != nil {
		return User{}, OrganisationMembership{}, AuditEvent{}, err
	}
	aeRow, err := q.InsertAuditEvent(ctx, &db.InsertAuditEventParams{
		ExternalID:     normalized.ExternalID,
		ClinicID:       normalized.ClinicID,
		ActorName:      normalized.ActorName,
		EventType:      normalized.EventType,
		Summary:        normalized.Summary,
		CreatedAt:      pgtype.Timestamptz{Time: normalized.CreatedAt, Valid: true},
		ActorUserID:    normalized.ActorUserID,
		ActorRole:      normalized.ActorRole,
		OrganisationID: normalized.OrganisationID,
		EntityType:     normalized.EntityType,
		EntityID:       normalized.EntityID,
		Column12:       metadataJSON,
	})
	if err != nil {
		return User{}, OrganisationMembership{}, AuditEvent{}, err
	}
	auditEvent, err := toAuditEvent(aeRow)
	if err != nil {
		return User{}, OrganisationMembership{}, AuditEvent{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return User{}, OrganisationMembership{}, AuditEvent{}, err
	}

	return user, membership, auditEvent, nil
}

func (s Store) UpdateUserLifecycleWithAuditTx(ctx context.Context, input UpdateUserLifecycleWithAuditInput) (User, AuditEvent, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return User{}, AuditEvent{}, err
	}
	defer tx.Rollback(ctx)

	q := s.db.WithTx(tx)

	userRow, err := q.UpdateUserLifecycle(ctx, &db.UpdateUserLifecycleParams{
		ID:          input.User.UserID,
		DisplayName: strOrZero(input.User.DisplayName),
		Column3:     boolOrFalse(input.User.Disabled),
		UpdatedAt:   pgtype.Timestamptz{Time: input.User.UpdatedAt, Valid: true},
	})
	if err != nil {
		return User{}, AuditEvent{}, err
	}

	user := userFromRow(userRow.ID, userRow.Email, userRow.DisplayName, userRow.PasswordHash, userRow.DisabledAt, userRow.PasswordChangedAt, userRow.PasswordResetRequired, userRow.CreatedAt, userRow.UpdatedAt)

	normalized := normalizeCreateAuditEventInput(input.AuditEvent)
	metadataJSON, err := json.Marshal(normalized.Metadata)
	if err != nil {
		return User{}, AuditEvent{}, err
	}
	aeRow, err := q.InsertAuditEvent(ctx, &db.InsertAuditEventParams{
		ExternalID:     normalized.ExternalID,
		ClinicID:       normalized.ClinicID,
		ActorName:      normalized.ActorName,
		EventType:      normalized.EventType,
		Summary:        normalized.Summary,
		CreatedAt:      pgtype.Timestamptz{Time: normalized.CreatedAt, Valid: true},
		ActorUserID:    normalized.ActorUserID,
		ActorRole:      normalized.ActorRole,
		OrganisationID: normalized.OrganisationID,
		EntityType:     normalized.EntityType,
		EntityID:       normalized.EntityID,
		Column12:       metadataJSON,
	})
	if err != nil {
		return User{}, AuditEvent{}, err
	}
	auditEvent, err := toAuditEvent(aeRow)
	if err != nil {
		return User{}, AuditEvent{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return User{}, AuditEvent{}, err
	}

	return user, auditEvent, nil
}

func (s Store) CreateSessionWithAuditTx(ctx context.Context, input CreateSessionWithAuditInput) (Session, AuditEvent, error) {
	normalizedSession, err := normalizeCreateSessionInput(input.Session)
	if err != nil {
		return Session{}, AuditEvent{}, err
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Session{}, AuditEvent{}, err
	}
	defer tx.Rollback(ctx)

	q := s.db.WithTx(tx)

	row, err := q.CreateSession(ctx, &db.CreateSessionParams{
		UserID:    normalizedSession.UserID,
		TokenHash: normalizedSession.TokenHash,
		ExpiresAt: pgtype.Timestamptz{Time: normalizedSession.ExpiresAt, Valid: true},
		UserAgent: normalizedSession.UserAgent,
		IpAddress: normalizedSession.IPAddress,
	})
	if err != nil {
		return Session{}, AuditEvent{}, err
	}

	session := sessionFromCreateRow(row)

	auditInput := auditEventForSession(input.AuditEvent, session)
	normalized := normalizeCreateAuditEventInput(auditInput)
	metadataJSON, err := json.Marshal(normalized.Metadata)
	if err != nil {
		return Session{}, AuditEvent{}, err
	}
	aeRow, err := q.InsertAuditEvent(ctx, &db.InsertAuditEventParams{
		ExternalID:     normalized.ExternalID,
		ClinicID:       normalized.ClinicID,
		ActorName:      normalized.ActorName,
		EventType:      normalized.EventType,
		Summary:        normalized.Summary,
		CreatedAt:      pgtype.Timestamptz{Time: normalized.CreatedAt, Valid: true},
		ActorUserID:    normalized.ActorUserID,
		ActorRole:      normalized.ActorRole,
		OrganisationID: normalized.OrganisationID,
		EntityType:     normalized.EntityType,
		EntityID:       normalized.EntityID,
		Column12:       metadataJSON,
	})
	if err != nil {
		return Session{}, AuditEvent{}, err
	}
	auditEvent, err := toAuditEvent(aeRow)
	if err != nil {
		return Session{}, AuditEvent{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Session{}, AuditEvent{}, err
	}

	return session, auditEvent, nil
}

func (s Store) RevokeActiveSessionsForUserWithAuditTx(ctx context.Context, input RevokeActiveSessionsWithAuditInput) (int64, AuditEvent, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return 0, AuditEvent{}, err
	}
	defer tx.Rollback(ctx)

	q := s.db.WithTx(tx)

	revokedSessions, err := q.RevokeActiveSessionsForUser(ctx, input.UserID)
	if err != nil {
		return 0, AuditEvent{}, err
	}

	input.AuditEvent.Metadata = cloneMetadata(input.AuditEvent.Metadata)
	input.AuditEvent.Metadata["revokedSessions"] = revokedSessions

	normalized := normalizeCreateAuditEventInput(input.AuditEvent)
	metadataJSON, err := json.Marshal(normalized.Metadata)
	if err != nil {
		return 0, AuditEvent{}, err
	}
	aeRow, err := q.InsertAuditEvent(ctx, &db.InsertAuditEventParams{
		ExternalID:     normalized.ExternalID,
		ClinicID:       normalized.ClinicID,
		ActorName:      normalized.ActorName,
		EventType:      normalized.EventType,
		Summary:        normalized.Summary,
		CreatedAt:      pgtype.Timestamptz{Time: normalized.CreatedAt, Valid: true},
		ActorUserID:    normalized.ActorUserID,
		ActorRole:      normalized.ActorRole,
		OrganisationID: normalized.OrganisationID,
		EntityType:     normalized.EntityType,
		EntityID:       normalized.EntityID,
		Column12:       metadataJSON,
	})
	if err != nil {
		return 0, AuditEvent{}, err
	}
	auditEvent, err := toAuditEvent(aeRow)
	if err != nil {
		return 0, AuditEvent{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, AuditEvent{}, err
	}

	return revokedSessions, auditEvent, nil
}

func (s Store) UpsertOrganisationMembership(ctx context.Context, input UpsertMembershipInput) (OrganisationMembership, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return OrganisationMembership{}, err
	}
	defer tx.Rollback(ctx)

	q := s.db.WithTx(tx)

	if _, err := q.LockUserForMembershipReplacement(ctx, input.UserID); err != nil {
		return OrganisationMembership{}, err
	}

	if err := q.DeleteOrganisationMembershipsForUser(ctx, input.UserID); err != nil {
		return OrganisationMembership{}, err
	}

	row, err := q.InsertOrganisationMembership(ctx, &db.InsertOrganisationMembershipParams{
		UserID:         input.UserID,
		OrganisationID: input.OrganisationID,
		Role:           input.Role,
		District:       input.District,
	})
	if err != nil {
		return OrganisationMembership{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return OrganisationMembership{}, err
	}

	return membershipFromCreatedRow(row), nil
}

func (s Store) UpsertOrganisationMembershipWithAuditTx(ctx context.Context, input UpsertMembershipWithAuditInput) (OrganisationMembership, AuditEvent, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return OrganisationMembership{}, AuditEvent{}, err
	}
	defer tx.Rollback(ctx)

	q := s.db.WithTx(tx)
	membershipInput := input.Membership

	if _, err := q.LockUserForMembershipReplacement(ctx, membershipInput.UserID); err != nil {
		return OrganisationMembership{}, AuditEvent{}, err
	}

	if err := q.DeleteOrganisationMembershipsForUser(ctx, membershipInput.UserID); err != nil {
		return OrganisationMembership{}, AuditEvent{}, err
	}

	row, err := q.InsertOrganisationMembership(ctx, &db.InsertOrganisationMembershipParams{
		UserID:         membershipInput.UserID,
		OrganisationID: membershipInput.OrganisationID,
		Role:           membershipInput.Role,
		District:       membershipInput.District,
	})
	if err != nil {
		return OrganisationMembership{}, AuditEvent{}, err
	}

	membership := membershipFromCreatedRow(row)

	normalized := normalizeCreateAuditEventInput(input.AuditEvent)
	metadataJSON, err := json.Marshal(normalized.Metadata)
	if err != nil {
		return OrganisationMembership{}, AuditEvent{}, err
	}
	aeRow, err := q.InsertAuditEvent(ctx, &db.InsertAuditEventParams{
		ExternalID:     normalized.ExternalID,
		ClinicID:       normalized.ClinicID,
		ActorName:      normalized.ActorName,
		EventType:      normalized.EventType,
		Summary:        normalized.Summary,
		CreatedAt:      pgtype.Timestamptz{Time: normalized.CreatedAt, Valid: true},
		ActorUserID:    normalized.ActorUserID,
		ActorRole:      normalized.ActorRole,
		OrganisationID: normalized.OrganisationID,
		EntityType:     normalized.EntityType,
		EntityID:       normalized.EntityID,
		Column12:       metadataJSON,
	})
	if err != nil {
		return OrganisationMembership{}, AuditEvent{}, err
	}
	auditEvent, err := toAuditEvent(aeRow)
	if err != nil {
		return OrganisationMembership{}, AuditEvent{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return OrganisationMembership{}, AuditEvent{}, err
	}

	return membership, auditEvent, nil
}
