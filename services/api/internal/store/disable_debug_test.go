package store

import (
	"context"
	"os"
	"testing"
	"time"
)

func TestDisableUserLifecycle(t *testing.T) {
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		t.Skip("DATABASE_URL not set")
	}
	pool, err := Open(context.Background(), url)
	if err != nil {
		t.Fatal(err)
	}
	s := New(pool)
	defer s.Close()

	// Get user 4 (reporter)
	user, err := s.GetUserByID(context.Background(), 4)
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("User 4: id=%d disabled=%v", user.ID, user.DisabledAt)

	// Try to disable
	now := time.Now().UTC()
	updated, err := s.UpdateUserLifecycle(context.Background(), UpdateUserLifecycleInput{
		UserID:    4,
		Disabled:  &[]bool{true}[0],
		UpdatedAt: now,
	})
	if err != nil {
		t.Fatalf("UpdateUserLifecycle: %v", err)
	}
	t.Logf("Disabled: disabledAt=%v", updated.DisabledAt)

	// Try with audit
	disabled := true
	u, ae, err := s.UpdateUserLifecycleWithAuditTx(context.Background(), UpdateUserLifecycleWithAuditInput{
		User: UpdateUserLifecycleInput{
			UserID:    4,
			Disabled:  &disabled,
			UpdatedAt: now,
		},
		AuditEvent: CreateAuditEventInput{
			EventType: "test",
			Summary:   "test disable",
		},
	})
	if err != nil {
		t.Fatalf("UpdateUserLifecycleWithAuditTx: %v", err)
	}
	t.Logf("Audit: user=%v event=%v id=%d", u.DisabledAt, ae.EventType, ae.ID)
}
