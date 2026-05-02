package http_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	apihttp "clinicpulse/services/api/internal/http"
)

func TestHealthzReturnsOK(t *testing.T) {
	router := apihttp.NewRouter()

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
