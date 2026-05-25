package observability

import (
	"context"
	"io"
	"log/slog"
	"strings"
)

// Fields contains structured log fields.
type Fields map[string]any

// Logger writes structured JSON logs through log/slog.
type Logger struct {
	logger *slog.Logger
}

// JSONLogger is kept as a compatibility alias for older call sites.
type JSONLogger = Logger

// NewLogger creates a slog-backed logger that writes JSON lines to w.
func NewLogger(w io.Writer, base Fields) *Logger {
	if w == nil {
		w = io.Discard
	}
	handler := slog.NewJSONHandler(w, &slog.HandlerOptions{ReplaceAttr: replaceLogAttr})
	logger := slog.New(handler)
	if args := fieldsToArgs(base); len(args) > 0 {
		logger = logger.With(args...)
	}
	return &Logger{logger: logger}
}

// NewJSONLogger creates a slog-backed logger that writes JSON lines to w.
func NewJSONLogger(w io.Writer, base Fields) *Logger {
	return NewLogger(w, base)
}

// Slog returns the underlying slog logger for call sites that need direct slog APIs.
func (l *Logger) Slog() *slog.Logger {
	if l == nil || l.logger == nil {
		return NewLogger(io.Discard, nil).Slog()
	}
	return l.logger
}

// With returns a child logger with additional base fields.
func (l *Logger) With(fields Fields) *Logger {
	return &Logger{logger: l.Slog().With(fieldsToArgs(fields)...)}
}

// Info writes an info-level event.
func (l *Logger) Info(event string, fields Fields) {
	l.log(context.Background(), slog.LevelInfo, event, fields)
}

// Warn writes a warn-level event.
func (l *Logger) Warn(event string, fields Fields) {
	l.log(context.Background(), slog.LevelWarn, event, fields)
}

// Error writes an error-level event.
func (l *Logger) Error(event string, fields Fields) {
	l.log(context.Background(), slog.LevelError, event, fields)
}

func (l *Logger) log(ctx context.Context, level slog.Level, event string, fields Fields) {
	args := append([]any{"event", event}, fieldsToArgs(fields)...)
	l.Slog().Log(ctx, level, event, args...)
}

func fieldsToArgs(fields Fields) []any {
	if len(fields) == 0 {
		return nil
	}
	args := make([]any, 0, len(fields)*2)
	for key, value := range fields {
		if isReservedLogField(key) {
			continue
		}
		args = append(args, key, normalizeLogValue(key, value))
	}
	return args
}

func replaceLogAttr(_ []string, attr slog.Attr) slog.Attr {
	if attr.Key == "" {
		return attr
	}
	if isSensitiveLogField(attr.Key) {
		return slog.String(attr.Key, "[REDACTED]")
	}
	if attr.Value.Kind() == slog.KindAny {
		return slog.Any(attr.Key, normalizeLogNestedValue(attr.Value.Any()))
	}
	return attr
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
	case "time", "timestamp", "level", "msg", "event":
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
