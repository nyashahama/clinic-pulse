package store

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
)

func TestDemoLeadStoreIntegration(t *testing.T) {
	databaseURL := getenvIntegrationDatabaseURL(t)
	ctx := context.Background()
	store := newIntegrationStore(t, ctx, databaseURL)
	createdAt := time.Date(2026, 5, 5, 8, 0, 0, 0, time.UTC)

	lead, err := store.CreateDemoLead(ctx, CreateDemoLeadInput{
		Name:         "  Demo Buyer  ",
		WorkEmail:    " buyer@example.test ",
		Organization: " District Health ",
		Role:         " Operations Lead ",
		Interest:     "government",
		Note:         " Wants the founder walkthrough. ",
		Status:       "new",
		Source:       "public_booking",
		CreatedAt:    createdAt,
	})
	if err != nil {
		t.Fatalf("CreateDemoLead returned error: %v", err)
	}
	if lead.ID == 0 || lead.Name != "Demo Buyer" || lead.WorkEmail != "buyer@example.test" || lead.Source != "public_booking" {
		t.Fatalf("unexpected lead: %+v", lead)
	}

	manual, err := store.CreateDemoLead(ctx, CreateDemoLeadInput{
		Name:         "Manual Admin",
		WorkEmail:    "manual@example.test",
		Organization: "Manual Org",
		Role:         "Founder",
		Interest:     "investor",
		Status:       "scheduled",
		Source:       "manual_admin",
		CreatedAt:    createdAt.Add(time.Minute),
	})
	if err != nil {
		t.Fatalf("CreateDemoLead manual returned error: %v", err)
	}

	leads, err := store.ListDemoLeads(ctx)
	if err != nil {
		t.Fatalf("ListDemoLeads returned error: %v", err)
	}
	if len(leads) < 2 || leads[0].ID != manual.ID || leads[1].ID != lead.ID {
		t.Fatalf("expected newest-first leads, got %+v", leads[:min(2, len(leads))])
	}

	updated, err := store.UpdateDemoLeadStatus(ctx, UpdateDemoLeadStatusInput{
		ID:        lead.ID,
		Status:    "contacted",
		UpdatedAt: createdAt.Add(2 * time.Minute),
	})
	if err != nil {
		t.Fatalf("UpdateDemoLeadStatus returned error: %v", err)
	}
	if updated.Status != "contacted" || !updated.UpdatedAt.Equal(createdAt.Add(2*time.Minute)) {
		t.Fatalf("unexpected updated lead: %+v", updated)
	}

	if _, err := store.UpdateDemoLeadStatus(ctx, UpdateDemoLeadStatusInput{ID: 999999, Status: "completed", UpdatedAt: createdAt}); !errors.Is(err, pgx.ErrNoRows) {
		t.Fatalf("expected missing lead update to return pgx.ErrNoRows, got %v", err)
	}
	if _, err := store.CreateDemoLead(ctx, CreateDemoLeadInput{Name: "Bad", WorkEmail: "bad@example.test", Organization: "Org", Role: "Role", Interest: "invalid", Status: "new", Source: "public_booking", CreatedAt: createdAt}); !errors.Is(err, ErrInvalidDemoLeadInterest) {
		t.Fatalf("expected invalid interest error, got %v", err)
	}
}
