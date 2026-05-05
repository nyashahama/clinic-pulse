package store

import "errors"

var ErrReportNotAccepted = errors.New("store: report must be accepted to update current status")
var ErrReportNotPending = errors.New("store: report must be pending")
var ErrReportAlreadyReviewed = errors.New("store: report already reviewed")
var ErrInvalidReviewDecision = errors.New("store: invalid review decision")
var ErrReportReviewForbidden = errors.New("store: report review forbidden")
var ErrReportSyncConflict = errors.New("store: report sync conflict")
var ErrInvalidSyncAttemptResult = errors.New("store: invalid sync attempt result")
var ErrPartnerAPIKeyRevoked = errors.New("store: partner api key revoked")
var ErrPartnerAPIKeyExpired = errors.New("store: partner api key expired")
var ErrInvalidPartnerScope = errors.New("store: invalid partner scope")
var ErrInvalidPartnerWebhookStatus = errors.New("store: invalid partner webhook status")
var ErrInvalidPartnerWebhookEventStatus = errors.New("store: invalid partner webhook event status")
var ErrInvalidPartnerExportFormat = errors.New("store: invalid partner export format")
var ErrInvalidIntegrationStatus = errors.New("store: invalid integration status")
var ErrInvalidDemoLeadRequiredFields = errors.New("store: demo lead required fields must be non-empty")
var ErrInvalidDemoLeadInterest = errors.New("store: invalid demo lead interest")
var ErrInvalidDemoLeadStatus = errors.New("store: invalid demo lead status")
var ErrInvalidDemoLeadSource = errors.New("store: invalid demo lead source")
