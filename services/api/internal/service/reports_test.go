package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"clinicpulse/services/api/internal/store"
)

func TestValidateCreateReportInputRejectsInvalidPayloads(t *testing.T) {
	tests := []struct {
		name    string
		mutate  func(*ReportInput)
		field   string
		message string
	}{
		{
			name: "empty clinic id",
			mutate: func(input *ReportInput) {
				input.StoreInput.ClinicID = ""
			},
			field:   "clinicId",
			message: "clinicId is required",
		},
		{
			name: "unsupported status",
			mutate: func(input *ReportInput) {
				input.StoreInput.Status = "closed"
			},
			field:   "status",
			message: "status must be one of: operational, degraded, non_functional, unknown",
		},
		{
			name: "unsupported staff pressure",
			mutate: func(input *ReportInput) {
				unsupported := "busy"
				input.StoreInput.StaffPressure = &unsupported
			},
			field:   "staffPressure",
			message: "staffPressure must be one of: normal, strained, critical, unknown",
		},
		{
			name: "unsupported stock pressure",
			mutate: func(input *ReportInput) {
				unsupported := "empty"
				input.StoreInput.StockPressure = &unsupported
			},
			field:   "stockPressure",
			message: "stockPressure must be one of: normal, low, stockout, unknown",
		},
		{
			name: "unsupported queue pressure",
			mutate: func(input *ReportInput) {
				unsupported := "packed"
				input.StoreInput.QueuePressure = &unsupported
			},
			field:   "queuePressure",
			message: "queuePressure must be one of: low, moderate, high, unknown",
		},
		{
			name: "empty reason",
			mutate: func(input *ReportInput) {
				empty := " "
				input.StoreInput.Reason = &empty
			},
			field:   "reason",
			message: "reason is required",
		},
		{
			name: "empty source",
			mutate: func(input *ReportInput) {
				input.StoreInput.Source = ""
			},
			field:   "source",
			message: "source must be one of: field_worker, clinic_coordinator, demo_control, seed",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			input := validReportInput()
			tt.mutate(&input)

			err := ValidateCreateReportInput(input)

			var validationErr ValidationError
			if !errors.As(err, &validationErr) {
				t.Fatalf("expected ValidationError, got %v", err)
			}
			want := tt.field + ": " + tt.message
			if !containsField(validationErr.Fields, want) {
				t.Fatalf("expected validation field message %q, got %#v", want, validationErr.Fields)
			}
		})
	}
}

func TestValidateCreateReportInputRejectsInvalidConfidence(t *testing.T) {
	tests := []struct {
		name   string
		mutate func(*ReportInput)
		want   string
	}{
		{
			name: "confidence below zero",
			mutate: func(input *ReportInput) {
				confidence := -1
				input.Confidence = &confidence
			},
			want: "confidence: confidence must be between 0 and 100",
		},
		{
			name: "confidence above one hundred",
			mutate: func(input *ReportInput) {
				confidence := 101
				input.Confidence = &confidence
			},
			want: "confidence: confidence must be between 0 and 100",
		},
		{
			name: "confidence score below zero",
			mutate: func(input *ReportInput) {
				score := -0.01
				input.ConfidenceScore = &score
			},
			want: "confidenceScore: confidenceScore must be between 0 and 1",
		},
		{
			name: "confidence score above one",
			mutate: func(input *ReportInput) {
				score := 1.01
				input.ConfidenceScore = &score
			},
			want: "confidenceScore: confidenceScore must be between 0 and 1",
		},
		{
			name: "invalid confidence rejected when confidence score is valid",
			mutate: func(input *ReportInput) {
				confidence := 101
				score := 0.8
				input.Confidence = &confidence
				input.ConfidenceScore = &score
			},
			want: "confidence: confidence must be between 0 and 100",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			input := validReportInput()
			tt.mutate(&input)

			err := ValidateCreateReportInput(input)

			var validationErr ValidationError
			if !errors.As(err, &validationErr) {
				t.Fatalf("expected ValidationError, got %v", err)
			}
			if !containsField(validationErr.Fields, tt.want) {
				t.Fatalf("expected validation field message %q, got %#v", tt.want, validationErr.Fields)
			}
		})
	}
}

func TestValidateCreateReportInputReturnsMultipleFieldMessages(t *testing.T) {
	input := validReportInput()
	input.StoreInput.ClinicID = ""
	input.StoreInput.Status = "closed"

	err := ValidateCreateReportInput(input)

	var validationErr ValidationError
	if !errors.As(err, &validationErr) {
		t.Fatalf("expected ValidationError, got %v", err)
	}
	for _, want := range []string{
		"clinicId: clinicId is required",
		"status: status must be one of: operational, degraded, non_functional, unknown",
	} {
		if !containsField(validationErr.Fields, want) {
			t.Fatalf("expected validation field message %q, got %#v", want, validationErr.Fields)
		}
	}
}

func TestValidateCreateReportInputAcceptsAllowedValues(t *testing.T) {
	for _, input := range []ReportInput{
		validReportInput(),
		reportInputWithValues("degraded", "strained", "low", "moderate", "clinic_coordinator"),
		reportInputWithValues("non_functional", "critical", "stockout", "high", "demo_control"),
		reportInputWithValues("unknown", "unknown", "unknown", "unknown", "seed"),
	} {
		if err := ValidateCreateReportInput(input); err != nil {
			t.Fatalf("expected valid input %#v, got %v", input, err)
		}
	}
}

func TestCreateReportRejectsInvalidInputWithoutCallingCreator(t *testing.T) {
	creator := &fakeReportCreator{}
	input := validReportInput()
	input.StoreInput.ClinicID = ""

	_, _, _, err := CreateReport(context.Background(), creator, input)

	var validationErr ValidationError
	if !errors.As(err, &validationErr) {
		t.Fatalf("expected ValidationError, got %v", err)
	}
	if creator.called {
		t.Fatal("expected invalid input not to call creator")
	}
}

func TestCreateReportCallsCreatorForValidInput(t *testing.T) {
	submittedAt := time.Date(2026, 5, 2, 9, 15, 0, 0, time.UTC)
	report := store.Report{ID: 101, ClinicID: "clinic-1", SubmittedAt: submittedAt}
	status := store.CurrentStatus{ClinicID: "clinic-1", Status: "operational", UpdatedAt: submittedAt}
	event := store.AuditEvent{ID: 201, ClinicID: "clinic-1", EventType: "report.submitted", CreatedAt: submittedAt}
	creator := &fakeReportCreator{report: report, status: status, event: event}
	input := validReportInput()

	gotReport, gotStatus, gotEvent, err := CreateReport(context.Background(), creator, input)

	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if !creator.called {
		t.Fatal("expected valid input to call creator")
	}
	if creator.input.ClinicID != input.StoreInput.ClinicID || creator.input.Status != input.StoreInput.Status {
		t.Fatalf("unexpected creator input: %#v", creator.input)
	}
	if gotReport.ID != report.ID || gotStatus.ClinicID != status.ClinicID || gotEvent.ID != event.ID {
		t.Fatalf("unexpected create results: %#v %#v %#v", gotReport, gotStatus, gotEvent)
	}
}

func TestCreateReportConvertsConfidenceToScore(t *testing.T) {
	creator := &fakeReportCreator{}
	input := validReportInput()
	confidence := 86
	input.Confidence = &confidence

	_, _, _, err := CreateReport(context.Background(), creator, input)

	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if creator.input.ConfidenceScore == nil || *creator.input.ConfidenceScore != 0.86 {
		t.Fatalf("expected confidence score 0.86, got %v", creator.input.ConfidenceScore)
	}
}

func TestCreateReportPrefersConfidenceScoreOverConfidence(t *testing.T) {
	creator := &fakeReportCreator{}
	input := validReportInput()
	confidence := 86
	score := 0.92
	input.Confidence = &confidence
	input.ConfidenceScore = &score

	_, _, _, err := CreateReport(context.Background(), creator, input)

	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if creator.input.ConfidenceScore == nil || *creator.input.ConfidenceScore != 0.92 {
		t.Fatalf("expected confidence score 0.92, got %v", creator.input.ConfidenceScore)
	}
}

func TestCreateReportPropagatesCreatorError(t *testing.T) {
	creatorErr := errors.New("store unavailable")
	creator := &fakeReportCreator{err: creatorErr}

	_, _, _, err := CreateReport(context.Background(), creator, validReportInput())

	if !errors.Is(err, creatorErr) {
		t.Fatalf("expected creator error %v, got %v", creatorErr, err)
	}
}

func validReportInput() ReportInput {
	return reportInputWithValues("operational", "normal", "normal", "low", "field_worker")
}

func reportInputWithValues(status, staffPressure, stockPressure, queuePressure, source string) ReportInput {
	reason := "Daily facility check"
	return ReportInput{
		StoreInput: store.CreateReportInput{
			ClinicID:      "clinic-1",
			Status:        status,
			StaffPressure: &staffPressure,
			StockPressure: &stockPressure,
			QueuePressure: &queuePressure,
			Reason:        &reason,
			Source:        source,
		},
	}
}

func containsField(fields []string, want string) bool {
	for _, field := range fields {
		if field == want {
			return true
		}
	}
	return false
}

type fakeReportCreator struct {
	called bool
	input  store.CreateReportInput
	report store.Report
	status store.CurrentStatus
	event  store.AuditEvent
	err    error
}

func (f *fakeReportCreator) CreateReportTx(_ context.Context, input store.CreateReportInput) (store.Report, store.CurrentStatus, store.AuditEvent, error) {
	f.called = true
	f.input = input
	return f.report, f.status, f.event, f.err
}
