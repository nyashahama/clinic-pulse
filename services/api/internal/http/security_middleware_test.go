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
	req.Header.Set("Referer", "https://app.clinicpulse.example/reports")
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: sessionTokenForTest(t)})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected forbidden, got %d with body %s", rec.Code, rec.Body.String())
	}
}

func TestCSRFProtectionRejectsCookieMutationWithoutBrowserOriginOrServerHeader(t *testing.T) {
	router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{}),
		apihttp.WithTrustedOrigins([]string{"https://app.clinicpulse.example"}),
	)
	req := httptest.NewRequest(http.MethodPost, "/v1/reports", strings.NewReader(`{"clinicId":"clinic-1","status":"operational"}`))
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: sessionTokenForTest(t)})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected missing browser origin to be rejected, got %d with body %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "csrf_rejected") {
		t.Fatalf("expected csrf rejection, got %s", rec.Body.String())
	}
}

func TestCSRFProtectionAllowsServerSideCookieMutationWithServerHeader(t *testing.T) {
	router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{}),
		apihttp.WithTrustedOrigins([]string{"https://app.clinicpulse.example"}),
	)
	req := httptest.NewRequest(http.MethodPost, "/v1/reports", strings.NewReader(`{"clinicId":"clinic-1","status":"operational"}`))
	req.Header.Set("X-ClinicPulse-Server-Mutation", "1")
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: sessionTokenForTest(t)})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code == http.StatusForbidden {
		t.Fatalf("expected server mutation header to pass through, body %s", rec.Body.String())
	}
	if strings.Contains(rec.Body.String(), "csrf_rejected") {
		t.Fatalf("expected response not to leak csrf rejection, got %s", rec.Body.String())
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

func TestCSRFProtectionAllowsTrustedRefererWhenOriginAbsent(t *testing.T) {
	router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{}),
		apihttp.WithTrustedOrigins([]string{"https://app.clinicpulse.example"}),
	)
	req := httptest.NewRequest(http.MethodPost, "/v1/reports", strings.NewReader(`{"clinicId":"clinic-1","status":"operational"}`))
	req.Header.Set("Referer", "https://app.clinicpulse.example/reports/new")
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: sessionTokenForTest(t)})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code == http.StatusForbidden {
		t.Fatalf("expected trusted referer not to be rejected, body %s", rec.Body.String())
	}
}

func TestCSRFProtectionAllowsPartnerMutationWithoutBrowserOrigin(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})
	handler := apihttp.ProtectCookieMutations([]string{"https://app.clinicpulse.example"})(next)
	req := httptest.NewRequest(http.MethodPost, "/v1/partner/events", strings.NewReader(`{}`))
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: sessionTokenForTest(t)})
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code == http.StatusForbidden {
		t.Fatalf("expected partner mutation not to be rejected, body %s", rec.Body.String())
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
