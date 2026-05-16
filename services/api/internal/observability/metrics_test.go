package observability

import (
	"strings"
	"sync"
	"testing"
	"time"
)

func TestRegistryRecordsRequestMetrics(t *testing.T) {
	registry := NewRegistry()
	registry.RecordHTTPRequest(HTTPRequestMetric{
		Method:        "GET",
		Route:         "/readyz",
		Status:        200,
		PrincipalType: "anonymous",
		Duration:      25 * time.Millisecond,
	})

	got := registry.RenderPrometheus()
	want := []string{
		`clinicpulse_http_requests_total{method="GET",route="/readyz",status_class="2xx",principal_type="anonymous"} 1`,
		`clinicpulse_http_request_duration_seconds_count{method="GET",route="/readyz",status_class="2xx",principal_type="anonymous"} 1`,
		`clinicpulse_http_request_duration_seconds_sum{method="GET",route="/readyz",status_class="2xx",principal_type="anonymous"} 0.025`,
		`clinicpulse_http_request_duration_seconds_bucket{method="GET",route="/readyz",status_class="2xx",principal_type="anonymous",le="0.05"} 1`,
	}
	for _, needle := range want {
		if !strings.Contains(got, needle) {
			t.Fatalf("expected metrics to contain %q, got:\n%s", needle, got)
		}
	}
}

func TestRegistryRendersRequiredMetricFamilies(t *testing.T) {
	got := NewRegistry().RenderPrometheus()
	for _, name := range []string{
		"clinicpulse_http_requests_total",
		"clinicpulse_http_request_duration_seconds",
		"clinicpulse_http_errors_total",
		"clinicpulse_rate_limit_denials_total",
		"clinicpulse_csrf_denials_total",
		"clinicpulse_readiness_checks_total",
		"clinicpulse_readiness_check_duration_seconds",
		"clinicpulse_domain_operations_total",
	} {
		if !strings.Contains(got, "# HELP "+name) || !strings.Contains(got, "# TYPE "+name) {
			t.Fatalf("expected HELP and TYPE for %s, got:\n%s", name, got)
		}
	}
}

func TestRegistryRecordsHTTPErrorKinds(t *testing.T) {
	registry := NewRegistry()
	registry.RecordHTTPError("store")
	registry.RecordHTTPError("store")
	registry.RecordHTTPError("validation")

	got := registry.RenderPrometheus()
	for _, needle := range []string{
		`clinicpulse_http_errors_total{error_kind="store"} 2`,
		`clinicpulse_http_errors_total{error_kind="validation"} 1`,
	} {
		if !strings.Contains(got, needle) {
			t.Fatalf("expected HTTP error kind metric %q, got:\n%s", needle, got)
		}
	}
	if strings.Contains(got, `clinicpulse_http_errors_total{method=`) {
		t.Fatalf("expected HTTP error family not to mix route/status labels with error_kind labels, got:\n%s", got)
	}
}

func TestRegistryBoundsHTTPErrorKinds(t *testing.T) {
	registry := NewRegistry()
	registry.RecordHTTPError("not a real kind")
	registry.RecordHTTPError("")

	got := registry.RenderPrometheus()
	if strings.Contains(got, "not a real kind") {
		t.Fatalf("expected raw error kind not to be rendered, got:\n%s", got)
	}
	if !strings.Contains(got, `clinicpulse_http_errors_total{error_kind="unknown"} 2`) {
		t.Fatalf("expected unknown error kind metric, got:\n%s", got)
	}
}

func TestRegistryDoesNotRenderRequestDerivedHTTPErrorSamples(t *testing.T) {
	registry := NewRegistry()
	registry.RecordHTTPRequest(HTTPRequestMetric{
		Method:        "GET",
		Route:         "/v1/clinics/clinic-secret-id/status",
		Status:        500,
		PrincipalType: "session",
		Duration:      10 * time.Millisecond,
	})

	got := registry.RenderPrometheus()
	if strings.Contains(got, `clinicpulse_http_errors_total{method=`) {
		t.Fatalf("expected HTTP errors to be categorized by error_kind only, got:\n%s", got)
	}
}

func TestRegistryBoundsUnknownDomainOperations(t *testing.T) {
	registry := NewRegistry()
	registry.RecordDomainOperation("report.review", "approved-ish")
	registry.RecordDomainOperation("secret.operation", "leaked-result")

	got := registry.RenderPrometheus()
	for _, forbidden := range []string{"approved-ish", "secret.operation", "leaked-result"} {
		if strings.Contains(got, forbidden) {
			t.Fatalf("expected raw domain label %q not to be rendered, got:\n%s", forbidden, got)
		}
	}
	for _, needle := range []string{
		`clinicpulse_domain_operations_total{operation="report.review",result="unknown"} 1`,
		`clinicpulse_domain_operations_total{operation="unknown",result="unknown"} 1`,
	} {
		if !strings.Contains(got, needle) {
			t.Fatalf("expected bounded domain operation metric %q, got:\n%s", needle, got)
		}
	}
}

func TestRegistryRendersReadinessDurationSummarySamples(t *testing.T) {
	registry := NewRegistry()
	registry.RecordReadinessCheck("ok", 15*time.Millisecond)
	registry.RecordReadinessCheck("ok", 10*time.Millisecond)

	got := registry.RenderPrometheus()
	for _, needle := range []string{
		"# HELP clinicpulse_readiness_check_duration_seconds Readiness check duration summary by result.",
		"# TYPE clinicpulse_readiness_check_duration_seconds summary",
		`clinicpulse_readiness_check_duration_seconds_count{result="ok"} 2`,
		`clinicpulse_readiness_check_duration_seconds_sum{result="ok"} 0.025`,
	} {
		if !strings.Contains(got, needle) {
			t.Fatalf("expected readiness duration output to contain %q, got:\n%s", needle, got)
		}
	}
	if strings.Contains(got, `clinicpulse_readiness_check_duration_seconds{result="ok"}`) {
		t.Fatalf("expected no cumulative readiness duration gauge sample, got:\n%s", got)
	}
}

func TestRegistryRendersHistogramSamplesUnderBaseFamily(t *testing.T) {
	registry := NewRegistry()
	registry.RecordHTTPRequest(HTTPRequestMetric{
		Method:        "GET",
		Route:         "/readyz",
		Status:        200,
		PrincipalType: "anonymous",
		Duration:      25 * time.Millisecond,
	})

	got := registry.RenderPrometheus()
	for _, needle := range []string{
		"# HELP clinicpulse_http_request_duration_seconds HTTP request duration histogram.",
		"# TYPE clinicpulse_http_request_duration_seconds histogram",
		"clinicpulse_http_request_duration_seconds_bucket",
		"clinicpulse_http_request_duration_seconds_count",
		"clinicpulse_http_request_duration_seconds_sum",
	} {
		if !strings.Contains(got, needle) {
			t.Fatalf("expected histogram output to contain %q, got:\n%s", needle, got)
		}
	}
	for _, forbidden := range []string{
		"# HELP clinicpulse_http_request_duration_seconds_bucket",
		"# TYPE clinicpulse_http_request_duration_seconds_bucket",
		"# HELP clinicpulse_http_request_duration_seconds_count",
		"# TYPE clinicpulse_http_request_duration_seconds_count",
		"# HELP clinicpulse_http_request_duration_seconds_sum",
		"# TYPE clinicpulse_http_request_duration_seconds_sum",
	} {
		if strings.Contains(got, forbidden) {
			t.Fatalf("expected histogram output not to declare %q, got:\n%s", forbidden, got)
		}
	}
}

func TestRegistryBoundsRawRouteIDs(t *testing.T) {
	registry := NewRegistry()
	registry.RecordHTTPRequest(HTTPRequestMetric{
		Method:        "GET",
		Route:         "/v1/clinics/clinic-secret-id/status",
		Status:        404,
		PrincipalType: "clinic_admin",
		Duration:      10 * time.Millisecond,
	})

	got := registry.RenderPrometheus()
	if strings.Contains(got, "clinic-secret-id") {
		t.Fatalf("expected raw id to be removed from route labels, got:\n%s", got)
	}
	if !strings.Contains(got, `route="/v1/clinics/{id}/status"`) {
		t.Fatalf("expected bounded route label, got:\n%s", got)
	}
}

func TestBoundRouteReplacesKnownResourceIDs(t *testing.T) {
	for _, test := range []struct {
		name      string
		route     string
		forbidden string
		want      string
	}{
		{
			name:      "clinic slug",
			route:     "/v1/clinics/acme/status",
			forbidden: "acme",
			want:      "/v1/clinics/{id}/status",
		},
		{
			name:      "report id",
			route:     "/v1/reports/123/review",
			forbidden: "123",
			want:      "/v1/reports/{id}/review",
		},
		{
			name:      "admin user id",
			route:     "/v1/admin/users/42/access",
			forbidden: "42",
			want:      "/v1/admin/users/{id}/access",
		},
		{
			name:      "webhook id",
			route:     "/v1/admin/webhooks/hook123/test",
			forbidden: "hook123",
			want:      "/v1/admin/webhooks/{id}/test",
		},
		{
			name:      "export id",
			route:     "/v1/admin/exports/export-a",
			forbidden: "export-a",
			want:      "/v1/admin/exports/{id}",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			got := BoundRoute(test.route)
			if strings.Contains(got, test.forbidden) {
				t.Fatalf("expected %q not to leak from %q, got %q", test.forbidden, test.route, got)
			}
			if got != test.want {
				t.Fatalf("expected bounded route %q, got %q", test.want, got)
			}
		})
	}
}

func TestPrometheusLabelEscaping(t *testing.T) {
	labels := httpRequestLabels{
		method:        "GET",
		route:         `/v1/path/"quoted"\slash` + "\nnext\tpart\x01",
		statusClass:   "2xx",
		principalType: "anonymous",
	}

	got := labels.render()
	want := `route="/v1/path/\"quoted\"\\slash\nnext part?"`
	if !strings.Contains(got, want) {
		t.Fatalf("expected escaped label %q in %q", want, got)
	}
}

func TestRegistryBoundsPrincipalType(t *testing.T) {
	registry := NewRegistry()
	registry.RecordHTTPRequest(HTTPRequestMetric{
		Method:        "GET",
		Route:         "/readyz",
		Status:        200,
		PrincipalType: "user-12345",
		Duration:      time.Millisecond,
	})

	got := registry.RenderPrometheus()
	if strings.Contains(got, "user-12345") {
		t.Fatalf("expected arbitrary principal type not to be rendered, got:\n%s", got)
	}
	if !strings.Contains(got, `principal_type="unknown"`) {
		t.Fatalf("expected unknown principal type label, got:\n%s", got)
	}
}

func TestRegistryConcurrentRecordAndRender(t *testing.T) {
	registry := NewRegistry()

	var wg sync.WaitGroup
	for i := 0; i < 25; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			registry.RecordHTTPRequest(HTTPRequestMetric{
				Method:        "GET",
				Route:         "/readyz",
				Status:        200,
				PrincipalType: "anonymous",
				Duration:      time.Millisecond,
			})
			_ = registry.RenderPrometheus()
		}()
	}
	wg.Wait()

	got := registry.RenderPrometheus()
	if !strings.Contains(got, `clinicpulse_http_requests_total{method="GET",route="/readyz",status_class="2xx",principal_type="anonymous"} 25`) {
		t.Fatalf("expected all concurrent records to be rendered, got:\n%s", got)
	}
}
