package http

import (
	nethttp "net/http"
	"net/url"
	"strings"

	"clinicpulse/services/api/internal/security"
)

func ProtectCookieMutations(trustedOrigins []string) func(nethttp.Handler) nethttp.Handler {
	trusted := map[string]struct{}{}
	for _, origin := range trustedOrigins {
		trusted[strings.TrimRight(strings.ToLower(strings.TrimSpace(origin)), "/")] = struct{}{}
	}
	trusted["http://localhost:3000"] = struct{}{}
	trusted["http://127.0.0.1:3000"] = struct{}{}

	return func(next nethttp.Handler) nethttp.Handler {
		return nethttp.HandlerFunc(func(w nethttp.ResponseWriter, r *nethttp.Request) {
			if !unsafeMethod(r.Method) || !hasSessionCookie(r) || strings.HasPrefix(r.URL.Path, "/v1/partner/") {
				next.ServeHTTP(w, r)
				return
			}

			origin := strings.TrimRight(strings.ToLower(strings.TrimSpace(r.Header.Get("Origin"))), "/")
			if origin != "" {
				if _, ok := trusted[origin]; !ok {
					RespondError(w, nethttp.StatusForbidden, "csrf_rejected", "request origin is not allowed")
					return
				}
				next.ServeHTTP(w, r)
				return
			}

			refererOrigin := originFromReferer(r.Header.Get("Referer"))
			if refererOrigin == "" {
				next.ServeHTTP(w, r)
				return
			}
			if _, ok := trusted[refererOrigin]; !ok {
				RespondError(w, nethttp.StatusForbidden, "csrf_rejected", "request origin is not allowed")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func RateLimitMutations(limiter *security.FixedWindowLimiter) func(nethttp.Handler) nethttp.Handler {
	return func(next nethttp.Handler) nethttp.Handler {
		return nethttp.HandlerFunc(func(w nethttp.ResponseWriter, r *nethttp.Request) {
			if limiter == nil || !unsafeMethod(r.Method) || r.URL.Path == "/v1/auth/login" {
				next.ServeHTTP(w, r)
				return
			}
			key := "mutation:" + remoteIPAddressValue(r.RemoteAddr) + ":" + r.URL.Path
			if !limiter.Allow(key) {
				RespondError(w, nethttp.StatusTooManyRequests, "rate_limited", "too many requests")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func unsafeMethod(method string) bool {
	return method == nethttp.MethodPost || method == nethttp.MethodPut || method == nethttp.MethodPatch || method == nethttp.MethodDelete
}

func hasSessionCookie(r *nethttp.Request) bool {
	cookie, err := r.Cookie(sessionCookieName)
	return err == nil && cookie.Value != ""
}

func originFromReferer(value string) string {
	if value == "" {
		return ""
	}
	if parsed, err := url.Parse(value); err == nil && parsed.Scheme != "" && parsed.Host != "" {
		return strings.ToLower(parsed.Scheme + "://" + parsed.Host)
	}
	return ""
}
