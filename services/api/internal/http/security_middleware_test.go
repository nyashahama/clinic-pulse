package http_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	apihttp "clinicpulse/services/api/internal/http"
	"clinicpulse/services/api/internal/security"
)

func TestCSRFProtectionRejectsUntrustedCookieMutationOrigin(t *testing.T) {
	router := apihttp.NewRouter(successfulLoginStore(t),
		apihttp.WithTrustedOrigins([]string{"https://app.clinicpulse.example"}),
	)
	req := httptest.NewRequest(http.MethodPost, "/v1/reports", strings.NewReader(`{}`))
	req.Header.Set("Origin", "https://evil.example")
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: sessionTokenForTest(t)})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected forbidden, got %d with body %s", rec.Code, rec.Body.String())
	}
}

func TestCSRFProtectionAllowsTrustedCookieMutationOrigin(t *testing.T) {
	router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{}),
		apihttp.WithTrustedOrigins([]string{"https://app.clinicpulse.example"}),
	)
	req := httptest.NewRequest(http.MethodPost, "/v1/reports", strings.NewReader(`{"clinicId":"clinic-1","status":"operational"}`))
	req.Header.Set("Origin", "https://app.clinicpulse.example")
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: sessionTokenForTest(t)})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code == http.StatusForbidden {
		t.Fatalf("expected trusted origin not to be rejected, body %s", rec.Body.String())
	}
}

func TestMutationRateLimitReturns429(t *testing.T) {
	limiter := security.NewFixedWindowLimiter(1, time.Minute, time.Now)
	router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{}),
		apihttp.WithMutationRateLimiter(limiter),
	)

	for attempt := 0; attempt < 2; attempt++ {
		req := httptest.NewRequest(http.MethodPost, "/v1/reports", strings.NewReader(`{"clinicId":"clinic-1","status":"operational"}`))
		req.Header.Set("Origin", "http://localhost:3000")
		req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: sessionTokenForTest(t)})
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if attempt == 1 && rec.Code != http.StatusTooManyRequests {
			t.Fatalf("expected second attempt to rate-limit, got %d", rec.Code)
		}
	}
}
