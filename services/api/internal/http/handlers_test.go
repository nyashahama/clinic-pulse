package http_test

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"

	"clinicpulse/services/api/internal/auth"
	apihttp "clinicpulse/services/api/internal/http"
	"clinicpulse/services/api/internal/observability"
	"clinicpulse/services/api/internal/security"
	"clinicpulse/services/api/internal/store"
)

const defaultTestDistrict = "Tshwane North Demo District"

func TestHealthzReturnsOK(t *testing.T) {
	router := apihttp.NewRouter(fakeStore{})

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rec.Code)
	}

	if !strings.Contains(rec.Body.String(), `"status":"ok"`) {
		t.Fatalf("expected response to contain status ok, got %q", rec.Body.String())
	}
}

func TestReadyzChecksDatabase(t *testing.T) {
	metrics := observability.NewRegistry()
	router := apihttp.NewRouter(fakeStore{}, apihttp.WithObservability(observability.NewJSONLogger(io.Discard, nil), metrics))

	req := httptest.NewRequest(http.MethodGet, "/readyz", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	var got map[string]string
	decodeJSON(t, rec, &got)
	if got["database"] != "ok" {
		t.Fatalf("expected database ok readiness response, got %#v", got)
	}
	gotMetrics := metrics.RenderPrometheus()
	if !strings.Contains(gotMetrics, `clinicpulse_readiness_checks_total{result="success"} 1`) {
		t.Fatalf("expected successful readiness metric, got:\n%s", gotMetrics)
	}
}

func TestReadyzReturnsUnavailableWhenDatabaseCheckFails(t *testing.T) {
	metrics := observability.NewRegistry()
	router := apihttp.NewRouter(fakeStore{readyErr: errors.New("database down")}, apihttp.WithObservability(observability.NewJSONLogger(io.Discard, nil), metrics))

	req := httptest.NewRequest(http.MethodGet, "/readyz", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusServiceUnavailable, rec.Code, rec.Body.String())
	}
	var got map[string]string
	decodeJSON(t, rec, &got)
	if got["database"] != "unavailable" {
		t.Fatalf("expected unavailable database readiness response, got %#v", got)
	}
	if strings.Contains(rec.Body.String(), "database down") {
		t.Fatalf("expected readiness response not to leak store error, got %s", rec.Body.String())
	}
	gotMetrics := metrics.RenderPrometheus()
	if !strings.Contains(gotMetrics, `clinicpulse_readiness_checks_total{result="failure"} 1`) {
		t.Fatalf("expected failed readiness metric, got:\n%s", gotMetrics)
	}
}

func TestMetricsEndpointRendersPrometheusMetrics(t *testing.T) {
	metrics := observability.NewRegistry()
	router := apihttp.NewRouter(fakeStore{}, apihttp.WithObservability(observability.NewJSONLogger(io.Discard, nil), metrics), apihttp.WithMetricsEndpoint(true, ""))

	req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if got := rec.Header().Get("Content-Type"); !strings.HasPrefix(got, "text/plain; version=0.0.4") && !strings.HasPrefix(got, "text/plain") {
		t.Fatalf("expected Prometheus text content type, got %q", got)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "# HELP clinicpulse_http_requests_total") {
		t.Fatalf("expected Prometheus metrics body, got:\n%s", body)
	}
	gotMetrics := metrics.RenderPrometheus()
	if !strings.Contains(gotMetrics, `clinicpulse_http_requests_total{method="GET",route="/metrics",status_class="2xx",principal_type="anonymous"} 1`) {
		t.Fatalf("expected request logger to record metrics endpoint, got:\n%s", gotMetrics)
	}
}

func TestMetricsEndpointIsNotExposedByBareRouter(t *testing.T) {
	router := apihttp.NewRouter(fakeStore{})

	req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNotFound, rec.Code, rec.Body.String())
	}
}

func TestMetricsEndpointRequiresBearerTokenWhenConfigured(t *testing.T) {
	const token = "abcdefghijklmnopqrstuvwxyz"
	router := apihttp.NewRouter(fakeStore{}, apihttp.WithMetricsEndpoint(true, token))

	for _, tt := range []struct {
		name          string
		authorization string
		wantStatus    int
	}{
		{name: "missing", wantStatus: http.StatusUnauthorized},
		{name: "invalid", authorization: "Bearer wrong-token", wantStatus: http.StatusUnauthorized},
		{name: "prefix only", authorization: "Bearer ", wantStatus: http.StatusUnauthorized},
		{name: "extra credential", authorization: "Bearer " + token + " extra", wantStatus: http.StatusUnauthorized},
		{name: "wrong scheme", authorization: "Basic " + token, wantStatus: http.StatusUnauthorized},
		{name: "valid", authorization: "Bearer " + token, wantStatus: http.StatusOK},
	} {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
			if tt.authorization != "" {
				req.Header.Set("Authorization", tt.authorization)
			}
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != tt.wantStatus {
				t.Fatalf("expected status %d, got %d with body %s", tt.wantStatus, rec.Code, rec.Body.String())
			}
			if rec.Code == http.StatusUnauthorized && strings.Contains(rec.Body.String(), token) {
				t.Fatalf("expected unauthorized response not to leak token, got %s", rec.Body.String())
			}
		})
	}
}

func TestMetricsEndpointUnauthorizedLogsStructuredErrorFields(t *testing.T) {
	const token = "abcdefghijklmnopqrstuvwxyz"
	var logOutput bytes.Buffer
	router := apihttp.NewRouter(
		fakeStore{},
		apihttp.WithObservability(observability.NewJSONLogger(&logOutput, nil), observability.NewRegistry()),
		apihttp.WithMetricsEndpoint(true, token),
	)
	req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	req.Header.Set("X-Request-Id", "request-structured-123")
	req.Header.Set("traceparent", "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01")
	req.Header.Set("Authorization", "Bearer wrong-token")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusUnauthorized, rec.Code, rec.Body.String())
	}
	logLine := decodeFirstLogLine(t, &logOutput)
	assertLogField(t, logLine, "event", "http_request_error")
	assertLogField(t, logLine, "component", "auth")
	assertLogField(t, logLine, "error_kind", "auth")
	assertLogField(t, logLine, "error_code", "unauthorized")
	assertLogField(t, logLine, "request_id", "request-structured-123")
	assertLogField(t, logLine, "trace_id", "4bf92f3577b34da6a3ce929d0e0e4736")
	assertLogField(t, logLine, "method", "GET")
	assertLogField(t, logLine, "route", "/metrics")
	assertLogField(t, logLine, "status", float64(http.StatusUnauthorized))
	assertLogField(t, logLine, "status_class", "4xx")
	if strings.Contains(logOutput.String(), token) || strings.Contains(logOutput.String(), "wrong-token") {
		t.Fatalf("expected structured error log not to contain metrics tokens, got %q", logOutput.String())
	}
}

func TestMetricsEndpointRejectsDuplicateAuthorizationHeaders(t *testing.T) {
	const token = "abcdefghijklmnopqrstuvwxyz"
	router := apihttp.NewRouter(fakeStore{}, apihttp.WithMetricsEndpoint(true, token))
	req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	req.Header.Add("Authorization", "Bearer "+token)
	req.Header.Add("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusUnauthorized, rec.Code, rec.Body.String())
	}
	if strings.Contains(rec.Body.String(), token) {
		t.Fatalf("expected unauthorized response not to leak token, got %s", rec.Body.String())
	}
}

func TestMetricsHandlerHandlesNilRegistry(t *testing.T) {
	handler := apihttp.NewHandler(fakeStore{}, apihttp.HandlerConfig{})
	req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	rec := httptest.NewRecorder()

	handler.Metrics(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "# HELP clinicpulse_http_requests_total") {
		t.Fatalf("expected Prometheus metrics body, got:\n%s", rec.Body.String())
	}
}

func TestMetricsEndpointReturnsNotFoundWhenDisabled(t *testing.T) {
	router := apihttp.NewRouter(fakeStore{}, apihttp.WithMetricsEndpoint(false, ""))

	req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNotFound, rec.Code, rec.Body.String())
	}
}

func TestRequestLoggerCapturesStatusAndRequestID(t *testing.T) {
	var logOutput bytes.Buffer
	logger := observability.NewJSONLogger(&logOutput, observability.Fields{"service": "clinicpulse-api", "deploy_env": "test"})
	metrics := observability.NewRegistry()
	traceparent := "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"
	handler := apihttp.RequestLogger(logger, metrics)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if requestID, ok := apihttp.RequestIDFromContext(r.Context()); !ok || requestID != "request-123" {
			t.Fatalf("expected request id in context, got %q ok=%v", requestID, ok)
		}
		traceContext, ok := apihttp.TraceContextFromContext(r.Context())
		if !ok || traceContext.Header() != traceparent {
			t.Fatalf("expected trace context in context, got %#v ok=%v", traceContext, ok)
		}
		w.WriteHeader(http.StatusTeapot)
	}))
	req := httptest.NewRequest(http.MethodGet, "/logged", nil)
	req.Header.Set("X-Request-Id", "request-123")
	req.Header.Set("traceparent", traceparent)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusTeapot {
		t.Fatalf("expected status %d, got %d", http.StatusTeapot, rec.Code)
	}
	if rec.Header().Get("X-Request-Id") != "request-123" {
		t.Fatalf("expected response request id request-123, got %q", rec.Header().Get("X-Request-Id"))
	}
	if rec.Header().Get("traceparent") != traceparent {
		t.Fatalf("expected response traceparent %q, got %q", traceparent, rec.Header().Get("traceparent"))
	}
	logLine := decodeLogLine(t, &logOutput)
	assertLogField(t, logLine, "event", "http_request_completed")
	assertLogField(t, logLine, "service", "clinicpulse-api")
	assertLogField(t, logLine, "deploy_env", "test")
	assertLogField(t, logLine, "method", "GET")
	assertLogField(t, logLine, "route", "/logged")
	assertLogField(t, logLine, "status", float64(http.StatusTeapot))
	assertLogField(t, logLine, "status_class", "4xx")
	assertLogField(t, logLine, "principal_type", "anonymous")
	assertLogField(t, logLine, "request_id", "request-123")
	assertLogField(t, logLine, "trace_id", "4bf92f3577b34da6a3ce929d0e0e4736")
	assertLogField(t, logLine, "span_id", "00f067aa0ba902b7")
	if _, ok := logLine["duration_ms"].(float64); !ok {
		t.Fatalf("expected numeric duration_ms, got %#v", logLine["duration_ms"])
	}
	gotMetrics := metrics.RenderPrometheus()
	if !strings.Contains(gotMetrics, `clinicpulse_http_requests_total{method="GET",route="/logged",status_class="4xx",principal_type="anonymous"} 1`) {
		t.Fatalf("expected request metrics for logged request, got:\n%s", gotMetrics)
	}
}

func TestRequestLoggerGeneratesRequestID(t *testing.T) {
	var logOutput bytes.Buffer
	logger := observability.NewJSONLogger(&logOutput, nil)
	handler := apihttp.RequestLogger(logger, observability.NewRegistry())(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))
	req := httptest.NewRequest(http.MethodGet, "/logged", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	requestID := rec.Header().Get("X-Request-Id")
	if requestID == "" {
		t.Fatal("expected generated request id response header")
	}
	traceparent := rec.Header().Get("traceparent")
	if !isValidTraceparentForTest(traceparent) {
		t.Fatalf("expected valid generated traceparent, got %q", traceparent)
	}
	logLine := decodeLogLine(t, &logOutput)
	assertLogField(t, logLine, "request_id", requestID)
	parts := strings.Split(traceparent, "-")
	assertLogField(t, logLine, "trace_id", parts[1])
	assertLogField(t, logLine, "span_id", parts[2])
}

func TestRequestLoggerRejectsUnsafeTraceparentHeaders(t *testing.T) {
	var logOutput bytes.Buffer
	logger := observability.NewJSONLogger(&logOutput, nil)
	handler := apihttp.RequestLogger(logger, observability.NewRegistry())(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))
	req := httptest.NewRequest(http.MethodGet, "/logged", nil)
	req.Header.Set("traceparent", "abc status=500")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	traceparent := rec.Header().Get("traceparent")
	if !isValidTraceparentForTest(traceparent) {
		t.Fatalf("expected safe replacement traceparent, got %q", traceparent)
	}
	if traceparent == "abc status=500" {
		t.Fatal("expected unsafe traceparent to be replaced")
	}
	logLine := decodeLogLine(t, &logOutput)
	parts := strings.Split(traceparent, "-")
	assertLogField(t, logLine, "trace_id", parts[1])
	assertLogField(t, logLine, "span_id", parts[2])
	if strings.Contains(logOutput.String(), "abc status=500") {
		t.Fatalf("expected log not to contain unsafe traceparent, got %q", logOutput.String())
	}
}

func TestRequestLoggerRecordsAndReraisesPanics(t *testing.T) {
	var logOutput bytes.Buffer
	logger := observability.NewJSONLogger(&logOutput, nil)
	metrics := observability.NewRegistry()
	handler := apihttp.RequestLogger(logger, metrics)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("boom")
	}))
	req := httptest.NewRequest(http.MethodGet, "/panic", nil)
	rec := httptest.NewRecorder()

	didPanic := false
	func() {
		defer func() {
			recovered := recover()
			if recovered == nil {
				return
			}
			didPanic = true
			if recovered != "boom" {
				t.Fatalf("expected panic to be re-raised unchanged, got %#v", recovered)
			}
		}()
		handler.ServeHTTP(rec, req)
	}()

	if !didPanic {
		t.Fatal("expected handler panic to be re-raised")
	}
	logLine := decodeLogLine(t, &logOutput)
	assertLogField(t, logLine, "event", "http_request_completed")
	assertLogField(t, logLine, "route", "/panic")
	assertLogField(t, logLine, "status", float64(http.StatusInternalServerError))
	assertLogField(t, logLine, "status_class", "5xx")
	gotMetrics := metrics.RenderPrometheus()
	if !strings.Contains(gotMetrics, `clinicpulse_http_requests_total{method="GET",route="/panic",status_class="5xx",principal_type="anonymous"} 1`) {
		t.Fatalf("expected panic request metric, got:\n%s", gotMetrics)
	}
}

func TestRequestLoggerSupportsResponseControllerFlush(t *testing.T) {
	var logOutput bytes.Buffer
	logger := observability.NewJSONLogger(&logOutput, nil)
	handler := apihttp.RequestLogger(logger, observability.NewRegistry())(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := http.NewResponseController(w).Flush(); err != nil {
			t.Fatalf("expected response controller flush to work: %v", err)
		}
	}))
	req := httptest.NewRequest(http.MethodGet, "/flush-route", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
	if !rec.Flushed {
		t.Fatal("expected underlying response recorder to be flushed")
	}
	assertLogField(t, decodeLogLine(t, &logOutput), "status", float64(http.StatusOK))
}

func TestRequestLoggerResponseControllerFlushReportsUnsupported(t *testing.T) {
	var logOutput bytes.Buffer
	logger := observability.NewJSONLogger(&logOutput, nil)
	handler := apihttp.RequestLogger(logger, observability.NewRegistry())(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		err := http.NewResponseController(w).Flush()
		if !errors.Is(err, http.ErrNotSupported) {
			t.Fatalf("expected unsupported flush error, got %v", err)
		}
		w.WriteHeader(http.StatusNoContent)
	}))
	req := httptest.NewRequest(http.MethodGet, "/flush-unsupported", nil)
	rec := newBasicResponseWriter()

	handler.ServeHTTP(rec, req)

	if rec.status != http.StatusNoContent {
		t.Fatalf("expected status %d, got %d", http.StatusNoContent, rec.status)
	}
	assertLogField(t, decodeLogLine(t, &logOutput), "status", float64(http.StatusNoContent))
}

func TestRequestLoggerRejectsUnsafeRequestIDHeaders(t *testing.T) {
	tests := []struct {
		name       string
		requestID  string
		notInLog   []string
		notInReply []string
	}{
		{
			name:      "fake log fields",
			requestID: "abc status=500",
			notInLog: []string{
				"request_id=abc status=500",
				"status=500",
			},
			notInReply: []string{"abc status=500"},
		},
		{
			name:       "too long",
			requestID:  strings.Repeat("a", 129),
			notInLog:   []string{strings.Repeat("a", 129)},
			notInReply: []string{strings.Repeat("a", 129)},
		},
		{
			name:       "unsafe character",
			requestID:  "request/id-123",
			notInLog:   []string{"request/id-123"},
			notInReply: []string{"request/id-123"},
		},
		{
			name:       "too short",
			requestID:  "short",
			notInLog:   []string{"request_id=short"},
			notInReply: []string{"short"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var logOutput bytes.Buffer
			logger := observability.NewJSONLogger(&logOutput, nil)
			handler := apihttp.RequestLogger(logger, observability.NewRegistry())(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusNoContent)
			}))
			req := httptest.NewRequest(http.MethodGet, "/logged", nil)
			req.Header.Set("X-Request-Id", tt.requestID)
			rec := httptest.NewRecorder()

			handler.ServeHTTP(rec, req)

			gotRequestID := rec.Header().Get("X-Request-Id")
			if !isSafeRequestIDForTest(gotRequestID) {
				t.Fatalf("expected safe replacement request id, got %q", gotRequestID)
			}
			if gotRequestID == tt.requestID {
				t.Fatalf("expected unsafe request id %q to be replaced", tt.requestID)
			}
			logLine := logOutput.String()
			assertLogField(t, decodeLogLine(t, &logOutput), "request_id", gotRequestID)
			for _, forbidden := range tt.notInLog {
				if strings.Contains(logLine, forbidden) {
					t.Fatalf("expected log not to contain %q, got %q", forbidden, logLine)
				}
			}
			for _, forbidden := range tt.notInReply {
				if strings.Contains(gotRequestID, forbidden) {
					t.Fatalf("expected response request id not to contain %q, got %q", forbidden, gotRequestID)
				}
			}
		})
	}
}

func TestRequestLoggerLogsPrincipalTypeAssignedDownstream(t *testing.T) {
	tests := []struct {
		name   string
		assign func(context.Context) context.Context
		want   string
	}{
		{
			name: "session",
			assign: func(ctx context.Context) context.Context {
				return apihttp.ContextWithPrincipal(ctx, apihttp.Principal{UserID: 42})
			},
			want: "principal_type=session",
		},
		{
			name: "partner",
			assign: func(ctx context.Context) context.Context {
				return apihttp.ContextWithPartnerPrincipal(ctx, apihttp.PartnerPrincipal{APIKeyID: 10})
			},
			want: "principal_type=partner",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var logOutput bytes.Buffer
			logger := observability.NewJSONLogger(&logOutput, nil)
			handler := apihttp.RequestLogger(logger, observability.NewRegistry())(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				r = r.WithContext(tt.assign(r.Context()))
				w.WriteHeader(http.StatusNoContent)
			}))
			req := httptest.NewRequest(http.MethodGet, "/logged", nil)
			rec := httptest.NewRecorder()

			handler.ServeHTTP(rec, req)

			if rec.Code != http.StatusNoContent {
				t.Fatalf("expected status %d, got %d", http.StatusNoContent, rec.Code)
			}
			assertLogField(t, decodeLogLine(t, &logOutput), "principal_type", strings.TrimPrefix(tt.want, "principal_type="))
		})
	}
}

func TestRequestLoggerRouterMountedPrincipalType(t *testing.T) {
	t.Run("session", func(t *testing.T) {
		var logOutput bytes.Buffer
		metrics := observability.NewRegistry()
		router := apihttp.NewRouter(authenticatedStore(t, "district_manager", fakeStore{
			clinics: []store.ClinicDetail{{Clinic: store.Clinic{ID: "clinic-1", District: defaultTestDistrict}}},
		}), apihttp.WithObservability(observability.NewJSONLogger(&logOutput, nil), metrics))
		req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics", nil)
		rec := httptest.NewRecorder()

		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
		}
		logLine := decodeLogLine(t, &logOutput)
		assertLogField(t, logLine, "principal_type", "session")
		assertLogField(t, logLine, "route", "/v1/clinics")
		gotMetrics := metrics.RenderPrometheus()
		if !strings.Contains(gotMetrics, `clinicpulse_http_requests_total{method="GET",route="/v1/clinics",status_class="2xx",principal_type="session"} 1`) {
			t.Fatalf("expected session request metric, got:\n%s", gotMetrics)
		}
	})

	t.Run("partner", func(t *testing.T) {
		var logOutput bytes.Buffer
		metrics := observability.NewRegistry()
		secret, _, err := auth.GenerateAPIKey("demo")
		if err != nil {
			t.Fatalf("GenerateAPIKey returned error: %v", err)
		}
		hash, err := auth.HashAPIKey(secret, "")
		if err != nil {
			t.Fatalf("HashAPIKey returned error: %v", err)
		}
		router := apihttp.NewRouter(fakeStore{
			partnerAPIKey: validPartnerAPIKey(hash, []string{"clinics:read"}, nil),
			clinics:       []store.ClinicDetail{{Clinic: store.Clinic{ID: "clinic-1", District: defaultTestDistrict}}},
		}, apihttp.WithObservability(observability.NewJSONLogger(&logOutput, nil), metrics))
		req := httptest.NewRequest(http.MethodGet, "/v1/partner/clinics", nil)
		req.Header.Set("Authorization", "Bearer "+secret)
		rec := httptest.NewRecorder()

		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
		}
		logLine := decodeLogLine(t, &logOutput)
		assertLogField(t, logLine, "principal_type", "partner")
		gotMetrics := metrics.RenderPrometheus()
		if !strings.Contains(gotMetrics, `clinicpulse_http_requests_total{method="GET",route="/v1/partner/clinics",status_class="2xx",principal_type="partner"} 1`) {
			t.Fatalf("expected partner request metric, got:\n%s", gotMetrics)
		}
	})
}

func TestRequestLoggerInvalidCredentialsRemainAnonymous(t *testing.T) {
	t.Run("invalid cookie", func(t *testing.T) {
		var logOutput bytes.Buffer
		router := apihttp.NewRouter(fakeStore{}, apihttp.WithObservability(observability.NewJSONLogger(&logOutput, nil), observability.NewRegistry()))
		req := httptest.NewRequest(http.MethodGet, "/v1/clinics", nil)
		req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: "not-a-valid-token"})
		rec := httptest.NewRecorder()

		router.ServeHTTP(rec, req)

		assertGenericUnauthorized(t, rec)
		assertLogField(t, decodeLogLine(t, &logOutput), "principal_type", "anonymous")
	})

	t.Run("invalid bearer", func(t *testing.T) {
		var logOutput bytes.Buffer
		secret, _, err := auth.GenerateAPIKey("demo")
		if err != nil {
			t.Fatalf("GenerateAPIKey returned error: %v", err)
		}
		router := apihttp.NewRouter(fakeStore{}, apihttp.WithObservability(observability.NewJSONLogger(&logOutput, nil), observability.NewRegistry()))
		req := httptest.NewRequest(http.MethodGet, "/v1/partner/clinics", nil)
		req.Header.Set("Authorization", "Bearer "+secret)
		rec := httptest.NewRecorder()

		router.ServeHTTP(rec, req)

		assertGenericUnauthorized(t, rec)
		assertLogField(t, decodeLogLine(t, &logOutput), "principal_type", "anonymous")
	})
}

func TestListClinicsReturnsOK(t *testing.T) {
	updatedAt := time.Date(2026, 5, 1, 10, 0, 0, 0, time.UTC)
	router := newAuthenticatedTestRouter(t, fakeStore{
		clinics: []store.ClinicDetail{{
			Clinic: store.Clinic{
				ID:                 "clinic-1",
				Name:               "Central Clinic",
				FacilityCode:       "C001",
				Province:           "Gauteng",
				District:           defaultTestDistrict,
				FacilityType:       "clinic",
				VerificationStatus: "verified",
				CreatedAt:          updatedAt,
				UpdatedAt:          updatedAt,
			},
		}},
	})

	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}

	var got []store.ClinicDetail
	decodeJSON(t, rec, &got)
	if len(got) != 1 || got[0].Clinic.ID != "clinic-1" || got[0].Clinic.Name != "Central Clinic" {
		t.Fatalf("unexpected clinics response: %#v", got)
	}
}

func TestListClinicsReturnsEmptyArrayForNilSlice(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{})

	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if strings.TrimSpace(rec.Body.String()) != "[]" {
		t.Fatalf("expected empty array response, got %q", rec.Body.String())
	}
}

func TestListClinicsReturnsInternalErrorForUnexpectedStoreError(t *testing.T) {
	storeErr := errors.New("database password leaked")
	router := newAuthenticatedTestRouter(t, fakeStore{listErr: storeErr})

	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertInternalError(t, rec, storeErr)
}

func TestPublicListClinicsWorksWithoutCookieAndSanitizesStatus(t *testing.T) {
	updatedAt := time.Date(2026, 5, 1, 10, 0, 0, 0, time.UTC)
	reportedAt := time.Date(2026, 5, 1, 9, 45, 0, 0, time.UTC)
	reporterName := "Nomsa Dlamini"
	source := "field_worker"
	reason := "Short staffed"
	router := apihttp.NewRouter(fakeStore{
		clinics: []store.ClinicDetail{{
			Clinic: store.Clinic{
				ID:                 "clinic-1",
				Name:               "Central Clinic",
				FacilityCode:       "C001",
				Province:           "Gauteng",
				District:           "Johannesburg",
				FacilityType:       "clinic",
				VerificationStatus: "verified",
				CreatedAt:          updatedAt,
				UpdatedAt:          updatedAt,
			},
			Services: []store.ClinicService{{
				ClinicID:            "clinic-1",
				ServiceName:         "Primary care",
				CurrentAvailability: "available",
			}},
			CurrentStatus: &store.CurrentStatus{
				ClinicID:       "clinic-1",
				Status:         "degraded",
				Reason:         &reason,
				Freshness:      "fresh",
				LastReportedAt: &reportedAt,
				ReporterName:   &reporterName,
				Source:         &source,
				UpdatedAt:      updatedAt,
			},
		}},
	})

	req := httptest.NewRequest(http.MethodGet, "/v1/public/clinics", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	assertPublicSafeResponse(t, rec.Body.String())

	var got []struct {
		Clinic        store.Clinic          `json:"clinic"`
		Services      []store.ClinicService `json:"services"`
		CurrentStatus *struct {
			ClinicID       string     `json:"clinicId"`
			Status         string     `json:"status"`
			Reason         *string    `json:"reason,omitempty"`
			Freshness      string     `json:"freshness"`
			LastReportedAt *time.Time `json:"lastReportedAt,omitempty"`
			UpdatedAt      time.Time  `json:"updatedAt"`
		} `json:"currentStatus,omitempty"`
	}
	decodeJSON(t, rec, &got)
	if len(got) != 1 || got[0].Clinic.ID != "clinic-1" || got[0].Services[0].ServiceName != "Primary care" {
		t.Fatalf("unexpected public clinics response: %#v", got)
	}
	if got[0].CurrentStatus == nil || got[0].CurrentStatus.ClinicID != "clinic-1" || got[0].CurrentStatus.Status != "degraded" {
		t.Fatalf("unexpected public status response: %#v", got[0].CurrentStatus)
	}
}

func TestPublicGetClinicWorksWithoutCookieAndSanitizesStatus(t *testing.T) {
	updatedAt := time.Date(2026, 5, 1, 10, 0, 0, 0, time.UTC)
	reporterName := "Nomsa Dlamini"
	source := "field_worker"
	router := apihttp.NewRouter(fakeStore{
		clinic: store.ClinicDetail{
			Clinic: store.Clinic{
				ID:                 "clinic-1",
				Name:               "Central Clinic",
				FacilityCode:       "C001",
				Province:           "Gauteng",
				District:           "Johannesburg",
				FacilityType:       "clinic",
				VerificationStatus: "verified",
				CreatedAt:          updatedAt,
				UpdatedAt:          updatedAt,
			},
			CurrentStatus: &store.CurrentStatus{
				ClinicID:     "clinic-1",
				Status:       "operational",
				Freshness:    "fresh",
				ReporterName: &reporterName,
				Source:       &source,
				UpdatedAt:    updatedAt,
			},
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/v1/public/clinics/clinic-1", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	assertPublicSafeResponse(t, rec.Body.String())
	if !strings.Contains(rec.Body.String(), `"id":"clinic-1"`) {
		t.Fatalf("expected public clinic detail in response, got %q", rec.Body.String())
	}
}

func TestPublicAlternativesWorksWithoutCookieAndSanitizesNestedClinics(t *testing.T) {
	reporterName := "Nomsa Dlamini"
	sourceLabel := "clinic_coordinator"
	source := clinicDetail("clinic-mamelodi-east", "Mamelodi East Clinic", -25.7400, 28.1300, "non_functional", "fresh", "Primary care")
	candidate := clinicDetail("near-operational", "Near Operational Clinic", -25.7410, 28.1310, "operational", "fresh", "Primary care")
	candidate.CurrentStatus.ReporterName = &reporterName
	candidate.CurrentStatus.Source = &sourceLabel
	router := apihttp.NewRouter(fakeStore{
		clinic:  source,
		clinics: []store.ClinicDetail{source, candidate},
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/public/alternatives?clinicId=clinic-mamelodi-east&service=Primary%20care", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	assertPublicSafeResponse(t, rec.Body.String())
	if !strings.Contains(rec.Body.String(), `"matchedService":"Primary care"`) {
		t.Fatalf("expected ranked public alternative response, got %q", rec.Body.String())
	}
}

func TestPartnerStatusEndpointRequiresStatusScopeAndSanitizesResponse(t *testing.T) {
	secret, _, err := auth.GenerateAPIKey("demo")
	if err != nil {
		t.Fatalf("GenerateAPIKey returned error: %v", err)
	}
	hash, err := auth.HashAPIKey(secret, "")
	if err != nil {
		t.Fatalf("HashAPIKey returned error: %v", err)
	}
	reporterName := "Nomsa Dlamini"
	source := "field_worker"
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	router := apihttp.NewRouter(fakeStore{
		partnerAPIKey: store.PartnerAPIKey{
			ID: 10, Name: "Demo partner", KeyHash: hash,
			Scopes:           []string{"status:read"},
			AllowedDistricts: []string{defaultTestDistrict},
		},
		clinic: store.ClinicDetail{Clinic: store.Clinic{ID: "clinic-1", District: defaultTestDistrict}},
		status: store.CurrentStatus{
			ClinicID: "clinic-1", Status: "degraded", Freshness: "fresh",
			ReporterName: &reporterName, Source: &source, UpdatedAt: now,
		},
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/partner/clinics/clinic-1/status", nil)
	req.Header.Set("Authorization", "Bearer "+secret)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	assertPublicSafeResponse(t, rec.Body.String())
	if strings.Contains(rec.Body.String(), "Nomsa") || strings.Contains(rec.Body.String(), "reporterName") {
		t.Fatalf("expected partner response to hide reporter identity, got %s", rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"sourceCategory":"field_worker"`) {
		t.Fatalf("expected partner source category, got %s", rec.Body.String())
	}
}

func TestPartnerEndpointRejectsMissingScope(t *testing.T) {
	secret, _, err := auth.GenerateAPIKey("demo")
	if err != nil {
		t.Fatalf("GenerateAPIKey returned error: %v", err)
	}
	hash, err := auth.HashAPIKey(secret, "")
	if err != nil {
		t.Fatalf("HashAPIKey returned error: %v", err)
	}
	router := apihttp.NewRouter(fakeStore{
		partnerAPIKey: store.PartnerAPIKey{ID: 10, Name: "Demo partner", KeyHash: hash, Scopes: []string{"clinics:read"}},
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/partner/clinics/clinic-1/status", nil)
	req.Header.Set("Authorization", "Bearer "+secret)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusForbidden, rec.Code, rec.Body.String())
	}
}

func TestPartnerLatestExportSanitizesResponse(t *testing.T) {
	secret, _, err := auth.GenerateAPIKey("demo")
	if err != nil {
		t.Fatalf("GenerateAPIKey returned error: %v", err)
	}
	hash, err := auth.HashAPIKey(secret, "")
	if err != nil {
		t.Fatalf("HashAPIKey returned error: %v", err)
	}
	userID := int64(42)
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	exportRun := store.PartnerExportRun{
		ID:                20,
		RequestedByUserID: &userID,
		Format:            "json",
		Scope:             map[string]any{"district": defaultTestDistrict, "secret": "raw-scope-secret"},
		RecordCounts:      map[string]any{"clinics": 3},
		Checksum:          "sha256:abc",
		Payload: map[string]any{
			"submittedByUserId": 42,
			"reviewedByUserId":  43,
			"rawSecret":         "export-payload-secret",
		},
		CreatedAt: now,
	}
	router := apihttp.NewRouter(fakeStore{
		partnerAPIKey:    validPartnerAPIKey(hash, []string{"exports:read"}, nil),
		partnerExportRun: exportRun,
		partnerReadinessSnapshot: store.PartnerReadinessSnapshot{
			ExportRuns: []store.PartnerExportRun{exportRun},
		},
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/partner/export/latest", nil)
	req.Header.Set("Authorization", "Bearer "+secret)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	assertPartnerSafeReadinessResponse(t, rec.Body.String())
	for _, forbidden := range []string{"requestedByUserId", "payload", "metadata", "submittedByUserId", "reviewedByUserId", "raw-scope-secret", "export-payload-secret"} {
		if strings.Contains(rec.Body.String(), forbidden) {
			t.Fatalf("expected partner export response to hide %q, got %s", forbidden, rec.Body.String())
		}
	}
	if !strings.Contains(rec.Body.String(), `"recordCounts":{"clinics":3}`) {
		t.Fatalf("expected record counts in partner export response, got %s", rec.Body.String())
	}
}

func TestPartnerLatestExportReturnsLatestAccessibleScopedRun(t *testing.T) {
	secret, _, err := auth.GenerateAPIKey("demo")
	if err != nil {
		t.Fatalf("GenerateAPIKey returned error: %v", err)
	}
	hash, err := auth.HashAPIKey(secret, "")
	if err != nil {
		t.Fatalf("HashAPIKey returned error: %v", err)
	}
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	inaccessibleLatest := store.PartnerExportRun{
		ID:           30,
		Format:       "json",
		Scope:        map[string]any{"district": "Johannesburg"},
		RecordCounts: map[string]any{"clinics": 9},
		Checksum:     "sha256:other-district",
		CreatedAt:    now.Add(2 * time.Minute),
	}
	allDistrictLatest := store.PartnerExportRun{
		ID:           29,
		Format:       "json",
		Scope:        map[string]any{},
		RecordCounts: map[string]any{"clinics": 20},
		Checksum:     "sha256:all-district",
		CreatedAt:    now.Add(time.Minute),
	}
	accessibleRun := store.PartnerExportRun{
		ID:           20,
		Format:       "json",
		Scope:        map[string]any{"district": defaultTestDistrict},
		RecordCounts: map[string]any{"clinics": 3},
		Checksum:     "sha256:allowed-district",
		CreatedAt:    now,
	}
	router := apihttp.NewRouter(fakeStore{
		partnerAPIKey:    validPartnerAPIKey(hash, []string{"exports:read"}, []string{defaultTestDistrict}),
		partnerExportRun: inaccessibleLatest,
		partnerReadinessSnapshot: store.PartnerReadinessSnapshot{
			ExportRuns: []store.PartnerExportRun{inaccessibleLatest, allDistrictLatest, accessibleRun},
		},
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/partner/export/latest", nil)
	req.Header.Set("Authorization", "Bearer "+secret)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	var got struct {
		ID       int64  `json:"id"`
		Checksum string `json:"checksum"`
	}
	decodeJSON(t, rec, &got)
	if got.ID != accessibleRun.ID || got.Checksum != accessibleRun.Checksum {
		t.Fatalf("expected latest accessible export %#v, got %#v", accessibleRun, got)
	}
}

func TestPartnerLatestExportDeniesAllDistrictRunForRestrictedKey(t *testing.T) {
	secret, _, err := auth.GenerateAPIKey("demo")
	if err != nil {
		t.Fatalf("GenerateAPIKey returned error: %v", err)
	}
	hash, err := auth.HashAPIKey(secret, "")
	if err != nil {
		t.Fatalf("HashAPIKey returned error: %v", err)
	}
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	allDistrictLatest := store.PartnerExportRun{
		ID:           31,
		Format:       "json",
		Scope:        map[string]any{},
		RecordCounts: map[string]any{"clinics": 20},
		Checksum:     "sha256:all-district",
		CreatedAt:    now,
	}
	router := apihttp.NewRouter(fakeStore{
		partnerAPIKey:    validPartnerAPIKey(hash, []string{"exports:read"}, []string{defaultTestDistrict}),
		partnerExportRun: allDistrictLatest,
		partnerReadinessSnapshot: store.PartnerReadinessSnapshot{
			ExportRuns: []store.PartnerExportRun{allDistrictLatest},
		},
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/partner/export/latest", nil)
	req.Header.Set("Authorization", "Bearer "+secret)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNotFound, rec.Code, rec.Body.String())
	}
}

func TestPartnerIntegrationStatusSanitizesRecomputedResponse(t *testing.T) {
	secret, _, err := auth.GenerateAPIKey("demo")
	if err != nil {
		t.Fatalf("GenerateAPIKey returned error: %v", err)
	}
	hash, err := auth.HashAPIKey(secret, "")
	if err != nil {
		t.Fatalf("HashAPIKey returned error: %v", err)
	}
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	tests := []struct {
		name  string
		store fakeStore
		want  string
	}{
		{
			name: "sanitized checks",
			store: fakeStore{
				partnerAPIKey: validPartnerAPIKey(hash, []string{"status:read"}, nil),
				integrationStatusChecks: []store.IntegrationStatusCheck{{
					ID:        30,
					CheckName: "webhook_delivery",
					Status:    "passing",
					Summary:   "Webhooks are healthy",
					Metadata: map[string]any{
						"secretToken":       "integration-secret-token",
						"submittedByUserId": 42,
						"reviewedByUserId":  43,
					},
					CheckedAt: now,
				}},
			},
			want: `"checkName":"api_key_active"`,
		},
		{
			name: "nil checks",
			store: fakeStore{
				partnerAPIKey: validPartnerAPIKey(hash, []string{"status:read"}, nil),
			},
			want: `"checkName":"api_key_active"`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(tt.store)
			req := httptest.NewRequest(http.MethodGet, "/v1/partner/integration-status", nil)
			req.Header.Set("Authorization", "Bearer "+secret)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
			}
			assertPartnerSafeReadinessResponse(t, rec.Body.String())
			for _, forbidden := range []string{"metadata", "submittedByUserId", "reviewedByUserId", "integration-secret-token"} {
				if strings.Contains(rec.Body.String(), forbidden) {
					t.Fatalf("expected partner integration response to hide %q, got %s", forbidden, rec.Body.String())
				}
			}
			if !strings.Contains(rec.Body.String(), tt.want) {
				t.Fatalf("expected %q in partner integration response, got %s", tt.want, rec.Body.String())
			}
		})
	}
}

func TestPartnerIntegrationStatusRecomputesChecksBeforeResponding(t *testing.T) {
	secret, _, err := auth.GenerateAPIKey("demo")
	if err != nil {
		t.Fatalf("GenerateAPIKey returned error: %v", err)
	}
	hash, err := auth.HashAPIKey(secret, "")
	if err != nil {
		t.Fatalf("HashAPIKey returned error: %v", err)
	}
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	upsertInputs := []store.UpsertIntegrationStatusCheckInput{}
	upsertedChecks := []store.IntegrationStatusCheck{}
	router := apihttp.NewRouter(fakeStore{
		partnerAPIKey: validPartnerAPIKey(hash, []string{"status:read"}, nil),
		partnerReadinessSnapshot: store.PartnerReadinessSnapshot{
			APIKeys: []store.PartnerAPIKey{validPartnerAPIKey(hash, []string{"status:read"}, nil)},
			ExportRuns: []store.PartnerExportRun{{
				ID:        1,
				Format:    "json",
				Scope:     map[string]any{"district": defaultTestDistrict},
				Checksum:  "sha256:export",
				CreatedAt: now,
			}},
			WebhookEvents: []store.PartnerWebhookEvent{{
				ID:             1,
				SubscriptionID: 1,
				EventType:      "clinicpulse.webhook_test",
				Status:         "preview_only",
				CreatedAt:      now,
			}},
		},
		currentStatuses: []store.CurrentStatus{{
			ClinicID:  "clinic-1",
			Status:    "operational",
			Freshness: "fresh",
			UpdatedAt: now,
		}},
		syncSummary:                        &store.SyncSummary{OfflineReportsReceived: 1},
		upsertIntegrationStatusCheckInputs: &upsertInputs,
		upsertIntegrationStatusChecks:      &upsertedChecks,
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/partner/integration-status", nil)
	req.Header.Set("Authorization", "Bearer "+secret)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	expectedNames := []string{
		"api_key_active",
		"export_generated",
		"webhook_test_recorded",
		"offline_sync_health_available",
		"stale_status_reconciliation_available",
		"deployment_env_configured",
	}
	if len(upsertInputs) != len(expectedNames) {
		t.Fatalf("expected %d upserted checks, got %#v", len(expectedNames), upsertInputs)
	}
	for _, name := range expectedNames {
		if !strings.Contains(rec.Body.String(), `"checkName":"`+name+`"`) {
			t.Fatalf("expected response to include recomputed check %q, got %s", name, rec.Body.String())
		}
	}
}

func TestAdminCanCreateListAndRevokePartnerAPIKey(t *testing.T) {
	orgID := int64(77)
	apiKeys := []store.PartnerAPIKey{}
	var createInput store.CreatePartnerAPIKeyInput
	var revokedKeyID int64
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		partnerAPIKeys:           &apiKeys,
		createPartnerAPIKeyInput: &createInput,
		revokedPartnerAPIKeyID:   &revokedKeyID,
		listPartnerAPIKeysOrgID:  new(int64),
		revokePartnerAPIKeyCalls: new(int),
	}), apihttp.WithAPIKeyPepper("test-pepper"))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/api-keys", strings.NewReader(`{
		"name":"Demo partner",
		"environment":"demo",
		"scopes":["clinics:read","exports:read"],
		"allowedDistricts":["Tshwane North Demo District"]
	}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusCreated, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"secret":"cp_demo_`) {
		t.Fatalf("expected one-time demo secret in create response, got %s", rec.Body.String())
	}
	if strings.Contains(rec.Body.String(), "keyHash") {
		t.Fatalf("expected create response not to expose key hash, got %s", rec.Body.String())
	}
	var created struct {
		APIKey store.PartnerAPIKey `json:"apiKey"`
		Secret string              `json:"secret"`
	}
	decodeJSON(t, rec, &created)
	if created.APIKey.ID != 1 || created.APIKey.KeyPrefix == "" {
		t.Fatalf("unexpected created API key response: %#v", created.APIKey)
	}
	if createInput.OrganisationID == nil || *createInput.OrganisationID != orgID {
		t.Fatalf("expected API key to be scoped to org %d, got %#v", orgID, createInput.OrganisationID)
	}
	wantHash, err := auth.HashAPIKey(created.Secret, "test-pepper")
	if err != nil {
		t.Fatalf("HashAPIKey returned error: %v", err)
	}
	if createInput.KeyHash != wantHash || createInput.KeyHash == created.Secret {
		t.Fatalf("expected stored API key hash to use pepper and not store raw secret, got input %#v", createInput)
	}

	req = newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/api-keys", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if strings.Contains(rec.Body.String(), `"secret"`) || strings.Contains(rec.Body.String(), created.Secret) || strings.Contains(rec.Body.String(), "keyHash") {
		t.Fatalf("expected list response not to expose raw or hashed secrets, got %s", rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"keyPrefix":"cp_demo_`) {
		t.Fatalf("expected list response to include key prefix, got %s", rec.Body.String())
	}

	req = newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/api-keys/1/revoke", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNoContent, rec.Code, rec.Body.String())
	}
	if revokedKeyID != 1 {
		t.Fatalf("expected API key 1 to be revoked, got %d", revokedKeyID)
	}
}

func TestAdminCreatePartnerAPIKeyValidatesNameAndExpiryBeforeStoreCall(t *testing.T) {
	orgID := int64(77)
	tests := []struct {
		name string
		body string
		want string
	}{
		{
			name: "missing name",
			body: `{"environment":"demo","scopes":["clinics:read"]}`,
			want: "name",
		},
		{
			name: "blank name",
			body: `{"name":"   ","environment":"demo","scopes":["clinics:read"]}`,
			want: "name",
		},
		{
			name: "already expired",
			body: `{"name":"Demo partner","environment":"demo","scopes":["clinics:read"],"expiresAt":"2020-01-01T00:00:00Z"}`,
			want: "expiresAt",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			createCalls := 0
			router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
				createPartnerAPIKeyCalls: &createCalls,
			}))
			req := newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/api-keys", strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
			}
			if createCalls != 0 {
				t.Fatalf("expected CreatePartnerAPIKey not to be called, got %d calls", createCalls)
			}
			if !strings.Contains(rec.Body.String(), `"code":"validation_error"`) || !strings.Contains(rec.Body.String(), tt.want) {
				t.Fatalf("expected validation error mentioning %q, got %s", tt.want, rec.Body.String())
			}
		})
	}
}

func TestAdminPartnerReadinessReturnsSnapshot(t *testing.T) {
	orgID := int64(77)
	readinessOrgID := int64(0)
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		partnerReadinessOrgID: &readinessOrgID,
		partnerReadinessSnapshot: store.PartnerReadinessSnapshot{
			APIKeys: []store.PartnerAPIKey{{
				ID:             1,
				OrganisationID: &orgID,
				Name:           "Demo partner",
				Environment:    "demo",
				KeyPrefix:      "cp_demo_abcd1234",
				KeyHash:        "raw-key-hash",
				Scopes:         []string{"clinics:read"},
				CreatedAt:      now,
				UpdatedAt:      now,
			}},
			IntegrationChecks: []store.IntegrationStatusCheck{{
				ID:             30,
				OrganisationID: &orgID,
				CheckName:      "webhook_delivery",
				Status:         "passing",
				Summary:        "Webhooks are healthy",
				Metadata:       map[string]any{"internal": "kept for admins"},
				CheckedAt:      now,
			}},
		},
	}))
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/partner-readiness", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if readinessOrgID != orgID {
		t.Fatalf("expected readiness snapshot scoped to org %d, got %d", orgID, readinessOrgID)
	}
	if !strings.Contains(rec.Body.String(), `"apiKeys"`) || !strings.Contains(rec.Body.String(), `"integrationChecks"`) {
		t.Fatalf("expected readiness response to include API keys and integration checks, got %s", rec.Body.String())
	}
	if strings.Contains(rec.Body.String(), "keyHash") || strings.Contains(rec.Body.String(), "raw-key-hash") {
		t.Fatalf("expected readiness response not to expose API key hashes, got %s", rec.Body.String())
	}
}

func TestAdminUsersAndAuditEventsRequireAdminRole(t *testing.T) {
	tests := []struct {
		name string
		role string
		path string
	}{
		{
			name: "reporter users",
			role: "reporter",
			path: "/v1/admin/users",
		},
		{
			name: "district manager users",
			role: "district_manager",
			path: "/v1/admin/users",
		},
		{
			name: "reporter audit events",
			role: "reporter",
			path: "/v1/admin/audit-events",
		},
		{
			name: "district manager audit events",
			role: "district_manager",
			path: "/v1/admin/audit-events",
		},
		{
			name: "reporter ingestion runs",
			role: "reporter",
			path: "/v1/admin/ingestion/runs",
		},
		{
			name: "district manager ingestion runs",
			role: "district_manager",
			path: "/v1/admin/ingestion/runs",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(authenticatedStore(t, tt.role, fakeStore{}))
			req := newAuthenticatedRequest(t, http.MethodGet, tt.path, nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusForbidden {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusForbidden, rec.Code, rec.Body.String())
			}
		})
	}
}

func TestAdminUsersReturnsMembershipRows(t *testing.T) {
	orgID := int64(77)
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		adminUsers: []store.AdminUserAccessRow{{
			UserID:         10,
			Email:          "reporter@example.test",
			DisplayName:    "Reporter User",
			CreatedAt:      now,
			Role:           "reporter",
			OrganisationID: &orgID,
		}},
	}))
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/users", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"email":"reporter@example.test"`) {
		t.Fatalf("expected response to include admin user row, got %s", rec.Body.String())
	}
}

func TestAdminUsersScopesOrganisationAdmins(t *testing.T) {
	orgID := int64(77)
	var gotOrgID *int64
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		listAdminUsersOrgID: &gotOrgID,
	}))
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/users", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if gotOrgID == nil || *gotOrgID != orgID {
		t.Fatalf("expected admin users list scoped to org %d, got %#v", orgID, gotOrgID)
	}
}

func TestAdminUsersUsesGlobalScopeForSystemAdmins(t *testing.T) {
	orgID := int64(77)
	sentinelOrgID := int64(-1)
	gotOrgID := &sentinelOrgID
	router := apihttp.NewRouter(authenticatedAdminStore(t, "system_admin", orgID, fakeStore{
		listAdminUsersOrgID: &gotOrgID,
	}))
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/users", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if gotOrgID != nil {
		t.Fatalf("expected system admin users list to use global scope, got %#v", gotOrgID)
	}
}

func TestAdminCanCreateUserWithoutLeakingHash(t *testing.T) {
	orgID := int64(1)
	var txInput store.CreateAdminUserWithAccessInput
	txCalls := 0
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		createAdminUserWithAccessInput: &txInput,
		createAdminUserWithAccessCalls: &txCalls,
	}))
	req := httptest.NewRequest(http.MethodPost, "/v1/admin/users", strings.NewReader(`{"email":"pilot@example.test","displayName":"Pilot User","role":"reporter","organisationId":1}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", "http://localhost:3000")
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: sessionTokenForTest(t)})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected created, got %d with body %s", rec.Code, rec.Body.String())
	}
	if txCalls != 1 {
		t.Fatalf("expected transactional admin create to be called once, got %d", txCalls)
	}
	if txInput.User.PasswordHash == nil || strings.Contains(rec.Body.String(), *txInput.User.PasswordHash) {
		t.Fatalf("response leaked password hash")
	}
	if !strings.Contains(rec.Body.String(), "temporaryPassword") {
		t.Fatalf("expected one-time temporary password in response, got %s", rec.Body.String())
	}
	var got struct {
		TemporaryPassword string `json:"temporaryPassword"`
	}
	decodeJSON(t, rec, &got)
	auditMetadata, err := json.Marshal(txInput.AuditEvent.Metadata)
	if err != nil {
		t.Fatalf("failed to marshal audit metadata: %v", err)
	}
	if strings.Contains(string(auditMetadata), got.TemporaryPassword) || strings.Contains(string(auditMetadata), *txInput.User.PasswordHash) {
		t.Fatalf("audit metadata leaked password material: %s", string(auditMetadata))
	}
}

func TestAdminCreateUserTransactionErrorDoesNotLeakPasswordMaterial(t *testing.T) {
	orgID := int64(1)
	storeErr := errors.New("database password leaked")
	var txInput store.CreateAdminUserWithAccessInput
	txCalls := 0
	var created store.CreateUserInput
	var membershipInput store.UpsertMembershipInput
	var auditInput store.CreateAuditEventInput
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		createAdminUserWithAccessInput: &txInput,
		createAdminUserWithAccessCalls: &txCalls,
		createAdminUserWithAccessErr:   storeErr,
		createUserInput:                &created,
		upsertMembershipInput:          &membershipInput,
		auditInput:                     &auditInput,
	}))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/users", strings.NewReader(`{"email":"pilot-error@example.test","displayName":"Pilot User","role":"reporter","organisationId":1}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertInternalError(t, rec, storeErr)
	if txCalls != 1 {
		t.Fatalf("expected transactional admin create to be called once, got %d", txCalls)
	}
	if created.Email != "" {
		t.Fatalf("expected standalone CreateUser not to be called, got %#v", created)
	}
	if membershipInput.UserID != 0 {
		t.Fatalf("expected standalone membership upsert not to be called, got %#v", membershipInput)
	}
	if auditInput.EventType != "" {
		t.Fatalf("expected standalone audit insert not to be called, got %#v", auditInput)
	}
	if strings.Contains(rec.Body.String(), "temporaryPassword") {
		t.Fatalf("expected error response not to return temporary password, got %s", rec.Body.String())
	}
	if txInput.User.PasswordHash != nil && strings.Contains(rec.Body.String(), *txInput.User.PasswordHash) {
		t.Fatalf("response leaked password hash")
	}
}

func TestAdminCreateUserRejectsDistrictManagerWithoutDistrictBeforeCreateUser(t *testing.T) {
	orgID := int64(1)
	var created store.CreateUserInput
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{createUserInput: &created}))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/users", strings.NewReader(`{"email":"dm@example.test","displayName":"District Manager","role":"district_manager","organisationId":1}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected validation error, got %d with body %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"validation_error"`) {
		t.Fatalf("expected validation_error response, got %s", rec.Body.String())
	}
	if created.Email != "" {
		t.Fatalf("expected CreateUser not to be called, got %#v", created)
	}
}

func TestAdminCreateUserRejectsOrgScopedRolesWithDistrictBeforeCreateUser(t *testing.T) {
	tests := []struct {
		name string
		role string
	}{
		{name: "reporter", role: "reporter"},
		{name: "org admin", role: "org_admin"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			orgID := int64(1)
			var created store.CreateUserInput
			router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{createUserInput: &created}))
			body := `{"email":"scoped@example.test","displayName":"Scoped User","role":"` + tt.role + `","organisationId":1,"district":"Tshwane"}`
			req := newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/users", strings.NewReader(body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected validation error, got %d with body %s", rec.Code, rec.Body.String())
			}
			if !strings.Contains(rec.Body.String(), `"code":"validation_error"`) {
				t.Fatalf("expected validation_error response, got %s", rec.Body.String())
			}
			if created.Email != "" {
				t.Fatalf("expected CreateUser not to be called, got %#v", created)
			}
		})
	}
}

func TestAdminCanRevokeManagedUserSessions(t *testing.T) {
	orgID := int64(1)
	revokedUserID := int64(0)
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		adminUserAccess:       store.AdminUserAccessRow{UserID: 42, Role: "reporter", OrganisationID: &orgID},
		revokedSessionsUserID: &revokedUserID,
	}))
	req := httptest.NewRequest(http.MethodPost, "/v1/admin/users/42/sessions/revoke", strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", "http://localhost:3000")
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: sessionTokenForTest(t)})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected ok, got %d with body %s", rec.Code, rec.Body.String())
	}
	if revokedUserID != 42 {
		t.Fatalf("expected revoked sessions for user 42, got %d", revokedUserID)
	}
}

func TestAdminCanUpdateManagedUserLifecycle(t *testing.T) {
	orgID := int64(1)
	var lifecycleInput store.UpdateUserLifecycleInput
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		adminUserAccess:          store.AdminUserAccessRow{UserID: 42, Role: "reporter", OrganisationID: &orgID},
		updateUserLifecycleInput: &lifecycleInput,
	}))
	req := newAuthenticatedRequest(t, http.MethodPatch, "/v1/admin/users/42", strings.NewReader(`{"displayName":" Pilot Lead ","disabled":true}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected ok, got %d with body %s", rec.Code, rec.Body.String())
	}
	if lifecycleInput.UserID != 42 {
		t.Fatalf("expected lifecycle update for user 42, got %#v", lifecycleInput)
	}
	if lifecycleInput.DisplayName == nil || *lifecycleInput.DisplayName != "Pilot Lead" {
		t.Fatalf("expected trimmed display name, got %#v", lifecycleInput.DisplayName)
	}
	if lifecycleInput.Disabled == nil || !*lifecycleInput.Disabled {
		t.Fatalf("expected disabled=true, got %#v", lifecycleInput.Disabled)
	}
}

func TestAdminCanUpdateManagedUserAccess(t *testing.T) {
	orgID := int64(1)
	district := "Tshwane"
	var membershipInput store.UpsertMembershipInput
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		adminUserAccess:       store.AdminUserAccessRow{UserID: 42, Role: "reporter", OrganisationID: &orgID},
		upsertMembershipInput: &membershipInput,
	}))
	req := newAuthenticatedRequest(t, http.MethodPut, "/v1/admin/users/42/access", strings.NewReader(`{"role":"district_manager","organisationId":1,"district":" Tshwane "}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected ok, got %d with body %s", rec.Code, rec.Body.String())
	}
	if membershipInput.UserID != 42 || membershipInput.Role != "district_manager" {
		t.Fatalf("unexpected membership input: %#v", membershipInput)
	}
	if membershipInput.OrganisationID == nil || *membershipInput.OrganisationID != orgID {
		t.Fatalf("expected membership org %d, got %#v", orgID, membershipInput.OrganisationID)
	}
	if membershipInput.District == nil || *membershipInput.District != district {
		t.Fatalf("expected district %q, got %#v", district, membershipInput.District)
	}
}

func TestAdminUpdateUserAccessRejectsInvalidRoleScopeBeforeMembershipUpsert(t *testing.T) {
	orgID := int64(1)
	tests := []struct {
		name string
		body string
	}{
		{
			name: "district manager without district",
			body: `{"role":"district_manager","organisationId":1}`,
		},
		{
			name: "reporter with district",
			body: `{"role":"reporter","organisationId":1,"district":"Tshwane"}`,
		},
		{
			name: "org admin with district",
			body: `{"role":"org_admin","organisationId":1,"district":"Tshwane"}`,
		},
		{
			name: "system admin with organisation",
			body: `{"role":"system_admin","organisationId":1}`,
		},
		{
			name: "system admin with district",
			body: `{"role":"system_admin","district":"Tshwane"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var membershipInput store.UpsertMembershipInput
			router := apihttp.NewRouter(authenticatedAdminStore(t, "system_admin", orgID, fakeStore{
				adminUserAccess:       store.AdminUserAccessRow{UserID: 42, Role: "reporter", OrganisationID: &orgID},
				upsertMembershipInput: &membershipInput,
			}))
			req := newAuthenticatedRequest(t, http.MethodPut, "/v1/admin/users/42/access", strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected validation error, got %d with body %s", rec.Code, rec.Body.String())
			}
			if !strings.Contains(rec.Body.String(), `"code":"validation_error"`) {
				t.Fatalf("expected validation_error response, got %s", rec.Body.String())
			}
			if membershipInput.UserID != 0 {
				t.Fatalf("expected membership not to be upserted, got %#v", membershipInput)
			}
		})
	}
}

func TestOrgAdminCannotRevokeSystemAdminSessions(t *testing.T) {
	orgID := int64(1)
	revokedUserID := int64(0)
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		adminUserAccess:       store.AdminUserAccessRow{UserID: 42, Role: "system_admin"},
		revokedSessionsUserID: &revokedUserID,
	}))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/users/42/sessions/revoke", strings.NewReader(`{}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected forbidden, got %d with body %s", rec.Code, rec.Body.String())
	}
	if revokedUserID != 0 {
		t.Fatalf("expected no sessions revoked, got user ID %d", revokedUserID)
	}
}

func TestOrgAdminCannotMoveUserOutsideOrganisation(t *testing.T) {
	actorOrgID := int64(1)
	otherOrgID := int64(2)
	var membershipInput store.UpsertMembershipInput
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", actorOrgID, fakeStore{
		adminUserAccess:       store.AdminUserAccessRow{UserID: 42, Role: "reporter", OrganisationID: &otherOrgID},
		upsertMembershipInput: &membershipInput,
	}))
	req := newAuthenticatedRequest(t, http.MethodPut, "/v1/admin/users/42/access", strings.NewReader(`{"role":"reporter","organisationId":2}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected forbidden, got %d with body %s", rec.Code, rec.Body.String())
	}
	if membershipInput.UserID != 0 {
		t.Fatalf("expected membership not to be upserted, got %#v", membershipInput)
	}
}

func TestAdminAuditEventsReturnsRecentEvents(t *testing.T) {
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	router := apihttp.NewRouter(authenticatedAdminStore(t, "system_admin", 77, fakeStore{
		adminAuditEvents: []store.AdminAuditEventRow{{
			ID:        20,
			EventType: "report.reviewed",
			Summary:   "Report accepted",
			CreatedAt: now,
			Metadata:  map[string]any{},
		}},
	}))
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/audit-events", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"eventType":"report.reviewed"`) {
		t.Fatalf("expected response to include admin audit event, got %s", rec.Body.String())
	}
}

func TestAdminAuditEventsUsesLimit(t *testing.T) {
	gotLimit := 0
	router := apihttp.NewRouter(authenticatedAdminStore(t, "system_admin", 77, fakeStore{
		listAdminAuditEventsLimit: &gotLimit,
	}))
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/audit-events", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if gotLimit != 100 {
		t.Fatalf("expected admin audit events limit 100, got %d", gotLimit)
	}
}

func TestAdminAuditEventsScopesOrganisationAdmins(t *testing.T) {
	orgID := int64(77)
	var gotOrgID *int64
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		listAdminAuditEventsOrgID: &gotOrgID,
	}))
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/audit-events", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if gotOrgID == nil || *gotOrgID != orgID {
		t.Fatalf("expected admin audit events scoped to org %d, got %#v", orgID, gotOrgID)
	}
}

func TestAdminAuditEventsUsesGlobalScopeForSystemAdmins(t *testing.T) {
	orgID := int64(77)
	sentinelOrgID := int64(-1)
	gotOrgID := &sentinelOrgID
	router := apihttp.NewRouter(authenticatedAdminStore(t, "system_admin", orgID, fakeStore{
		listAdminAuditEventsOrgID: &gotOrgID,
	}))
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/audit-events", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if gotOrgID != nil {
		t.Fatalf("expected system admin audit events to use global scope, got %#v", gotOrgID)
	}
}

func TestAdminIngestionRunsListsRuns(t *testing.T) {
	now := time.Date(2026, 5, 16, 8, 0, 0, 0, time.UTC)
	completedAt := now.Add(3 * time.Second)
	actorID := int64(42)
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", 77, fakeStore{
		pilotIngestionRuns: []store.PilotIngestionRun{{
			ID:               "ingest-001",
			OrganisationID:   77,
			SourceName:       "pilot CSV import",
			SourceReference:  "district-upload.csv",
			Status:           "partial",
			RecordsReceived:  20,
			RecordsImported:  18,
			RecordsRejected:  2,
			ValidationErrors: []string{"clinic code missing", "district invalid"},
			ActorUserID:      &actorID,
			StartedAt:        now,
			CompletedAt:      &completedAt,
		}},
	}))
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/ingestion/runs", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	body := rec.Body.String()
	for _, want := range []string{
		`"runs"`,
		`"id":"ingest-001"`,
		`"sourceName":"pilot CSV import"`,
		`"sourceReference":"district-upload.csv"`,
		`"validationErrorCount":2`,
	} {
		if !strings.Contains(body, want) {
			t.Fatalf("expected ingestion run response to contain %s, got %s", want, body)
		}
	}
	if strings.Contains(body, "clinic code missing") {
		t.Fatalf("expected response to expose validation error count without raw validation details, got %s", body)
	}
}

func TestAdminIngestionRunsScopesOrganisationAdmins(t *testing.T) {
	orgID := int64(77)
	var gotOrgID *int64
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		listPilotIngestionRunsOrgID: &gotOrgID,
	}))
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/ingestion/runs", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if gotOrgID == nil || *gotOrgID != orgID {
		t.Fatalf("expected org admin ingestion runs scoped to org %d, got %#v", orgID, gotOrgID)
	}
}

func TestAdminIngestionRunsUsesGlobalScopeForSystemAdmins(t *testing.T) {
	orgID := int64(77)
	sentinelOrgID := int64(-1)
	gotOrgID := &sentinelOrgID
	router := apihttp.NewRouter(authenticatedAdminStore(t, "system_admin", orgID, fakeStore{
		listPilotIngestionRunsOrgID: &gotOrgID,
	}))
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/ingestion/runs", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if gotOrgID != nil {
		t.Fatalf("expected system admin ingestion runs to use global scope, got %#v", gotOrgID)
	}
}

func TestAdminAuditEventsStoreErrorsUseInternalError(t *testing.T) {
	storeErr := errors.New("database password leaked")
	router := apihttp.NewRouter(authenticatedAdminStore(t, "system_admin", 77, fakeStore{
		adminAuditEventsErr: storeErr,
	}))
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/audit-events", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertInternalError(t, rec, storeErr)
}

func TestAdminPartnerReadinessRecomputesChecksBeforeReturningSnapshot(t *testing.T) {
	orgID := int64(77)
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	upsertInputs := []store.UpsertIntegrationStatusCheckInput{}
	upsertedChecks := []store.IntegrationStatusCheck{}
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		partnerReadinessSnapshot: store.PartnerReadinessSnapshot{
			APIKeys: []store.PartnerAPIKey{{
				ID:             1,
				OrganisationID: &orgID,
				Name:           "Demo partner",
				Environment:    "demo",
				KeyPrefix:      "cp_demo_abcd1234",
				Scopes:         []string{"status:read", "exports:read"},
				CreatedAt:      now,
				UpdatedAt:      now,
			}},
			ExportRuns: []store.PartnerExportRun{{
				ID:             1,
				OrganisationID: &orgID,
				Format:         "json",
				Scope:          map[string]any{"district": defaultTestDistrict},
				Checksum:       "sha256:export",
				CreatedAt:      now,
			}},
			WebhookEvents: []store.PartnerWebhookEvent{{
				ID:             1,
				SubscriptionID: 1,
				EventType:      "clinicpulse.webhook_test",
				Status:         "preview_only",
				CreatedAt:      now,
			}},
		},
		currentStatuses: []store.CurrentStatus{{
			ClinicID:  "clinic-1",
			Status:    "operational",
			Freshness: "fresh",
			UpdatedAt: now,
		}},
		syncSummary:                        &store.SyncSummary{OfflineReportsReceived: 1},
		upsertIntegrationStatusCheckInputs: &upsertInputs,
		upsertIntegrationStatusChecks:      &upsertedChecks,
	}), apihttp.WithAPIKeyPepper("test-pepper"))
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/partner-readiness", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if len(upsertInputs) != 6 {
		t.Fatalf("expected readiness read to upsert 6 checks, got %#v", upsertInputs)
	}
	if !strings.Contains(rec.Body.String(), `"integrationChecks":[`) || !strings.Contains(rec.Body.String(), `"checkName":"api_key_active"`) {
		t.Fatalf("expected readiness response to include recomputed checks, got %s", rec.Body.String())
	}
	for _, input := range upsertInputs {
		if input.OrganisationID == nil || *input.OrganisationID != orgID {
			t.Fatalf("expected upserted checks scoped to org %d, got %#v", orgID, input)
		}
	}
}

func TestAdminPartnerReadinessRequiresUsefulPartnerAPIScopes(t *testing.T) {
	orgID := int64(77)
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	upsertInputs := []store.UpsertIntegrationStatusCheckInput{}
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		partnerReadinessSnapshot: store.PartnerReadinessSnapshot{
			APIKeys: []store.PartnerAPIKey{{
				ID:          1,
				Name:        "Incomplete partner key",
				Environment: "demo",
				KeyPrefix:   "cp_demo_incomplete",
				Scopes:      []string{"clinics:read"},
				CreatedAt:   now,
				UpdatedAt:   now,
			}},
			ExportRuns: []store.PartnerExportRun{{
				ID:        1,
				Format:    "json",
				Scope:     map[string]any{"district": defaultTestDistrict},
				Checksum:  "sha256:export",
				CreatedAt: now,
			}},
			WebhookEvents: []store.PartnerWebhookEvent{{
				ID:             1,
				SubscriptionID: 1,
				EventType:      "clinicpulse.webhook_test",
				Status:         "preview_only",
				CreatedAt:      now,
			}},
		},
		currentStatuses:                    []store.CurrentStatus{{ClinicID: "clinic-1", Status: "operational", Freshness: "fresh", UpdatedAt: now}},
		syncSummary:                        &store.SyncSummary{OfflineReportsReceived: 1},
		upsertIntegrationStatusCheckInputs: &upsertInputs,
	}))
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/partner-readiness", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	for _, input := range upsertInputs {
		if input.CheckName == "api_key_active" {
			if input.Status != "attention" {
				t.Fatalf("expected incomplete API key scopes to require attention, got %#v", input)
			}
			return
		}
	}
	t.Fatalf("expected api_key_active check to be recomputed, got %#v", upsertInputs)
}

func TestAdminPartnerWebhookCreateListAndTestDoesNotExposeSecret(t *testing.T) {
	orgID := int64(77)
	subscriptions := []store.PartnerWebhookSubscription{}
	events := []store.PartnerWebhookEvent{}
	var createInput store.CreatePartnerWebhookSubscriptionInput
	var eventInput store.CreatePartnerWebhookEventInput
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		partnerWebhookSubscriptions:           &subscriptions,
		partnerWebhookEvents:                  &events,
		createPartnerWebhookSubscriptionInput: &createInput,
		createPartnerWebhookEventInput:        &eventInput,
		listPartnerWebhookSubscriptionsOrgID:  new(int64),
		listPartnerWebhookEventsOrgID:         new(int64),
	}))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/webhooks", strings.NewReader(`{
		"name":"Status webhook",
		"targetUrl":"https://partner.example.test/webhooks/clinicpulse",
		"eventTypes":["clinic.status_changed"]
	}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusCreated, rec.Code, rec.Body.String())
	}
	var created struct {
		Subscription store.PartnerWebhookSubscription `json:"subscription"`
		Secret       string                           `json:"secret"`
	}
	decodeJSON(t, rec, &created)
	if created.Secret == "" || !strings.HasPrefix(created.Secret, "cp_whsec_") {
		t.Fatalf("expected one-time webhook secret, got %#v", created)
	}
	if createInput.SecretHash == "" || createInput.SecretHash == created.Secret {
		t.Fatalf("expected webhook secret hash to be stored without the raw secret, got %#v", createInput)
	}
	if strings.Contains(rec.Body.String(), "secretHash") {
		t.Fatalf("expected create response not to expose secret hash, got %s", rec.Body.String())
	}

	req = newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/webhooks", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if strings.Contains(rec.Body.String(), created.Secret) || strings.Contains(rec.Body.String(), `"secret"`) || strings.Contains(rec.Body.String(), "secretHash") {
		t.Fatalf("expected webhook list not to expose secrets, got %s", rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"subscriptions"`) || !strings.Contains(rec.Body.String(), `"events"`) {
		t.Fatalf("expected webhook list response shape, got %s", rec.Body.String())
	}

	req = newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/webhooks/1/test", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusCreated, rec.Code, rec.Body.String())
	}
	if eventInput.SubscriptionID != 1 || eventInput.Status != "preview_only" || eventInput.EventType != "clinicpulse.webhook_test" {
		t.Fatalf("unexpected webhook test event input: %#v", eventInput)
	}
	if strings.Contains(rec.Body.String(), created.Secret) || strings.Contains(rec.Body.String(), `"secret"`) {
		t.Fatalf("expected webhook test response not to expose secret, got %s", rec.Body.String())
	}
}

func TestAdminPartnerWebhookRejectsUnsafeTargetURLs(t *testing.T) {
	orgID := int64(77)
	tests := []struct {
		name      string
		targetURL string
	}{
		{name: "http URL", targetURL: "http://partner.example.test/webhooks/clinicpulse"},
		{name: "localhost URL", targetURL: "https://localhost/webhooks/clinicpulse"},
		{name: "private IP URL", targetURL: "https://10.0.0.5/webhooks/clinicpulse"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var createInput store.CreatePartnerWebhookSubscriptionInput
			router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
				createPartnerWebhookSubscriptionInput: &createInput,
			}))
			req := newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/webhooks", strings.NewReader(`{
				"name":"Status webhook",
				"targetUrl":"`+tt.targetURL+`",
				"eventTypes":["clinic.status_changed"]
			}`))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
			}
			if createInput.TargetURL != "" {
				t.Fatalf("expected unsafe webhook target not to be persisted, got %#v", createInput)
			}
		})
	}
}

func TestAdminPartnerWebhookTestDeliveryEnabledIsExplicitlyNotImplemented(t *testing.T) {
	orgID := int64(77)
	secretHash := "stored-webhook-secret-hash"
	metrics := observability.NewRegistry()
	subscriptions := []store.PartnerWebhookSubscription{{
		ID:             5,
		OrganisationID: &orgID,
		Name:           "Status webhook",
		TargetURL:      "https://partner.example.test/webhooks/clinicpulse",
		EventTypes:     []string{"clinic.status_changed"},
		SecretHash:     secretHash,
		Status:         "active",
	}}
	events := []store.PartnerWebhookEvent{}
	var eventInput store.CreatePartnerWebhookEventInput
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		partnerWebhookSubscriptions:    &subscriptions,
		partnerWebhookEvents:           &events,
		createPartnerWebhookEventInput: &eventInput,
	}), apihttp.WithWebhookDeliveryEnabled(true), apihttp.WithObservability(observability.NewJSONLogger(io.Discard, nil), metrics))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/webhooks/5/test", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotImplemented {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNotImplemented, rec.Code, rec.Body.String())
	}
	if len(events) != 1 {
		t.Fatalf("expected failed webhook delivery evidence, got %#v", events)
	}
	if eventInput.SubscriptionID != 5 || eventInput.Status != "failed" || eventInput.AttemptCount != 1 || eventInput.EventType != "clinicpulse.webhook_test" {
		t.Fatalf("unexpected webhook failure event input: %#v", eventInput)
	}
	if eventInput.LastError == nil || !strings.Contains(*eventInput.LastError, "not implemented") {
		t.Fatalf("expected not implemented failure evidence, got %#v", eventInput.LastError)
	}
	if !strings.Contains(rec.Body.String(), "not_implemented") {
		t.Fatalf("expected explicit not implemented response, got %s", rec.Body.String())
	}
	if strings.Contains(rec.Body.String(), secretHash) || strings.Contains(fmt.Sprint(eventInput.Payload), secretHash) || strings.Contains(fmt.Sprint(eventInput.Metadata), secretHash) {
		t.Fatalf("expected webhook failure evidence not to expose secrets, response=%s input=%#v", rec.Body.String(), eventInput)
	}
	gotMetrics := metrics.RenderPrometheus()
	if !strings.Contains(gotMetrics, `clinicpulse_domain_operations_total{operation="partner.webhook_test",result="failed"} 1`) {
		t.Fatalf("expected webhook test failure operation metric, got:\n%s", gotMetrics)
	}
}

func TestAdminPartnerWebhookTestDisabledSubscriptionDoesNotCreatePreviewEvent(t *testing.T) {
	orgID := int64(77)
	subscriptions := []store.PartnerWebhookSubscription{{
		ID:             5,
		OrganisationID: &orgID,
		Name:           "Status webhook",
		TargetURL:      "https://partner.example.test/webhooks/clinicpulse",
		EventTypes:     []string{"clinic.status_changed"},
		Status:         "disabled",
	}}
	events := []store.PartnerWebhookEvent{}
	createEventCalls := 0
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		partnerWebhookSubscriptions:    &subscriptions,
		partnerWebhookEvents:           &events,
		createPartnerWebhookEventCalls: &createEventCalls,
	}))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/webhooks/5/test", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusConflict {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusConflict, rec.Code, rec.Body.String())
	}
	if createEventCalls != 0 || len(events) != 0 {
		t.Fatalf("expected no webhook test event to be created, got calls=%d events=%#v", createEventCalls, events)
	}
	if !strings.Contains(rec.Body.String(), `"code":"conflict"`) || !strings.Contains(rec.Body.String(), "disabled") {
		t.Fatalf("expected conflict response mentioning disabled subscription, got %s", rec.Body.String())
	}
}

func TestAdminPartnerExportCreateAndGetUsesPayloadAndScopedStore(t *testing.T) {
	orgID := int64(77)
	exports := []store.PartnerExportRun{}
	var createInput store.CreatePartnerExportRunInput
	var getOrgID int64
	var getExportID int64
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		clinics: []store.ClinicDetail{{
			Clinic: store.Clinic{
				ID:       "clinic-1",
				Name:     "Central Clinic",
				District: defaultTestDistrict,
			},
			CurrentStatus: &store.CurrentStatus{
				ClinicID:  "clinic-1",
				Status:    "operational",
				Freshness: "fresh",
				UpdatedAt: now,
			},
		}},
		integrationStatusChecks: []store.IntegrationStatusCheck{{
			CheckName: "api_key_rotation",
			Status:    "passing",
			Summary:   "Keys are rotated",
			CheckedAt: now,
		}},
		partnerExportRuns:           &exports,
		createPartnerExportRunInput: &createInput,
		getPartnerExportRunOrgID:    &getOrgID,
		getPartnerExportRunID:       &getExportID,
	}))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/exports", strings.NewReader(`{
		"format":"json",
		"scope":{"district":"Tshwane North Demo District"}
	}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusCreated, rec.Code, rec.Body.String())
	}
	if createInput.OrganisationID == nil || *createInput.OrganisationID != orgID {
		t.Fatalf("expected export run scoped to org %d, got %#v", orgID, createInput.OrganisationID)
	}
	if createInput.Payload == nil || createInput.Checksum == "" || createInput.RecordCounts["clinics"] != 1 {
		t.Fatalf("expected backend export payload, checksum, and counts, got %#v", createInput)
	}
	if strings.Contains(rec.Body.String(), "reporterName") {
		t.Fatalf("expected export response payload to be partner-safe, got %s", rec.Body.String())
	}

	req = newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/exports/1", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if getOrgID != orgID || getExportID != 1 {
		t.Fatalf("expected scoped export lookup org=%d id=1, got org=%d id=%d", orgID, getOrgID, getExportID)
	}
	if !strings.Contains(rec.Body.String(), `"payload"`) || !strings.Contains(rec.Body.String(), `"checksum"`) {
		t.Fatalf("expected export lookup to return stored run, got %s", rec.Body.String())
	}
}

func TestDistrictManagerCannotReadOrMutatePartnerResources(t *testing.T) {
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	router := newAuthenticatedTestRouter(t, fakeStore{
		partnerReadinessSnapshot: store.PartnerReadinessSnapshot{
			IntegrationChecks: []store.IntegrationStatusCheck{{
				CheckName: "readiness",
				Status:    "passing",
				Summary:   "Ready",
				CheckedAt: now,
			}},
		},
	})
	readReq := newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/partner-readiness", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, readReq)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected district manager readiness status %d, got %d with body %s", http.StatusForbidden, rec.Code, rec.Body.String())
	}

	tests := []struct {
		method string
		path   string
		body   string
	}{
		{method: http.MethodPost, path: "/v1/admin/api-keys", body: `{"name":"Demo","environment":"demo"}`},
		{method: http.MethodGet, path: "/v1/admin/api-keys"},
		{method: http.MethodPost, path: "/v1/admin/webhooks", body: `{"name":"Webhook","targetUrl":"https://example.test","eventTypes":[]}`},
		{method: http.MethodGet, path: "/v1/admin/webhooks"},
		{method: http.MethodPost, path: "/v1/admin/exports", body: `{"format":"json","scope":{}}`},
		{method: http.MethodGet, path: "/v1/admin/exports/1"},
	}
	for _, tt := range tests {
		req := newAuthenticatedRequest(t, tt.method, tt.path, strings.NewReader(tt.body))
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		if rec.Code != http.StatusForbidden {
			t.Fatalf("%s %s: expected status %d, got %d with body %s", tt.method, tt.path, http.StatusForbidden, rec.Code, rec.Body.String())
		}
	}
}

func TestAdminPartnerInvalidIDsAndBodiesReturnExpectedStatus(t *testing.T) {
	orgID := int64(77)
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{
		getPartnerExportRunErr: pgx.ErrNoRows,
	}))

	tests := []struct {
		name   string
		method string
		path   string
		body   string
		want   int
	}{
		{name: "invalid api key json", method: http.MethodPost, path: "/v1/admin/api-keys", body: `{"name":`, want: http.StatusBadRequest},
		{name: "invalid api key environment", method: http.MethodPost, path: "/v1/admin/api-keys", body: `{"name":"Demo","environment":"sandbox"}`, want: http.StatusBadRequest},
		{name: "invalid webhook json", method: http.MethodPost, path: "/v1/admin/webhooks", body: `{"name":`, want: http.StatusBadRequest},
		{name: "invalid export format", method: http.MethodPost, path: "/v1/admin/exports", body: `{"format":"xml","scope":{}}`, want: http.StatusBadRequest},
		{name: "invalid revoke id", method: http.MethodPost, path: "/v1/admin/api-keys/not-a-number/revoke", want: http.StatusNotFound},
		{name: "invalid webhook test id", method: http.MethodPost, path: "/v1/admin/webhooks/not-a-number/test", want: http.StatusNotFound},
		{name: "invalid export id", method: http.MethodGet, path: "/v1/admin/exports/not-a-number", want: http.StatusNotFound},
		{name: "missing export", method: http.MethodGet, path: "/v1/admin/exports/404", want: http.StatusNotFound},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := newAuthenticatedRequest(t, tt.method, tt.path, strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != tt.want {
				t.Fatalf("expected status %d, got %d with body %s", tt.want, rec.Code, rec.Body.String())
			}
		})
	}
}

func TestAdminPartnerInvalidIDsIncludeRequestIDAndValidationMetric(t *testing.T) {
	orgID := int64(77)
	metrics := observability.NewRegistry()
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", orgID, fakeStore{}),
		apihttp.WithObservability(observability.NewJSONLogger(io.Discard, nil), metrics),
	)

	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/webhooks/not-a-number/test", nil)
	req.Header.Set("X-Request-Id", "invalid-id-request-123")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNotFound, rec.Code, rec.Body.String())
	}
	var got struct {
		Error struct {
			Code      string `json:"code"`
			RequestID string `json:"requestId"`
		} `json:"error"`
	}
	decodeJSON(t, rec, &got)
	if got.Error.Code != "not_found" || got.Error.RequestID != "invalid-id-request-123" {
		t.Fatalf("expected not_found with requestId, got %#v", got)
	}
	gotMetrics := metrics.RenderPrometheus()
	if !strings.Contains(gotMetrics, `clinicpulse_http_errors_total{error_kind="validation"} 1`) {
		t.Fatalf("expected validation error metric for invalid id, got:\n%s", gotMetrics)
	}
}

func TestPartnerAlternativesFiltersCandidatesToAllowedDistricts(t *testing.T) {
	secret, _, err := auth.GenerateAPIKey("demo")
	if err != nil {
		t.Fatalf("GenerateAPIKey returned error: %v", err)
	}
	hash, err := auth.HashAPIKey(secret, "")
	if err != nil {
		t.Fatalf("HashAPIKey returned error: %v", err)
	}
	source := clinicDetail("clinic-source", "Source Clinic", -25.7400, 28.1300, "non_functional", "fresh", "Primary care")
	inScope := clinicDetail("clinic-in-scope", "In Scope Clinic", -25.7410, 28.1310, "operational", "fresh", "Primary care")
	outOfScope := clinicDetail("clinic-out-of-scope", "Out Of Scope Clinic", -25.7420, 28.1320, "operational", "fresh", "Primary care")
	outOfScope.Clinic.District = "Johannesburg"
	router := apihttp.NewRouter(fakeStore{
		partnerAPIKey: validPartnerAPIKey(hash, []string{"alternatives:read"}, []string{defaultTestDistrict}),
		clinic:        source,
		clinics:       []store.ClinicDetail{source, inScope, outOfScope},
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/partner/alternatives?clinicId=clinic-source&service=Primary%20care", nil)
	req.Header.Set("Authorization", "Bearer "+secret)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	assertPublicSafeResponse(t, rec.Body.String())
	if !strings.Contains(rec.Body.String(), `"id":"clinic-in-scope"`) {
		t.Fatalf("expected in-scope alternative, got %s", rec.Body.String())
	}
	if strings.Contains(rec.Body.String(), "clinic-out-of-scope") {
		t.Fatalf("expected out-of-scope candidate to be filtered, got %s", rec.Body.String())
	}
}

func TestRestrictedClinicRoutesStillRequireCookie(t *testing.T) {
	router := apihttp.NewRouter(fakeStore{})
	for _, path := range []string{
		"/v1/clinics",
		"/v1/clinics/clinic-1",
		"/v1/clinics/clinic-1/status",
		"/v1/clinics/clinic-1/reports",
		"/v1/clinics/clinic-1/audit-events",
		"/v1/alternatives?clinicId=clinic-1&service=Primary%20care",
	} {
		t.Run(path, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, path, nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			assertGenericUnauthorized(t, rec)
		})
	}
}

func TestUnexpectedStoreErrorsReturnInternalError(t *testing.T) {
	storeErr := errors.New("database password leaked")
	tests := []struct {
		name  string
		path  string
		store fakeStore
	}{
		{
			name:  "get clinic",
			path:  "/v1/clinics/clinic-1",
			store: fakeStore{getClinicErr: storeErr},
		},
		{
			name:  "get clinic status",
			path:  "/v1/clinics/clinic-1/status",
			store: fakeStore{statusErr: storeErr},
		},
		{
			name:  "list reports preflight",
			path:  "/v1/clinics/clinic-1/reports",
			store: fakeStore{getClinicErr: storeErr},
		},
		{
			name:  "list reports",
			path:  "/v1/clinics/clinic-1/reports",
			store: fakeStore{reportsErr: storeErr},
		},
		{
			name:  "list audit events preflight",
			path:  "/v1/clinics/clinic-1/audit-events",
			store: fakeStore{getClinicErr: storeErr},
		},
		{
			name:  "list audit events",
			path:  "/v1/clinics/clinic-1/audit-events",
			store: fakeStore{auditEventsErr: storeErr},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := newAuthenticatedTestRouter(t, tt.store)
			req := newAuthenticatedRequest(t, http.MethodGet, tt.path, nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			assertInternalError(t, rec, storeErr)
		})
	}
}

func TestStoreBackedErrorsLogStructuredHTTPErrorFields(t *testing.T) {
	storeErr := errors.New("database password leaked")
	tests := []struct {
		name             string
		storeErr         error
		wantStatus       int
		wantResponseCode string
		wantLogCode      string
	}{
		{
			name:             "not found",
			storeErr:         pgx.ErrNoRows,
			wantStatus:       http.StatusNotFound,
			wantResponseCode: "not_found",
			wantLogCode:      "not_found",
		},
		{
			name:             "store error",
			storeErr:         storeErr,
			wantStatus:       http.StatusInternalServerError,
			wantResponseCode: "internal_error",
			wantLogCode:      "store_error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var logOutput bytes.Buffer
			router := apihttp.NewRouter(
				authenticatedStore(t, "district_manager", fakeStore{getClinicErr: tt.storeErr}),
				apihttp.WithObservability(observability.NewJSONLogger(&logOutput, nil), observability.NewRegistry()),
			)
			req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics/clinic-1", nil)
			req.Header.Set("X-Request-Id", "store-structured-123")
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != tt.wantStatus {
				t.Fatalf("expected status %d, got %d with body %s", tt.wantStatus, rec.Code, rec.Body.String())
			}
			if !strings.Contains(rec.Body.String(), `"code":"`+tt.wantResponseCode+`"`) {
				t.Fatalf("expected response code %q, got %q", tt.wantResponseCode, rec.Body.String())
			}
			logLine := decodeFirstLogLine(t, &logOutput)
			assertLogField(t, logLine, "event", "http_request_error")
			assertLogField(t, logLine, "component", "store")
			assertLogField(t, logLine, "error_kind", "store")
			assertLogField(t, logLine, "error_code", tt.wantLogCode)
			assertLogField(t, logLine, "request_id", "store-structured-123")
			assertLogField(t, logLine, "route", "/v1/clinics/{clinicId}")
			assertLogField(t, logLine, "status", float64(tt.wantStatus))
			if strings.Contains(logOutput.String(), storeErr.Error()) {
				t.Fatalf("expected structured store error log not to contain raw store error, got %q", logOutput.String())
			}
		})
	}
}

func TestStoreErrorRecordsHTTPErrorMetricAndRequestID(t *testing.T) {
	metrics := observability.NewRegistry()
	storeErr := errors.New("database password leaked")
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", 77, fakeStore{
		createPartnerExportRunErr: storeErr,
	}), apihttp.WithObservability(observability.NewJSONLogger(io.Discard, nil), metrics))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/exports", strings.NewReader(`{"format":"json","scope":{}}`))
	req.Header.Set("X-Request-Id", "support-request-123")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertInternalError(t, rec, storeErr)
	gotMetrics := metrics.RenderPrometheus()
	if !strings.Contains(gotMetrics, `clinicpulse_http_errors_total{error_kind="store"} 1`) {
		t.Fatalf("expected store error metric, got:\n%s", gotMetrics)
	}
	var got struct {
		Error struct {
			RequestID string `json:"requestId"`
		} `json:"error"`
	}
	decodeJSON(t, rec, &got)
	if got.Error.RequestID != "support-request-123" {
		t.Fatalf("expected requestId in error response, got %#v", got)
	}
}

func TestValidationErrorRecordsHTTPErrorMetric(t *testing.T) {
	metrics := observability.NewRegistry()
	router := apihttp.NewRouter(authenticatedAdminStore(t, "reporter", 77, fakeStore{}), apihttp.WithObservability(observability.NewJSONLogger(io.Discard, nil), metrics))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(`{"clinicId":"","status":"limited"}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
	}
	gotMetrics := metrics.RenderPrometheus()
	if !strings.Contains(gotMetrics, `clinicpulse_http_errors_total{error_kind="validation"} 1`) {
		t.Fatalf("expected validation error metric, got:\n%s", gotMetrics)
	}
}

func TestGetClinicReturnsNotFoundForMissingClinic(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{getClinicErr: pgx.ErrNoRows})

	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics/missing-clinic", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNotFound, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"not_found"`) {
		t.Fatalf("expected not_found error code, got %q", rec.Body.String())
	}
}

func TestGetClinicStatusReturnsCurrentStatusJSON(t *testing.T) {
	updatedAt := time.Date(2026, 5, 1, 11, 0, 0, 0, time.UTC)
	reason := "Power outage"
	router := newAuthenticatedTestRouter(t, fakeStore{
		status: store.CurrentStatus{
			ClinicID:  "clinic-1",
			Status:    "limited",
			Reason:    &reason,
			Freshness: "fresh",
			UpdatedAt: updatedAt,
		},
	})

	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics/clinic-1/status", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}

	var got store.CurrentStatus
	decodeJSON(t, rec, &got)
	if got.ClinicID != "clinic-1" || got.Status != "limited" || got.Reason == nil || *got.Reason != reason {
		t.Fatalf("unexpected status response: %#v", got)
	}
}

func TestListClinicReportsReturnsOrderedReportJSON(t *testing.T) {
	firstSubmitted := time.Date(2026, 5, 1, 9, 0, 0, 0, time.UTC)
	secondSubmitted := time.Date(2026, 5, 1, 10, 0, 0, 0, time.UTC)
	router := newAuthenticatedTestRouter(t, fakeStore{
		reports: []store.Report{
			{ID: 10, ClinicID: "clinic-1", Source: "ussd", SubmittedAt: firstSubmitted, ReceivedAt: firstSubmitted, Status: "open", ReviewState: "accepted"},
			{ID: 11, ClinicID: "clinic-1", Source: "web", SubmittedAt: secondSubmitted, ReceivedAt: secondSubmitted, Status: "limited", ReviewState: "accepted"},
		},
	})

	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics/clinic-1/reports", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}

	var got []store.Report
	decodeJSON(t, rec, &got)
	if len(got) != 2 || got[0].ID != 10 || got[1].ID != 11 {
		t.Fatalf("unexpected reports response order: %#v", got)
	}
}

func TestListClinicReportsReturnsNotFoundForUnknownClinic(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{getClinicErr: pgx.ErrNoRows})

	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics/unknown-clinic/reports", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNotFound, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"not_found"`) {
		t.Fatalf("expected not_found error code, got %q", rec.Body.String())
	}
}

func TestClinicOperationalReadsDenyDistrictManagerOutsideDistrict(t *testing.T) {
	managerDistrict := defaultTestDistrict
	clinicDistrict := "Ekurhuleni East District"
	storeErr := errors.New("scoped read should not reach unscoped store list")
	now := time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC)
	memberships := []store.OrganisationMembership{{
		ID:        1,
		UserID:    42,
		Role:      "district_manager",
		District:  &managerDistrict,
		CreatedAt: now,
	}}

	tests := []struct {
		name  string
		path  string
		store fakeStore
	}{
		{
			name: "reports",
			path: "/v1/clinics/clinic-1/reports",
			store: fakeStore{
				clinic:     clinicDetailInDistrict("clinic-1", clinicDistrict),
				reportsErr: storeErr,
			},
		},
		{
			name: "audit events",
			path: "/v1/clinics/clinic-1/audit-events",
			store: fakeStore{
				clinic:         clinicDetailInDistrict("clinic-1", clinicDistrict),
				auditEventsErr: storeErr,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.store.memberships = memberships
			router := apihttp.NewRouter(authenticatedStore(t, "district_manager", tt.store))
			req := newAuthenticatedRequest(t, http.MethodGet, tt.path, nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusForbidden {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusForbidden, rec.Code, rec.Body.String())
			}
			if !strings.Contains(rec.Body.String(), `"code":"forbidden"`) {
				t.Fatalf("expected forbidden error code, got %q", rec.Body.String())
			}
		})
	}
}

func TestListClinicsScopesDistrictManagerToTheirDistrict(t *testing.T) {
	managerDistrict := defaultTestDistrict
	otherDistrict := "Ekurhuleni East District"
	router := apihttp.NewRouter(authenticatedStore(t, "district_manager", fakeStore{
		memberships: []store.OrganisationMembership{{
			ID:        1,
			UserID:    42,
			Role:      "district_manager",
			District:  &managerDistrict,
			CreatedAt: time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC),
		}},
		clinics: []store.ClinicDetail{
			clinicDetailInDistrict("clinic-in-scope", managerDistrict),
			clinicDetailInDistrict("clinic-out-of-scope", otherDistrict),
		},
	}))
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	var got []store.ClinicDetail
	decodeJSON(t, rec, &got)
	if len(got) != 1 || got[0].Clinic.ID != "clinic-in-scope" {
		t.Fatalf("expected only in-scope clinic, got %#v", got)
	}
}

func TestClinicOperationalReadsDenyDistrictManagerOutsideDistrictForDetailStatusAndAlternatives(t *testing.T) {
	managerDistrict := defaultTestDistrict
	clinicDistrict := "Ekurhuleni East District"
	now := time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC)
	memberships := []store.OrganisationMembership{{
		ID:        1,
		UserID:    42,
		Role:      "district_manager",
		District:  &managerDistrict,
		CreatedAt: now,
	}}

	tests := []struct {
		name string
		path string
	}{
		{name: "clinic detail", path: "/v1/clinics/clinic-1"},
		{name: "clinic status", path: "/v1/clinics/clinic-1/status"},
		{name: "alternatives", path: "/v1/alternatives?clinicId=clinic-1&service=Primary%20care"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(authenticatedStore(t, "district_manager", fakeStore{
				memberships: memberships,
				clinic:      clinicDetailInDistrict("clinic-1", clinicDistrict),
				clinics: []store.ClinicDetail{
					clinicDetailInDistrict("clinic-1", clinicDistrict),
					clinicDetailInDistrict("clinic-2", managerDistrict),
				},
			}))
			req := newAuthenticatedRequest(t, http.MethodGet, tt.path, nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusForbidden {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusForbidden, rec.Code, rec.Body.String())
			}
			if !strings.Contains(rec.Body.String(), `"code":"forbidden"`) {
				t.Fatalf("expected forbidden error code, got %q", rec.Body.String())
			}
		})
	}
}

func TestClinicOperationalReadsAllowAdminRolesAcrossDistricts(t *testing.T) {
	clinicDistrict := "Ekurhuleni East District"
	tests := []struct {
		name string
		role string
		path string
	}{
		{name: "org admin reports", role: "org_admin", path: "/v1/clinics/clinic-1/reports"},
		{name: "system admin reports", role: "system_admin", path: "/v1/clinics/clinic-1/reports"},
		{name: "org admin audit events", role: "org_admin", path: "/v1/clinics/clinic-1/audit-events"},
		{name: "system admin audit events", role: "system_admin", path: "/v1/clinics/clinic-1/audit-events"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(authenticatedStore(t, tt.role, fakeStore{
				clinic: clinicDetailInDistrict("clinic-1", clinicDistrict),
			}))
			req := newAuthenticatedRequest(t, http.MethodGet, tt.path, nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
			}
		})
	}
}

func TestClinicOperationalReadsDenyUnknownAndEmptyRoles(t *testing.T) {
	tests := []struct {
		name string
		role string
		path string
	}{
		{name: "empty reports", path: "/v1/clinics/clinic-1/reports"},
		{name: "unknown reports", role: "unknown", path: "/v1/clinics/clinic-1/reports"},
		{name: "empty audit events", path: "/v1/clinics/clinic-1/audit-events"},
		{name: "unknown audit events", role: "unknown", path: "/v1/clinics/clinic-1/audit-events"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(authenticatedStore(t, tt.role, fakeStore{
				clinic: clinicDetailInDistrict("clinic-1", defaultTestDistrict),
			}))
			req := newAuthenticatedRequest(t, http.MethodGet, tt.path, nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusForbidden {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusForbidden, rec.Code, rec.Body.String())
			}
		})
	}
}

func TestListClinicAuditEventsReturnsOrderedAuditEventJSON(t *testing.T) {
	firstCreated := time.Date(2026, 5, 1, 9, 30, 0, 0, time.UTC)
	secondCreated := time.Date(2026, 5, 1, 10, 30, 0, 0, time.UTC)
	actorUserID := int64(42)
	actorRole := "district_manager"
	organisationID := int64(7)
	entityType := "report"
	entityID := "100"
	router := newAuthenticatedTestRouter(t, fakeStore{
		auditEvents: []store.AuditEvent{
			{ID: 20, ClinicID: "clinic-1", EventType: "report.submitted", Summary: "First report", CreatedAt: firstCreated},
			{
				ID:             21,
				ClinicID:       "clinic-1",
				EventType:      "report.reviewed",
				Summary:        "Report accepted.",
				CreatedAt:      secondCreated,
				ActorUserID:    &actorUserID,
				ActorRole:      &actorRole,
				OrganisationID: &organisationID,
				EntityType:     &entityType,
				EntityID:       &entityID,
				Metadata:       map[string]any{"decision": "accepted"},
			},
		},
	})

	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics/clinic-1/audit-events", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}

	var got []store.AuditEvent
	decodeJSON(t, rec, &got)
	if len(got) != 2 || got[0].ID != 20 || got[1].ID != 21 {
		t.Fatalf("unexpected audit event response order: %#v", got)
	}
	if got[1].ActorUserID == nil || *got[1].ActorUserID != actorUserID || got[1].EntityID == nil || *got[1].EntityID != entityID {
		t.Fatalf("expected actor and entity fields in audit response, got %#v", got[1])
	}
	if got[1].Metadata["decision"] != "accepted" {
		t.Fatalf("expected decision metadata in audit response, got %#v", got[1].Metadata)
	}
}

func TestListClinicAuditEventsReturnsNotFoundForUnknownClinic(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{getClinicErr: pgx.ErrNoRows})

	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/clinics/unknown-clinic/audit-events", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNotFound, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"not_found"`) {
		t.Fatalf("expected not_found error code, got %q", rec.Body.String())
	}
}

func TestAlternativesReturnsBadRequestForMissingQueryParams(t *testing.T) {
	tests := []struct {
		name string
		path string
	}{
		{name: "missing clinicId", path: "/v1/alternatives?service=Primary%20care"},
		{name: "missing service", path: "/v1/alternatives?clinicId=clinic-1"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := newAuthenticatedTestRouter(t, fakeStore{})
			req := newAuthenticatedRequest(t, http.MethodGet, tt.path, nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
			}
			if !strings.Contains(rec.Body.String(), `"code":"validation_error"`) {
				t.Fatalf("expected validation_error code, got %q", rec.Body.String())
			}
		})
	}
}

func TestAlternativesReturnsNotFoundForUnknownSourceClinic(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{getClinicErr: pgx.ErrNoRows})
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/alternatives?clinicId=unknown-clinic&service=Primary%20care", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNotFound, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"not_found"`) {
		t.Fatalf("expected not_found error code, got %q", rec.Body.String())
	}
}

func TestAlternativesReturnsRankedAlternatives(t *testing.T) {
	source := clinicDetail("clinic-mamelodi-east", "Mamelodi East Clinic", -25.7400, 28.1300, "non_functional", "fresh", "Primary care")
	router := newAuthenticatedTestRouter(t, fakeStore{
		clinic: source,
		clinics: []store.ClinicDetail{
			source,
			clinicDetail("far-degraded", "Far Degraded Clinic", -25.7600, 28.1600, "degraded", "fresh", "Primary care"),
			clinicDetail("near-operational", "Near Operational Clinic", -25.7410, 28.1310, "operational", "fresh", "Primary care"),
			clinicDetail("wrong-service", "Wrong Service Clinic", -25.7405, 28.1305, "operational", "fresh", "Pharmacy"),
		},
	})
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/alternatives?clinicId=clinic-mamelodi-east&service=Primary%20care", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}

	var got []struct {
		Clinic     store.ClinicDetail `json:"clinic"`
		DistanceKm float64            `json:"distanceKm"`
		RankReason string             `json:"rankReason"`
	}
	decodeJSON(t, rec, &got)

	if len(got) != 2 {
		t.Fatalf("expected 2 alternatives, got %#v", got)
	}
	if got[0].Clinic.Clinic.ID != "near-operational" || got[1].Clinic.Clinic.ID != "far-degraded" {
		t.Fatalf("unexpected alternatives order: %#v", got)
	}
	if got[0].DistanceKm <= 0 {
		t.Fatalf("expected positive distance, got %.3f", got[0].DistanceKm)
	}
	if got[0].RankReason == "" {
		t.Fatalf("expected rank reason in response, got %#v", got[0])
	}
}

func TestAlternativesReturnsInternalErrorForUnexpectedStoreErrors(t *testing.T) {
	storeErr := errors.New("database password leaked")
	tests := []struct {
		name  string
		store fakeStore
	}{
		{name: "get source clinic", store: fakeStore{getClinicErr: storeErr}},
		{name: "list candidates", store: fakeStore{listErr: storeErr}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := newAuthenticatedTestRouter(t, tt.store)
			req := newAuthenticatedRequest(t, http.MethodGet, "/v1/alternatives?clinicId=clinic-1&service=Primary%20care", nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			assertInternalError(t, rec, storeErr)
		})
	}
}

func TestCreateReportReturnsCreatedPendingReportWithoutStatusOrAuditEvent(t *testing.T) {
	reason := "Generator failed"
	staffPressure := "strained"
	stockPressure := "low"
	queuePressure := "moderate"
	submittedAt := time.Date(2026, 5, 2, 9, 15, 0, 0, time.UTC)
	receivedAt := time.Date(2026, 5, 2, 9, 16, 0, 0, time.UTC)
	reporterName := "Amina Nkosi"
	notes := "Using backup generator"
	var createInput store.CreateReportInput
	router := newAuthenticatedTestRouter(t, fakeStore{
		createReport: store.Report{
			ID:             100,
			ClinicID:       "clinic-1",
			Source:         "field_worker",
			SubmittedAt:    submittedAt,
			ReceivedAt:     receivedAt,
			Status:         "degraded",
			Reason:         &reason,
			StaffPressure:  &staffPressure,
			StockPressure:  &stockPressure,
			QueuePressure:  &queuePressure,
			ReviewState:    "pending",
			OfflineCreated: true,
		},
		createInput: &createInput,
	})
	body := `{
		"clinicId":"clinic-1",
		"status":"degraded",
		"staffPressure":"strained",
		"stockPressure":"low",
		"queuePressure":"moderate",
		"reason":"Generator failed",
		"source":"field_worker",
		"reporterName":"Amina Nkosi",
		"notes":"Using backup generator",
		"confidence":86,
		"offlineCreated":true,
		"submittedAt":"2026-05-02T09:15:00Z"
	}`
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(body))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusCreated, rec.Code, rec.Body.String())
	}

	var got struct {
		Report        store.Report         `json:"report"`
		Created       bool                 `json:"created"`
		CurrentStatus *store.CurrentStatus `json:"currentStatus,omitempty"`
		AuditEvent    *store.AuditEvent    `json:"auditEvent,omitempty"`
	}
	decodeJSON(t, rec, &got)
	if got.Report.ID != 100 || got.Report.ReviewState != "pending" || got.CurrentStatus != nil || got.AuditEvent != nil {
		t.Fatalf("unexpected create report response: %#v", got)
	}
	if !got.Created {
		t.Fatalf("expected created=true in create report response, got %#v", got)
	}
	if strings.Contains(rec.Body.String(), "currentStatus") || strings.Contains(rec.Body.String(), "auditEvent") {
		t.Fatalf("expected create response not to claim status or audit event, got %s", rec.Body.String())
	}
	if createInput.ReviewState != "pending" {
		t.Fatalf("expected pending review state in store input, got %q", createInput.ReviewState)
	}
	if createInput.SubmittedAt != submittedAt {
		t.Fatalf("expected submittedAt %s, got %s", submittedAt, createInput.SubmittedAt)
	}
	if !createInput.OfflineCreated {
		t.Fatal("expected offlineCreated to map to store input")
	}
	if createInput.ReporterName == nil || *createInput.ReporterName != reporterName {
		t.Fatalf("expected reporterName %q, got %v", reporterName, createInput.ReporterName)
	}
	if createInput.Notes == nil || *createInput.Notes != notes {
		t.Fatalf("expected notes %q, got %v", notes, createInput.Notes)
	}
	if createInput.ConfidenceScore == nil || *createInput.ConfidenceScore != 0.86 {
		t.Fatalf("expected confidence score 0.86, got %v", createInput.ConfidenceScore)
	}
}

func TestCreateReportExposesExistingPendingDuplicate(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{
		pendingPayloadReport: store.Report{
			ID:          202,
			ClinicID:    "clinic-1",
			Status:      "degraded",
			ReviewState: "pending",
		},
	})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(validReportJSON()))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusCreated, rec.Code, rec.Body.String())
	}

	var got struct {
		Report  store.Report `json:"report"`
		Created bool         `json:"created"`
	}
	decodeJSON(t, rec, &got)
	if got.Report.ID != 202 {
		t.Fatalf("expected existing pending report in response, got %#v", got.Report)
	}
	if got.Created {
		t.Fatalf("expected duplicate response to expose created=false, got %#v", got)
	}
}

func TestCreateReportAssociatesAuthenticatedReporter(t *testing.T) {
	var createInput store.CreateReportInput
	router := newAuthenticatedTestRouter(t, fakeStore{
		createReport: store.Report{ID: 100, ClinicID: "clinic-1", ReviewState: "pending"},
		createInput:  &createInput,
	})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(validReportJSON()))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusCreated, rec.Code, rec.Body.String())
	}
	if createInput.SubmittedByUserID == nil || *createInput.SubmittedByUserID != 42 {
		t.Fatalf("expected submittedByUserId 42, got %v", createInput.SubmittedByUserID)
	}
}

func TestCreateReportDerivesAttributionForAuthenticatedReporter(t *testing.T) {
	for _, spoofedSource := range []string{"demo_control", "seed"} {
		t.Run(spoofedSource, func(t *testing.T) {
			var createInput store.CreateReportInput
			now := time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC)
			router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{
				sessionUser: store.User{
					ID:          42,
					Email:       "real-reporter@example.test",
					DisplayName: "Real Reporter",
					CreatedAt:   now,
					UpdatedAt:   now,
				},
				createReport: store.Report{ID: 100, ClinicID: "clinic-1", ReviewState: "pending"},
				createInput:  &createInput,
			}))
			body := `{
				"clinicId":"clinic-1",
				"status":"operational",
				"staffPressure":"normal",
				"stockPressure":"normal",
				"queuePressure":"low",
				"reason":"Daily facility check",
				"source":"` + spoofedSource + `",
				"reporterName":"Spoofed Manager"
			}`
			req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusCreated {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusCreated, rec.Code, rec.Body.String())
			}
			if createInput.Source != "field_worker" {
				t.Fatalf("expected reporter source field_worker, got %q", createInput.Source)
			}
			if createInput.ReporterName == nil || *createInput.ReporterName != "Real Reporter" {
				t.Fatalf("expected reporterName from authenticated principal, got %v", createInput.ReporterName)
			}
		})
	}
}

func TestCreateReportWritesSubmissionAuditWithAuthenticatedActor(t *testing.T) {
	var createInput store.CreateReportInput
	router := newAuthenticatedTestRouter(t, fakeStore{
		createReport: store.Report{ID: 100, ClinicID: "clinic-1", ReviewState: "pending"},
		createInput:  &createInput,
	})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(validReportJSON()))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusCreated, rec.Code, rec.Body.String())
	}
	if createInput.AuditEvent == nil {
		t.Fatal("expected submission audit event in store input")
	}
	if createInput.AuditEvent.ActorUserID == nil || *createInput.AuditEvent.ActorUserID != 42 {
		t.Fatalf("expected actor user id 42, got %v", createInput.AuditEvent.ActorUserID)
	}
	if createInput.AuditEvent.ActorRole == nil || *createInput.AuditEvent.ActorRole != "district_manager" {
		t.Fatalf("expected actor role district_manager, got %v", createInput.AuditEvent.ActorRole)
	}
}

func TestCreateReportMapsVisitVerificationEvidence(t *testing.T) {
	var createInput store.CreateReportInput
	router := newAuthenticatedTestRouter(t, fakeStore{
		createReport: store.Report{ID: 100, ClinicID: "clinic-1", ReviewState: "pending"},
		createInput:  &createInput,
	})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(`{
		"clinicId":"clinic-1",
		"status":"operational",
		"staffPressure":"normal",
		"stockPressure":"normal",
		"queuePressure":"low",
		"reason":"Daily facility check",
		"source":"field_worker",
		"visitVerification":{
			"statusLabel":"Location verified",
			"distanceLabel":"18 m",
			"distanceMeters":18,
			"accuracyLabel":"Good GPS accuracy",
			"capturedAt":"2026-05-03T08:29:00Z",
			"coordinateLabel":"25.70694°S 28.22944°E",
			"tone":"clear"
		}
	}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusCreated, rec.Code, rec.Body.String())
	}
	if createInput.VisitVerification["statusLabel"] != "Location verified" || createInput.VisitVerification["distanceLabel"] != "18 m" {
		t.Fatalf("expected visit verification evidence to map into store input, got %#v", createInput.VisitVerification)
	}
}

func TestCreateReportReturnsBadRequestForInvalidJSON(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(`{"clinicId":`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"invalid_json"`) {
		t.Fatalf("expected invalid_json code, got %q", rec.Body.String())
	}
}

func TestCreateReportReturnsBadRequestForTrailingJSON(t *testing.T) {
	tests := []struct {
		name string
		body string
	}{
		{name: "second object", body: validReportJSON() + `{}`},
		{name: "trailing garbage", body: validReportJSON() + `garbage`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			createCalls := 0
			router := newAuthenticatedTestRouter(t, fakeStore{createCalls: &createCalls})
			req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
			}
			if !strings.Contains(rec.Body.String(), `"code":"invalid_json"`) {
				t.Fatalf("expected invalid_json code, got %q", rec.Body.String())
			}
			if createCalls != 0 {
				t.Fatalf("expected trailing JSON not to call store, got %d calls", createCalls)
			}
		})
	}
}

func TestCreateReportReturnsBadRequestForValidationFailures(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(`{
		"clinicId":"",
		"status":"closed",
		"staffPressure":"busy",
		"stockPressure":"empty",
		"queuePressure":"packed",
		"reason":"",
		"source":""
	}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
	}
	for _, message := range []string{
		"clinicId: clinicId is required",
		"status: status must be one of: operational, degraded, non_functional, unknown",
		"staffPressure: staffPressure must be one of: normal, strained, critical, unknown",
		"stockPressure: stockPressure must be one of: normal, low, stockout, unknown",
		"queuePressure: queuePressure must be one of: low, moderate, high, unknown",
		"reason: reason is required",
		"source: source must be one of: field_worker, clinic_coordinator, demo_control, seed",
	} {
		if !strings.Contains(rec.Body.String(), message) {
			t.Fatalf("expected validation message %q in response, got %q", message, rec.Body.String())
		}
	}
}

func TestCreateReportReturnsBadRequestForInvalidConfidence(t *testing.T) {
	tests := []struct {
		name        string
		body        string
		wantMessage string
	}{
		{
			name: "confidence above range",
			body: `{
				"clinicId":"clinic-1",
				"status":"operational",
				"staffPressure":"normal",
				"stockPressure":"normal",
				"queuePressure":"low",
				"reason":"Daily facility check",
				"source":"field_worker",
				"confidence":101
			}`,
			wantMessage: "confidence: confidence must be between 0 and 100",
		},
		{
			name: "confidence score above range",
			body: `{
				"clinicId":"clinic-1",
				"status":"operational",
				"staffPressure":"normal",
				"stockPressure":"normal",
				"queuePressure":"low",
				"reason":"Daily facility check",
				"source":"field_worker",
				"confidenceScore":1.01
			}`,
			wantMessage: "confidenceScore: confidenceScore must be between 0 and 1",
		},
		{
			name: "invalid confidence rejected even with valid confidence score",
			body: `{
				"clinicId":"clinic-1",
				"status":"operational",
				"staffPressure":"normal",
				"stockPressure":"normal",
				"queuePressure":"low",
				"reason":"Daily facility check",
				"source":"field_worker",
				"confidence":-1,
				"confidenceScore":0.8
			}`,
			wantMessage: "confidence: confidence must be between 0 and 100",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			createCalls := 0
			router := newAuthenticatedTestRouter(t, fakeStore{
				createCalls: &createCalls,
				createErr:   errors.New("store should not be called"),
			})
			req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
			}
			if !strings.Contains(rec.Body.String(), tt.wantMessage) {
				t.Fatalf("expected validation message %q in response, got %q", tt.wantMessage, rec.Body.String())
			}
			if createCalls != 0 {
				t.Fatalf("expected invalid confidence not to call store, got %d calls", createCalls)
			}
		})
	}
}

func TestCreateReportReturnsNotFoundForUnknownClinic(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{createErr: pgx.ErrNoRows})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(validReportJSON()))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNotFound, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"not_found"`) {
		t.Fatalf("expected not_found error code, got %q", rec.Body.String())
	}
}

func TestCreateReportReturnsInternalErrorForUnexpectedStoreError(t *testing.T) {
	storeErr := errors.New("database password leaked")
	router := newAuthenticatedTestRouter(t, fakeStore{createErr: storeErr})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports", strings.NewReader(validReportJSON()))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertInternalError(t, rec, storeErr)
}

func TestListPendingReportsReturnsPendingReports(t *testing.T) {
	newer := time.Date(2026, 5, 3, 9, 0, 0, 0, time.UTC)
	older := time.Date(2026, 5, 3, 8, 0, 0, 0, time.UTC)
	router := newAuthenticatedTestRouter(t, fakeStore{
		pendingReports: []store.Report{
			{ID: 20, ClinicID: "clinic-1", ReviewState: "pending", ReceivedAt: newer},
			{ID: 19, ClinicID: "clinic-2", ReviewState: "pending", ReceivedAt: older},
		},
	})
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/reports/pending", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	var got []store.Report
	decodeJSON(t, rec, &got)
	if len(got) != 2 || got[0].ID != 20 || got[1].ID != 19 {
		t.Fatalf("unexpected pending reports response: %#v", got)
	}
}

func TestListPendingReportsPassesDistrictManagerScope(t *testing.T) {
	var scope store.ReportReviewScope
	district := "Tshwane North Demo District"
	router := apihttp.NewRouter(authenticatedStore(t, "district_manager", fakeStore{
		memberships: []store.OrganisationMembership{{
			ID:        1,
			UserID:    42,
			Role:      "district_manager",
			District:  &district,
			CreatedAt: time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC),
		}},
		pendingScope: &scope,
	}))
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/reports/pending", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if scope.Role != "district_manager" || scope.District == nil || *scope.District != district {
		t.Fatalf("unexpected pending scope: %#v", scope)
	}
}

func TestReporterCannotListPendingOrReviewReports(t *testing.T) {
	for _, tt := range []struct {
		name   string
		method string
		path   string
		body   string
	}{
		{name: "list pending", method: http.MethodGet, path: "/v1/reports/pending"},
		{name: "review", method: http.MethodPost, path: "/v1/reports/100/review", body: `{"decision":"accepted"}`},
	} {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{}))
			req := newAuthenticatedRequest(t, tt.method, tt.path, strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusForbidden {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusForbidden, rec.Code, rec.Body.String())
			}
		})
	}
}

func TestOfflineSyncRequiresReporterRoleOrHigher(t *testing.T) {
	body := strings.NewReader(validOfflineSyncJSON())
	for _, tt := range []struct {
		name     string
		role     string
		wantCode int
	}{
		{name: "reporter", role: "reporter", wantCode: http.StatusOK},
		{name: "district manager", role: "district_manager", wantCode: http.StatusOK},
		{name: "org admin", role: "org_admin", wantCode: http.StatusOK},
		{name: "system admin", role: "system_admin", wantCode: http.StatusOK},
		{name: "unknown role", role: "unknown", wantCode: http.StatusForbidden},
	} {
		t.Run(tt.name, func(t *testing.T) {
			createCalls := 0
			router := apihttp.NewRouter(authenticatedStore(t, tt.role, fakeStore{
				createReport:      store.Report{ID: 100, ClinicID: "clinic-1", Status: "degraded", ReviewState: "pending"},
				createCalls:       &createCalls,
				externalReportErr: pgx.ErrNoRows,
			}))
			req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/offline-sync", strings.NewReader(validOfflineSyncJSON()))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != tt.wantCode {
				t.Fatalf("expected status %d, got %d with body %s", tt.wantCode, rec.Code, rec.Body.String())
			}
			if tt.wantCode == http.StatusOK && createCalls != 1 {
				t.Fatalf("expected allowed role to create one report, got %d", createCalls)
			}
		})
	}

	router := apihttp.NewRouter(fakeStore{})
	req := httptest.NewRequest(http.MethodPost, "/v1/reports/offline-sync", body)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertGenericUnauthorized(t, rec)
}

func TestOfflineSyncReturnsPerItemResults(t *testing.T) {
	submittedAt := time.Date(2026, 5, 3, 8, 30, 0, 0, time.UTC)
	reason := "Queued while offline."
	staffPressure := "strained"
	stockPressure := "low"
	queuePressure := "high"
	notes := "Pharmacy queue overflow."
	var createInput store.CreateReportInput
	var syncAttemptInput store.CreateReportSyncAttemptInput
	router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{
		createReport: store.Report{
			ID:             100,
			ClinicID:       "clinic-1",
			Status:         "degraded",
			Reason:         &reason,
			StaffPressure:  &staffPressure,
			StockPressure:  &stockPressure,
			QueuePressure:  &queuePressure,
			Notes:          &notes,
			SubmittedAt:    submittedAt,
			ReviewState:    "pending",
			OfflineCreated: true,
		},
		createInput:       &createInput,
		syncAttemptInput:  &syncAttemptInput,
		externalReportErr: pgx.ErrNoRows,
	}))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/offline-sync", strings.NewReader(validOfflineSyncJSON()))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	var got struct {
		Results []struct {
			ClientReportID string        `json:"clientReportId"`
			Result         string        `json:"result"`
			Report         *store.Report `json:"report,omitempty"`
		} `json:"results"`
		Summary struct {
			Created   int `json:"created"`
			Duplicate int `json:"duplicate"`
			Conflict  int `json:"conflict"`
			Failed    int `json:"failed"`
		} `json:"summary"`
	}
	decodeJSON(t, rec, &got)
	if len(got.Results) != 1 || got.Results[0].ClientReportID != "offline-report-1" || got.Results[0].Result != "created" || got.Results[0].Report == nil || got.Results[0].Report.ID != 100 {
		t.Fatalf("unexpected offline sync results: %#v", got.Results)
	}
	if got.Summary.Created != 1 || got.Summary.Duplicate != 0 || got.Summary.Conflict != 0 || got.Summary.Failed != 0 {
		t.Fatalf("unexpected offline sync summary: %#v", got.Summary)
	}
	if createInput.ExternalID == nil || *createInput.ExternalID != "offline-report-1" || createInput.ClinicID != "clinic-1" || createInput.SubmittedAt != submittedAt {
		t.Fatalf("unexpected offline report create input: %#v", createInput)
	}
	if syncAttemptInput.ClientAttemptCount != 2 || syncAttemptInput.ExternalID != "offline-report-1" || syncAttemptInput.QueuedAt == nil {
		t.Fatalf("expected attemptCount to map to sync attempt input, got %#v", syncAttemptInput)
	}
}

func TestOfflineSyncMapsVisitVerificationEvidence(t *testing.T) {
	var createInput store.CreateReportInput
	router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{
		createReport: store.Report{
			ID:             100,
			ClinicID:       "clinic-1",
			Status:         "degraded",
			ReviewState:    "pending",
			OfflineCreated: true,
		},
		createInput:       &createInput,
		externalReportErr: pgx.ErrNoRows,
	}))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/offline-sync", strings.NewReader(`{
		"items": [{
			"clientReportId": "offline-report-1",
			"clinicId": "clinic-1",
			"status": "degraded",
			"reason": "Queued while offline.",
			"staffPressure": "strained",
			"stockPressure": "low",
			"queuePressure": "high",
			"notes": "Pharmacy queue overflow.",
			"submittedAt": "2026-05-03T08:30:00Z",
			"queuedAt": "2026-05-03T08:30:03Z",
			"attemptCount": 2,
			"visitVerification": {
				"statusLabel": "Location verified",
				"distanceLabel": "18 m",
				"distanceMeters": 18,
				"accuracyLabel": "Good GPS accuracy",
				"capturedAt": "2026-05-03T08:29:00Z",
				"coordinateLabel": "25.70694°S 28.22944°E",
				"tone": "clear"
			}
		}]
	}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if createInput.VisitVerification["statusLabel"] != "Location verified" || createInput.VisitVerification["distanceLabel"] != "18 m" {
		t.Fatalf("expected visit verification evidence to map into offline report input, got %#v", createInput.VisitVerification)
	}
}

func TestOfflineSyncContinuesAfterItemTimestampValidationError(t *testing.T) {
	submittedAt := time.Date(2026, 5, 3, 8, 30, 0, 0, time.UTC)
	var createInput store.CreateReportInput
	var syncAttemptInputs []store.CreateReportSyncAttemptInput
	createCalls := 0
	router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{
		createReport: store.Report{
			ID:             100,
			ClinicID:       "clinic-1",
			Status:         "degraded",
			SubmittedAt:    submittedAt,
			ReviewState:    "pending",
			OfflineCreated: true,
		},
		createCalls:       &createCalls,
		createInput:       &createInput,
		syncAttemptInputs: &syncAttemptInputs,
		externalReportErr: pgx.ErrNoRows,
	}))
	body := `{
		"items": [
			{
				"clientReportId": "offline-report-bad-time",
				"clinicId": "clinic-1",
				"status": "degraded",
				"reason": "Queued while offline.",
				"staffPressure": "strained",
				"stockPressure": "low",
				"queuePressure": "high",
				"submittedAt": "not-a-timestamp",
				"attemptCount": 1
			},
			{
				"clientReportId": "offline-report-1",
				"clinicId": "clinic-1",
				"status": "degraded",
				"reason": "Queued while offline.",
				"staffPressure": "strained",
				"stockPressure": "low",
				"queuePressure": "high",
				"submittedAt": "2026-05-03T08:30:00Z",
				"queuedAt": "2026-05-03T08:30:03Z",
				"attemptCount": 2
			}
		]
	}`
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/offline-sync", strings.NewReader(body))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	var got struct {
		Results []struct {
			ClientReportID string                 `json:"clientReportId"`
			Result         string                 `json:"result"`
			Report         *store.Report          `json:"report,omitempty"`
			Error          map[string]interface{} `json:"error,omitempty"`
		} `json:"results"`
		Summary struct {
			Created int `json:"created"`
			Failed  int `json:"failed"`
		} `json:"summary"`
	}
	decodeJSON(t, rec, &got)
	if len(got.Results) != 2 {
		t.Fatalf("expected two per-item results, got %#v", got.Results)
	}
	if got.Results[0].ClientReportID != "offline-report-bad-time" || got.Results[0].Result != "validation_error" || got.Results[0].Error["code"] != "validation_error" {
		t.Fatalf("expected first item validation_error, got %#v", got.Results[0])
	}
	if got.Results[1].ClientReportID != "offline-report-1" || got.Results[1].Result != "created" || got.Results[1].Report == nil || got.Results[1].Report.ID != 100 {
		t.Fatalf("expected second item created, got %#v", got.Results[1])
	}
	if got.Summary.Created != 1 || got.Summary.Failed != 1 {
		t.Fatalf("unexpected mixed batch summary: %#v", got.Summary)
	}
	if createCalls != 1 || createInput.ExternalID == nil || *createInput.ExternalID != "offline-report-1" {
		t.Fatalf("expected only valid item to create report, calls=%d input=%#v", createCalls, createInput)
	}
	if len(syncAttemptInputs) != 2 || syncAttemptInputs[0].Result != "validation_error" || syncAttemptInputs[1].Result != "created" {
		t.Fatalf("expected sync attempts for validation and created items, got %#v", syncAttemptInputs)
	}
}

func TestOfflineSyncTimestampValidationNormalizesNegativeAttemptCount(t *testing.T) {
	var syncAttemptInput store.CreateReportSyncAttemptInput
	router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{
		syncAttemptInput: &syncAttemptInput,
	}))
	body := `{"items":[{
		"clientReportId":"offline-report-bad-attempt",
		"clinicId":"clinic-1",
		"status":"degraded",
		"reason":"Queued while offline.",
		"staffPressure":"strained",
		"stockPressure":"low",
		"queuePressure":"high",
		"submittedAt":"not-a-timestamp",
		"attemptCount":-2
	}]}`
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/offline-sync", strings.NewReader(body))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	var got struct {
		Results []struct {
			Result string `json:"result"`
			Error  *struct {
				Code string `json:"code"`
			} `json:"error,omitempty"`
		} `json:"results"`
	}
	decodeJSON(t, rec, &got)
	if len(got.Results) != 1 || got.Results[0].Result != "validation_error" || got.Results[0].Error == nil || got.Results[0].Error.Code != "validation_error" {
		t.Fatalf("expected validation_error result, got %#v", got.Results)
	}
	if syncAttemptInput.ClientAttemptCount != 1 {
		t.Fatalf("expected normalized attempt count 1, got %#v", syncAttemptInput)
	}
}

func TestOfflineSyncTimestampValidationAllowsBlankClinicIDAttempt(t *testing.T) {
	var syncAttemptInput store.CreateReportSyncAttemptInput
	router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{
		syncAttemptInput: &syncAttemptInput,
	}))
	body := `{"items":[{
		"clientReportId":"offline-report-no-clinic",
		"clinicId":"",
		"status":"degraded",
		"reason":"Queued while offline.",
		"staffPressure":"strained",
		"stockPressure":"low",
		"queuePressure":"high",
		"submittedAt":"not-a-timestamp",
		"attemptCount":1
	}]}`
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/offline-sync", strings.NewReader(body))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	var got struct {
		Results []struct {
			Result string `json:"result"`
			Error  *struct {
				Code string `json:"code"`
			} `json:"error,omitempty"`
		} `json:"results"`
	}
	decodeJSON(t, rec, &got)
	if len(got.Results) != 1 || got.Results[0].Result != "validation_error" || got.Results[0].Error == nil || got.Results[0].Error.Code != "validation_error" {
		t.Fatalf("expected validation_error result, got %#v", got.Results)
	}
	if syncAttemptInput.ClinicID != "" {
		t.Fatalf("expected blank clinic id to be passed through for nullable ledger insert, got %#v", syncAttemptInput)
	}
}

func TestOfflineSyncInvalidJSONRecordsOperationError(t *testing.T) {
	for _, tt := range []struct {
		name string
		body string
	}{
		{name: "invalid", body: `{"items":`},
		{name: "trailing", body: validOfflineSyncJSON() + `{}`},
	} {
		t.Run(tt.name, func(t *testing.T) {
			createCalls := 0
			metrics := observability.NewRegistry()
			router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{createCalls: &createCalls}),
				apihttp.WithObservability(observability.NewJSONLogger(io.Discard, nil), metrics),
			)
			req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/offline-sync", strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
			}
			if !strings.Contains(rec.Body.String(), `"code":"invalid_json"`) {
				t.Fatalf("expected invalid_json code, got %q", rec.Body.String())
			}
			if createCalls != 0 {
				t.Fatalf("expected invalid JSON not to call store, got %d calls", createCalls)
			}
			gotMetrics := metrics.RenderPrometheus()
			if !strings.Contains(gotMetrics, `clinicpulse_domain_operations_total{operation="offline_sync",result="error"} 1`) {
				t.Fatalf("expected offline sync error operation metric, got:\n%s", gotMetrics)
			}
		})
	}
}

func TestSyncSummaryRequiresAuthenticatedReporterOrHigher(t *testing.T) {
	summary := store.SyncSummary{
		OfflineReportsReceived:    3,
		DuplicateSyncsHandled:     1,
		ConflictsNeedingAttention: 1,
		ValidationFailures:        1,
		PendingOfflineReports:     2,
	}
	for _, tt := range []struct {
		name     string
		role     string
		wantCode int
	}{
		{name: "district manager", role: "district_manager", wantCode: http.StatusOK},
		{name: "org admin", role: "org_admin", wantCode: http.StatusOK},
		{name: "system admin", role: "system_admin", wantCode: http.StatusOK},
		{name: "reporter", role: "reporter", wantCode: http.StatusOK},
	} {
		t.Run(tt.name, func(t *testing.T) {
			var since time.Time
			router := apihttp.NewRouter(authenticatedStore(t, tt.role, fakeStore{
				syncSummary:  &summary,
				summarySince: &since,
			}))
			req := newAuthenticatedRequest(t, http.MethodGet, "/v1/sync/summary", nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != tt.wantCode {
				t.Fatalf("expected status %d, got %d with body %s", tt.wantCode, rec.Code, rec.Body.String())
			}
			if tt.wantCode == http.StatusOK {
				var got store.SyncSummary
				decodeJSON(t, rec, &got)
				if got.OfflineReportsReceived != 3 || got.WindowStartedAt.IsZero() {
					t.Fatalf("unexpected sync summary response: %#v", got)
				}
				if age := time.Since(since); age < 23*time.Hour || age > 25*time.Hour {
					t.Fatalf("expected default summary window near 24 hours, got since %s", since)
				}
			}
		})
	}

	router := apihttp.NewRouter(fakeStore{})
	req := httptest.NewRequest(http.MethodGet, "/v1/sync/summary", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertGenericUnauthorized(t, rec)
}

func TestSyncSummaryPassesReviewScopeForDistrictManager(t *testing.T) {
	var scope store.ReportReviewScope
	router := apihttp.NewRouter(authenticatedStore(t, "district_manager", fakeStore{
		syncSummary:      &store.SyncSummary{OfflineReportsReceived: 1},
		syncSummaryScope: &scope,
	}))
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/sync/summary", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if scope.Role != "district_manager" || scope.District == nil || *scope.District != defaultTestDistrict {
		t.Fatalf("expected district-manager review scope, got %#v", scope)
	}
	if scope.UserID == nil || *scope.UserID != 42 {
		t.Fatalf("expected authenticated user id in review scope, got %#v", scope)
	}
}

func TestSyncSummaryPassesReporterUserScope(t *testing.T) {
	var scope store.ReportReviewScope
	router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{
		syncSummary:      &store.SyncSummary{OfflineReportsReceived: 1},
		syncSummaryScope: &scope,
	}))
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/sync/summary", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if scope.Role != "reporter" {
		t.Fatalf("expected reporter review scope, got %#v", scope)
	}
	if scope.UserID == nil || *scope.UserID != 42 {
		t.Fatalf("expected reporter user id in review scope, got %#v", scope)
	}
}

func TestReconcileStalenessRequiresDistrictManagerOrHigher(t *testing.T) {
	for _, tt := range []struct {
		name     string
		role     string
		wantCode int
	}{
		{name: "district manager", role: "district_manager", wantCode: http.StatusOK},
		{name: "org admin", role: "org_admin", wantCode: http.StatusOK},
		{name: "system admin", role: "system_admin", wantCode: http.StatusOK},
		{name: "reporter", role: "reporter", wantCode: http.StatusForbidden},
	} {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(authenticatedStore(t, tt.role, fakeStore{}))
			req := newAuthenticatedRequest(t, http.MethodPost, "/v1/status/reconcile-staleness", nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != tt.wantCode {
				t.Fatalf("expected status %d, got %d with body %s", tt.wantCode, rec.Code, rec.Body.String())
			}
		})
	}

	router := apihttp.NewRouter(fakeStore{})
	req := httptest.NewRequest(http.MethodPost, "/v1/status/reconcile-staleness", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertGenericUnauthorized(t, rec)
}

func TestReconcileStalenessPassesReviewScopeForDistrictManager(t *testing.T) {
	now := time.Now().UTC()
	lastReportedAt := now.Add(-24 * time.Hour)
	var scope store.ReportReviewScope
	router := apihttp.NewRouter(authenticatedStore(t, "district_manager", fakeStore{
		currentStatuses: []store.CurrentStatus{{
			ClinicID:       "clinic-1",
			Freshness:      "fresh",
			LastReportedAt: &lastReportedAt,
		}},
		currentStatusScope: &scope,
	}))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/status/reconcile-staleness", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if scope.Role != "district_manager" || scope.District == nil || *scope.District != defaultTestDistrict {
		t.Fatalf("expected district-manager review scope, got %#v", scope)
	}
}

func TestReconcileStalenessReturnsSummary(t *testing.T) {
	now := time.Now().UTC()
	lastReportedAt := now.Add(-24 * time.Hour)
	var updateInput store.CreateAuditEventInput
	var updateCalled bool
	router := apihttp.NewRouter(authenticatedStore(t, "district_manager", fakeStore{
		currentStatuses: []store.CurrentStatus{{
			ClinicID:       "clinic-1",
			Freshness:      "fresh",
			LastReportedAt: &lastReportedAt,
		}},
		updateFreshnessInput:  &updateInput,
		updateFreshnessCalled: &updateCalled,
	}))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/status/reconcile-staleness", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	var got struct {
		Checked                 int `json:"checked"`
		MarkedNeedsConfirmation int `json:"markedNeedsConfirmation"`
		MarkedStale             int `json:"markedStale"`
	}
	decodeJSON(t, rec, &got)
	if got.Checked != 1 || got.MarkedNeedsConfirmation != 0 || got.MarkedStale != 1 {
		t.Fatalf("unexpected reconcile response: %#v", got)
	}
	if !updateCalled {
		t.Fatal("expected freshness update to be called")
	}
	if updateInput.ActorUserID == nil || *updateInput.ActorUserID != 42 {
		t.Fatalf("expected authenticated actor in audit input, got %#v", updateInput.ActorUserID)
	}
	if updateInput.EventType != "clinic.status_marked_stale" || updateInput.Metadata["freshness"] != "stale" {
		t.Fatalf("unexpected audit input: %#v", updateInput)
	}
}

func TestReviewReportRequiresAuthenticatedPrincipal(t *testing.T) {
	router := apihttp.NewRouter(fakeStore{})
	req := httptest.NewRequest(http.MethodPost, "/v1/reports/100/review", strings.NewReader(`{"decision":"accepted"}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertGenericUnauthorized(t, rec)
}

func TestAcceptPendingReportReturnsUpdatedReportAndCurrentStatus(t *testing.T) {
	notes := "District verified"
	district := "Tshwane North Demo District"
	status := store.CurrentStatus{ClinicID: "clinic-1", Status: "degraded"}
	var reviewInput store.ReviewReportInput
	router := newAuthenticatedTestRouter(t, fakeStore{
		reviewReport: store.Report{ID: 100, ClinicID: "clinic-1", ReviewState: "accepted", Status: "degraded"},
		reviewStatus: &status,
		reviewInput:  &reviewInput,
		memberships: []store.OrganisationMembership{{
			ID:        1,
			UserID:    42,
			Role:      "district_manager",
			District:  &district,
			CreatedAt: time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC),
		}},
	})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/100/review", strings.NewReader(`{"decision":"accepted","notes":"  District verified  "}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	var got struct {
		Report        store.Report         `json:"report"`
		CurrentStatus *store.CurrentStatus `json:"currentStatus,omitempty"`
	}
	decodeJSON(t, rec, &got)
	if got.Report.ID != 100 || got.Report.ReviewState != "accepted" || got.CurrentStatus == nil || got.CurrentStatus.Status != "degraded" {
		t.Fatalf("unexpected review response: %#v", got)
	}
	if reviewInput.ReportID != 100 || reviewInput.Decision != "accepted" || reviewInput.ReviewerUserID != 42 {
		t.Fatalf("unexpected review input: %#v", reviewInput)
	}
	if reviewInput.Notes == nil || *reviewInput.Notes != notes {
		t.Fatalf("expected trimmed notes %q, got %v", notes, reviewInput.Notes)
	}
	if reviewInput.Scope.Role != "district_manager" {
		t.Fatalf("expected review scope role district_manager, got %#v", reviewInput.Scope)
	}
	if reviewInput.Scope.District == nil || *reviewInput.Scope.District != district {
		t.Fatalf("expected review scope district %q, got %#v", district, reviewInput.Scope)
	}
}

func TestReviewReportWritesDecisionAuditWithAuthenticatedActor(t *testing.T) {
	orgID := int64(7)
	notes := "District verified"
	district := "Tshwane North Demo District"
	var reviewInput store.ReviewReportInput
	router := apihttp.NewRouter(authenticatedStore(t, "district_manager", fakeStore{
		reviewReport: store.Report{ID: 100, ClinicID: "clinic-1", ReviewState: "accepted", Status: "degraded"},
		reviewInput:  &reviewInput,
		memberships: []store.OrganisationMembership{{
			ID:             1,
			OrganisationID: &orgID,
			UserID:         42,
			Role:           "district_manager",
			District:       &district,
			CreatedAt:      time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC),
		}},
	}))
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/100/review", strings.NewReader(`{"decision":"accepted","notes":"District verified"}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if reviewInput.AuditEvent == nil {
		t.Fatal("expected review audit event in store input")
	}
	if reviewInput.AuditEvent.ActorUserID == nil || *reviewInput.AuditEvent.ActorUserID != 42 {
		t.Fatalf("expected actor user id 42, got %v", reviewInput.AuditEvent.ActorUserID)
	}
	if reviewInput.AuditEvent.OrganisationID == nil || *reviewInput.AuditEvent.OrganisationID != orgID {
		t.Fatalf("expected organisation id %d, got %v", orgID, reviewInput.AuditEvent.OrganisationID)
	}
	if reviewInput.AuditEvent.Metadata["decision"] != "accepted" || reviewInput.AuditEvent.Metadata["notes"] != notes {
		t.Fatalf("unexpected review audit metadata: %#v", reviewInput.AuditEvent.Metadata)
	}
}

func TestRejectPendingReportReturnsNoCurrentStatus(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{
		reviewReport: store.Report{ID: 100, ClinicID: "clinic-1", ReviewState: "rejected"},
	})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/100/review", strings.NewReader(`{"decision":"rejected"}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	var got struct {
		Report        store.Report         `json:"report"`
		CurrentStatus *store.CurrentStatus `json:"currentStatus,omitempty"`
	}
	decodeJSON(t, rec, &got)
	if got.Report.ID != 100 || got.Report.ReviewState != "rejected" || got.CurrentStatus != nil {
		t.Fatalf("unexpected review response: %#v", got)
	}
}

func TestReviewReportReturnsConflictForAlreadyReviewed(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{reviewErr: store.ErrReportAlreadyReviewed})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/100/review", strings.NewReader(`{"decision":"accepted"}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusConflict {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusConflict, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"conflict"`) {
		t.Fatalf("expected conflict error code, got %q", rec.Body.String())
	}
}

func TestReviewReportInvalidJSONAndDecisionRecordsOperationError(t *testing.T) {
	for _, tt := range []struct {
		name string
		body string
		code string
	}{
		{name: "invalid json", body: `{"decision":`, code: "invalid_json"},
		{name: "trailing json", body: `{"decision":"accepted"} {}`, code: "invalid_json"},
		{name: "invalid decision", body: `{"decision":"maybe"}`, code: "validation_error"},
	} {
		t.Run(tt.name, func(t *testing.T) {
			metrics := observability.NewRegistry()
			router := apihttp.NewRouter(authenticatedStore(t, "org_admin", fakeStore{}),
				apihttp.WithObservability(observability.NewJSONLogger(io.Discard, nil), metrics),
			)
			req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/100/review", strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
			}
			if !strings.Contains(rec.Body.String(), `"code":"`+tt.code+`"`) {
				t.Fatalf("expected %s error code, got %q", tt.code, rec.Body.String())
			}
			gotMetrics := metrics.RenderPrometheus()
			if !strings.Contains(gotMetrics, `clinicpulse_domain_operations_total{operation="report.review",result="error"} 1`) {
				t.Fatalf("expected review error operation metric, got:\n%s", gotMetrics)
			}
		})
	}
}

func TestReviewReportReturnsBadRequestForWhitespaceOnlyNotes(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/100/review", strings.NewReader(`{"decision":"accepted","notes":"   "}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "notes: notes cannot be blank") {
		t.Fatalf("expected notes validation error, got %q", rec.Body.String())
	}
}

func TestReviewReportAllowsEmptyStringNotesAsNil(t *testing.T) {
	var reviewInput store.ReviewReportInput
	router := newAuthenticatedTestRouter(t, fakeStore{
		reviewReport: store.Report{ID: 100, ClinicID: "clinic-1", ReviewState: "accepted"},
		reviewInput:  &reviewInput,
	})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/100/review", strings.NewReader(`{"decision":"accepted","notes":""}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if reviewInput.Notes != nil {
		t.Fatalf("expected empty notes to become nil, got %q", *reviewInput.Notes)
	}
}

func TestReviewReportReturnsForbiddenForOutOfScopeDistrictManager(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{reviewErr: store.ErrReportReviewForbidden})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/100/review", strings.NewReader(`{"decision":"accepted"}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusForbidden, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"forbidden"`) {
		t.Fatalf("expected forbidden error code, got %q", rec.Body.String())
	}
}

func TestReviewReportReturnsNotFoundForMissingReport(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{reviewErr: pgx.ErrNoRows})
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/reports/404/review", strings.NewReader(`{"decision":"accepted"}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNotFound, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"not_found"`) {
		t.Fatalf("expected not_found error code, got %q", rec.Body.String())
	}
}

func TestLoginSuccessSetsSessionCookieAndReturnsUserMemberships(t *testing.T) {
	passwordHash := hashPasswordForTest(t, "correct-password")
	now := time.Date(2026, 5, 3, 8, 0, 0, 0, time.UTC)
	var getEmail string
	var createInput store.CreateSessionInput
	router := apihttp.NewRouter(fakeStore{
		user: store.User{
			ID:           42,
			Email:        "manager@example.test",
			DisplayName:  "Clinic Manager",
			PasswordHash: &passwordHash,
			CreatedAt:    now,
			UpdatedAt:    now,
		},
		createSession: store.Session{
			ID:        100,
			UserID:    42,
			CreatedAt: now,
			ExpiresAt: now.Add(12 * time.Hour),
		},
		memberships: []store.OrganisationMembership{
			{ID: 7, UserID: 42, Role: "district_manager", CreatedAt: now},
		},
		getUserEmail:       &getEmail,
		createSessionInput: &createInput,
	})
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(`{"email":" Manager@Example.Test ","password":"correct-password"}`))
	req.Header.Set("User-Agent", "ClinicPulse Test")
	req.RemoteAddr = "192.0.2.55:4321"
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	sessionCookie := findCookie(rec, "clinicpulse_session")
	if sessionCookie == nil {
		t.Fatalf("expected clinicpulse_session cookie, got %v", rec.Result().Cookies())
	}
	if sessionCookie.Value == "" {
		t.Fatal("expected non-empty plaintext session token cookie")
	}
	if !sessionCookie.HttpOnly {
		t.Fatalf("expected HttpOnly cookie, got %#v", sessionCookie)
	}
	if sessionCookie.Path != "/" {
		t.Fatalf("expected cookie path /, got %q", sessionCookie.Path)
	}
	if sessionCookie.SameSite != http.SameSiteLaxMode {
		t.Fatalf("expected SameSite=Lax, got %#v", sessionCookie.SameSite)
	}
	if time.Until(sessionCookie.Expires) <= 0 {
		t.Fatalf("expected future cookie expiry, got %s", sessionCookie.Expires)
	}
	if getEmail != "manager@example.test" {
		t.Fatalf("expected trimmed lower-case lookup email, got %q", getEmail)
	}
	if createInput.UserID != 42 || createInput.TokenHash == "" || createInput.ExpiresAt.IsZero() {
		t.Fatalf("expected populated session input, got %#v", createInput)
	}
	if createInput.TokenHash == sessionCookie.Value {
		t.Fatal("expected store token hash not to equal plaintext cookie token")
	}
	if createInput.UserAgent == nil || *createInput.UserAgent != "ClinicPulse Test" {
		t.Fatalf("expected captured user agent, got %#v", createInput.UserAgent)
	}
	if createInput.IPAddress == nil || *createInput.IPAddress != "192.0.2.55" {
		t.Fatalf("expected captured remote IP, got %#v", createInput.IPAddress)
	}

	var got struct {
		User        store.User                     `json:"user"`
		Memberships []store.OrganisationMembership `json:"memberships"`
	}
	decodeJSON(t, rec, &got)
	if got.User.ID != 42 || got.User.Email != "manager@example.test" || got.User.PasswordHash != nil {
		t.Fatalf("unexpected user response: %#v", got.User)
	}
	if len(got.Memberships) != 1 || got.Memberships[0].Role != "district_manager" {
		t.Fatalf("unexpected memberships response: %#v", got.Memberships)
	}
	if strings.Contains(rec.Body.String(), "correct-password") || strings.Contains(rec.Body.String(), passwordHash) || strings.Contains(rec.Body.String(), createInput.TokenHash) {
		t.Fatalf("expected auth secrets not to appear in response, got %q", rec.Body.String())
	}
}

func TestLoginSuccessWritesActorAuditEvent(t *testing.T) {
	passwordHash := hashPasswordForTest(t, "correct-password")
	now := time.Date(2026, 5, 3, 8, 0, 0, 0, time.UTC)
	orgID := int64(7)
	var auditInput store.CreateAuditEventInput
	auditCalls := 0
	createSessionCalls := 0
	router := apihttp.NewRouter(fakeStore{
		user: store.User{
			ID:           42,
			Email:        "manager@example.test",
			DisplayName:  "Clinic Manager",
			PasswordHash: &passwordHash,
			CreatedAt:    now,
			UpdatedAt:    now,
		},
		createSession: store.Session{
			ID:        100,
			UserID:    42,
			CreatedAt: now,
			ExpiresAt: now.Add(12 * time.Hour),
		},
		memberships: []store.OrganisationMembership{
			{ID: 7, OrganisationID: &orgID, UserID: 42, Role: "org_admin", CreatedAt: now},
		},
		auditInput:         &auditInput,
		auditCalls:         &auditCalls,
		createSessionCalls: &createSessionCalls,
	})
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(`{"email":"manager@example.test","password":"correct-password"}`))
	req.Header.Set("User-Agent", "ClinicPulse Test")
	req.RemoteAddr = "192.0.2.55:4321"
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if auditCalls != 1 {
		t.Fatalf("expected one audit event, got %d", auditCalls)
	}
	if createSessionCalls != 0 {
		t.Fatalf("expected login to use transactional session audit store method, got %d CreateSession calls", createSessionCalls)
	}
	if auditInput.EventType != "auth.login.succeeded" {
		t.Fatalf("expected auth.login.succeeded event type, got %q", auditInput.EventType)
	}
	if auditInput.ActorUserID == nil || *auditInput.ActorUserID != 42 {
		t.Fatalf("expected actor user id 42, got %v", auditInput.ActorUserID)
	}
	if auditInput.ActorRole == nil || *auditInput.ActorRole != "org_admin" {
		t.Fatalf("expected actor role org_admin, got %v", auditInput.ActorRole)
	}
	if auditInput.OrganisationID == nil || *auditInput.OrganisationID != orgID {
		t.Fatalf("expected organisation id %d, got %v", orgID, auditInput.OrganisationID)
	}
	if auditInput.EntityType == nil || *auditInput.EntityType != "session" {
		t.Fatalf("expected session entity type, got %v", auditInput.EntityType)
	}
	if auditInput.EntityID == nil || *auditInput.EntityID != "100" {
		t.Fatalf("expected session entity id 100, got %v", auditInput.EntityID)
	}
	if auditInput.Metadata["sessionId"] != int64(100) || auditInput.Metadata["userAgent"] != "ClinicPulse Test" || auditInput.Metadata["ipAddress"] != "192.0.2.55" {
		t.Fatalf("unexpected login audit metadata: %#v", auditInput.Metadata)
	}
}

func TestLoginAuditFailureDoesNotCreateSessionOnlyOrSetCookie(t *testing.T) {
	passwordHash := hashPasswordForTest(t, "correct-password")
	now := time.Date(2026, 5, 3, 8, 0, 0, 0, time.UTC)
	storeErr := errors.New("audit insert failed")
	createSessionCalls := 0
	sessionAuditCalls := 0
	router := apihttp.NewRouter(fakeStore{
		user: store.User{
			ID:           42,
			Email:        "manager@example.test",
			DisplayName:  "Clinic Manager",
			PasswordHash: &passwordHash,
			CreatedAt:    now,
			UpdatedAt:    now,
		},
		createSession: store.Session{
			ID:        100,
			UserID:    42,
			CreatedAt: now,
			ExpiresAt: now.Add(12 * time.Hour),
		},
		memberships: []store.OrganisationMembership{
			{ID: 7, UserID: 42, Role: "org_admin", CreatedAt: now},
		},
		createSessionCalls:          &createSessionCalls,
		createSessionWithAuditCalls: &sessionAuditCalls,
		createSessionWithAuditErr:   storeErr,
		auditErr:                    storeErr,
	})
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(`{"email":"manager@example.test","password":"correct-password"}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertInternalError(t, rec, storeErr)
	if createSessionCalls != 0 {
		t.Fatalf("expected audit failure not to use CreateSession-only path, got %d calls", createSessionCalls)
	}
	if sessionAuditCalls != 1 {
		t.Fatalf("expected transactional session audit path once, got %d calls", sessionAuditCalls)
	}
	if findCookie(rec, "clinicpulse_session") != nil {
		t.Fatalf("expected audit failure not to set session cookie, got %v", rec.Result().Cookies())
	}
}

func TestLoginSessionCookieSecureBehavior(t *testing.T) {
	tests := []struct {
		name       string
		target     string
		wantSecure bool
	}{
		{name: "localhost HTTP remains usable for local dev", target: "http://localhost:3000/v1/auth/login", wantSecure: false},
		{name: "loopback HTTP remains usable for local dev", target: "http://127.0.0.1:3000/v1/auth/login", wantSecure: false},
		{name: "production-like host uses secure cookie", target: "http://api.example.test/v1/auth/login", wantSecure: true},
		{name: "TLS request uses secure cookie", target: "https://localhost:3000/v1/auth/login", wantSecure: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(successfulLoginStore(t))
			req := httptest.NewRequest(http.MethodPost, tt.target, strings.NewReader(`{"email":"manager@example.test","password":"correct-password"}`))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
			}
			cookie := findCookie(rec, "clinicpulse_session")
			if cookie == nil {
				t.Fatalf("expected clinicpulse_session cookie, got %v", rec.Result().Cookies())
			}
			if cookie.Secure != tt.wantSecure {
				t.Fatalf("expected Secure=%t, got %#v", tt.wantSecure, cookie)
			}
		})
	}
}

func TestLoginReturnsBadRequestForInvalidOrTrailingJSON(t *testing.T) {
	tests := []struct {
		name string
		body string
	}{
		{name: "invalid json", body: `{"email":`},
		{name: "trailing object", body: `{"email":"manager@example.test","password":"password"}{}`},
		{name: "trailing garbage", body: `{"email":"manager@example.test","password":"password"} garbage`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(fakeStore{})
			req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
			}
			if !strings.Contains(rec.Body.String(), `"code":"invalid_json"`) {
				t.Fatalf("expected invalid_json code, got %q", rec.Body.String())
			}
		})
	}
}

func TestLoginReturnsBadRequestForMissingEmailOrPassword(t *testing.T) {
	tests := []struct {
		name string
		body string
	}{
		{name: "missing email", body: `{"password":"password"}`},
		{name: "blank email", body: `{"email":"  ","password":"password"}`},
		{name: "missing password", body: `{"email":"manager@example.test"}`},
		{name: "blank password", body: `{"email":"manager@example.test","password":""}`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(fakeStore{})
			req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusBadRequest, rec.Code, rec.Body.String())
			}
			if !strings.Contains(rec.Body.String(), `"code":"validation_error"`) {
				t.Fatalf("expected validation_error code, got %q", rec.Body.String())
			}
		})
	}
}

func TestLoginReturnsGenericUnauthorizedForInvalidCredentials(t *testing.T) {
	validHash := hashPasswordForTest(t, "correct-password")
	disabledAt := time.Date(2026, 5, 3, 9, 0, 0, 0, time.UTC)
	tests := []struct {
		name  string
		store fakeStore
		body  string
	}{
		{
			name:  "missing user",
			store: fakeStore{getUserErr: pgx.ErrNoRows},
			body:  `{"email":"missing@example.test","password":"password"}`,
		},
		{
			name: "wrong password",
			store: fakeStore{user: store.User{
				ID:           42,
				Email:        "manager@example.test",
				PasswordHash: &validHash,
			}},
			body: `{"email":"manager@example.test","password":"wrong-password"}`,
		},
		{
			name: "disabled user",
			store: fakeStore{user: store.User{
				ID:           42,
				Email:        "manager@example.test",
				PasswordHash: &validHash,
				DisabledAt:   &disabledAt,
			}},
			body: `{"email":"manager@example.test","password":"correct-password"}`,
		},
		{
			name:  "user without password hash",
			store: fakeStore{user: store.User{ID: 42, Email: "manager@example.test"}},
			body:  `{"email":"manager@example.test","password":"correct-password"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			createSessionCalls := 0
			tt.store.createSessionCalls = &createSessionCalls
			router := apihttp.NewRouter(tt.store)
			req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			assertGenericUnauthorized(t, rec)
			if createSessionCalls != 0 {
				t.Fatalf("expected invalid credentials not to create a session, got %d calls", createSessionCalls)
			}
		})
	}
}

func TestLoginInvalidCredentialsLogsStructuredAuthErrorCode(t *testing.T) {
	var logOutput bytes.Buffer
	router := apihttp.NewRouter(
		fakeStore{getUserErr: pgx.ErrNoRows},
		apihttp.WithObservability(observability.NewJSONLogger(&logOutput, nil), observability.NewRegistry()),
	)
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(`{"email":"missing@example.test","password":"wrong-password"}`))
	req.Header.Set("X-Request-Id", "login-invalid-structured-123")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertGenericUnauthorized(t, rec)
	if strings.Contains(rec.Body.String(), "invalid_credentials") {
		t.Fatalf("expected login response not to expose internal credential code, got %s", rec.Body.String())
	}
	logLine := decodeFirstLogLine(t, &logOutput)
	assertLogField(t, logLine, "event", "http_request_error")
	assertLogField(t, logLine, "component", "auth")
	assertLogField(t, logLine, "error_kind", "auth")
	assertLogField(t, logLine, "error_code", "invalid_credentials")
	assertLogField(t, logLine, "request_id", "login-invalid-structured-123")
	assertLogField(t, logLine, "route", "/v1/auth/login")
	assertLogField(t, logLine, "status", float64(http.StatusUnauthorized))
	if strings.Contains(logOutput.String(), "missing@example.test") || strings.Contains(logOutput.String(), "wrong-password") {
		t.Fatalf("expected structured login error log not to contain credentials, got %q", logOutput.String())
	}
}

func TestLoginRateLimitLogsStructuredAuthErrorCode(t *testing.T) {
	var logOutput bytes.Buffer
	router := apihttp.NewRouter(
		successfulLoginStore(t),
		apihttp.WithLoginRateLimiter(security.NewFixedWindowLimiter(1, time.Minute, time.Now)),
		apihttp.WithObservability(observability.NewJSONLogger(&logOutput, nil), observability.NewRegistry()),
	)

	firstReq := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(`{"email":"manager@example.test","password":"correct-password"}`))
	firstReq.RemoteAddr = "203.0.113.10:41234"
	firstRec := httptest.NewRecorder()
	router.ServeHTTP(firstRec, firstReq)
	if firstRec.Code != http.StatusOK {
		t.Fatalf("expected warmup login status %d, got %d with body %s", http.StatusOK, firstRec.Code, firstRec.Body.String())
	}
	logOutput.Reset()

	req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(`{"email":"manager@example.test","password":"correct-password"}`))
	req.RemoteAddr = "203.0.113.10:41234"
	req.Header.Set("X-Request-Id", "login-denial-structured-123")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertGenericUnauthorized(t, rec)
	if strings.Contains(rec.Body.String(), "rate_limited") || strings.Contains(rec.Body.String(), "rate") || strings.Contains(rec.Body.String(), "throttle") {
		t.Fatalf("expected login rate-limit response not to expose throttle state, got %s", rec.Body.String())
	}
	logLine := decodeFirstLogLine(t, &logOutput)
	assertLogField(t, logLine, "event", "http_request_error")
	assertLogField(t, logLine, "component", "auth")
	assertLogField(t, logLine, "error_kind", "auth")
	assertLogField(t, logLine, "error_code", "rate_limited")
	assertLogField(t, logLine, "request_id", "login-denial-structured-123")
	assertLogField(t, logLine, "route", "/v1/auth/login")
	assertLogField(t, logLine, "status", float64(http.StatusUnauthorized))
	if strings.Contains(logOutput.String(), "manager@example.test") || strings.Contains(logOutput.String(), "correct-password") {
		t.Fatalf("expected structured login rate-limit log not to contain credentials, got %q", logOutput.String())
	}
}

func TestLoginSystemErrorsLogStructuredAuthErrorCode(t *testing.T) {
	var logOutput bytes.Buffer
	storeErr := errors.New("membership lookup failed")
	loginStore := successfulLoginStore(t)
	loginStore.membershipsErr = storeErr
	router := apihttp.NewRouter(
		loginStore,
		apihttp.WithObservability(observability.NewJSONLogger(&logOutput, nil), observability.NewRegistry()),
	)
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(`{"email":"manager@example.test","password":"correct-password"}`))
	req.Header.Set("X-Request-Id", "login-error-structured-123")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusInternalServerError, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"internal_error"`) {
		t.Fatalf("expected public internal_error response, got %q", rec.Body.String())
	}
	logLine := decodeFirstLogLine(t, &logOutput)
	assertLogField(t, logLine, "event", "http_request_error")
	assertLogField(t, logLine, "component", "auth")
	assertLogField(t, logLine, "error_kind", "auth")
	assertLogField(t, logLine, "error_code", "auth_error")
	assertLogField(t, logLine, "request_id", "login-error-structured-123")
	assertLogField(t, logLine, "route", "/v1/auth/login")
	assertLogField(t, logLine, "status", float64(http.StatusInternalServerError))
	if strings.Contains(logOutput.String(), storeErr.Error()) || strings.Contains(logOutput.String(), "correct-password") {
		t.Fatalf("expected structured login system error log not to contain raw errors or credentials, got %q", logOutput.String())
	}
}

func TestLoginRateLimitReturnsGenericUnauthorized(t *testing.T) {
	getUserCalls := 0
	metrics := observability.NewRegistry()
	loginStore := successfulLoginStore(t)
	loginStore.getUserCalls = &getUserCalls
	router := apihttp.NewRouter(loginStore,
		apihttp.WithLoginRateLimiter(security.NewFixedWindowLimiter(1, time.Minute, time.Now)),
		apihttp.WithMutationRateLimiter(security.NewFixedWindowLimiter(1, time.Minute, time.Now)),
		apihttp.WithObservability(observability.NewJSONLogger(io.Discard, nil), metrics),
	)

	for attempt := 0; attempt < 2; attempt++ {
		req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(`{"email":"manager@example.test","password":"wrong-password"}`))
		req.RemoteAddr = "203.0.113.10:41234"
		rec := httptest.NewRecorder()

		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected generic unauthorized, got %d with body %s", rec.Code, rec.Body.String())
		}
		if strings.Contains(rec.Body.String(), "rate") || strings.Contains(rec.Body.String(), "throttle") {
			t.Fatalf("login throttle response leaked throttle state: %s", rec.Body.String())
		}
	}
	if getUserCalls != 1 {
		t.Fatalf("expected throttled login to skip user lookup after first attempt, got %d lookups", getUserCalls)
	}
	gotMetrics := metrics.RenderPrometheus()
	if !strings.Contains(gotMetrics, `clinicpulse_rate_limit_denials_total{result="denied"} 1`) {
		t.Fatalf("expected login rate limit denial metric, got:\n%s", gotMetrics)
	}
	if !strings.Contains(gotMetrics, `clinicpulse_domain_operations_total{operation="auth.login",result="rate_limited"} 1`) {
		t.Fatalf("expected login rate_limited operation metric, got:\n%s", gotMetrics)
	}
}

func TestCSRFRejectionRecordsMetric(t *testing.T) {
	metrics := observability.NewRegistry()
	router := apihttp.NewRouter(authenticatedAdminStore(t, "org_admin", 77, fakeStore{}),
		apihttp.WithTrustedOrigins([]string{"https://app.example.test"}),
		apihttp.WithObservability(observability.NewJSONLogger(io.Discard, nil), metrics),
	)
	req := newAuthenticatedRequest(t, http.MethodPost, "/v1/auth/logout", nil)
	req.Header.Set("Origin", "https://evil.example.test")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusForbidden, rec.Code, rec.Body.String())
	}
	gotMetrics := metrics.RenderPrometheus()
	if !strings.Contains(gotMetrics, `clinicpulse_csrf_denials_total{result="denied"} 1`) {
		t.Fatalf("expected CSRF denial metric, got:\n%s", gotMetrics)
	}
}

func TestLoginMutationRateLimitStillReturnsGenericUnauthorizedForRotatingEmails(t *testing.T) {
	router := apihttp.NewRouter(successfulLoginStore(t),
		apihttp.WithLoginRateLimiter(security.NewFixedWindowLimiter(1, time.Minute, time.Now)),
		apihttp.WithMutationRateLimiter(security.NewFixedWindowLimiter(1, time.Minute, time.Now)),
	)

	for _, email := range []string{"manager+1@example.test", "manager+2@example.test", "manager+3@example.test"} {
		req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(`{"email":"`+email+`","password":"wrong-password"}`))
		req.RemoteAddr = "203.0.113.10:41234"
		rec := httptest.NewRecorder()

		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected generic unauthorized for %s, got %d with body %s", email, rec.Code, rec.Body.String())
		}
		if strings.Contains(rec.Body.String(), "rate_limited") || strings.Contains(rec.Body.String(), "rate") || strings.Contains(rec.Body.String(), "throttle") {
			t.Fatalf("login response leaked rate-limit state for %s: %s", email, rec.Body.String())
		}
	}
}

func TestLoginMembershipFailureReturnsInternalErrorWithoutCreatingSession(t *testing.T) {
	storeErr := errors.New("membership lookup failed")
	createSessionCalls := 0
	loginStore := successfulLoginStore(t)
	loginStore.membershipsErr = storeErr
	loginStore.createSessionCalls = &createSessionCalls
	router := apihttp.NewRouter(loginStore)
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(`{"email":"manager@example.test","password":"correct-password"}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertInternalError(t, rec, storeErr)
	if createSessionCalls != 0 {
		t.Fatalf("expected membership failure not to create a session, got %d calls", createSessionCalls)
	}
	if findCookie(rec, "clinicpulse_session") != nil {
		t.Fatalf("expected membership failure not to set session cookie, got %v", rec.Result().Cookies())
	}
}

func TestLoginNoMembershipReturnsUnauthorizedWithoutCreatingSession(t *testing.T) {
	createSessionCalls := 0
	loginStore := successfulLoginStore(t)
	loginStore.memberships = []store.OrganisationMembership{}
	loginStore.createSessionCalls = &createSessionCalls
	router := apihttp.NewRouter(loginStore)
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(`{"email":"manager@example.test","password":"correct-password"}`))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertGenericUnauthorized(t, rec)
	if createSessionCalls != 0 {
		t.Fatalf("expected no-membership login not to create a session, got %d calls", createSessionCalls)
	}
	if findCookie(rec, "clinicpulse_session") != nil {
		t.Fatalf("expected no-membership login not to set session cookie, got %v", rec.Result().Cookies())
	}
}

func TestAuthMeNoCookieReturnsUnauthorized(t *testing.T) {
	router := apihttp.NewRouter(fakeStore{})
	req := httptest.NewRequest(http.MethodGet, "/v1/auth/me", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertGenericUnauthorized(t, rec)
}

func TestAuthMeWithValidCookieReturnsUserSessionMemberships(t *testing.T) {
	token := sessionTokenForTest(t)
	tokenHash := hashSessionTokenForTest(t, token)
	now := time.Date(2026, 5, 3, 10, 0, 0, 0, time.UTC)
	var gotTokenHash string
	getSessionCalls := 0
	router := apihttp.NewRouter(fakeStore{
		session: store.Session{
			ID:        100,
			UserID:    42,
			TokenHash: tokenHash,
			CreatedAt: now,
			ExpiresAt: now.Add(12 * time.Hour),
		},
		sessionUser: store.User{
			ID:          42,
			Email:       "manager@example.test",
			DisplayName: "Clinic Manager",
			CreatedAt:   now,
			UpdatedAt:   now,
		},
		memberships: []store.OrganisationMembership{
			{ID: 7, UserID: 42, Role: "district_manager", CreatedAt: now},
		},
		getSessionTokenHash: &gotTokenHash,
		getSessionCalls:     &getSessionCalls,
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/auth/me", nil)
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: token})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, rec.Code, rec.Body.String())
	}
	if getSessionCalls != 1 {
		t.Fatalf("expected GetSessionByTokenHash to be called once, got %d", getSessionCalls)
	}
	if gotTokenHash != tokenHash {
		t.Fatalf("expected token hash %q, got %q", tokenHash, gotTokenHash)
	}

	var got struct {
		User        store.User                     `json:"user"`
		Session     store.Session                  `json:"session"`
		Memberships []store.OrganisationMembership `json:"memberships"`
	}
	decodeJSON(t, rec, &got)
	if got.User.ID != 42 || got.User.Email != "manager@example.test" {
		t.Fatalf("unexpected user response: %#v", got.User)
	}
	if got.Session.ID != 100 || got.Session.TokenHash != "" {
		t.Fatalf("unexpected session response: %#v", got.Session)
	}
	if len(got.Memberships) != 1 || got.Memberships[0].Role != "district_manager" {
		t.Fatalf("unexpected memberships response: %#v", got.Memberships)
	}
	if strings.Contains(rec.Body.String(), tokenHash) || strings.Contains(rec.Body.String(), token) {
		t.Fatalf("expected session secrets not to appear in response, got %q", rec.Body.String())
	}
}

func TestAuthMeMalformedCookieReturnsUnauthorized(t *testing.T) {
	getSessionCalls := 0
	router := apihttp.NewRouter(fakeStore{getSessionCalls: &getSessionCalls})
	req := httptest.NewRequest(http.MethodGet, "/v1/auth/me", nil)
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: "not-a-valid-token"})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertGenericUnauthorized(t, rec)
	if getSessionCalls != 0 {
		t.Fatalf("expected malformed token not to call store, got %d calls", getSessionCalls)
	}
}

func TestAuthMeUnknownExpiredRevokedOrDisabledSessionReturnsUnauthorized(t *testing.T) {
	token := sessionTokenForTest(t)
	getSessionCalls := 0
	router := apihttp.NewRouter(fakeStore{
		getSessionCalls: &getSessionCalls,
		getSessionErr:   pgx.ErrNoRows,
	})
	req := httptest.NewRequest(http.MethodGet, "/v1/auth/me", nil)
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: token})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertGenericUnauthorized(t, rec)
	if getSessionCalls != 1 {
		t.Fatalf("expected valid-looking token to call store once, got %d calls", getSessionCalls)
	}
	for _, leaked := range []string{"unknown", "expired", "revoked", "disabled"} {
		if strings.Contains(strings.ToLower(rec.Body.String()), leaked) {
			t.Fatalf("expected generic unauthorized response, got %q", rec.Body.String())
		}
	}
}

func TestAuthenticatedUserCanChangeOwnPassword(t *testing.T) {
	oldHash := hashPasswordForTest(t, "old-password")
	var updatedHash string
	router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{
		userPasswordHash:    &oldHash,
		updatedPasswordHash: &updatedHash,
	}))
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/password", strings.NewReader(`{"currentPassword":"old-password","newPassword":"new-secure-password-123"}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", "http://localhost:3000")
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: sessionTokenForTest(t)})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected no content, got %d with body %s", rec.Code, rec.Body.String())
	}
	if updatedHash == "" || strings.Contains(updatedHash, "new-secure-password-123") {
		t.Fatalf("expected hashed password update")
	}
}

func TestChangeOwnPasswordRejectsWrongCurrentPasswordWithoutUpdatingHash(t *testing.T) {
	oldHash := hashPasswordForTest(t, "old-password")
	var updatedHash string
	router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{
		userPasswordHash:    &oldHash,
		updatedPasswordHash: &updatedHash,
	}))
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/password", strings.NewReader(`{"currentPassword":"wrong-password","newPassword":"new-secure-password-123"}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", "http://localhost:3000")
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: sessionTokenForTest(t)})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assertGenericUnauthorized(t, rec)
	if updatedHash != "" {
		t.Fatalf("expected wrong current password not to update hash, got %q", updatedHash)
	}
	if strings.Contains(rec.Body.String(), "wrong-password") || strings.Contains(rec.Body.String(), "new-secure-password-123") {
		t.Fatalf("expected password material not to appear in response, got %s", rec.Body.String())
	}
}

func TestChangeOwnPasswordAllowsTrustedOriginWithCSRFMiddleware(t *testing.T) {
	oldHash := hashPasswordForTest(t, "old-password")
	var updatedHash string
	router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{
		userPasswordHash:    &oldHash,
		updatedPasswordHash: &updatedHash,
	}), apihttp.WithTrustedOrigins([]string{"http://localhost:3000"}))
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/password", strings.NewReader(`{"currentPassword":"old-password","newPassword":"new-secure-password-123"}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", "http://localhost:3000")
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: sessionTokenForTest(t)})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected trusted-origin password change not to be blocked, got %d with body %s", rec.Code, rec.Body.String())
	}
	if updatedHash == "" {
		t.Fatal("expected trusted-origin password change to update hash")
	}
}

func TestLogoutRevokesValidCookieHashAndClearsCookie(t *testing.T) {
	token := sessionTokenForTest(t)
	tokenHash := hashSessionTokenForTest(t, token)
	var revokedHash string
	router := apihttp.NewRouter(fakeStore{revokedTokenHash: &revokedHash})
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/logout", nil)
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: token})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusNoContent, rec.Code, rec.Body.String())
	}
	if revokedHash != tokenHash {
		t.Fatalf("expected revoked hash %q, got %q", tokenHash, revokedHash)
	}
	assertSessionCookieCleared(t, rec)
}

func TestLogoutMissingOrMalformedCookieClearsAndSucceeds(t *testing.T) {
	tests := []struct {
		name   string
		cookie *http.Cookie
	}{
		{name: "missing cookie"},
		{name: "malformed cookie", cookie: &http.Cookie{Name: "clinicpulse_session", Value: "bad-token"}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			revokeCalls := 0
			router := apihttp.NewRouter(fakeStore{revokeCalls: &revokeCalls})
			req := httptest.NewRequest(http.MethodPost, "/v1/auth/logout", nil)
			if tt.cookie != nil {
				req.AddCookie(tt.cookie)
			}
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusNoContent {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusNoContent, rec.Code, rec.Body.String())
			}
			if revokeCalls != 0 {
				t.Fatalf("expected no revoke call, got %d", revokeCalls)
			}
			assertSessionCookieCleared(t, rec)
		})
	}
}

func TestLogoutClearCookieSecureBehaviorMatchesRequest(t *testing.T) {
	token := sessionTokenForTest(t)
	tests := []struct {
		name       string
		target     string
		wantSecure bool
	}{
		{name: "localhost HTTP clear cookie remains local-dev compatible", target: "http://localhost:3000/v1/auth/logout", wantSecure: false},
		{name: "production-like host clear cookie is secure", target: "http://api.example.test/v1/auth/logout", wantSecure: true},
		{name: "TLS clear cookie is secure", target: "https://localhost:3000/v1/auth/logout", wantSecure: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := apihttp.NewRouter(fakeStore{})
			req := httptest.NewRequest(http.MethodPost, tt.target, nil)
			req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: token})
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusNoContent {
				t.Fatalf("expected status %d, got %d with body %s", http.StatusNoContent, rec.Code, rec.Body.String())
			}
			cookie := findCookie(rec, "clinicpulse_session")
			if cookie == nil {
				t.Fatalf("expected clinicpulse_session clear cookie, got %v", rec.Result().Cookies())
			}
			if cookie.Secure != tt.wantSecure {
				t.Fatalf("expected Secure=%t, got %#v", tt.wantSecure, cookie)
			}
		})
	}
}

type fakeStore struct {
	clinics                               []store.ClinicDetail
	clinic                                store.ClinicDetail
	status                                store.CurrentStatus
	reports                               []store.Report
	pendingReports                        []store.Report
	auditEvents                           []store.AuditEvent
	adminUsers                            []store.AdminUserAccessRow
	adminUserAccess                       store.AdminUserAccessRow
	adminAuditEvents                      []store.AdminAuditEventRow
	pilotIngestionRuns                    []store.PilotIngestionRun
	currentStatuses                       []store.CurrentStatus
	createReport                          store.Report
	createStatus                          store.CurrentStatus
	createAuditEvent                      store.AuditEvent
	createdUser                           store.User
	updatedUser                           store.User
	upsertMembership                      store.OrganisationMembership
	reviewReport                          store.Report
	reviewStatus                          *store.CurrentStatus
	user                                  store.User
	createSession                         store.Session
	createSessionAudit                    store.AuditEvent
	externalReport                        store.Report
	pendingPayloadReport                  store.Report
	syncAttempt                           store.ReportSyncAttempt
	session                               store.Session
	sessionUser                           store.User
	memberships                           []store.OrganisationMembership
	syncSummary                           *store.SyncSummary
	partnerAPIKey                         store.PartnerAPIKey
	partnerAPIKeys                        *[]store.PartnerAPIKey
	partnerWebhookSubscriptions           *[]store.PartnerWebhookSubscription
	partnerWebhookEvents                  *[]store.PartnerWebhookEvent
	partnerExportRuns                     *[]store.PartnerExportRun
	partnerExportRun                      store.PartnerExportRun
	partnerReadinessSnapshot              store.PartnerReadinessSnapshot
	integrationStatusChecks               []store.IntegrationStatusCheck
	upsertIntegrationStatusCheckInputs    *[]store.UpsertIntegrationStatusCheckInput
	upsertIntegrationStatusChecks         *[]store.IntegrationStatusCheck
	createInput                           *store.CreateReportInput
	createUserInput                       *store.CreateUserInput
	createAdminUserWithAccessInput        *store.CreateAdminUserWithAccessInput
	updateUserLifecycleInput              *store.UpdateUserLifecycleInput
	upsertMembershipInput                 *store.UpsertMembershipInput
	createPartnerAPIKeyInput              *store.CreatePartnerAPIKeyInput
	createPartnerWebhookSubscriptionInput *store.CreatePartnerWebhookSubscriptionInput
	createPartnerWebhookEventInput        *store.CreatePartnerWebhookEventInput
	createPartnerExportRunInput           *store.CreatePartnerExportRunInput
	reviewInput                           *store.ReviewReportInput
	syncAttemptInput                      *store.CreateReportSyncAttemptInput
	syncAttemptInputs                     *[]store.CreateReportSyncAttemptInput
	updateFreshnessInput                  *store.CreateAuditEventInput
	updateFreshnessCalled                 *bool
	listPartnerAPIKeysOrgID               *int64
	listPartnerWebhookSubscriptionsOrgID  *int64
	listPartnerWebhookEventsOrgID         *int64
	listAdminUsersOrgID                   **int64
	listAdminAuditEventsOrgID             **int64
	listAdminAuditEventsLimit             *int
	listPilotIngestionRunsOrgID           **int64
	listPilotIngestionRunsLimit           *int
	partnerReadinessOrgID                 *int64
	getPartnerExportRunOrgID              *int64
	getPartnerExportRunID                 *int64
	revokedPartnerAPIKeyID                *int64
	pendingScope                          *store.ReportReviewScope
	currentStatusScope                    *store.ReportReviewScope
	syncSummaryScope                      *store.ReportReviewScope
	summarySince                          *time.Time
	getUserEmail                          *string
	getUserByIDUserID                     *int64
	getUserCalls                          *int
	createSessionInput                    *store.CreateSessionInput
	sessionAuditInput                     *store.CreateSessionWithAuditInput
	auditInput                            *store.CreateAuditEventInput
	getSessionTokenHash                   *string
	userPasswordHash                      *string
	updatedPasswordHash                   *string
	updatePasswordUserID                  *int64
	revokedTokenHash                      *string
	revokedSessionsUserID                 *int64
	createCalls                           *int
	createAdminUserWithAccessCalls        *int
	createPartnerAPIKeyCalls              *int
	createPartnerWebhookEventCalls        *int
	createSessionCalls                    *int
	createSessionWithAuditCalls           *int
	auditCalls                            *int
	revokePartnerAPIKeyCalls              *int
	getSessionCalls                       *int
	revokeCalls                           *int
	partnerTouchCalls                     *int
	partnerTouchErr                       error
	listErr                               error
	getClinicErr                          error
	statusErr                             error
	reportsErr                            error
	pendingReportsErr                     error
	auditEventsErr                        error
	adminUsersErr                         error
	adminUserAccessErr                    error
	adminAuditEventsErr                   error
	pilotIngestionRunsErr                 error
	currentStatusesErr                    error
	createErr                             error
	createUserErr                         error
	createAdminUserWithAccessErr          error
	updateUserLifecycleErr                error
	upsertMembershipErr                   error
	updateFreshnessErr                    error
	reviewErr                             error
	getUserErr                            error
	getUserByIDErr                        error
	updatePasswordErr                     error
	createSessionErr                      error
	createSessionWithAuditErr             error
	auditErr                              error
	externalReportErr                     error
	pendingPayloadErr                     error
	syncAttemptErr                        error
	syncSummaryErr                        error
	getSessionErr                         error
	revokeErr                             error
	revokeSessionsErr                     error
	membershipsErr                        error
	partnerKeyErr                         error
	createPartnerAPIKeyErr                error
	listPartnerAPIKeysErr                 error
	revokePartnerAPIKeyErr                error
	createPartnerWebhookSubscriptionErr   error
	listPartnerWebhookSubscriptionsErr    error
	createPartnerWebhookEventErr          error
	listPartnerWebhookEventsErr           error
	createPartnerExportRunErr             error
	getPartnerExportRunErr                error
	partnerReadinessErr                   error
	partnerExportRunErr                   error
	integrationStatusChecksErr            error
	upsertIntegrationStatusCheckErr       error
	readyErr                              error
}

func (f fakeStore) Ready(context.Context) error {
	return f.readyErr
}

func (f fakeStore) ListClinics(context.Context) ([]store.ClinicDetail, error) {
	return f.clinics, f.listErr
}

func (f fakeStore) GetClinic(_ context.Context, clinicID string) (store.ClinicDetail, error) {
	if f.clinic.Clinic.ID == "" {
		return clinicDetailInDistrict(clinicID, defaultTestDistrict), f.getClinicErr
	}
	return f.clinic, f.getClinicErr
}

func (f fakeStore) GetCurrentStatus(context.Context, string) (store.CurrentStatus, error) {
	return f.status, f.statusErr
}

func (f fakeStore) ListClinicReports(context.Context, string) ([]store.Report, error) {
	return f.reports, f.reportsErr
}

func (f fakeStore) ListPendingReports(_ context.Context, scope store.ReportReviewScope) ([]store.Report, error) {
	if f.pendingScope != nil {
		*f.pendingScope = scope
	}
	return f.pendingReports, f.pendingReportsErr
}

func (f fakeStore) ListClinicAuditEvents(context.Context, string) ([]store.AuditEvent, error) {
	return f.auditEvents, f.auditEventsErr
}

func (f fakeStore) ListAdminUserAccess(_ context.Context, organisationID *int64) ([]store.AdminUserAccessRow, error) {
	if f.listAdminUsersOrgID != nil {
		*f.listAdminUsersOrgID = organisationID
	}
	return f.adminUsers, f.adminUsersErr
}

func (f fakeStore) ListAdminAuditEvents(_ context.Context, organisationID *int64, limit int) ([]store.AdminAuditEventRow, error) {
	if f.listAdminAuditEventsOrgID != nil {
		*f.listAdminAuditEventsOrgID = organisationID
	}
	if f.listAdminAuditEventsLimit != nil {
		*f.listAdminAuditEventsLimit = limit
	}
	return f.adminAuditEvents, f.adminAuditEventsErr
}

func (f fakeStore) ListPilotIngestionRuns(_ context.Context, organisationID *int64, limit int) ([]store.PilotIngestionRun, error) {
	if f.listPilotIngestionRunsOrgID != nil {
		*f.listPilotIngestionRunsOrgID = organisationID
	}
	if f.listPilotIngestionRunsLimit != nil {
		*f.listPilotIngestionRunsLimit = limit
	}
	return f.pilotIngestionRuns, f.pilotIngestionRunsErr
}

func (f fakeStore) CreateUser(_ context.Context, input store.CreateUserInput) (store.User, error) {
	if f.createUserInput != nil {
		*f.createUserInput = input
	}
	if f.createUserErr != nil {
		return store.User{}, f.createUserErr
	}
	now := time.Date(2026, 5, 3, 12, 0, 0, 0, time.UTC)
	user := f.createdUser
	if user.ID == 0 {
		user.ID = 101
	}
	if user.Email == "" {
		user.Email = input.Email
	}
	if user.DisplayName == "" {
		user.DisplayName = input.DisplayName
	}
	user.PasswordHash = input.PasswordHash
	user.PasswordResetRequired = input.PasswordResetRequired
	if user.CreatedAt.IsZero() {
		user.CreatedAt = now
	}
	if user.UpdatedAt.IsZero() {
		user.UpdatedAt = now
	}
	return user, nil
}

func (f fakeStore) CreateAdminUserWithAccessTx(_ context.Context, input store.CreateAdminUserWithAccessInput) (store.User, store.OrganisationMembership, store.AuditEvent, error) {
	if f.createAdminUserWithAccessCalls != nil {
		*f.createAdminUserWithAccessCalls++
	}
	if f.createAdminUserWithAccessInput != nil {
		*f.createAdminUserWithAccessInput = input
	}
	if f.createAdminUserWithAccessErr != nil {
		return store.User{}, store.OrganisationMembership{}, store.AuditEvent{}, f.createAdminUserWithAccessErr
	}
	now := time.Date(2026, 5, 3, 12, 0, 0, 0, time.UTC)
	user := f.createdUser
	if user.ID == 0 {
		user.ID = 101
	}
	if user.Email == "" {
		user.Email = input.User.Email
	}
	if user.DisplayName == "" {
		user.DisplayName = input.User.DisplayName
	}
	user.PasswordHash = input.User.PasswordHash
	user.PasswordResetRequired = input.User.PasswordResetRequired
	if user.CreatedAt.IsZero() {
		user.CreatedAt = now
	}
	if user.UpdatedAt.IsZero() {
		user.UpdatedAt = now
	}

	membership := f.upsertMembership
	if membership.ID == 0 {
		membership.ID = 1
	}
	membership.UserID = user.ID
	membership.OrganisationID = input.Access.OrganisationID
	membership.Role = input.Access.Role
	membership.District = input.Access.District
	if membership.CreatedAt.IsZero() {
		membership.CreatedAt = now
	}

	auditEvent := f.createAuditEvent
	if auditEvent.ID == 0 {
		auditEvent.ID = 1
	}
	auditEvent.EventType = input.AuditEvent.EventType
	auditEvent.Summary = input.AuditEvent.Summary
	auditEvent.ActorUserID = input.AuditEvent.ActorUserID
	auditEvent.ActorRole = input.AuditEvent.ActorRole
	auditEvent.OrganisationID = input.AuditEvent.OrganisationID
	auditEvent.EntityType = input.AuditEvent.EntityType
	if auditEvent.EntityType == nil {
		entityType := "user"
		auditEvent.EntityType = &entityType
	}
	auditEvent.EntityID = input.AuditEvent.EntityID
	if auditEvent.EntityID == nil {
		entityID := strconv.FormatInt(user.ID, 10)
		auditEvent.EntityID = &entityID
	}
	auditEvent.Metadata = input.AuditEvent.Metadata
	if auditEvent.CreatedAt.IsZero() {
		auditEvent.CreatedAt = now
	}
	return user, membership, auditEvent, nil
}

func (f fakeStore) GetUserByID(_ context.Context, userID int64) (store.User, error) {
	if f.getUserByIDUserID != nil {
		*f.getUserByIDUserID = userID
	}
	if f.getUserByIDErr != nil {
		return store.User{}, f.getUserByIDErr
	}
	if f.user.ID != 0 {
		return f.user, nil
	}
	if f.adminUserAccess.UserID != 0 {
		now := time.Date(2026, 5, 3, 12, 0, 0, 0, time.UTC)
		return store.User{
			ID:          f.adminUserAccess.UserID,
			Email:       f.adminUserAccess.Email,
			DisplayName: f.adminUserAccess.DisplayName,
			DisabledAt:  f.adminUserAccess.DisabledAt,
			CreatedAt:   now,
			UpdatedAt:   now,
		}, nil
	}
	return store.User{}, pgx.ErrNoRows
}

func (f fakeStore) GetAdminUserAccessByUserID(_ context.Context, userID int64) (store.AdminUserAccessRow, error) {
	if f.adminUserAccessErr != nil {
		return store.AdminUserAccessRow{}, f.adminUserAccessErr
	}
	if f.adminUserAccess.UserID == 0 {
		return store.AdminUserAccessRow{}, pgx.ErrNoRows
	}
	if f.adminUserAccess.UserID != userID {
		return store.AdminUserAccessRow{}, pgx.ErrNoRows
	}
	return f.adminUserAccess, nil
}

func (f fakeStore) UpdateUserLifecycle(_ context.Context, input store.UpdateUserLifecycleInput) (store.User, error) {
	if f.updateUserLifecycleInput != nil {
		*f.updateUserLifecycleInput = input
	}
	if f.updateUserLifecycleErr != nil {
		return store.User{}, f.updateUserLifecycleErr
	}
	user := f.updatedUser
	if user.ID == 0 {
		user.ID = input.UserID
	}
	if user.Email == "" {
		user.Email = f.adminUserAccess.Email
	}
	if user.DisplayName == "" {
		user.DisplayName = f.adminUserAccess.DisplayName
	}
	if input.DisplayName != nil {
		user.DisplayName = *input.DisplayName
	}
	if input.Disabled != nil && *input.Disabled {
		user.DisabledAt = &input.UpdatedAt
	}
	if input.Disabled != nil && !*input.Disabled {
		user.DisabledAt = nil
	}
	if user.CreatedAt.IsZero() {
		user.CreatedAt = time.Date(2026, 5, 3, 12, 0, 0, 0, time.UTC)
	}
	user.UpdatedAt = input.UpdatedAt
	return user, nil
}

func (f fakeStore) UpdateUserPassword(_ context.Context, userID int64, passwordHash string) (store.User, error) {
	if f.updatePasswordUserID != nil {
		*f.updatePasswordUserID = userID
	}
	if f.updatedPasswordHash != nil {
		*f.updatedPasswordHash = passwordHash
	}
	if f.updatePasswordErr != nil {
		return store.User{}, f.updatePasswordErr
	}
	now := time.Date(2026, 5, 3, 12, 0, 0, 0, time.UTC)
	user := f.updatedUser
	if user.ID == 0 {
		user.ID = userID
	}
	if user.Email == "" {
		user.Email = f.sessionUser.Email
	}
	if user.DisplayName == "" {
		user.DisplayName = f.sessionUser.DisplayName
	}
	user.PasswordHash = &passwordHash
	user.PasswordResetRequired = false
	if user.PasswordChangedAt == nil {
		user.PasswordChangedAt = &now
	}
	if user.CreatedAt.IsZero() {
		user.CreatedAt = now
	}
	if user.UpdatedAt.IsZero() {
		user.UpdatedAt = now
	}
	return user, nil
}

func (f fakeStore) UpsertOrganisationMembership(_ context.Context, input store.UpsertMembershipInput) (store.OrganisationMembership, error) {
	if f.upsertMembershipInput != nil {
		*f.upsertMembershipInput = input
	}
	if f.upsertMembershipErr != nil {
		return store.OrganisationMembership{}, f.upsertMembershipErr
	}
	membership := f.upsertMembership
	if membership.ID == 0 {
		membership.ID = 1
	}
	membership.UserID = input.UserID
	membership.OrganisationID = input.OrganisationID
	membership.Role = input.Role
	membership.District = input.District
	if membership.CreatedAt.IsZero() {
		membership.CreatedAt = time.Date(2026, 5, 3, 12, 0, 0, 0, time.UTC)
	}
	return membership, nil
}

func (f fakeStore) RevokeActiveSessionsForUser(_ context.Context, userID int64) (int64, error) {
	if f.revokedSessionsUserID != nil {
		*f.revokedSessionsUserID = userID
	}
	if f.revokeSessionsErr != nil {
		return 0, f.revokeSessionsErr
	}
	return 1, nil
}

func (f fakeStore) ListCurrentStatuses(context.Context) ([]store.CurrentStatus, error) {
	return f.currentStatuses, f.currentStatusesErr
}

func (f fakeStore) ListCurrentStatusesForReviewScope(_ context.Context, scope store.ReportReviewScope) ([]store.CurrentStatus, error) {
	if f.currentStatusScope != nil {
		*f.currentStatusScope = scope
	}
	return f.currentStatuses, f.currentStatusesErr
}

func (f fakeStore) UpdateCurrentStatusFreshness(_ context.Context, clinicID string, freshness string, updatedAt time.Time, audit *store.CreateAuditEventInput) (store.CurrentStatus, bool, error) {
	if f.updateFreshnessCalled != nil {
		*f.updateFreshnessCalled = true
	}
	if f.updateFreshnessInput != nil && audit != nil {
		*f.updateFreshnessInput = *audit
	}
	return store.CurrentStatus{ClinicID: clinicID, Freshness: freshness, UpdatedAt: updatedAt}, true, f.updateFreshnessErr
}

func (f fakeStore) CreateReportTx(_ context.Context, input store.CreateReportInput) (store.Report, store.CurrentStatus, store.AuditEvent, error) {
	if f.createCalls != nil {
		*f.createCalls++
	}
	if f.createInput != nil {
		*f.createInput = input
	}
	return f.createReport, f.createStatus, f.createAuditEvent, f.createErr
}

func (f fakeStore) CreatePendingReportTx(_ context.Context, input store.CreateReportInput) (store.Report, error) {
	if f.createCalls != nil {
		*f.createCalls++
	}
	if f.createInput != nil {
		*f.createInput = input
	}
	return f.createReport, f.createErr
}

func (f fakeStore) GetReportByExternalID(context.Context, string) (store.Report, error) {
	return f.externalReport, f.externalReportErr
}

func (f fakeStore) GetPendingReportByPayload(context.Context, store.CreateReportInput) (store.Report, error) {
	if f.pendingPayloadErr != nil {
		return store.Report{}, f.pendingPayloadErr
	}
	if f.pendingPayloadReport.ID == 0 {
		return store.Report{}, pgx.ErrNoRows
	}
	return f.pendingPayloadReport, nil
}

func (f fakeStore) GetRecentReportByPayload(context.Context, store.CreateReportInput, time.Time) (store.Report, error) {
	return store.Report{}, pgx.ErrNoRows
}

func (f fakeStore) CreateReportSyncAttempt(_ context.Context, input store.CreateReportSyncAttemptInput) (store.ReportSyncAttempt, error) {
	if f.syncAttemptInput != nil {
		*f.syncAttemptInput = input
	}
	if f.syncAttemptInputs != nil {
		*f.syncAttemptInputs = append(*f.syncAttemptInputs, input)
	}
	return f.syncAttempt, f.syncAttemptErr
}

func (f fakeStore) GetSyncSummarySince(_ context.Context, since time.Time) (store.SyncSummary, error) {
	if f.summarySince != nil {
		*f.summarySince = since
	}
	if f.syncSummary != nil {
		summary := *f.syncSummary
		summary.WindowStartedAt = since
		return summary, f.syncSummaryErr
	}
	return store.SyncSummary{WindowStartedAt: since}, f.syncSummaryErr
}

func (f fakeStore) GetSyncSummarySinceForReviewScope(_ context.Context, since time.Time, scope store.ReportReviewScope) (store.SyncSummary, error) {
	if f.summarySince != nil {
		*f.summarySince = since
	}
	if f.syncSummaryScope != nil {
		*f.syncSummaryScope = scope
	}
	if f.syncSummary != nil {
		summary := *f.syncSummary
		summary.WindowStartedAt = since
		return summary, f.syncSummaryErr
	}
	return store.SyncSummary{WindowStartedAt: since}, f.syncSummaryErr
}

func (f fakeStore) ReviewReportTx(_ context.Context, input store.ReviewReportInput) (store.Report, *store.CurrentStatus, error) {
	if f.reviewInput != nil {
		*f.reviewInput = input
	}
	return f.reviewReport, f.reviewStatus, f.reviewErr
}

func (f fakeStore) GetUserByEmail(_ context.Context, email string) (store.User, error) {
	if f.getUserCalls != nil {
		*f.getUserCalls++
	}
	if f.getUserEmail != nil {
		*f.getUserEmail = email
	}
	return f.user, f.getUserErr
}

func (f fakeStore) CreateSession(_ context.Context, input store.CreateSessionInput) (store.Session, error) {
	if f.createSessionCalls != nil {
		*f.createSessionCalls++
	}
	if f.createSessionInput != nil {
		*f.createSessionInput = input
	}
	session := f.createSession
	session.UserID = input.UserID
	session.TokenHash = input.TokenHash
	session.ExpiresAt = input.ExpiresAt
	session.UserAgent = input.UserAgent
	session.IPAddress = input.IPAddress
	return session, f.createSessionErr
}

func (f fakeStore) CreateSessionWithAuditTx(_ context.Context, input store.CreateSessionWithAuditInput) (store.Session, store.AuditEvent, error) {
	if f.createSessionWithAuditCalls != nil {
		*f.createSessionWithAuditCalls++
	}
	if f.createSessionInput != nil {
		*f.createSessionInput = input.Session
	}
	session := f.createSession
	session.UserID = input.Session.UserID
	session.TokenHash = input.Session.TokenHash
	session.ExpiresAt = input.Session.ExpiresAt
	session.UserAgent = input.Session.UserAgent
	session.IPAddress = input.Session.IPAddress
	auditInput := input.AuditEvent
	entityType := "session"
	auditInput.EntityType = &entityType
	entityID := strconv.FormatInt(session.ID, 10)
	auditInput.EntityID = &entityID
	if auditInput.Metadata == nil {
		auditInput.Metadata = map[string]any{}
	}
	auditInput.Metadata["sessionId"] = session.ID
	if f.sessionAuditInput != nil {
		*f.sessionAuditInput = store.CreateSessionWithAuditInput{
			Session:    input.Session,
			AuditEvent: auditInput,
		}
	}
	if f.auditCalls != nil {
		*f.auditCalls++
	}
	if f.auditInput != nil {
		*f.auditInput = auditInput
	}
	return session, f.createSessionAudit, f.createSessionWithAuditErr
}

func (f fakeStore) CreateAuditEvent(_ context.Context, input store.CreateAuditEventInput) (store.AuditEvent, error) {
	if f.auditCalls != nil {
		*f.auditCalls++
	}
	if f.auditInput != nil {
		*f.auditInput = input
	}
	return f.createAuditEvent, f.auditErr
}

func (f fakeStore) GetSessionByTokenHash(_ context.Context, tokenHash string) (store.Session, store.User, error) {
	if f.getSessionCalls != nil {
		*f.getSessionCalls++
	}
	if f.getSessionTokenHash != nil {
		*f.getSessionTokenHash = tokenHash
	}
	user := f.sessionUser
	if f.userPasswordHash != nil {
		user.PasswordHash = f.userPasswordHash
	}
	return f.session, user, f.getSessionErr
}

func (f fakeStore) RevokeSession(_ context.Context, tokenHash string) error {
	if f.revokeCalls != nil {
		*f.revokeCalls++
	}
	if f.revokedTokenHash != nil {
		*f.revokedTokenHash = tokenHash
	}
	return f.revokeErr
}

func (f fakeStore) ListMembershipsForUser(context.Context, int64) ([]store.OrganisationMembership, error) {
	return f.memberships, f.membershipsErr
}

func (f fakeStore) GetPartnerAPIKeyByHash(_ context.Context, keyHash string) (store.PartnerAPIKey, error) {
	if f.partnerKeyErr != nil {
		return store.PartnerAPIKey{}, f.partnerKeyErr
	}
	if f.partnerAPIKey.ID == 0 {
		return store.PartnerAPIKey{}, pgx.ErrNoRows
	}
	if f.partnerAPIKey.KeyHash != keyHash {
		return store.PartnerAPIKey{}, pgx.ErrNoRows
	}
	return f.partnerAPIKey, nil
}

func (f fakeStore) CreatePartnerAPIKey(_ context.Context, input store.CreatePartnerAPIKeyInput) (store.PartnerAPIKey, error) {
	if f.createPartnerAPIKeyCalls != nil {
		*f.createPartnerAPIKeyCalls++
	}
	if f.createPartnerAPIKeyInput != nil {
		*f.createPartnerAPIKeyInput = input
	}
	if f.createPartnerAPIKeyErr != nil {
		return store.PartnerAPIKey{}, f.createPartnerAPIKeyErr
	}
	apiKey := store.PartnerAPIKey{
		ID:               1,
		OrganisationID:   input.OrganisationID,
		Name:             input.Name,
		Environment:      input.Environment,
		KeyPrefix:        input.KeyPrefix,
		KeyHash:          input.KeyHash,
		Scopes:           input.Scopes,
		AllowedDistricts: input.AllowedDistricts,
		ExpiresAt:        input.ExpiresAt,
		CreatedByUserID:  input.CreatedByUserID,
		CreatedAt:        input.CreatedAt,
		UpdatedAt:        input.CreatedAt,
	}
	if f.partnerAPIKeys != nil {
		apiKey.ID = int64(len(*f.partnerAPIKeys) + 1)
		*f.partnerAPIKeys = append(*f.partnerAPIKeys, apiKey)
	}
	return apiKey, nil
}

func (f fakeStore) ListPartnerAPIKeys(_ context.Context, organisationID *int64) ([]store.PartnerAPIKey, error) {
	if f.listPartnerAPIKeysOrgID != nil && organisationID != nil {
		*f.listPartnerAPIKeysOrgID = *organisationID
	}
	if f.listPartnerAPIKeysErr != nil {
		return nil, f.listPartnerAPIKeysErr
	}
	if f.partnerAPIKeys != nil {
		return *f.partnerAPIKeys, nil
	}
	return nil, nil
}

func (f fakeStore) RevokePartnerAPIKey(_ context.Context, keyID int64, revokedAt time.Time) error {
	if f.revokePartnerAPIKeyCalls != nil {
		*f.revokePartnerAPIKeyCalls++
	}
	if f.revokedPartnerAPIKeyID != nil {
		*f.revokedPartnerAPIKeyID = keyID
	}
	if f.revokePartnerAPIKeyErr != nil {
		return f.revokePartnerAPIKeyErr
	}
	if f.partnerAPIKeys != nil {
		for index := range *f.partnerAPIKeys {
			if (*f.partnerAPIKeys)[index].ID == keyID {
				(*f.partnerAPIKeys)[index].RevokedAt = &revokedAt
				(*f.partnerAPIKeys)[index].UpdatedAt = revokedAt
				return nil
			}
		}
		return pgx.ErrNoRows
	}
	return nil
}

func (f fakeStore) TouchPartnerAPIKey(context.Context, int64, string, time.Time) error {
	if f.partnerTouchCalls != nil {
		*f.partnerTouchCalls++
	}
	return f.partnerTouchErr
}

func (f fakeStore) GetPartnerReadinessSnapshot(_ context.Context, organisationID *int64) (store.PartnerReadinessSnapshot, error) {
	if f.partnerReadinessOrgID != nil && organisationID != nil {
		*f.partnerReadinessOrgID = *organisationID
	}
	snapshot := f.partnerReadinessSnapshot
	if f.upsertIntegrationStatusChecks != nil {
		snapshot.IntegrationChecks = *f.upsertIntegrationStatusChecks
	}
	return snapshot, f.partnerReadinessErr
}

func (f fakeStore) CreatePartnerWebhookSubscription(_ context.Context, input store.CreatePartnerWebhookSubscriptionInput) (store.PartnerWebhookSubscription, error) {
	if f.createPartnerWebhookSubscriptionInput != nil {
		*f.createPartnerWebhookSubscriptionInput = input
	}
	if f.createPartnerWebhookSubscriptionErr != nil {
		return store.PartnerWebhookSubscription{}, f.createPartnerWebhookSubscriptionErr
	}
	subscription := store.PartnerWebhookSubscription{
		ID:               1,
		OrganisationID:   input.OrganisationID,
		Name:             input.Name,
		TargetURL:        input.TargetURL,
		EventTypes:       input.EventTypes,
		SecretHash:       input.SecretHash,
		Status:           input.Status,
		LastTestMetadata: input.LastTestMetadata,
		CreatedByUserID:  input.CreatedByUserID,
		CreatedAt:        input.CreatedAt,
		UpdatedAt:        input.CreatedAt,
	}
	if f.partnerWebhookSubscriptions != nil {
		subscription.ID = int64(len(*f.partnerWebhookSubscriptions) + 1)
		*f.partnerWebhookSubscriptions = append(*f.partnerWebhookSubscriptions, subscription)
	}
	return subscription, nil
}

func (f fakeStore) ListPartnerWebhookSubscriptions(_ context.Context, organisationID *int64) ([]store.PartnerWebhookSubscription, error) {
	if f.listPartnerWebhookSubscriptionsOrgID != nil && organisationID != nil {
		*f.listPartnerWebhookSubscriptionsOrgID = *organisationID
	}
	if f.listPartnerWebhookSubscriptionsErr != nil {
		return nil, f.listPartnerWebhookSubscriptionsErr
	}
	if f.partnerWebhookSubscriptions != nil {
		return *f.partnerWebhookSubscriptions, nil
	}
	return nil, nil
}

func (f fakeStore) CreatePartnerWebhookEvent(_ context.Context, input store.CreatePartnerWebhookEventInput) (store.PartnerWebhookEvent, error) {
	if f.createPartnerWebhookEventCalls != nil {
		*f.createPartnerWebhookEventCalls++
	}
	if f.createPartnerWebhookEventInput != nil {
		*f.createPartnerWebhookEventInput = input
	}
	if f.createPartnerWebhookEventErr != nil {
		return store.PartnerWebhookEvent{}, f.createPartnerWebhookEventErr
	}
	event := store.PartnerWebhookEvent{
		ID:             1,
		SubscriptionID: input.SubscriptionID,
		EventType:      input.EventType,
		Payload:        input.Payload,
		Metadata:       input.Metadata,
		Status:         input.Status,
		AttemptCount:   input.AttemptCount,
		LastError:      input.LastError,
		CreatedAt:      input.CreatedAt,
		DeliveredAt:    input.DeliveredAt,
	}
	if f.partnerWebhookEvents != nil {
		event.ID = int64(len(*f.partnerWebhookEvents) + 1)
		*f.partnerWebhookEvents = append(*f.partnerWebhookEvents, event)
	}
	return event, nil
}

func (f fakeStore) ListPartnerWebhookEvents(_ context.Context, organisationID *int64) ([]store.PartnerWebhookEvent, error) {
	if f.listPartnerWebhookEventsOrgID != nil && organisationID != nil {
		*f.listPartnerWebhookEventsOrgID = *organisationID
	}
	if f.listPartnerWebhookEventsErr != nil {
		return nil, f.listPartnerWebhookEventsErr
	}
	if f.partnerWebhookEvents != nil {
		return *f.partnerWebhookEvents, nil
	}
	return nil, nil
}

func (f fakeStore) CreatePartnerExportRun(_ context.Context, input store.CreatePartnerExportRunInput) (store.PartnerExportRun, error) {
	if f.createPartnerExportRunInput != nil {
		*f.createPartnerExportRunInput = input
	}
	if f.createPartnerExportRunErr != nil {
		return store.PartnerExportRun{}, f.createPartnerExportRunErr
	}
	exportRun := store.PartnerExportRun{
		ID:                1,
		OrganisationID:    input.OrganisationID,
		RequestedByUserID: input.RequestedByUserID,
		Format:            input.Format,
		Scope:             input.Scope,
		RecordCounts:      input.RecordCounts,
		Checksum:          input.Checksum,
		Payload:           input.Payload,
		CreatedAt:         input.CreatedAt,
	}
	if f.partnerExportRuns != nil {
		exportRun.ID = int64(len(*f.partnerExportRuns) + 1)
		*f.partnerExportRuns = append(*f.partnerExportRuns, exportRun)
	}
	return exportRun, nil
}

func (f fakeStore) GetPartnerExportRunForOrganisation(_ context.Context, organisationID *int64, exportID int64) (store.PartnerExportRun, error) {
	if f.getPartnerExportRunOrgID != nil && organisationID != nil {
		*f.getPartnerExportRunOrgID = *organisationID
	}
	if f.getPartnerExportRunID != nil {
		*f.getPartnerExportRunID = exportID
	}
	if f.getPartnerExportRunErr != nil {
		return store.PartnerExportRun{}, f.getPartnerExportRunErr
	}
	if f.partnerExportRuns != nil {
		for _, exportRun := range *f.partnerExportRuns {
			if exportRun.ID != exportID {
				continue
			}
			if organisationID != nil && (exportRun.OrganisationID == nil || *exportRun.OrganisationID != *organisationID) {
				return store.PartnerExportRun{}, pgx.ErrNoRows
			}
			return exportRun, nil
		}
		return store.PartnerExportRun{}, pgx.ErrNoRows
	}
	if f.partnerExportRun.ID != 0 {
		return f.partnerExportRun, nil
	}
	return store.PartnerExportRun{}, pgx.ErrNoRows
}

func (f fakeStore) GetLatestPartnerExportRun(context.Context, *int64) (store.PartnerExportRun, error) {
	return f.partnerExportRun, f.partnerExportRunErr
}

func (f fakeStore) UpsertIntegrationStatusCheck(_ context.Context, input store.UpsertIntegrationStatusCheckInput) (store.IntegrationStatusCheck, error) {
	if f.upsertIntegrationStatusCheckInputs != nil {
		*f.upsertIntegrationStatusCheckInputs = append(*f.upsertIntegrationStatusCheckInputs, input)
	}
	if f.upsertIntegrationStatusCheckErr != nil {
		return store.IntegrationStatusCheck{}, f.upsertIntegrationStatusCheckErr
	}
	check := store.IntegrationStatusCheck{
		ID:             int64(len(f.integrationStatusChecks) + 1),
		OrganisationID: input.OrganisationID,
		CheckName:      input.CheckName,
		Status:         input.Status,
		Summary:        input.Summary,
		Metadata:       input.Metadata,
		CheckedAt:      input.CheckedAt,
	}
	if f.upsertIntegrationStatusChecks != nil {
		check.ID = int64(len(*f.upsertIntegrationStatusChecks) + 1)
		*f.upsertIntegrationStatusChecks = append(*f.upsertIntegrationStatusChecks, check)
	}
	return check, nil
}

func (f fakeStore) ListIntegrationStatusChecks(context.Context, *int64) ([]store.IntegrationStatusCheck, error) {
	if f.upsertIntegrationStatusChecks != nil {
		return *f.upsertIntegrationStatusChecks, f.integrationStatusChecksErr
	}
	return f.integrationStatusChecks, f.integrationStatusChecksErr
}

func validReportJSON() string {
	return `{
		"clinicId":"clinic-1",
		"status":"operational",
		"staffPressure":"normal",
		"stockPressure":"normal",
		"queuePressure":"low",
		"reason":"Daily facility check",
		"source":"field_worker"
	}`
}

func validOfflineSyncJSON() string {
	return `{
		"items": [{
			"clientReportId": "offline-report-1",
			"clinicId": "clinic-1",
			"status": "degraded",
			"reason": "Queued while offline.",
			"staffPressure": "strained",
			"stockPressure": "low",
			"queuePressure": "high",
			"notes": "Pharmacy queue overflow.",
			"submittedAt": "2026-05-03T08:30:00Z",
			"queuedAt": "2026-05-03T08:30:03Z",
			"attemptCount": 2
		}]
	}`
}

func decodeJSON(t *testing.T, rec *httptest.ResponseRecorder, target any) {
	t.Helper()
	if err := json.Unmarshal(rec.Body.Bytes(), target); err != nil {
		t.Fatalf("failed to decode response %q: %v", rec.Body.String(), err)
	}
}

func decodeLogLine(t *testing.T, output *bytes.Buffer) map[string]any {
	t.Helper()
	return decodeLogLineAt(t, output, len(logLines(output))-1)
}

func decodeFirstLogLine(t *testing.T, output *bytes.Buffer) map[string]any {
	t.Helper()
	return decodeLogLineAt(t, output, 0)
}

func decodeLogLineAt(t *testing.T, output *bytes.Buffer, index int) map[string]any {
	t.Helper()
	var got map[string]any
	lines := logLines(output)
	if index < 0 || index >= len(lines) {
		t.Fatalf("expected log line %d, got %d lines in %q", index, len(lines), output.String())
	}
	line := lines[index]
	if err := json.Unmarshal(line, &got); err != nil {
		t.Fatalf("failed to decode log line %q: %v", string(line), err)
	}
	return got
}

func logLines(output *bytes.Buffer) [][]byte {
	trimmed := bytes.TrimSpace(output.Bytes())
	if len(trimmed) == 0 {
		return nil
	}
	return bytes.Split(trimmed, []byte("\n"))
}

func assertLogField(t *testing.T, logLine map[string]any, key string, want any) {
	t.Helper()
	if got := logLine[key]; got != want {
		t.Fatalf("expected log field %s=%#v, got %#v in %#v", key, want, got, logLine)
	}
}

func captureDefaultLogger(t *testing.T) *bytes.Buffer {
	t.Helper()
	var output bytes.Buffer
	logger := log.Default()
	previousWriter := logger.Writer()
	previousFlags := logger.Flags()
	previousPrefix := logger.Prefix()
	logger.SetOutput(&output)
	logger.SetFlags(0)
	logger.SetPrefix("")
	t.Cleanup(func() {
		logger.SetOutput(previousWriter)
		logger.SetFlags(previousFlags)
		logger.SetPrefix(previousPrefix)
	})
	return &output
}

func isValidTraceparentForTest(value string) bool {
	parts := strings.Split(value, "-")
	return len(parts) == 4 &&
		parts[0] == "00" &&
		isLowerHexForTest(parts[1], 32) &&
		isLowerHexForTest(parts[2], 16) &&
		isLowerHexForTest(parts[3], 2) &&
		!allZeroForTest(parts[1]) &&
		!allZeroForTest(parts[2])
}

func isLowerHexForTest(value string, length int) bool {
	if len(value) != length {
		return false
	}
	for _, char := range value {
		if (char < '0' || char > '9') && (char < 'a' || char > 'f') {
			return false
		}
	}
	return true
}

func allZeroForTest(value string) bool {
	for _, char := range value {
		if char != '0' {
			return false
		}
	}
	return true
}

type basicResponseWriter struct {
	header http.Header
	status int
	body   bytes.Buffer
}

func newBasicResponseWriter() *basicResponseWriter {
	return &basicResponseWriter{header: make(http.Header), status: http.StatusOK}
}

func (w *basicResponseWriter) Header() http.Header {
	return w.header
}

func (w *basicResponseWriter) Write(payload []byte) (int, error) {
	return w.body.Write(payload)
}

func (w *basicResponseWriter) WriteHeader(status int) {
	w.status = status
}

func isSafeRequestIDForTest(value string) bool {
	if len(value) < 8 || len(value) > 128 {
		return false
	}
	for _, char := range value {
		if char >= 'a' && char <= 'z' {
			continue
		}
		if char >= 'A' && char <= 'Z' {
			continue
		}
		if char >= '0' && char <= '9' {
			continue
		}
		if char == '.' || char == '_' || char == '-' {
			continue
		}
		return false
	}
	return true
}

func assertInternalError(t *testing.T, rec *httptest.ResponseRecorder, storeErr error) {
	t.Helper()
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusInternalServerError, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"internal_error"`) {
		t.Fatalf("expected internal_error code, got %q", rec.Body.String())
	}
	if strings.Contains(rec.Body.String(), storeErr.Error()) {
		t.Fatalf("expected response not to leak store error, got %q", rec.Body.String())
	}
}

func assertGenericUnauthorized(t *testing.T, rec *httptest.ResponseRecorder) {
	t.Helper()
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusUnauthorized, rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"unauthorized"`) {
		t.Fatalf("expected unauthorized code, got %q", rec.Body.String())
	}
	for _, leaked := range []string{"disabled", "password", "missing", "hash", "malformed"} {
		if strings.Contains(strings.ToLower(rec.Body.String()), leaked) {
			t.Fatalf("expected generic unauthorized response, got %q", rec.Body.String())
		}
	}
}

func assertPublicSafeResponse(t *testing.T, body string) {
	t.Helper()

	var payload any
	if err := json.Unmarshal([]byte(body), &payload); err != nil {
		t.Fatalf("failed to decode public response %q: %v", body, err)
	}
	forbiddenKeys := map[string]struct{}{
		"reporterName": {},
		"source":       {},
		"auditEvent":   {},
		"auditEvents":  {},
		"reviewState":  {},
		"notes":        {},
	}
	assertNoForbiddenJSONKeys(t, payload, forbiddenKeys)
}

func assertPartnerSafeReadinessResponse(t *testing.T, body string) {
	t.Helper()

	var payload any
	if err := json.Unmarshal([]byte(body), &payload); err != nil {
		t.Fatalf("failed to decode partner response %q: %v", body, err)
	}
	forbiddenKeys := map[string]struct{}{
		"requestedByUserId": {},
		"payload":           {},
		"metadata":          {},
		"submittedByUserId": {},
		"reviewedByUserId":  {},
	}
	assertNoForbiddenJSONKeys(t, payload, forbiddenKeys)
}

func assertNoForbiddenJSONKeys(t *testing.T, value any, forbiddenKeys map[string]struct{}) {
	t.Helper()
	switch typed := value.(type) {
	case map[string]any:
		for key, child := range typed {
			if _, forbidden := forbiddenKeys[key]; forbidden {
				t.Fatalf("expected public response not to contain JSON key %q", key)
			}
			assertNoForbiddenJSONKeys(t, child, forbiddenKeys)
		}
	case []any:
		for _, child := range typed {
			assertNoForbiddenJSONKeys(t, child, forbiddenKeys)
		}
	}
}

func assertSessionCookieCleared(t *testing.T, rec *httptest.ResponseRecorder) {
	t.Helper()
	cookie := findCookie(rec, "clinicpulse_session")
	if cookie == nil {
		t.Fatalf("expected clinicpulse_session clear cookie, got %v", rec.Result().Cookies())
	}
	if cookie.Value != "" {
		t.Fatalf("expected cleared cookie value, got %q", cookie.Value)
	}
	if cookie.Path != "/" {
		t.Fatalf("expected cleared cookie path /, got %q", cookie.Path)
	}
	if cookie.MaxAge >= 0 {
		t.Fatalf("expected MaxAge < 0, got %d", cookie.MaxAge)
	}
	if time.Until(cookie.Expires) >= 0 {
		t.Fatalf("expected expired cookie date, got %s", cookie.Expires)
	}
}

func findCookie(rec *httptest.ResponseRecorder, name string) *http.Cookie {
	for _, cookie := range rec.Result().Cookies() {
		if cookie.Name == name {
			return cookie
		}
	}
	return nil
}

func successfulLoginStore(t *testing.T) fakeStore {
	t.Helper()
	passwordHash := hashPasswordForTest(t, "correct-password")
	now := time.Date(2026, 5, 3, 8, 0, 0, 0, time.UTC)
	return fakeStore{
		user: store.User{
			ID:           42,
			Email:        "manager@example.test",
			DisplayName:  "Clinic Manager",
			PasswordHash: &passwordHash,
			CreatedAt:    now,
			UpdatedAt:    now,
		},
		createSession: store.Session{
			ID:        100,
			UserID:    42,
			CreatedAt: now,
			ExpiresAt: now.Add(12 * time.Hour),
		},
		memberships: []store.OrganisationMembership{
			{ID: 7, UserID: 42, Role: "district_manager", CreatedAt: now},
		},
	}
}

func hashPasswordForTest(t *testing.T, plaintext string) string {
	t.Helper()
	hash, err := auth.HashPassword(plaintext)
	if err != nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}
	return hash
}

func sessionTokenForTest(t *testing.T) string {
	t.Helper()
	token, err := auth.GenerateSessionToken()
	if err != nil {
		t.Fatalf("GenerateSessionToken returned error: %v", err)
	}
	return token
}

func hashSessionTokenForTest(t *testing.T, token string) string {
	t.Helper()
	hash, err := auth.HashSessionToken(token)
	if err != nil {
		t.Fatalf("HashSessionToken returned error: %v", err)
	}
	return hash
}

func authenticatedStore(t *testing.T, role string, f fakeStore) fakeStore {
	t.Helper()
	now := time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC)
	if f.session.ID == 0 {
		f.session = store.Session{
			ID:        100,
			UserID:    42,
			CreatedAt: now,
			ExpiresAt: now.Add(12 * time.Hour),
		}
	}
	if f.sessionUser.ID == 0 {
		f.sessionUser = store.User{
			ID:          f.session.UserID,
			Email:       "auth-user@example.test",
			DisplayName: "Authenticated User",
			CreatedAt:   now,
			UpdatedAt:   now,
		}
	}
	if f.memberships == nil {
		var district *string
		if role == "district_manager" {
			district = stringPtr(defaultTestDistrict)
		}
		f.memberships = []store.OrganisationMembership{{
			ID:        1,
			UserID:    f.sessionUser.ID,
			Role:      role,
			District:  district,
			CreatedAt: now,
		}}
	}
	return f
}

func authenticatedAdminStore(t *testing.T, role string, orgID int64, f fakeStore) fakeStore {
	t.Helper()
	now := time.Date(2026, 5, 3, 11, 0, 0, 0, time.UTC)
	if f.session.ID == 0 {
		f.session = store.Session{
			ID:        100,
			UserID:    42,
			CreatedAt: now,
			ExpiresAt: now.Add(12 * time.Hour),
		}
	}
	if f.sessionUser.ID == 0 {
		f.sessionUser = store.User{
			ID:          f.session.UserID,
			Email:       "admin@example.test",
			DisplayName: "Admin User",
			CreatedAt:   now,
			UpdatedAt:   now,
		}
	}
	f.memberships = []store.OrganisationMembership{{
		ID:             1,
		UserID:         f.sessionUser.ID,
		OrganisationID: &orgID,
		Role:           role,
		CreatedAt:      now,
	}}
	return f
}

func newAuthenticatedTestRouter(t *testing.T, f fakeStore) http.Handler {
	t.Helper()
	return apihttp.NewRouter(authenticatedStore(t, "district_manager", f))
}

func newAuthenticatedRequest(t *testing.T, method string, target string, body io.Reader) *http.Request {
	t.Helper()
	req := httptest.NewRequest(method, target, body)
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: sessionTokenForTest(t)})
	return req
}

func clinicDetail(id, name string, latitude, longitude float64, status, freshness string, services ...string) store.ClinicDetail {
	detail := store.ClinicDetail{
		Clinic: store.Clinic{
			ID:                 id,
			Name:               name,
			District:           defaultTestDistrict,
			Latitude:           &latitude,
			Longitude:          &longitude,
			FacilityType:       "clinic",
			VerificationStatus: "verified",
		},
		CurrentStatus: &store.CurrentStatus{
			ClinicID:  id,
			Status:    status,
			Freshness: freshness,
		},
	}

	for _, serviceName := range services {
		detail.Services = append(detail.Services, store.ClinicService{
			ClinicID:            id,
			ServiceName:         serviceName,
			CurrentAvailability: "available",
		})
	}

	return detail
}

func clinicDetailInDistrict(id string, district string) store.ClinicDetail {
	return store.ClinicDetail{
		Clinic: store.Clinic{
			ID:                 id,
			District:           district,
			FacilityType:       "clinic",
			VerificationStatus: "verified",
		},
	}
}
