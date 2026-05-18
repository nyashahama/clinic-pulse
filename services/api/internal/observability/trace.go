package observability

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"regexp"
	"strings"
	"sync/atomic"
	"time"
)

var requestIDPattern = regexp.MustCompile(`^[A-Za-z0-9._-]{8,128}$`)
var fallbackIDCounter uint64

// TraceContext contains a W3C trace context in traceparent form.
type TraceContext struct {
	Valid      bool
	TraceID    string
	SpanID     string
	TraceFlags string
	header     string
}

// RequestIDFromHeader returns value when it is safe to preserve, otherwise empty.
func RequestIDFromHeader(value string) string {
	value = strings.TrimSpace(value)
	if !requestIDPattern.MatchString(value) {
		return ""
	}
	return value
}

// NewRequestID returns a generated request id that is safe for logs and headers.
func NewRequestID() string {
	return randomHex(16)
}

// TraceContextFromHeader parses version 00 traceparent or creates a valid fallback.
func TraceContextFromHeader(value string) TraceContext {
	value = strings.TrimSpace(value)
	if trace, ok := parseTraceparent(value); ok {
		return trace
	}
	return NewTraceContext()
}

// NewTraceContext creates a valid fallback trace context.
func NewTraceContext() TraceContext {
	traceID := randomNonZeroHex(16)
	spanID := randomNonZeroHex(8)
	return TraceContext{
		Valid:      true,
		TraceID:    traceID,
		SpanID:     spanID,
		TraceFlags: "00",
		header:     fmt.Sprintf("00-%s-%s-00", traceID, spanID),
	}
}

// Header returns a traceparent header value.
func (t TraceContext) Header() string {
	if t.header != "" {
		return t.header
	}
	if !t.Valid {
		return ""
	}
	return fmt.Sprintf("00-%s-%s-%s", t.TraceID, t.SpanID, t.TraceFlags)
}

func parseTraceparent(value string) (TraceContext, bool) {
	parts := strings.Split(value, "-")
	if len(parts) != 4 || parts[0] != "00" {
		return TraceContext{}, false
	}
	traceID, spanID, flags := parts[1], parts[2], parts[3]
	if !isLowerHex(traceID, 32) || !isLowerHex(spanID, 16) || !isLowerHex(flags, 2) {
		return TraceContext{}, false
	}
	if isAllZero(traceID) || isAllZero(spanID) {
		return TraceContext{}, false
	}
	return TraceContext{Valid: true, TraceID: traceID, SpanID: spanID, TraceFlags: flags, header: value}, true
}

func isLowerHex(value string, length int) bool {
	if len(value) != length {
		return false
	}
	for _, r := range value {
		if !((r >= '0' && r <= '9') || (r >= 'a' && r <= 'f')) {
			return false
		}
	}
	return true
}

func isAllZero(value string) bool {
	for _, r := range value {
		if r != '0' {
			return false
		}
	}
	return true
}

func randomHex(size int) string {
	buf := make([]byte, size)
	if _, err := rand.Read(buf); err != nil {
		return fallbackRandomHex(size)
	}
	return hex.EncodeToString(buf)
}

func randomNonZeroHex(size int) string {
	for {
		value := randomHex(size)
		if !isAllZero(value) {
			return value
		}
	}
}

func fallbackRandomHex(size int) string {
	buf := make([]byte, size)
	seed := uint64(time.Now().UnixNano()) ^ uint64(os.Getpid())<<32 ^ atomic.AddUint64(&fallbackIDCounter, 1)
	for i := range buf {
		seed ^= seed << 13
		seed ^= seed >> 7
		seed ^= seed << 17
		buf[i] = byte(seed >> uint((i%8)*8))
	}
	return hex.EncodeToString(buf)
}
