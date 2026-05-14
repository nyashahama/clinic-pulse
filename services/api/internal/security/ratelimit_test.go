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

func TestFixedWindowLimiterPrunesExpiredBuckets(t *testing.T) {
	now := time.Date(2026, 5, 14, 8, 0, 0, 0, time.UTC)
	limiter := NewFixedWindowLimiter(1, time.Minute, func() time.Time { return now })

	if !limiter.Allow("login:expired-a") {
		t.Fatal("expected first expired-a attempt to pass")
	}
	if !limiter.Allow("login:expired-b") {
		t.Fatal("expected first expired-b attempt to pass")
	}
	if len(limiter.buckets) != 2 {
		t.Fatalf("expected two buckets before expiry, got %d", len(limiter.buckets))
	}

	now = now.Add(time.Minute + time.Second)
	if !limiter.Allow("login:fresh") {
		t.Fatal("expected fresh attempt after expiry to pass")
	}
	if len(limiter.buckets) != 1 {
		t.Fatalf("expected expired buckets to be pruned, got %d buckets", len(limiter.buckets))
	}
	if _, ok := limiter.buckets["login:fresh"]; !ok {
		t.Fatalf("expected fresh bucket to remain, got %#v", limiter.buckets)
	}
}

func TestFixedWindowLimiterNilClockAllowsFirstKey(t *testing.T) {
	limiter := NewFixedWindowLimiter(1, time.Millisecond, nil)

	if !limiter.Allow("login:nil-clock@example.test") {
		t.Fatal("expected first attempt with nil clock to pass")
	}
}

func TestFixedWindowLimiterNonPositiveLimitAllows(t *testing.T) {
	now := time.Date(2026, 5, 14, 8, 0, 0, 0, time.UTC)
	limiter := NewFixedWindowLimiter(0, time.Minute, func() time.Time { return now })

	if !limiter.Allow("key") {
		t.Fatal("expected non-positive limit to allow")
	}
}

func TestFixedWindowLimiterNonPositiveWindowAllows(t *testing.T) {
	now := time.Date(2026, 5, 14, 8, 0, 0, 0, time.UTC)
	limiter := NewFixedWindowLimiter(1, 0, func() time.Time { return now })

	if !limiter.Allow("key") {
		t.Fatal("expected non-positive window to allow")
	}
}
