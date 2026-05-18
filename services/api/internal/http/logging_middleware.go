package http

import (
	"context"
	"io"
	nethttp "net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"clinicpulse/services/api/internal/observability"
)

const (
	requestIDHeader   = "X-Request-Id"
	traceparentHeader = "traceparent"
)

type requestIDContextKeyType string
type traceContextContextKeyType string
type requestLogStateContextKeyType string
type requestLoggerContextKeyType string
type metricsRegistryContextKeyType string

const requestIDContextKey requestIDContextKeyType = "requestID"
const traceContextContextKey traceContextContextKeyType = "traceContext"
const requestLogStateContextKey requestLogStateContextKeyType = "requestLogState"
const requestLoggerContextKey requestLoggerContextKeyType = "requestLogger"
const metricsRegistryContextKey metricsRegistryContextKeyType = "metricsRegistry"

type requestLogState struct {
	principalType string
}

func RequestLogger(logger *observability.JSONLogger, registry *observability.Registry) func(nethttp.Handler) nethttp.Handler {
	if logger == nil {
		logger = observability.NewJSONLogger(io.Discard, observability.Fields{"service": "clinicpulse-api"})
	}
	if registry == nil {
		registry = observability.NewRegistry()
	}
	return func(next nethttp.Handler) nethttp.Handler {
		return nethttp.HandlerFunc(func(w nethttp.ResponseWriter, r *nethttp.Request) {
			requestID := observability.RequestIDFromHeader(r.Header.Get(requestIDHeader))
			if requestID == "" {
				requestID = observability.NewRequestID()
			}
			traceContext := observability.TraceContextFromHeader(r.Header.Get(traceparentHeader))
			w.Header().Set(requestIDHeader, requestID)
			w.Header().Set(traceparentHeader, traceContext.Header())

			startedAt := time.Now()
			recorder := &statusRecorder{ResponseWriter: w, status: nethttp.StatusOK}
			logState := &requestLogState{principalType: "anonymous"}
			ctx := context.WithValue(r.Context(), requestIDContextKey, requestID)
			ctx = context.WithValue(ctx, traceContextContextKey, traceContext)
			ctx = context.WithValue(ctx, requestLogStateContextKey, logState)
			ctx = context.WithValue(ctx, requestLoggerContextKey, logger)
			ctx = context.WithValue(ctx, metricsRegistryContextKey, registry)
			defer func() {
				if recovered := recover(); recovered != nil {
					if !recorder.wrote {
						recorder.status = nethttp.StatusInternalServerError
					}
					recordRequestCompletion(logger, registry, r, recorder, logState, traceContext, requestID, time.Since(startedAt))
					panic(recovered)
				}
				recordRequestCompletion(logger, registry, r, recorder, logState, traceContext, requestID, time.Since(startedAt))
			}()

			next.ServeHTTP(recorder, r.WithContext(ctx))
		})
	}
}

func logRequestHTTPError(r *nethttp.Request, status int, kind string, code string) {
	logger, ok := r.Context().Value(requestLoggerContextKey).(*observability.JSONLogger)
	if !ok || logger == nil {
		return
	}

	requestID, _ := RequestIDFromContext(r.Context())
	traceContext, _ := TraceContextFromContext(r.Context())
	fields := observability.Fields{
		"component":    kind,
		"error_kind":   kind,
		"error_code":   code,
		"request_id":   requestID,
		"trace_id":     traceContext.TraceID,
		"method":       r.Method,
		"route":        requestRoute(r),
		"status":       status,
		"status_class": statusClass(status),
	}
	if status >= nethttp.StatusInternalServerError {
		logger.Error("http_request_error", fields)
		return
	}
	logger.Warn("http_request_error", fields)
}

func recordRequestCompletion(logger *observability.JSONLogger, registry *observability.Registry, r *nethttp.Request, recorder *statusRecorder, logState *requestLogState, traceContext observability.TraceContext, requestID string, duration time.Duration) {
	route := requestRoute(r)
	registry.RecordHTTPRequest(observability.HTTPRequestMetric{
		Method:        r.Method,
		Route:         route,
		Status:        recorder.status,
		PrincipalType: logState.principalType,
		Duration:      duration,
	})
	logger.Info("http_request_completed", observability.Fields{
		"method":         r.Method,
		"route":          route,
		"status":         recorder.status,
		"status_class":   statusClass(recorder.status),
		"duration_ms":    duration.Milliseconds(),
		"principal_type": logState.principalType,
		"request_id":     requestID,
		"trace_id":       traceContext.TraceID,
		"span_id":        traceContext.SpanID,
	})
}

func RequestIDFromContext(ctx context.Context) (string, bool) {
	requestID, ok := ctx.Value(requestIDContextKey).(string)
	return requestID, ok
}

func TraceContextFromContext(ctx context.Context) (observability.TraceContext, bool) {
	traceContext, ok := ctx.Value(traceContextContextKey).(observability.TraceContext)
	return traceContext, ok
}

func metricsRegistryFromContext(ctx context.Context) (*observability.Registry, bool) {
	registry, ok := ctx.Value(metricsRegistryContextKey).(*observability.Registry)
	return registry, ok && registry != nil
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

func (r *statusRecorder) Unwrap() nethttp.ResponseWriter {
	return r.ResponseWriter
}

func markRequestPrincipalType(ctx context.Context, principalType string) {
	if state, ok := ctx.Value(requestLogStateContextKey).(*requestLogState); ok && state != nil {
		state.principalType = principalType
	}
}

func requestRoute(r *nethttp.Request) string {
	if routeContext := chi.RouteContext(r.Context()); routeContext != nil {
		if pattern := routeContext.RoutePattern(); pattern != "" {
			return pattern
		}
	}
	return observability.BoundRoute(r.URL.Path)
}

func statusClass(status int) string {
	if status < 100 || status > 999 {
		return "unknown"
	}
	return string(rune('0'+status/100)) + "xx"
}
