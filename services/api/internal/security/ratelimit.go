package security

import (
	"sync"
	"time"
)

type Clock func() time.Time

type FixedWindowLimiter struct {
	mu      sync.Mutex
	limit   int
	window  time.Duration
	clock   Clock
	buckets map[string]bucket
}

type bucket struct {
	count      int
	windowEnd  time.Time
	lastAccess time.Time
}

func NewFixedWindowLimiter(limit int, window time.Duration, clock Clock) *FixedWindowLimiter {
	if clock == nil {
		clock = time.Now
	}
	return &FixedWindowLimiter{
		limit:   limit,
		window:  window,
		clock:   clock,
		buckets: map[string]bucket{},
	}
}

func (l *FixedWindowLimiter) Allow(key string) bool {
	if l.limit <= 0 || l.window <= 0 {
		return true
	}
	now := l.clock().UTC()

	l.mu.Lock()
	defer l.mu.Unlock()

	entry := l.buckets[key]
	if entry.windowEnd.IsZero() || !now.Before(entry.windowEnd) {
		entry = bucket{windowEnd: now.Add(l.window)}
	}
	entry.count++
	entry.lastAccess = now
	l.buckets[key] = entry

	return entry.count <= l.limit
}
