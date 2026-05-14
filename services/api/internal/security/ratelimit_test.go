package security

import (
	"testing"
	"time"
)

func TestFixedWindowLimiterAllowsConfiguredAttempts(t *testing.T) {
	now := time.Date(2026, 5, 14, 8, 0, 0, 0, time.UTC)
	limiter := NewFixedWindowLimiter(2, time.Minute, func() time.Time { return now })

	if !limiter.Allow("login:person@example.test") {
		t.Fatal("expected first attempt to pass")
	}
	if !limiter.Allow("login:person@example.test") {
		t.Fatal("expected second attempt to pass")
	}
	if limiter.Allow("login:person@example.test") {
		t.Fatal("expected third attempt to be blocked")
	}
}

func TestFixedWindowLimiterResetsAfterWindow(t *testing.T) {
	now := time.Date(2026, 5, 14, 8, 0, 0, 0, time.UTC)
	limiter := NewFixedWindowLimiter(1, time.Minute, func() time.Time { return now })

	if !limiter.Allow("mutation:admin") {
		t.Fatal("expected first attempt to pass")
	}
	now = now.Add(time.Minute + time.Second)
	if !limiter.Allow("mutation:admin") {
		t.Fatal("expected attempt after window to pass")
	}
}
