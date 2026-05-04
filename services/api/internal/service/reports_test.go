package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"clinicpulse/services/api/internal/store"
	"github.com/jackc/pgx/v5"
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

func TestValidateCreateReportInputRejectsSubmittedAtBeyondFutureSkew(t *testing.T) {
	validationTime := time.Date(2026, 5, 3, 12, 0, 0, 0, time.UTC)
	input := validReportInput()
	input.StoreInput.SubmittedAt = validationTime.Add(6 * time.Minute)

	err := ValidateCreateReportInputAt(input, validationTime)

	var validationErr ValidationError
	if !errors.As(err, &validationErr) {
		t.Fatalf("expected ValidationError, got %v", err)
	}
	want := "submittedAt: submittedAt cannot be more than 5 minutes in the future"
	if !containsField(validationErr.Fields, want) {
		t.Fatalf("expected validation field message %q, got %#v", want, validationErr.Fields)
	}
}

func TestValidateCreateReportInputAcceptsAbsentAndNormalSubmittedAt(t *testing.T) {
	validationTime := time.Date(2026, 5, 3, 12, 0, 0, 0, time.UTC)

	tests := []struct {
		name        string
		submittedAt time.Time
	}{
		{name: "absent submitted at"},
		{name: "past submitted at", submittedAt: validationTime.Add(-24 * time.Hour)},
		{name: "within future skew", submittedAt: validationTime.Add(5 * time.Minute)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			input := validReportInput()
			input.StoreInput.SubmittedAt = tt.submittedAt

			if err := ValidateCreateReportInputAt(input, validationTime); err != nil {
				t.Fatalf("expected nil error, got %v", err)
			}
		})
	}
}

func TestCreateReportRejectsInvalidInputWithoutCallingCreator(t *testing.T) {
	creator := &fakeReportCreator{}
	input := validReportInput()
	input.StoreInput.ClinicID = ""

	_, err := CreateReport(context.Background(), creator, input)

	var validationErr ValidationError
	if !errors.As(err, &validationErr) {
		t.Fatalf("expected ValidationError, got %v", err)
	}
	if creator.called {
		t.Fatal("expected invalid input not to call creator")
	}
}

func TestCreateReportRejectsFarFutureSubmittedAtWithoutCallingCreator(t *testing.T) {
	validationTime := time.Date(2026, 5, 3, 12, 0, 0, 0, time.UTC)
	creator := &fakeReportCreator{}
	input := validReportInput()
	input.StoreInput.SubmittedAt = validationTime.Add(6 * time.Minute)

	_, err := createReportAt(context.Background(), creator, input, validationTime)

	var validationErr ValidationError
	if !errors.As(err, &validationErr) {
		t.Fatalf("expected ValidationError, got %v", err)
	}
	want := "submittedAt: submittedAt cannot be more than 5 minutes in the future"
	if !containsField(validationErr.Fields, want) {
		t.Fatalf("expected validation field message %q, got %#v", want, validationErr.Fields)
	}
	if creator.called {
		t.Fatal("expected invalid input not to call creator")
	}
}

func TestCreateReportCallsCreatorForValidInput(t *testing.T) {
	submittedAt := time.Date(2026, 5, 2, 9, 15, 0, 0, time.UTC)
	report := store.Report{ID: 101, ClinicID: "clinic-1", SubmittedAt: submittedAt, ReviewState: "pending"}
	creator := &fakeReportCreator{report: report}
	input := validReportInput()

	gotReport, err := CreateReport(context.Background(), creator, input)

	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if !creator.called {
		t.Fatal("expected valid input to call creator")
	}
	if creator.input.ClinicID != input.StoreInput.ClinicID || creator.input.Status != input.StoreInput.Status {
		t.Fatalf("unexpected creator input: %#v", creator.input)
	}
	if creator.input.ReviewState != "pending" {
		t.Fatalf("expected pending review state, got %q", creator.input.ReviewState)
	}
	if gotReport.ID != report.ID {
		t.Fatalf("unexpected create result: %#v", gotReport)
	}
}

func TestCreateReportReturnsExistingPendingSemanticDuplicate(t *testing.T) {
	existing := store.Report{ID: 202, ClinicID: "clinic-1", ReviewState: "pending"}
	creator := &fakeReportCreator{semanticDuplicate: existing}
	input := validReportInput()

	gotReport, err := CreateReport(context.Background(), creator, input)

	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if gotReport.ID != existing.ID {
		t.Fatalf("expected existing pending duplicate report, got %#v", gotReport)
	}
	if creator.called {
		t.Fatal("expected semantic duplicate not to create another pending report")
	}
}

func TestCreateReportConvertsConfidenceToScore(t *testing.T) {
	creator := &fakeReportCreator{}
	input := validReportInput()
	confidence := 86
	input.Confidence = &confidence

	_, err := CreateReport(context.Background(), creator, input)

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

	_, err := CreateReport(context.Background(), creator, input)

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

	_, err := CreateReport(context.Background(), creator, validReportInput())

	if !errors.Is(err, creatorErr) {
		t.Fatalf("expected creator error %v, got %v", creatorErr, err)
	}
}

func TestValidateReviewReportInputRejectsInvalidDecision(t *testing.T) {
	input := ReviewReportInput{ReportID: 100, Decision: "maybe", ReviewerUserID: 42}

	err := ValidateReviewReportInput(input)

	var validationErr ValidationError
	if !errors.As(err, &validationErr) {
		t.Fatalf("expected ValidationError, got %v", err)
	}
	want := "decision: decision must be one of: accepted, rejected"
	if !containsField(validationErr.Fields, want) {
		t.Fatalf("expected validation field message %q, got %#v", want, validationErr.Fields)
	}
}

func TestValidateReviewReportInputRejectsMissingReviewer(t *testing.T) {
	input := ReviewReportInput{ReportID: 100, Decision: "accepted"}

	err := ValidateReviewReportInput(input)

	var validationErr ValidationError
	if !errors.As(err, &validationErr) {
		t.Fatalf("expected ValidationError, got %v", err)
	}
	want := "reviewer: authenticated reviewer is required"
	if !containsField(validationErr.Fields, want) {
		t.Fatalf("expected validation field message %q, got %#v", want, validationErr.Fields)
	}
}

func TestReviewReportTrimsWhitespaceNotes(t *testing.T) {
	notes := "  reviewed by district  "
	reviewerOrgID := int64(7)
	reviewer := &fakeReportReviewer{report: store.Report{ID: 100, ReviewState: "accepted"}}
	input := ReviewReportInput{
		ReportID:       100,
		Decision:       "accepted",
		Notes:          &notes,
		ReviewerUserID: 42,
		OrganisationID: &reviewerOrgID,
	}

	_, _, err := ReviewReport(context.Background(), reviewer, input)

	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if reviewer.input.Notes == nil || *reviewer.input.Notes != "reviewed by district" {
		t.Fatalf("expected trimmed notes, got %v", reviewer.input.Notes)
	}
}

func TestReviewReportConvertsEmptyNotesToNil(t *testing.T) {
	notes := ""
	reviewer := &fakeReportReviewer{report: store.Report{ID: 100, ReviewState: "rejected"}}
	input := ReviewReportInput{
		ReportID:       100,
		Decision:       "rejected",
		Notes:          &notes,
		ReviewerUserID: 42,
	}

	_, _, err := ReviewReport(context.Background(), reviewer, input)

	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if reviewer.input.Notes != nil {
		t.Fatalf("expected nil notes, got %q", *reviewer.input.Notes)
	}
}

func TestReviewReportRejectsWhitespaceOnlyNotes(t *testing.T) {
	notes := "  "
	reviewer := &fakeReportReviewer{report: store.Report{ID: 100, ReviewState: "rejected"}}
	input := ReviewReportInput{
		ReportID:       100,
		Decision:       "rejected",
		Notes:          &notes,
		ReviewerUserID: 42,
	}

	_, _, err := ReviewReport(context.Background(), reviewer, input)

	var validationErr ValidationError
	if !errors.As(err, &validationErr) {
		t.Fatalf("expected ValidationError, got %v", err)
	}
	want := "notes: notes cannot be blank"
	if !containsField(validationErr.Fields, want) {
		t.Fatalf("expected validation field message %q, got %#v", want, validationErr.Fields)
	}
	if reviewer.called {
		t.Fatal("expected invalid notes not to call reviewer")
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
	called            bool
	input             store.CreateReportInput
	report            store.Report
	semanticDuplicate store.Report
	err               error
}

func (f *fakeReportCreator) CreatePendingReportTx(_ context.Context, input store.CreateReportInput) (store.Report, error) {
	f.called = true
	f.input = input
	return f.report, f.err
}

func (f *fakeReportCreator) GetPendingReportByPayload(_ context.Context, _ store.CreateReportInput) (store.Report, error) {
	if f.semanticDuplicate.ID == 0 {
		return store.Report{}, pgx.ErrNoRows
	}
	return f.semanticDuplicate, nil
}

type fakeReportReviewer struct {
	called bool
	input  store.ReviewReportInput
	report store.Report
	status *store.CurrentStatus
	err    error
}

func (f *fakeReportReviewer) ReviewReportTx(_ context.Context, input store.ReviewReportInput) (store.Report, *store.CurrentStatus, error) {
	f.called = true
	f.input = input
	return f.report, f.status, f.err
}
