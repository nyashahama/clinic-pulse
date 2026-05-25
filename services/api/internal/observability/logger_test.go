package observability

import (
	"bytes"
	"encoding/json"
	"errors"
	"strings"
	"sync"
	"testing"
)

func TestJSONLoggerWritesStructuredLine(t *testing.T) {
	var output bytes.Buffer
	logger := NewLogger(&output, Fields{
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
	if got["level"] != "INFO" || got["msg"] != "request_completed" || got["event"] != "request_completed" {
		t.Fatalf("unexpected log payload: %#v", got)
	}
	if got["service"] != "clinicpulse-api" || got["deploy_env"] != "test" {
		t.Fatalf("missing base fields: %#v", got)
	}
	if got["time"] == "" {
		t.Fatalf("missing slog timestamp: %#v", got)
	}
}

func TestLoggerExposesSlogLogger(t *testing.T) {
	var output bytes.Buffer
	logger := NewLogger(&output, Fields{"service": "clinicpulse-api"})

	logger.Slog().Info("api_started", "addr", ":8080")

	var got map[string]any
	if err := json.Unmarshal(bytes.TrimSpace(output.Bytes()), &got); err != nil {
		t.Fatalf("log line is not JSON: %v", err)
	}
	if got["msg"] != "api_started" || got["addr"] != ":8080" || got["service"] != "clinicpulse-api" {
		t.Fatalf("expected slog logger to write structured attrs with base fields, got %#v", got)
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
	if !strings.Contains(line, "database unavailable") {
		t.Fatalf("expected error message to be logged, got %s", line)
	}
}

func TestJSONLoggerControlsReservedFields(t *testing.T) {
	var output bytes.Buffer
	logger := NewLogger(&output, Fields{"level": "debug", "event": "base", "time": "yesterday", "msg": "base"})

	logger.Warn("safe_event", Fields{"level": "debug", "event": "field_event", "time": "tomorrow", "msg": "field_msg"})

	var got map[string]any
	if err := json.Unmarshal(bytes.TrimSpace(output.Bytes()), &got); err != nil {
		t.Fatalf("log line is not JSON: %v", err)
	}
	if got["level"] != "WARN" || got["event"] != "safe_event" || got["msg"] != "safe_event" {
		t.Fatalf("reserved fields were overridden: %#v", got)
	}
	if got["time"] == "tomorrow" || got["time"] == "yesterday" {
		t.Fatalf("time was not controlled by slog handler: %#v", got)
	}
}

func TestJSONLoggerRedactsNestedSensitiveFields(t *testing.T) {
	var output bytes.Buffer
	logger := NewJSONLogger(&output, nil)

	logger.Info("nested", Fields{
		"headers": map[string]string{
			"authorization": "Bearer secret-token",
			"cookie":        "session=secret-cookie",
		},
		"context": Fields{
			"token": "nested-token",
			"profile": map[string]any{
				"password": "nested-password",
				"safe":     "visible",
			},
		},
		"events": []any{
			map[string]any{"payload": "nested-payload"},
			map[string]string{"token": "slice-token"},
		},
	})

	line := output.String()
	for _, forbidden := range []string{
		"Bearer secret-token",
		"session=secret-cookie",
		"nested-token",
		"nested-password",
		"nested-payload",
		"slice-token",
	} {
		if strings.Contains(line, forbidden) {
			t.Fatalf("expected nested sensitive value %q to be redacted, got %s", forbidden, line)
		}
	}
	if !strings.Contains(line, "visible") {
		t.Fatalf("expected non-sensitive nested value to remain, got %s", line)
	}
}

func TestJSONLoggerConcurrentWrites(t *testing.T) {
	var output bytes.Buffer
	logger := NewJSONLogger(&output, nil)

	var wg sync.WaitGroup
	for i := 0; i < 25; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			logger.Info("concurrent", nil)
		}()
	}
	wg.Wait()

	lines := strings.Split(strings.TrimSpace(output.String()), "\n")
	if len(lines) != 25 {
		t.Fatalf("expected 25 log lines, got %d: %q", len(lines), output.String())
	}
	for _, line := range lines {
		var got map[string]any
		if err := json.Unmarshal([]byte(line), &got); err != nil {
			t.Fatalf("log line is not JSON: %v line=%q", err, line)
		}
	}
}
