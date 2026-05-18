package observability

import "testing"

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

func TestNewRequestIDGeneratesSafeValue(t *testing.T) {
	got := NewRequestID()
	if got == "" {
		t.Fatal("expected generated request id")
	}
	if RequestIDFromHeader(got) != got {
		t.Fatalf("generated unsafe request id %q", got)
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

func TestTraceparentFallbackForInvalidHeader(t *testing.T) {
	trace := TraceContextFromHeader("abc status=500")
	if !trace.Valid {
		t.Fatalf("expected fallback trace context to be valid: %#v", trace)
	}
	if trace.Header() == "abc status=500" || len(trace.Header()) != len("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01") {
		t.Fatalf("unexpected fallback trace header %q", trace.Header())
	}
}

func TestTraceparentRejectsMalformedVariants(t *testing.T) {
	for _, header := range []string{
		"",
		"01-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
		"00-4bf92f3577b34da6a3ce929d0e0e473-00f067aa0ba902b7-01",
		"00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902-01",
		"00-4bf92f3577b34da6a3ce929d0e0e473g-00f067aa0ba902b7-01",
		"00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-0g",
		"00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01-extra",
	} {
		trace := TraceContextFromHeader(header)
		if !trace.Valid {
			t.Fatalf("expected fallback trace context to be valid for %q", header)
		}
		if trace.Header() == header && header != "" {
			t.Fatalf("expected malformed traceparent %q not to be preserved", header)
		}
	}
}

func TestTraceparentRejectsAllZeroIDs(t *testing.T) {
	for _, header := range []string{
		"00-00000000000000000000000000000000-00f067aa0ba902b7-01",
		"00-4bf92f3577b34da6a3ce929d0e0e4736-0000000000000000-01",
	} {
		trace := TraceContextFromHeader(header)
		if !trace.Valid {
			t.Fatalf("expected fallback trace context to be valid for %q", header)
		}
		if trace.Header() == header {
			t.Fatalf("expected all-zero traceparent %q not to be preserved", header)
		}
	}
}

func TestGeneratedTraceContextsAreValidAndNotAllZero(t *testing.T) {
	trace := NewTraceContext()
	if !trace.Valid || trace.Header() == "" {
		t.Fatalf("expected valid generated trace context, got %#v", trace)
	}
	parsed := TraceContextFromHeader(trace.Header())
	if parsed.Header() != trace.Header() {
		t.Fatalf("expected generated trace context to parse, got %q want %q", parsed.Header(), trace.Header())
	}
	if isAllZero(trace.TraceID) || isAllZero(trace.SpanID) {
		t.Fatalf("generated all-zero trace context: %#v", trace)
	}
}
