package service

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"clinicpulse/services/api/internal/store"
)

type AuditActor struct {
	UserID         int64
	Name           string
	Role           string
	OrganisationID *int64
}

type LoginAuditInput struct {
	Actor      AuditActor
	SessionID  int64
	UserAgent  *string
	IPAddress  *string
	OccurredAt time.Time
}

type AuditWriter interface {
	CreateAuditEvent(ctx context.Context, input store.CreateAuditEventInput) (store.AuditEvent, error)
}

type LoginSessionCreator interface {
	CreateSessionWithAuditTx(ctx context.Context, input store.CreateSessionWithAuditInput) (store.Session, store.AuditEvent, error)
}

func ReportSubmissionAudit(input store.CreateReportInput, actor AuditActor) store.CreateAuditEventInput {
	clinicID := stringPtrIfNotBlank(input.ClinicID)
	entityType := "report"

	metadata := map[string]any{
		"reviewState": "pending",
		"status":      input.Status,
		"source":      input.Source,
	}
	if input.OfflineCreated {
		metadata["offlineCreated"] = true
	}

	return auditEventWithActor(store.CreateAuditEventInput{
		ClinicID:   clinicID,
		EventType:  "report.submitted",
		Summary:    "Report submitted for review.",
		CreatedAt:  input.ReceivedAt,
		EntityType: &entityType,
		Metadata:   metadata,
	}, actor)
}

func ReportReviewAudit(input ReviewReportInput, actor AuditActor) store.CreateAuditEventInput {
	entityType := "report"
	entityID := strconv.FormatInt(input.ReportID, 10)
	decision := strings.TrimSpace(input.Decision)

	metadata := map[string]any{
		"decision": decision,
		"reportId": input.ReportID,
	}
	if input.Notes != nil {
		metadata["notes"] = *input.Notes
	}

	return auditEventWithActor(store.CreateAuditEventInput{
		EventType:  "report.reviewed",
		Summary:    fmt.Sprintf("Report %s.", decision),
		EntityType: &entityType,
		EntityID:   &entityID,
		Metadata:   metadata,
	}, actor)
}

func LoginSuccessAudit(input LoginAuditInput) store.CreateAuditEventInput {
	entityType := "session"
	var entityID *string

	metadata := map[string]any{}
	if input.SessionID > 0 {
		sessionID := strconv.FormatInt(input.SessionID, 10)
		entityID = &sessionID
		metadata["sessionId"] = input.SessionID
	}
	if input.UserAgent != nil {
		metadata["userAgent"] = *input.UserAgent
	}
	if input.IPAddress != nil {
		metadata["ipAddress"] = *input.IPAddress
	}

	return auditEventWithActor(store.CreateAuditEventInput{
		EventType:  "auth.login.succeeded",
		Summary:    "User signed in.",
		CreatedAt:  input.OccurredAt,
		EntityType: &entityType,
		EntityID:   entityID,
		Metadata:   metadata,
	}, input.Actor)
}

func CreateLoginSessionWithAudit(ctx context.Context, creator LoginSessionCreator, sessionInput store.CreateSessionInput, auditInput LoginAuditInput) (store.Session, error) {
	session, _, err := creator.CreateSessionWithAuditTx(ctx, store.CreateSessionWithAuditInput{
		Session:    sessionInput,
		AuditEvent: LoginSuccessAudit(auditInput),
	})
	return session, err
}

func RecordLoginSuccess(ctx context.Context, writer AuditWriter, input LoginAuditInput) (store.AuditEvent, error) {
	return writer.CreateAuditEvent(ctx, LoginSuccessAudit(input))
}

func auditEventWithActor(input store.CreateAuditEventInput, actor AuditActor) store.CreateAuditEventInput {
	if actor.UserID > 0 {
		input.ActorUserID = &actor.UserID
	}
	input.ActorName = stringPtrIfNotBlank(actor.Name)
	input.ActorRole = stringPtrIfNotBlank(actor.Role)
	input.OrganisationID = actor.OrganisationID
	return input
}

func stringPtrIfNotBlank(value string) *string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}
