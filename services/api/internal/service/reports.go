package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"clinicpulse/services/api/internal/store"
)

const maxSubmittedAtFutureSkew = 5 * time.Minute

type ReportCreator interface {
	CreateReportTx(ctx context.Context, input store.CreateReportInput) (store.Report, store.CurrentStatus, store.AuditEvent, error)
}

type ReportInput struct {
	StoreInput      store.CreateReportInput
	Confidence      *int
	ConfidenceScore *float64
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

func CreateReport(ctx context.Context, creator ReportCreator, input ReportInput) (store.Report, store.CurrentStatus, store.AuditEvent, error) {
	return createReportAt(ctx, creator, input, time.Now().UTC())
}

func createReportAt(ctx context.Context, creator ReportCreator, input ReportInput, validationTime time.Time) (store.Report, store.CurrentStatus, store.AuditEvent, error) {
	if err := ValidateCreateReportInputAt(input, validationTime); err != nil {
		return store.Report{}, store.CurrentStatus{}, store.AuditEvent{}, err
	}

	return creator.CreateReportTx(ctx, input.toStoreInput())
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
