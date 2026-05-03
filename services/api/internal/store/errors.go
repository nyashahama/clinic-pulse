package store

import "errors"

var ErrReportNotAccepted = errors.New("store: report must be accepted to update current status")
var ErrReportNotPending = errors.New("store: report must be pending")
var ErrReportAlreadyReviewed = errors.New("store: report already reviewed")
var ErrInvalidReviewDecision = errors.New("store: invalid review decision")
var ErrReportReviewForbidden = errors.New("store: report review forbidden")
