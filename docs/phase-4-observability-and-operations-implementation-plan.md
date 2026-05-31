# Phase 4 Observability And Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ClinicPulse operable by adding structured logs, request correlation, metrics, trace context, error signals, runbooks, alerts, SLOs, and smoke/load checks.

**Architecture:** Build a low-dependency observability layer over the existing Next.js rewrite, Go chi API, Postgres health checks, and admin audit evidence. Use JSON logs, bounded in-memory Prometheus-style metrics, request ID and `traceparent` propagation, and documented operations workflows before introducing an external observability vendor.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Playwright, Node 24 scripts, Go chi API, Go stdlib logging/HTTP, Postgres, Docker, GitHub Actions.

---

## File Map

Create:

- `services/api/internal/observability/logger.go`: structured JSON logger and safe field helpers.
- `services/api/internal/observability/logger_test.go`: JSON log contract and redaction tests.
- `services/api/internal/observability/trace.go`: request ID and W3C `traceparent` parsing/generation helpers.
- `services/api/internal/observability/trace_test.go`: trace/request ID validation tests.
- `services/api/internal/observability/metrics.go`: bounded in-memory counters and duration histograms with Prometheus text rendering.
- `services/api/internal/observability/metrics_test.go`: metrics label, bucket, and rendering tests.
- `lib/observability/request-context.ts`: frontend request ID and traceparent helpers.
- `lib/observability/request-context.test.ts`: frontend trace/request ID helper tests.
- `middleware.ts`: Next middleware for `/api/clinicpulse/*` correlation headers.
- `scripts/smoke/clinicpulse-smoke.mjs`: core uptime and API journey smoke checks.
- `scripts/load/core-journeys.mjs`: lightweight load smoke script using Node fetch.
- `docs/operations/observability.md`: logs, metrics, traces, and dashboard/query guidance.
- `docs/operations/incident-response.md`: incident lifecycle and communication runbook.
- `docs/operations/alert-routing.md`: alert matrix and routing defaults.
- `docs/operations/slo.md`: pilot SLOs, burn-rate interpretation, and error-budget policy.
- `docs/phase-4-observability-and-operations-closeout.md`: final closeout after verification.

Modify:

- `services/api/internal/http/logging_middleware.go`: use structured logger, trace context, response headers, and metrics recorder.
- `services/api/internal/http/router.go`: wire observability middleware and `/metrics`.
- `services/api/internal/http/handlers.go`: emit readiness metrics and selected domain operation/error signals.
- `services/api/internal/http/respond.go`: include request IDs in error responses where safe and record error categories.
- `services/api/internal/http/auth_middleware.go`: record principal type, auth denials, rate-limit denials, and CSRF denials.
- `services/api/internal/http/security_middleware.go`: record CSRF/mutation guard outcomes.
- `services/api/internal/config/config.go`: add metrics enabled/token and observability service-name config.
- `services/api/internal/config/config_test.go`: validate observability config.
- `services/api/cmd/api/main.go`: create shared logger/metrics registry and pass observability options to the router.
- `lib/workspace/api-client.ts`: propagate request ID/trace headers for server-side API calls.
- `lib/auth/api.ts`: propagate request ID/trace headers for auth API calls.
- `lib/workspace/api-client.test.ts`: verify observability headers are set/preserved.
- `lib/auth/session.test.ts`: verify request correlation is preserved through session/API calls if needed.
- `Makefile`: add `smoke` and `load-smoke` targets.
- `package.json`: add script aliases for smoke/load checks if useful.
- `.github/workflows/ci.yml`: add smoke check job or step after API container smoke.
- `docs/deployment.md`: document metrics token, log forwarding, uptime checks, and alert destinations.
- `docs/release.md`: add Phase 4 observability gates.
- `docs/production-readiness-execution-plan.md`: update Phase 4 links/status and later closeout.

## Task 0: Prepare The Phase Branch And Baseline

**Files:**

- Read: `docs/phase-4-observability-and-operations-spec.md`
- Read: `docs/production-readiness-execution-plan.md`
- Read: `docs/phase-3-pilot-data-product-integrity-closeout.md`

- [ ] **Step 1: Create the implementation branch**

Run:

```bash
git switch main
git pull --ff-only
git switch -c feature/phase-4-observability-and-operations
```

Expected: branch switches to `feature/phase-4-observability-and-operations` from current `main`.

- [ ] **Step 2: Confirm clean branch state**

Run:

```bash
git status --short --branch
```

Expected: branch is clean.

- [ ] **Step 3: Run inherited release baseline**

Run:

```bash
make verify
```

Expected: existing web tests, lint, API tests, and production build pass before Phase 4 changes begin.

- [ ] **Step 4: Confirm current observability foundation**

Run:

```bash
rg -n "RequestLogger|healthz|readyz|metrics|traceparent|X-Request-Id" services app lib docs
```

Expected: output shows existing request logger and health/readiness endpoints; metrics and traceparent support are not yet complete.

- [ ] **Step 5: Commit planning docs if they are intended for the PR**

Run only if planning docs should be public in the branch:

```bash
git add docs/phase-4-observability-and-operations-spec.md docs/phase-4-observability-and-operations-implementation-plan.md docs/production-readiness-execution-plan.md
git commit -m "docs: plan phase 4 observability operations"
```

Expected: one docs commit. If planning docs are local-only, skip this step and keep implementation commits separate.

## Task 1: Add Backend Observability Primitives

**Files:**

- Create: `services/api/internal/observability/logger.go`
- Create: `services/api/internal/observability/logger_test.go`
- Create: `services/api/internal/observability/trace.go`
- Create: `services/api/internal/observability/trace_test.go`
- Create: `services/api/internal/observability/metrics.go`
- Create: `services/api/internal/observability/metrics_test.go`

- [ ] **Step 1: Write failing logger tests**

Create `services/api/internal/observability/logger_test.go` with tests that prove:

```go
func TestJSONLoggerWritesStructuredLine(t *testing.T) {
	var output bytes.Buffer
	logger := NewJSONLogger(&output, Fields{
		"service":    "clinicpulse-api",
		"deploy_env": "test",
	})

	logger.Info("request_completed", Fields{
		"request_id":  "req-12345678",
		"method":      "GET",
		"route":       "/healthz",
		"status":      200,
		"duration_ms": 12,
	})

	var got map[string]any
	if err := json.Unmarshal(bytes.TrimSpace(output.Bytes()), &got); err != nil {
		t.Fatalf("log line is not JSON: %v", err)
	}
	if got["level"] != "info" || got["event"] != "request_completed" {
		t.Fatalf("unexpected log payload: %#v", got)
	}
	if got["service"] != "clinicpulse-api" || got["deploy_env"] != "test" {
		t.Fatalf("missing base fields: %#v", got)
	}
}

func TestJSONLoggerRedactsSensitiveFields(t *testing.T) {
	var output bytes.Buffer
	logger := NewJSONLogger(&output, nil)

	logger.Error("auth_failed", Fields{
		"session_token": "secret-session",
		"api_key":       "cp_live_secret",
		"password":      "not-logged",
		"error":         errors.New("database unavailable"),
	})

	line := output.String()
	for _, forbidden := range []string{"secret-session", "cp_live_secret", "not-logged"} {
		if strings.Contains(line, forbidden) {
			t.Fatalf("expected log not to contain %q, got %s", forbidden, line)
		}
	}
}
```

- [ ] **Step 2: Write failing trace tests**

Create `services/api/internal/observability/trace_test.go` with tests for:

```go
func TestRequestIDPreservesSafeValues(t *testing.T) {
	got := RequestIDFromHeader("request-12345678")
	if got != "request-12345678" {
		t.Fatalf("expected safe request id to be preserved, got %q", got)
	}
}

func TestRequestIDRejectsUnsafeValues(t *testing.T) {
	if got := RequestIDFromHeader("abc status=500"); got != "" {
		t.Fatalf("expected unsafe request id to be rejected, got %q", got)
	}
}

func TestTraceparentRoundTrip(t *testing.T) {
	trace := TraceContextFromHeader("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01")
	if !trace.Valid || trace.TraceID != "4bf92f3577b34da6a3ce929d0e0e4736" {
		t.Fatalf("unexpected trace context: %#v", trace)
	}
	if trace.Header() != "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01" {
		t.Fatalf("unexpected trace header: %s", trace.Header())
	}
}
```

- [ ] **Step 3: Write failing metrics tests**

Create `services/api/internal/observability/metrics_test.go` with tests that prove:

```go
func TestRegistryRecordsRequestMetrics(t *testing.T) {
	registry := NewRegistry()
	registry.RecordHTTPRequest(HTTPRequestMetric{
		Method:        "GET",
		Route:         "/readyz",
		Status:        200,
		PrincipalType: "anonymous",
		Duration:      42 * time.Millisecond,
	})

	metrics := registry.RenderPrometheus()
	for _, want := range []string{
		`clinicpulse_http_requests_total{method="GET",principal_type="anonymous",route="/readyz",status_class="2xx"} 1`,
		"clinicpulse_http_request_duration_seconds_bucket",
		"clinicpulse_http_request_duration_seconds_sum",
	} {
		if !strings.Contains(metrics, want) {
			t.Fatalf("expected metrics to contain %q, got\n%s", want, metrics)
		}
	}
}

func TestRegistryBoundsRouteLabels(t *testing.T) {
	registry := NewRegistry()
	registry.RecordHTTPRequest(HTTPRequestMetric{
		Method:        "GET",
		Route:         "/v1/clinics/clinic-secret-id/status",
		Status:        404,
		PrincipalType: "session",
		Duration:      time.Millisecond,
	})

	metrics := registry.RenderPrometheus()
	if strings.Contains(metrics, "clinic-secret-id") {
		t.Fatalf("expected raw ids not to appear in metrics, got\n%s", metrics)
	}
}
```

- [ ] **Step 4: Run failing observability primitive tests**

Run:

```bash
cd services/api && go test ./internal/observability
```

Expected: FAIL because the package does not exist yet.

- [ ] **Step 5: Implement the primitives**

Implement:

- `Fields map[string]any`
- `JSONLogger` with `Info`, `Warn`, and `Error`.
- Sensitive-key redaction for keys containing `password`, `token`, `secret`, `api_key`, `authorization`, `cookie`, and `payload`.
- Request ID validation/generation helpers.
- W3C `traceparent` parser/generator with safe fallback.
- `Registry` with bounded request counters, duration buckets, error counters, readiness metrics, rate-limit/CSRF counters, and domain operation counters.
- Prometheus text rendering.

Design constraints:

- Use only Go stdlib.
- Do not store raw request paths with IDs as metric labels.
- Do not log raw request bodies.
- Make the registry safe for concurrent requests.

- [ ] **Step 6: Verify primitive tests pass**

Run:

```bash
cd services/api && go test ./internal/observability
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add services/api/internal/observability
git commit -m "feat: add observability primitives"
```

## Task 2: Instrument API Requests With Structured Logs, Trace Context, And Metrics

**Files:**

- Modify: `services/api/internal/http/logging_middleware.go`
- Modify: `services/api/internal/http/router.go`
- Modify: `services/api/internal/http/handlers_test.go`
- Modify: `services/api/cmd/api/main.go`

- [ ] **Step 1: Add failing request instrumentation tests**

Update the existing request logger tests in `services/api/internal/http/handlers_test.go` to assert:

- log output is JSON,
- response contains `X-Request-Id`,
- response contains `traceparent`,
- log contains `trace_id`, `span_id`, `route`, `status_class`, and `principal_type`,
- metrics registry records the request.

Expected test shape:

```go
func TestRequestLoggerWritesJSONAndRecordsMetrics(t *testing.T) {
	var logOutput bytes.Buffer
	logger := observability.NewJSONLogger(&logOutput, observability.Fields{
		"service": "clinicpulse-api",
	})
	registry := observability.NewRegistry()
	handler := apihttp.RequestLogger(logger, registry)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTeapot)
	}))
	req := httptest.NewRequest(http.MethodGet, "/logged", nil)
	req.Header.Set("X-Request-Id", "request-12345678")
	req.Header.Set("traceparent", "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Header().Get("X-Request-Id") != "request-12345678" {
		t.Fatalf("expected response request id, got %q", rec.Header().Get("X-Request-Id"))
	}
	if rec.Header().Get("traceparent") == "" {
		t.Fatal("expected response traceparent")
	}
	var got map[string]any
	if err := json.Unmarshal(bytes.TrimSpace(logOutput.Bytes()), &got); err != nil {
		t.Fatalf("expected JSON log: %v", err)
	}
	if got["event"] != "http_request_completed" || got["status_class"] != "4xx" {
		t.Fatalf("unexpected log payload: %#v", got)
	}
	if !strings.Contains(registry.RenderPrometheus(), "clinicpulse_http_requests_total") {
		t.Fatal("expected request metrics")
	}
}
```

- [ ] **Step 2: Run failing HTTP tests**

Run:

```bash
cd services/api && go test ./internal/http -run 'TestRequestLogger|TestHealthz|TestReadyz'
```

Expected: FAIL until middleware signature and structured logging are implemented.

- [ ] **Step 3: Update request middleware**

Change `RequestLogger` to accept:

```go
func RequestLogger(logger *observability.JSONLogger, registry *observability.Registry) func(nethttp.Handler) nethttp.Handler
```

Required behavior:

- Use observability request ID helpers.
- Use trace context helpers.
- Set `X-Request-Id` and `traceparent` response headers.
- Store request ID and trace context in request context.
- Preserve existing principal-type marking behavior.
- Record request duration/status/principal metrics after the handler returns.
- Log one JSON `http_request_completed` event per request.
- Use the chi route pattern when available; otherwise use a sanitized route fallback.

- [ ] **Step 4: Wire middleware from `main.go`**

In `services/api/cmd/api/main.go`:

- construct one JSON logger with base fields,
- construct one metrics registry,
- pass both to `apihttp.NewRouter`.

Router options should keep existing behavior while adding observability options.

- [ ] **Step 5: Verify HTTP instrumentation tests pass**

Run:

```bash
cd services/api && go test ./internal/http -run 'TestRequestLogger|TestHealthz|TestReadyz'
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add services/api/internal/http/logging_middleware.go services/api/internal/http/router.go services/api/internal/http/handlers_test.go services/api/cmd/api/main.go
git commit -m "feat: instrument api requests"
```

## Task 3: Add Protected Metrics Endpoint And Readiness Metrics

**Files:**

- Modify: `services/api/internal/config/config.go`
- Modify: `services/api/internal/config/config_test.go`
- Modify: `services/api/internal/http/router.go`
- Modify: `services/api/internal/http/handlers.go`
- Modify: `services/api/internal/http/handlers_test.go`
- Modify: `services/api/cmd/api/main.go`

- [ ] **Step 1: Add failing config tests**

Add tests for:

- local defaults enable metrics without token,
- `CLINICPULSE_METRICS_ENABLED=false` disables metrics,
- staging/production require `CLINICPULSE_METRICS_TOKEN` when metrics are enabled,
- token must be at least 24 characters outside local.

Expected test names:

```go
func TestLoadAllowsLocalMetricsWithoutToken(t *testing.T) {}
func TestLoadDisablesMetricsWhenConfigured(t *testing.T) {}
func TestLoadRequiresMetricsTokenOutsideLocal(t *testing.T) {}
func TestLoadRejectsShortMetricsTokenOutsideLocal(t *testing.T) {}
```

- [ ] **Step 2: Add failing endpoint tests**

Add HTTP tests:

```go
func TestMetricsEndpointRendersPrometheusMetrics(t *testing.T) {}
func TestMetricsEndpointRequiresBearerTokenWhenConfigured(t *testing.T) {}
func TestMetricsEndpointReturnsNotFoundWhenDisabled(t *testing.T) {}
func TestReadyzRecordsReadinessMetrics(t *testing.T) {}
```

Expected behavior:

- local enabled `/metrics` returns `200` and `text/plain; version=0.0.4`,
- configured token requires `Authorization: Bearer <token>`,
- disabled metrics returns `404`,
- readiness success/failure increments readiness metrics.

- [ ] **Step 3: Run failing tests**

Run:

```bash
cd services/api && go test ./internal/config ./internal/http -run 'Metrics|Readyz'
```

Expected: FAIL until config and endpoint are implemented.

- [ ] **Step 4: Implement config fields**

Add to config:

```go
MetricsEnabled bool
MetricsToken string
ObservabilityServiceName string
```

Environment variables:

- `CLINICPULSE_METRICS_ENABLED`, default `true`
- `CLINICPULSE_METRICS_TOKEN`
- `CLINICPULSE_OBSERVABILITY_SERVICE_NAME`, default `clinicpulse-api`

Validation:

- metrics token required outside local when metrics enabled,
- token length at least 24 outside local,
- service name non-empty.

- [ ] **Step 5: Implement `/metrics`**

Router behavior:

- Add `router.Get("/metrics", handler.Metrics)` only when metrics enabled.
- Handler renders `registry.RenderPrometheus()`.
- If token configured, require `Authorization: Bearer <token>`.
- Record metrics endpoint requests through normal request middleware.

- [ ] **Step 6: Verify tests pass**

Run:

```bash
cd services/api && go test ./internal/config ./internal/http -run 'Metrics|Readyz'
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add services/api/internal/config/config.go services/api/internal/config/config_test.go services/api/internal/http/router.go services/api/internal/http/handlers.go services/api/internal/http/handlers_test.go services/api/cmd/api/main.go
git commit -m "feat: expose protected api metrics"
```

## Task 4: Add Frontend/API Request Correlation

**Files:**

- Create: `lib/observability/request-context.ts`
- Create: `lib/observability/request-context.test.ts`
- Create: `middleware.ts`
- Modify: `lib/workspace/api-client.ts`
- Modify: `lib/auth/api.ts`
- Modify: `lib/workspace/api-client.test.ts`
- Modify: `lib/auth/session.test.ts`

- [ ] **Step 1: Write failing frontend helper tests**

Create `lib/observability/request-context.test.ts` with tests for:

- safe request ID preservation,
- unsafe request ID replacement,
- traceparent preservation,
- traceparent generation,
- request header merge without overwriting explicit caller headers.

- [ ] **Step 2: Add failing API client tests**

Update `lib/workspace/api-client.test.ts` and auth/session API tests to assert server-side requests include:

- `X-Request-Id`
- `traceparent`

Expected behavior:

- Explicit headers passed by caller are preserved.
- Missing observability headers are generated.
- Relative browser base URL behavior remains unchanged.

- [ ] **Step 3: Run failing frontend tests**

Run:

```bash
npm test -- lib/observability/request-context.test.ts lib/workspace/api-client.test.ts lib/auth/session.test.ts
```

Expected: FAIL until helpers/client propagation are implemented.

- [ ] **Step 4: Implement request context helpers**

Implement helpers:

```ts
export function safeRequestId(value?: string | null): string | null
export function createRequestId(): string
export function safeTraceparent(value?: string | null): string | null
export function createTraceparent(): string
export function withObservabilityHeaders(headers?: HeadersInit): Headers
```

Constraints:

- Do not include user email, path, or payload in generated IDs.
- Preserve caller-provided safe headers.
- Keep implementation runtime-compatible with Next middleware and Node tests.

- [ ] **Step 5: Implement Next middleware**

Create `middleware.ts`:

- Match `/api/clinicpulse/:path*`.
- Add request ID and traceparent to forwarded request headers when missing.
- Add request ID and traceparent to response headers.
- Do not change auth cookies, body, or rewrite destination.

- [ ] **Step 6: Update API clients**

Update `lib/workspace/api-client.ts` and `lib/auth/api.ts`:

- call `withObservabilityHeaders` inside request init construction,
- preserve existing cookie/content-type behavior,
- do not log in browser code,
- do not alter error classes.

- [ ] **Step 7: Verify frontend tests pass**

Run:

```bash
npm test -- lib/observability/request-context.test.ts lib/workspace/api-client.test.ts lib/auth/session.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add lib/observability/request-context.ts lib/observability/request-context.test.ts middleware.ts lib/workspace/api-client.ts lib/auth/api.ts lib/workspace/api-client.test.ts lib/auth/session.test.ts
git commit -m "feat: propagate request correlation"
```

## Task 5: Record Error And Domain Operation Signals

**Files:**

- Modify: `services/api/internal/http/respond.go`
- Modify: `services/api/internal/http/auth_middleware.go`
- Modify: `services/api/internal/http/security_middleware.go`
- Modify: `services/api/internal/http/handlers.go`
- Modify: `services/api/internal/http/handlers_test.go`

- [ ] **Step 1: Add failing error-signal tests**

Add tests proving:

- store errors increment `clinicpulse_http_errors_total{error_kind="store"}`,
- validation errors increment `error_kind="validation"`,
- login throttling increments `clinicpulse_rate_limit_denials_total`,
- CSRF rejection increments `clinicpulse_csrf_denials_total`,
- partner webhook test failure records a `domain_operations_total` signal.

- [ ] **Step 2: Run failing tests**

Run:

```bash
cd services/api && go test ./internal/http -run 'Error|RateLimit|CSRF|Webhook|Metrics'
```

Expected: FAIL until error/domain signals are wired.

- [ ] **Step 3: Add error category recording**

Implementation requirements:

- classify errors as `store`, `auth`, `validation`, `rate_limit`, `csrf`, `partner`, `sync`, or `unknown`,
- increment counters without logging sensitive payloads,
- include `request_id` in JSON error responses where it helps support correlation,
- keep existing HTTP status codes and response shapes compatible except for additive `requestId`.

- [ ] **Step 4: Add domain operation signals**

Record bounded operations:

- `auth.login` with result `success`, `invalid_credentials`, `rate_limited`, or `error`,
- `report.create` with result `created`, `pending_review`, `duplicate`, `validation_error`, or `error`,
- `report.review` with result `accepted`, `rejected`, or `error`,
- `offline_sync` with result `synced`, `duplicate`, `conflict`, `validation_error`, or `error`,
- `partner.export` with result `created` or `error`,
- `partner.webhook_test` with result `preview_only`, `failed`, or `error`.

- [ ] **Step 5: Verify tests pass**

Run:

```bash
cd services/api && go test ./internal/http -run 'Error|RateLimit|CSRF|Webhook|Metrics'
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add services/api/internal/http/respond.go services/api/internal/http/auth_middleware.go services/api/internal/http/security_middleware.go services/api/internal/http/handlers.go services/api/internal/http/handlers_test.go
git commit -m "feat: record api error and operation signals"
```

## Task 6: Add Operations Runbooks, Alerts, And SLOs

**Files:**

- Create: `docs/operations/observability.md`
- Create: `docs/operations/incident-response.md`
- Create: `docs/operations/alert-routing.md`
- Create: `docs/operations/slo.md`
- Modify: `docs/deployment.md`
- Modify: `docs/release.md`

- [ ] **Step 1: Write observability docs**

`docs/operations/observability.md` must include:

- log field reference,
- metrics endpoint setup,
- metrics token behavior,
- safe log forwarding guidance for Render/Railway/Vercel,
- dashboard query examples for request volume, 5xx rate, latency, readiness, auth denials, sync failures, webhook failures, and partner export failures,
- privacy/redaction rules.

- [ ] **Step 2: Write incident runbook**

`docs/operations/incident-response.md` must include:

- severity levels,
- triage checklist,
- request ID/trace ID lookup procedure,
- database-down procedure,
- auth/login degradation procedure,
- high 5xx procedure,
- stale data/sync failure procedure,
- partner webhook/export failure procedure,
- stakeholder communication template,
- post-incident review template.

- [ ] **Step 3: Write alert routing matrix**

`docs/operations/alert-routing.md` must include:

- alert name,
- signal/query,
- threshold,
- route/owner,
- first response action,
- escalation note.

Minimum alerts:

- API health down,
- readiness/database unavailable,
- 5xx rate elevated,
- p95 latency elevated,
- login throttling spike,
- CSRF denials spike,
- offline sync failures elevated,
- webhook failures elevated,
- export generation failures,
- stale clinic count elevated.

- [ ] **Step 4: Write SLO document**

`docs/operations/slo.md` must include pilot-stage objectives:

- API availability,
- frontend availability,
- API p95 latency,
- authenticated workflow success,
- data freshness,
- incident acknowledgement time,
- incident communication time.

Use conservative alpha/pilot wording; do not imply contractual SLA.

- [ ] **Step 5: Update deployment and release docs**

Update:

- `docs/deployment.md` with metrics token, log forwarding, uptime checks, and observability env vars.
- `docs/release.md` with Phase 4 observability gates.

- [ ] **Step 6: Commit**

```bash
git add docs/operations/observability.md docs/operations/incident-response.md docs/operations/alert-routing.md docs/operations/slo.md docs/deployment.md docs/release.md
git commit -m "docs: add operations runbooks and slo policy"
```

## Task 7: Add Smoke And Load Checks

**Files:**

- Create: `scripts/smoke/clinicpulse-smoke.mjs`
- Create: `scripts/load/core-journeys.mjs`
- Modify: `Makefile`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Write smoke script**

Create `scripts/smoke/clinicpulse-smoke.mjs`.

Required behavior:

- Read `CLINICPULSE_API_BASE_URL`, default `http://localhost:8080`.
- Check `/healthz`.
- Check `/readyz`.
- Check `/v1/public/clinics`.
- If `CLINICPULSE_SMOKE_EMAIL` and `CLINICPULSE_SMOKE_PASSWORD` are present, log in and check `/v1/auth/me`, `/v1/reports/pending`, `/v1/sync/summary`, and `/v1/admin/partner-readiness` when the role allows.
- Print one line per check with method, path, status, duration, and request ID.
- Exit non-zero on failed required checks.
- Never print passwords, cookies, or tokens.

- [ ] **Step 2: Write load smoke script**

Create `scripts/load/core-journeys.mjs`.

Required behavior:

- Use Node built-in `fetch`.
- Read `CLINICPULSE_API_BASE_URL`, `CLINICPULSE_LOAD_CONCURRENCY`, `CLINICPULSE_LOAD_DURATION_SECONDS`.
- Exercise `/healthz`, `/readyz`, `/v1/public/clinics`, and `/v1/public/alternatives?clinicId=<firstClinic>&service=Primary%20care`.
- Track total requests, failures, p50, p95, max latency.
- Fail when failure rate exceeds 1% or p95 exceeds 1000ms for local smoke.
- Keep defaults small enough for local/CI smoke.

- [ ] **Step 3: Add package and make targets**

Add scripts:

```json
"smoke": "node scripts/smoke/clinicpulse-smoke.mjs",
"load:smoke": "node scripts/load/core-journeys.mjs"
```

Add Make targets:

```make
smoke:
	npm run smoke

load-smoke:
	npm run load:smoke
```

- [ ] **Step 4: Add CI smoke step**

In `.github/workflows/ci.yml`, add the smoke script after API container smoke only if the API container is already running or adjust `make test-api-container` to support a smoke sub-step. Do not make CI depend on external staging.

- [ ] **Step 5: Run targeted script checks**

Run:

```bash
node --check scripts/smoke/clinicpulse-smoke.mjs
node --check scripts/load/core-journeys.mjs
```

Expected: both parse successfully.

- [ ] **Step 6: Commit**

```bash
git add scripts/smoke/clinicpulse-smoke.mjs scripts/load/core-journeys.mjs Makefile package.json .github/workflows/ci.yml
git commit -m "test: add operations smoke checks"
```

## Task 8: Add Release Integration And Closeout

**Files:**

- Modify: `docs/production-readiness-execution-plan.md`
- Create: `docs/phase-4-observability-and-operations-closeout.md`

- [ ] **Step 1: Update production-readiness plan**

Update:

- Phase 4 status to `Complete` only after all verification passes.
- Add closeout link under Phase 4.
- Move current phase to Phase 5.
- Keep Phase 5 status `Not started`.

- [ ] **Step 2: Create closeout**

Create `docs/phase-4-observability-and-operations-closeout.md` with:

- completed outcomes,
- observability signals added,
- runbooks added,
- smoke/load checks added,
- verification commands and outcomes,
- residual risks,
- Phase 5 handoff notes.

- [ ] **Step 3: Run final verification**

Run:

```bash
npm ci
make verify
make test-e2e
make verify-security
make test-api-container
npm run smoke
npm run load:smoke
git status --short
```

Expected:

- all inherited release gates pass,
- smoke and load smoke pass against the configured local/API container target,
- git status shows only intentional closeout changes before final commit.

- [ ] **Step 4: Commit closeout**

```bash
git add docs/production-readiness-execution-plan.md docs/phase-4-observability-and-operations-closeout.md
git commit -m "docs: close out phase 4 observability operations"
```

## Final PR Checklist

- [ ] `npm ci`
- [ ] `make verify`
- [ ] `make test-e2e`
- [ ] `make verify-security`
- [ ] `make test-api-container`
- [ ] `npm run smoke`
- [ ] `npm run load:smoke`
- [ ] `git diff --check main...HEAD`
- [ ] `git status --short`

PR summary should call out:

- JSON logs and request correlation,
- metrics endpoint and protection model,
- error/domain operation signals,
- runbooks/SLOs/alerts,
- smoke/load checks,
- residual non-goals: no external observability vendor, no distributed tracing backend, no production scheduler.
