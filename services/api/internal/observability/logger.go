package observability

import (
	"encoding/json"
	"io"
	"strings"
	"sync"
	"time"
)

// Fields contains structured log fields.
type Fields map[string]any

// JSONLogger writes one JSON object per log line.
type JSONLogger struct {
	w    io.Writer
	base Fields
	mu   sync.Mutex
}

// NewJSONLogger creates a logger that writes JSON lines to w.
func NewJSONLogger(w io.Writer, base Fields) *JSONLogger {
	copied := make(Fields, len(base))
	for key, value := range base {
		if isReservedLogField(key) {
			continue
		}
		copied[key] = normalizeLogValue(key, value)
	}
	return &JSONLogger{w: w, base: copied}
}

// Info writes an info-level event.
func (l *JSONLogger) Info(event string, fields Fields) {
	l.log("info", event, fields)
}

// Warn writes a warn-level event.
func (l *JSONLogger) Warn(event string, fields Fields) {
	l.log("warn", event, fields)
}

// Error writes an error-level event.
func (l *JSONLogger) Error(event string, fields Fields) {
	l.log("error", event, fields)
}

func (l *JSONLogger) log(level, event string, fields Fields) {
	payload := make(Fields, len(l.base)+len(fields)+3)
	for key, value := range l.base {
		payload[key] = value
	}
	for key, value := range fields {
		if isReservedLogField(key) {
			continue
		}
		payload[key] = normalizeLogValue(key, value)
	}
	payload["timestamp"] = time.Now().UTC().Format(time.RFC3339Nano)
	payload["level"] = level
	payload["event"] = event

	line, err := json.Marshal(payload)
	if err != nil {
		line, _ = json.Marshal(Fields{
			"timestamp": time.Now().UTC().Format(time.RFC3339Nano),
			"level":     "error",
			"event":     "log_encode_failed",
			"error":     err.Error(),
		})
	}
	line = append(line, '\n')

	l.mu.Lock()
	defer l.mu.Unlock()
	_, _ = l.w.Write(line)
}

func normalizeLogValue(key string, value any) any {
	if isSensitiveLogField(key) {
		return "[REDACTED]"
	}
	return normalizeLogNestedValue(value)
}

func normalizeLogNestedValue(value any) any {
	if err, ok := value.(error); ok {
		return err.Error()
	}
	switch typed := value.(type) {
	case Fields:
		return normalizeLogFields(typed)
	case map[string]any:
		return normalizeLogFields(Fields(typed))
	case map[string]string:
		normalized := make(map[string]any, len(typed))
		for key, item := range typed {
			normalized[key] = normalizeLogValue(key, item)
		}
		return normalized
	case []any:
		normalized := make([]any, len(typed))
		for i, item := range typed {
			normalized[i] = normalizeLogNestedValue(item)
		}
		return normalized
	case []Fields:
		normalized := make([]any, len(typed))
		for i, item := range typed {
			normalized[i] = normalizeLogFields(item)
		}
		return normalized
	case []map[string]any:
		normalized := make([]any, len(typed))
		for i, item := range typed {
			normalized[i] = normalizeLogFields(Fields(item))
		}
		return normalized
	case []map[string]string:
		normalized := make([]any, len(typed))
		for i, item := range typed {
			normalized[i] = normalizeLogNestedValue(item)
		}
		return normalized
	default:
		return value
	}
}

func normalizeLogFields(fields Fields) Fields {
	normalized := make(Fields, len(fields))
	for key, value := range fields {
		normalized[key] = normalizeLogValue(key, value)
	}
	return normalized
}

func isReservedLogField(key string) bool {
	switch key {
	case "timestamp", "level", "event":
		return true
	default:
		return false
	}
}

func isSensitiveLogField(key string) bool {
	normalized := strings.ToLower(strings.ReplaceAll(strings.ReplaceAll(key, "-", "_"), ".", "_"))
	for _, marker := range []string{"password", "token", "secret", "api_key", "authorization", "cookie", "payload"} {
		if strings.Contains(normalized, marker) {
			return true
		}
	}
	return false
}
