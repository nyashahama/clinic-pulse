package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"clinicpulse/services/api/internal/store"
	"github.com/jackc/pgx/v5"
)

const maxSubmittedAtFutureSkew = 5 * time.Minute

type ReportCreator interface {
	GetPendingReportByPayload(ctx context.Context, input store.CreateReportInput) (store.Report, error)
	CreatePendingReportTx(ctx context.Context, input store.CreateReportInput) (store.Report, error)
}

type ReportReviewer interface {
	ReviewReportTx(ctx context.Context, input store.ReviewReportInput) (store.Report, *store.CurrentStatus, error)
}

type ReportInput struct {
	StoreInput      store.CreateReportInput
	Confidence      *int
	ConfidenceScore *float64
	Actor           *AuditActor
}

type ReviewReportInput struct {
	ReportID       int64
	ReviewerUserID int64
	OrganisationID *int64
	Decision       string
	Notes          *string
	Scope          store.ReportReviewScope
	Actor          *AuditActor
}

type ValidationError struct {
	Fields []string
}

func (e ValidationError) Error() string {
	return fmt.Sprintf("validation failed for fields: %s", strings.Join(e.Fields, ", "))
}

func ValidateCreateReportInput(input ReportInput) error {
	return ValidateCreateReportInputAt(input, time.Now().UTC())
}

func ValidateReviewReportInput(input ReviewReportInput) error {
	fields := make([]string, 0, 3)
	if input.ReportID <= 0 {
		fields = append(fields, fieldMessage("reportId", "reportId is required"))
	}
	if input.ReviewerUserID <= 0 {
		fields = append(fields, fieldMessage("reviewer", "authenticated reviewer is required"))
	}
	if !allowedReviewDecisions[input.Decision] {
		fields = append(fields, fieldMessage("decision", "decision must be one of: accepted, rejected"))
	}
	if input.Notes != nil && *input.Notes != "" && strings.TrimSpace(*input.Notes) == "" {
		fields = append(fields, fieldMessage("notes", "notes cannot be blank"))
	}
	if len(fields) > 0 {
		return ValidationError{Fields: fields}
	}
	return nil
}

func ValidateCreateReportInputAt(input ReportInput, validationTime time.Time) error {
	fields := make([]string, 0, 10)
	storeInput := input.StoreInput

	if strings.TrimSpace(storeInput.ClinicID) == "" {
		fields = append(fields, fieldMessage("clinicId", "clinicId is required"))
	}
	if !allowedReportStatuses[storeInput.Status] {
		fields = append(fields, fieldMessage("status", "status must be one of: operational, degraded, non_functional, unknown"))
	}
	if !allowedStringPtr(storeInput.StaffPressure, allowedStaffPressures) {
		fields = append(fields, fieldMessage("staffPressure", "staffPressure must be one of: normal, strained, critical, unknown"))
	}
	if !allowedStringPtr(storeInput.StockPressure, allowedStockPressures) {
		fields = append(fields, fieldMessage("stockPressure", "stockPressure must be one of: normal, low, stockout, unknown"))
	}
	if !allowedStringPtr(storeInput.QueuePressure, allowedQueuePressures) {
		fields = append(fields, fieldMessage("queuePressure", "queuePressure must be one of: low, moderate, high, unknown"))
	}
	if storeInput.Reason == nil || strings.TrimSpace(*storeInput.Reason) == "" {
		fields = append(fields, fieldMessage("reason", "reason is required"))
	}
	if !allowedReportSources[storeInput.Source] {
		fields = append(fields, fieldMessage("source", "source must be one of: field_worker, clinic_coordinator, demo_control, seed"))
	}
	if input.Confidence != nil && (*input.Confidence < 0 || *input.Confidence > 100) {
		fields = append(fields, fieldMessage("confidence", "confidence must be between 0 and 100"))
	}
	if confidenceScore := reportInputConfidenceScore(input); confidenceScore != nil && (*confidenceScore < 0 || *confidenceScore > 1) {
		fields = append(fields, fieldMessage("confidenceScore", "confidenceScore must be between 0 and 1"))
	}
	if !storeInput.SubmittedAt.IsZero() && storeInput.SubmittedAt.After(validationTime.Add(maxSubmittedAtFutureSkew)) {
		fields = append(fields, fieldMessage("submittedAt", "submittedAt cannot be more than 5 minutes in the future"))
	}

	if len(fields) > 0 {
		return ValidationError{Fields: fields}
	}
	return nil
}

func CreateReport(ctx context.Context, creator ReportCreator, input ReportInput) (store.Report, error) {
	return createReportAt(ctx, creator, input, time.Now().UTC())
}

func createReportAt(ctx context.Context, creator ReportCreator, input ReportInput, validationTime time.Time) (store.Report, error) {
	if err := ValidateCreateReportInputAt(input, validationTime); err != nil {
		return store.Report{}, err
	}

	storeInput := input.toStoreInput()
	storeInput.ReviewState = "pending"
	existing, err := creator.GetPendingReportByPayload(ctx, storeInput)
	if err == nil {
		return existing, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return store.Report{}, err
	}

	if input.Actor != nil {
		storeInput.AuditEvent = ptr(ReportSubmissionAudit(storeInput, *input.Actor))
	}
	return creator.CreatePendingReportTx(ctx, storeInput)
}

func ReviewReport(ctx context.Context, reviewer ReportReviewer, input ReviewReportInput) (store.Report, *store.CurrentStatus, error) {
	normalized := normalizeReviewReportInput(input)
	if err := ValidateReviewReportInput(normalized); err != nil {
		return store.Report{}, nil, err
	}
	storeInput := store.ReviewReportInput{
		ReportID:       normalized.ReportID,
		ReviewerUserID: normalized.ReviewerUserID,
		OrganisationID: normalized.OrganisationID,
		Decision:       normalized.Decision,
		Notes:          normalized.Notes,
		Scope:          normalized.Scope,
	}
	if normalized.Actor != nil {
		storeInput.AuditEvent = ptr(ReportReviewAudit(normalized, *normalized.Actor))
	}
	return reviewer.ReviewReportTx(ctx, storeInput)
}

func fieldMessage(field string, message string) string {
	return field + ": " + message
}

func (input ReportInput) toStoreInput() store.CreateReportInput {
	storeInput := input.StoreInput
	if input.ConfidenceScore != nil {
		storeInput.ConfidenceScore = input.ConfidenceScore
		return storeInput
	}
	if input.Confidence != nil {
		score := float64(*input.Confidence) / 100
		storeInput.ConfidenceScore = &score
	}
	return storeInput
}

func reportInputConfidenceScore(input ReportInput) *float64 {
	if input.ConfidenceScore != nil {
		return input.ConfidenceScore
	}
	return input.StoreInput.ConfidenceScore
}

func normalizeReviewReportInput(input ReviewReportInput) ReviewReportInput {
	input.Decision = strings.TrimSpace(input.Decision)
	if input.Notes != nil {
		trimmed := strings.TrimSpace(*input.Notes)
		if trimmed == "" {
			if *input.Notes == "" {
				input.Notes = nil
			}
		} else {
			input.Notes = &trimmed
		}
	}
	return input
}

func allowedStringPtr(value *string, allowed map[string]bool) bool {
	if value == nil {
		return false
	}
	return allowed[*value]
}

var allowedReportStatuses = map[string]bool{
	"operational":    true,
	"degraded":       true,
	"non_functional": true,
	"unknown":        true,
}

var allowedStaffPressures = map[string]bool{
	"normal":   true,
	"strained": true,
	"critical": true,
	"unknown":  true,
}

var allowedStockPressures = map[string]bool{
	"normal":   true,
	"low":      true,
	"stockout": true,
	"unknown":  true,
}

var allowedQueuePressures = map[string]bool{
	"low":      true,
	"moderate": true,
	"high":     true,
	"unknown":  true,
}

var allowedReportSources = map[string]bool{
	"field_worker":       true,
	"clinic_coordinator": true,
	"demo_control":       true,
	"seed":               true,
}

var allowedReviewDecisions = map[string]bool{
	"accepted": true,
	"rejected": true,
}

func ptr[T any](value T) *T {
	return &value
}
