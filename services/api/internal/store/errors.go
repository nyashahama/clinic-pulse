package store

import "errors"

var ErrReportNotAccepted = errors.New("store: report must be accepted to update current status")
