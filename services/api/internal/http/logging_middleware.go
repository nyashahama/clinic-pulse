package http

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"log"
	nethttp "net/http"
	"strings"
	"time"
)

const requestIDHeader = "X-Request-Id"

type requestIDContextKeyType string
type requestLogStateContextKeyType string

const requestIDContextKey requestIDContextKeyType = "requestID"
const requestLogStateContextKey requestLogStateContextKeyType = "requestLogState"

type requestLogState struct {
	principalType string
}

func RequestLogger(logger *log.Logger) func(nethttp.Handler) nethttp.Handler {
	if logger == nil {
		logger = log.Default()
	}
	return func(next nethttp.Handler) nethttp.Handler {
		return nethttp.HandlerFunc(func(w nethttp.ResponseWriter, r *nethttp.Request) {
			requestID := requestIDFromHeader(r.Header.Get(requestIDHeader))
			if requestID == "" {
				requestID = generateRequestID()
			}
			w.Header().Set(requestIDHeader, requestID)

			startedAt := time.Now()
			recorder := &statusRecorder{ResponseWriter: w, status: nethttp.StatusOK}
			logState := &requestLogState{principalType: "anonymous"}
			ctx := context.WithValue(r.Context(), requestIDContextKey, requestID)
			ctx = context.WithValue(ctx, requestLogStateContextKey, logState)
			next.ServeHTTP(recorder, r.WithContext(ctx))

			logger.Printf(
				"method=%s path=%s status=%d duration_ms=%d principal_type=%s request_id=%s",
				r.Method,
				r.URL.Path,
				recorder.status,
				time.Since(startedAt).Milliseconds(),
				logState.principalType,
				requestID,
			)
		})
	}
}

func RequestIDFromContext(ctx context.Context) (string, bool) {
	requestID, ok := ctx.Value(requestIDContextKey).(string)
	return requestID, ok
}

type statusRecorder struct {
	nethttp.ResponseWriter
	status int
	wrote  bool
}

func (r *statusRecorder) WriteHeader(status int) {
	if r.wrote {
		return
	}
	r.status = status
	r.wrote = true
	r.ResponseWriter.WriteHeader(status)
}

func (r *statusRecorder) Write(payload []byte) (int, error) {
	if !r.wrote {
		r.WriteHeader(nethttp.StatusOK)
	}
	return r.ResponseWriter.Write(payload)
}

func markRequestPrincipalType(ctx context.Context, principalType string) {
	if state, ok := ctx.Value(requestLogStateContextKey).(*requestLogState); ok && state != nil {
		state.principalType = principalType
	}
}

func requestIDFromHeader(value string) string {
	return strings.TrimSpace(value)
}

func generateRequestID() string {
	var bytes [16]byte
	if _, err := rand.Read(bytes[:]); err != nil {
		return hex.EncodeToString([]byte(time.Now().UTC().Format(time.RFC3339Nano)))
	}
	return hex.EncodeToString(bytes[:])
}
