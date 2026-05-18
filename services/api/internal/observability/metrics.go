package observability

import (
	"fmt"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

// HTTPRequestMetric captures bounded HTTP request dimensions.
type HTTPRequestMetric struct {
	Method        string
	Route         string
	Status        int
	PrincipalType string
	Duration      time.Duration
}

// Registry stores in-memory metrics suitable for Prometheus text rendering.
type Registry struct {
	mu sync.RWMutex

	httpRequests map[httpRequestLabels]*durationStats
	httpErrors   map[errorKindLabels]int64
	rateLimits   map[resultLabels]int64
	csrfDenials  map[resultLabels]int64
	readiness    map[resultLabels]*durationStats
	domainOps    map[operationResultLabels]int64
}

type httpRequestLabels struct {
	method        string
	route         string
	statusClass   string
	principalType string
}

type resultLabels struct {
	result string
}

type errorKindLabels struct {
	kind string
}

type operationResultLabels struct {
	operation string
	result    string
}

type durationStats struct {
	count   int64
	sum     float64
	buckets []int64
}

var httpDurationBuckets = []float64{0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10}

// NewRegistry creates an empty metrics registry.
func NewRegistry() *Registry {
	return &Registry{
		httpRequests: make(map[httpRequestLabels]*durationStats),
		httpErrors:   make(map[errorKindLabels]int64),
		rateLimits:   make(map[resultLabels]int64),
		csrfDenials:  make(map[resultLabels]int64),
		readiness:    make(map[resultLabels]*durationStats),
		domainOps:    make(map[operationResultLabels]int64),
	}
}

// RecordHTTPRequest records request count, error count, and duration histogram data.
func (r *Registry) RecordHTTPRequest(metric HTTPRequestMetric) {
	labels := httpRequestLabels{
		method:        boundMethod(metric.Method),
		route:         BoundRoute(metric.Route),
		statusClass:   statusClass(metric.Status),
		principalType: boundPrincipalType(metric.PrincipalType),
	}
	duration := metric.Duration.Seconds()
	if duration < 0 {
		duration = 0
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	stats := r.httpRequests[labels]
	if stats == nil {
		stats = newDurationStats(len(httpDurationBuckets))
		r.httpRequests[labels] = stats
	}
	stats.observe(duration, httpDurationBuckets)
}

// RecordHTTPError records a bounded HTTP error category.
func (r *Registry) RecordHTTPError(kind string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.httpErrors[errorKindLabels{kind: boundHTTPErrorKind(kind)}]++
}

// RecordRateLimitDenial records a rate-limit denial result.
func (r *Registry) RecordRateLimitDenial(result string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.rateLimits[resultLabels{result: boundLabel(result, "denied")}]++
}

// RecordCSRFDenial records a CSRF denial result.
func (r *Registry) RecordCSRFDenial(result string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.csrfDenials[resultLabels{result: boundLabel(result, "denied")}]++
}

// RecordReadinessCheck records readiness check result and duration.
func (r *Registry) RecordReadinessCheck(result string, duration time.Duration) {
	seconds := duration.Seconds()
	if seconds < 0 {
		seconds = 0
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	labels := resultLabels{result: boundLabel(result, "unknown")}
	stats := r.readiness[labels]
	if stats == nil {
		stats = newDurationStats(0)
		r.readiness[labels] = stats
	}
	stats.count++
	stats.sum += seconds
}

// RecordDomainOperation records a domain operation outcome.
func (r *Registry) RecordDomainOperation(operation, result string) {
	operation, result = boundDomainOperation(operation, result)
	r.mu.Lock()
	defer r.mu.Unlock()
	r.domainOps[operationResultLabels{operation: operation, result: result}]++
}

// RenderPrometheus renders the registry in Prometheus text format.
func (r *Registry) RenderPrometheus() string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var b strings.Builder
	writeFamily(&b, "clinicpulse_http_requests_total", "Total HTTP requests by bounded route and principal type.", "counter")
	for _, labels := range sortedHTTPRequestLabels(r.httpRequests) {
		stats := r.httpRequests[labels]
		fmt.Fprintf(&b, "clinicpulse_http_requests_total{%s} %d\n", labels.render(), stats.count)
	}

	writeFamily(&b, "clinicpulse_http_request_duration_seconds", "HTTP request duration histogram.", "histogram")
	for _, labels := range sortedHTTPRequestLabels(r.httpRequests) {
		stats := r.httpRequests[labels]
		for i, bucket := range httpDurationBuckets {
			fmt.Fprintf(&b, "clinicpulse_http_request_duration_seconds_bucket{%s,le=%q} %d\n", labels.render(), formatFloat(bucket), stats.buckets[i])
		}
		fmt.Fprintf(&b, "clinicpulse_http_request_duration_seconds_bucket{%s,le=\"+Inf\"} %d\n", labels.render(), stats.count)
		fmt.Fprintf(&b, "clinicpulse_http_request_duration_seconds_count{%s} %d\n", labels.render(), stats.count)
		fmt.Fprintf(&b, "clinicpulse_http_request_duration_seconds_sum{%s} %s\n", labels.render(), formatFloat(stats.sum))
	}

	writeFamily(&b, "clinicpulse_http_errors_total", "Total HTTP error responses by bounded error kind.", "counter")
	for _, labels := range sortedErrorKindLabels(r.httpErrors) {
		fmt.Fprintf(&b, "clinicpulse_http_errors_total{error_kind=\"%s\"} %d\n", escapePrometheusLabel(labels.kind), r.httpErrors[labels])
	}

	writeFamily(&b, "clinicpulse_rate_limit_denials_total", "Total rate limit denials.", "counter")
	for _, labels := range sortedResultLabels(r.rateLimits) {
		fmt.Fprintf(&b, "clinicpulse_rate_limit_denials_total{result=\"%s\"} %d\n", escapePrometheusLabel(labels.result), r.rateLimits[labels])
	}

	writeFamily(&b, "clinicpulse_csrf_denials_total", "Total CSRF denials.", "counter")
	for _, labels := range sortedResultLabels(r.csrfDenials) {
		fmt.Fprintf(&b, "clinicpulse_csrf_denials_total{result=\"%s\"} %d\n", escapePrometheusLabel(labels.result), r.csrfDenials[labels])
	}

	writeFamily(&b, "clinicpulse_readiness_checks_total", "Total readiness checks by result.", "counter")
	writeFamily(&b, "clinicpulse_readiness_check_duration_seconds", "Readiness check duration summary by result.", "summary")
	for _, labels := range sortedReadinessLabels(r.readiness) {
		stats := r.readiness[labels]
		fmt.Fprintf(&b, "clinicpulse_readiness_checks_total{result=\"%s\"} %d\n", escapePrometheusLabel(labels.result), stats.count)
		fmt.Fprintf(&b, "clinicpulse_readiness_check_duration_seconds_count{result=\"%s\"} %d\n", escapePrometheusLabel(labels.result), stats.count)
		fmt.Fprintf(&b, "clinicpulse_readiness_check_duration_seconds_sum{result=\"%s\"} %s\n", escapePrometheusLabel(labels.result), formatFloat(stats.sum))
	}

	writeFamily(&b, "clinicpulse_domain_operations_total", "Total domain operations by operation and result.", "counter")
	for _, labels := range sortedOperationResultLabels(r.domainOps) {
		fmt.Fprintf(&b, "clinicpulse_domain_operations_total{operation=\"%s\",result=\"%s\"} %d\n", escapePrometheusLabel(labels.operation), escapePrometheusLabel(labels.result), r.domainOps[labels])
	}

	return b.String()
}

// BoundRoute converts raw route paths into bounded, low-cardinality labels.
func BoundRoute(route string) string {
	route = strings.TrimSpace(route)
	if route == "" {
		return "unknown"
	}
	if !strings.HasPrefix(route, "/") {
		return boundLabel(route, "unknown")
	}
	parts := strings.Split(route, "/")
	for i := 1; i < len(parts); i++ {
		if isKnownDynamicRoutePosition(parts, i) || isDynamicSegment(parts[i]) {
			parts[i] = "{id}"
		}
	}
	bounded := strings.Join(parts, "/")
	if len(bounded) > 160 {
		return "other"
	}
	return bounded
}

func isKnownDynamicRoutePosition(parts []string, index int) bool {
	if index <= 1 {
		return false
	}
	switch parts[index-1] {
	case "clinics", "reports", "users", "api-keys", "webhooks", "exports":
		return true
	default:
		return false
	}
}

func boundHTTPErrorKind(kind string) string {
	switch strings.TrimSpace(strings.ToLower(kind)) {
	case "store", "auth", "validation", "rate_limit", "csrf", "partner", "sync", "unknown":
		return strings.TrimSpace(strings.ToLower(kind))
	default:
		return "unknown"
	}
}

func boundPrincipalType(principalType string) string {
	switch strings.TrimSpace(strings.ToLower(principalType)) {
	case "anonymous", "session", "partner", "unknown":
		return strings.TrimSpace(strings.ToLower(principalType))
	default:
		return "unknown"
	}
}

func boundDomainOperation(operation string, result string) (string, string) {
	operation = strings.TrimSpace(strings.ToLower(operation))
	result = strings.TrimSpace(strings.ToLower(result))
	switch operation {
	case "auth.login":
		if result == "success" || result == "invalid_credentials" || result == "rate_limited" || result == "error" {
			return operation, result
		}
	case "report.create":
		if result == "created" || result == "pending_review" || result == "duplicate" || result == "validation_error" || result == "error" {
			return operation, result
		}
	case "report.review":
		if result == "accepted" || result == "rejected" || result == "error" {
			return operation, result
		}
	case "offline_sync":
		if result == "synced" || result == "duplicate" || result == "conflict" || result == "validation_error" || result == "error" {
			return operation, result
		}
	case "partner.export":
		if result == "created" || result == "error" {
			return operation, result
		}
	case "partner.webhook_test":
		if result == "preview_only" || result == "failed" || result == "error" {
			return operation, result
		}
	case "unknown":
		return "unknown", "unknown"
	default:
		return "unknown", "unknown"
	}
	return operation, "unknown"
}

func newDurationStats(bucketCount int) *durationStats {
	return &durationStats{buckets: make([]int64, bucketCount)}
}

func (s *durationStats) observe(seconds float64, buckets []float64) {
	s.count++
	s.sum += seconds
	for i, bucket := range buckets {
		if seconds <= bucket {
			s.buckets[i]++
		}
	}
}

func writeFamily(b *strings.Builder, name, help, typ string) {
	fmt.Fprintf(b, "# HELP %s %s\n", name, help)
	fmt.Fprintf(b, "# TYPE %s %s\n", name, typ)
}

func (l httpRequestLabels) render() string {
	return fmt.Sprintf("method=\"%s\",route=\"%s\",status_class=\"%s\",principal_type=\"%s\"", escapePrometheusLabel(l.method), escapePrometheusLabel(l.route), escapePrometheusLabel(l.statusClass), escapePrometheusLabel(l.principalType))
}

func boundMethod(method string) string {
	method = strings.ToUpper(strings.TrimSpace(method))
	switch method {
	case "GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS":
		return method
	default:
		return "OTHER"
	}
}

func statusClass(status int) string {
	if status < 100 || status > 599 {
		return "unknown"
	}
	return strconv.Itoa(status/100) + "xx"
}

func boundLabel(value, fallback string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	if value == "" {
		return fallback
	}
	var out strings.Builder
	for _, r := range value {
		switch {
		case r >= 'a' && r <= 'z':
			out.WriteRune(r)
		case r >= '0' && r <= '9':
			out.WriteRune(r)
		case r == '_' || r == '-' || r == '.':
			out.WriteRune(r)
		default:
			out.WriteRune('_')
		}
		if out.Len() >= 64 {
			break
		}
	}
	if out.Len() == 0 {
		return fallback
	}
	return out.String()
}

func isDynamicSegment(segment string) bool {
	if segment == "" || strings.HasPrefix(segment, "{") && strings.HasSuffix(segment, "}") {
		return false
	}
	lower := strings.ToLower(segment)
	if strings.Contains(lower, "secret") || strings.Contains(lower, "token") || strings.Contains(lower, "password") {
		return true
	}
	if strings.Contains(segment, "-") || strings.Contains(segment, ".") {
		return true
	}
	if len(segment) >= 12 {
		return true
	}
	digitCount := 0
	for _, r := range segment {
		if r >= '0' && r <= '9' {
			digitCount++
		}
	}
	return digitCount > 0 && (digitCount == len(segment) || len(segment) >= 8)
}

func formatFloat(value float64) string {
	return strconv.FormatFloat(value, 'f', -1, 64)
}

func escapePrometheusLabel(value string) string {
	var escaped strings.Builder
	for _, r := range value {
		switch r {
		case '\\':
			escaped.WriteString(`\\`)
		case '"':
			escaped.WriteString(`\"`)
		case '\n':
			escaped.WriteString(`\n`)
		case '\t':
			escaped.WriteByte(' ')
		default:
			if r < 0x20 || r == 0x7f {
				escaped.WriteByte('?')
				continue
			}
			escaped.WriteRune(r)
		}
	}
	return escaped.String()
}

func sortedHTTPRequestLabels(values map[httpRequestLabels]*durationStats) []httpRequestLabels {
	labels := make([]httpRequestLabels, 0, len(values))
	for label := range values {
		labels = append(labels, label)
	}
	sort.Slice(labels, func(i, j int) bool { return labels[i].render() < labels[j].render() })
	return labels
}

func sortedResultLabels[T any](values map[resultLabels]T) []resultLabels {
	labels := make([]resultLabels, 0, len(values))
	for label := range values {
		labels = append(labels, label)
	}
	sort.Slice(labels, func(i, j int) bool { return labels[i].result < labels[j].result })
	return labels
}

func sortedErrorKindLabels(values map[errorKindLabels]int64) []errorKindLabels {
	labels := make([]errorKindLabels, 0, len(values))
	for label := range values {
		labels = append(labels, label)
	}
	sort.Slice(labels, func(i, j int) bool { return labels[i].kind < labels[j].kind })
	return labels
}

func sortedReadinessLabels(values map[resultLabels]*durationStats) []resultLabels {
	return sortedResultLabels(values)
}

func sortedOperationResultLabels(values map[operationResultLabels]int64) []operationResultLabels {
	labels := make([]operationResultLabels, 0, len(values))
	for label := range values {
		labels = append(labels, label)
	}
	sort.Slice(labels, func(i, j int) bool {
		if labels[i].operation == labels[j].operation {
			return labels[i].result < labels[j].result
		}
		return labels[i].operation < labels[j].operation
	})
	return labels
}
