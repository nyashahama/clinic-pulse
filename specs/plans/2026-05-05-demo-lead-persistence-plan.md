# Demo Lead Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist public booking leads and authenticated admin pipeline updates through the Go API while preserving local demo fallback.

**Architecture:** Add a `demo_leads` persistence slice to the Go API, expose public create and authenticated admin management endpoints, then wire Next API client/server actions into the booking and admin flows. The browser demo store remains the optimistic/fallback state layer.

**Tech Stack:** Go 1.x, chi, pgx, PostgreSQL migrations, Next.js 16 app router, TypeScript, Vitest, Playwright.

---

## File Structure

- Create `services/api/migrations/0009_demo_leads.sql`: table, indexes, and seeded lead rows.
- Modify `services/api/internal/store/models.go`: `DemoLead`, `CreateDemoLeadInput`, `UpdateDemoLeadStatusInput`.
- Modify `services/api/internal/store/queries.go`: create/list/update demo lead SQL and methods.
- Add `services/api/internal/store/demo_leads_integration_test.go`: integration coverage for persistence.
- Modify `services/api/internal/http/handlers.go`: add lead methods to `ClinicStore` interface and implement admin handlers.
- Modify `services/api/internal/http/public_handlers.go`: implement public lead creation handler.
- Modify `services/api/internal/http/router.go`: mount public/admin lead routes.
- Modify `services/api/internal/http/handlers_test.go`: fake store and handler route coverage.
- Modify `lib/demo/api-types.ts`: lead API types.
- Modify `lib/demo/api-client.ts` and `lib/demo/api-client.test.ts`: lead client functions and request tests.
- Modify `app/(demo)/admin/actions.ts`: admin lead server actions.
- Modify `app/(demo)/admin/page.tsx`: fetch backend leads with the admin page payload.
- Modify `app/(demo)/admin/page-client.tsx`: use backend leads/actions with visible persistence errors.
- Modify `components/landing/booking-demo-controller.tsx`: public create with local fallback.
- Modify `lib/demo/demo-store.tsx` and tests: add returned-lead hydration/upsert support.
- Modify `tests/e2e/phase-one-smoke.spec.ts`: submit booking and verify admin pipeline persistence.
- Modify `README.md`: replace local-storage lead note with backend-plus-fallback wording.

---

### Task 1: Backend Schema And Store

**Files:**
- Create: `services/api/migrations/0009_demo_leads.sql`
- Modify: `services/api/internal/store/models.go`
- Modify: `services/api/internal/store/queries.go`
- Create: `services/api/internal/store/demo_leads_integration_test.go`

- [ ] **Step 1: Write the failing migration/store tests**

Create `services/api/internal/store/demo_leads_integration_test.go`:

```go
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
```

- [ ] **Step 2: Run the store test and verify RED**

Run:

```bash
AUTH_STORE_TEST_DATABASE_URL="postgres://clinicpulse:clinicpulse@localhost:55432/clinicpulse_e2e?sslmode=disable" go test ./services/api/internal/store -run TestDemoLeadStoreIntegration -count=1
```

Expected: FAIL because `CreateDemoLeadInput`, `CreateDemoLead`, `UpdateDemoLeadStatus`, and `ErrInvalidDemoLeadInterest` do not exist.

- [ ] **Step 3: Add migration**

Create `services/api/migrations/0009_demo_leads.sql`:

```sql
CREATE TABLE demo_leads (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL CHECK (btrim(name) <> ''),
    work_email TEXT NOT NULL CHECK (btrim(work_email) <> ''),
    organization TEXT NOT NULL CHECK (btrim(organization) <> ''),
    role TEXT NOT NULL CHECK (btrim(role) <> ''),
    interest TEXT NOT NULL CHECK (interest IN ('government', 'ngo', 'investor', 'clinic_operator', 'other')),
    note TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled', 'completed')),
    source TEXT NOT NULL CHECK (source IN ('public_booking', 'manual_admin', 'seed')),
    created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (updated_at >= created_at)
);

CREATE INDEX demo_leads_created_at_idx ON demo_leads (created_at DESC, id DESC);
CREATE INDEX demo_leads_status_created_at_idx ON demo_leads (status, created_at DESC);

INSERT INTO demo_leads (name, work_email, organization, role, interest, note, status, source, created_at, updated_at)
VALUES
    ('Thandi Mabuza', 'thandi.mabuza@gautenghealth.gov.za', 'Gauteng Department of Health', 'District operations lead', 'government', 'Interested in district-wide visibility and audit exports before budget review.', 'scheduled', 'seed', '2026-04-30T09:10:00.000Z', '2026-04-30T09:10:00.000Z'),
    ('Ben Molefe', 'ben.molefe@healthbridge.org', 'HealthBridge NGO', 'Programs director', 'ngo', 'Wants offline field reporting for mobile outreach teams.', 'contacted', 'seed', '2026-04-29T15:25:00.000Z', '2026-04-29T15:25:00.000Z'),
    ('Catherine Joubert', 'c.joubert@capitalclinics.co.za', 'Capital Clinics Group', 'Operations executive', 'clinic_operator', 'Exploring private network rollout with public referral visibility.', 'new', 'seed', '2026-04-28T12:00:00.000Z', '2026-04-28T12:00:00.000Z'),
    ('Hassan Patel', 'h.patel@northstar.vc', 'Northstar Ventures', 'Partner', 'investor', 'Asked for a founder demo focused on expansion readiness and API story.', 'completed', 'seed', '2026-04-27T17:40:00.000Z', '2026-04-27T17:40:00.000Z');
```

- [ ] **Step 4: Add store models and errors**

In `services/api/internal/store/models.go`, add:

```go
type DemoLead struct {
	ID              int64      `json:"id"`
	Name            string     `json:"name"`
	WorkEmail       string     `json:"workEmail"`
	Organization    string     `json:"organization"`
	Role            string     `json:"role"`
	Interest        string     `json:"interest"`
	Note            string     `json:"note"`
	Status          string     `json:"status"`
	Source          string     `json:"source"`
	CreatedByUserID *int64     `json:"createdByUserId,omitempty"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`
}

type CreateDemoLeadInput struct {
	Name            string
	WorkEmail       string
	Organization    string
	Role            string
	Interest        string
	Note            string
	Status          string
	Source          string
	CreatedByUserID *int64
	CreatedAt       time.Time
}

type UpdateDemoLeadStatusInput struct {
	ID        int64
	Status    string
	UpdatedAt time.Time
}
```

In `services/api/internal/store/errors.go`, add:

```go
var (
	ErrInvalidDemoLeadInterest = errors.New("invalid demo lead interest")
	ErrInvalidDemoLeadStatus   = errors.New("invalid demo lead status")
	ErrInvalidDemoLeadSource   = errors.New("invalid demo lead source")
)
```

- [ ] **Step 5: Add store SQL and methods**

In `services/api/internal/store/queries.go`, add constants and methods:

```go
const (
	insertDemoLeadSQL = `
INSERT INTO demo_leads (
    name, work_email, organization, role, interest, note, status, source, created_by_user_id, created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
RETURNING id, name, work_email, organization, role, interest, note, status, source, created_by_user_id, created_at, updated_at`

	listDemoLeadsSQL = `
SELECT id, name, work_email, organization, role, interest, note, status, source, created_by_user_id, created_at, updated_at
FROM demo_leads
ORDER BY created_at DESC, id DESC`

	updateDemoLeadStatusSQL = `
UPDATE demo_leads
SET status = $2, updated_at = $3
WHERE id = $1
RETURNING id, name, work_email, organization, role, interest, note, status, source, created_by_user_id, created_at, updated_at`
)

func normalizeDemoLeadInput(input CreateDemoLeadInput) (CreateDemoLeadInput, error) {
	input.Name = strings.TrimSpace(input.Name)
	input.WorkEmail = strings.TrimSpace(input.WorkEmail)
	input.Organization = strings.TrimSpace(input.Organization)
	input.Role = strings.TrimSpace(input.Role)
	input.Interest = strings.TrimSpace(input.Interest)
	input.Note = strings.TrimSpace(input.Note)
	input.Status = strings.TrimSpace(input.Status)
	input.Source = strings.TrimSpace(input.Source)
	if input.Status == "" {
		input.Status = "new"
	}
	if input.Source == "" {
		input.Source = "public_booking"
	}
	if input.CreatedAt.IsZero() {
		input.CreatedAt = time.Now().UTC()
	}
	if input.Name == "" || input.WorkEmail == "" || input.Organization == "" || input.Role == "" {
		return input, ErrValidation
	}
	if !isValidDemoLeadInterest(input.Interest) {
		return input, ErrInvalidDemoLeadInterest
	}
	if !isValidDemoLeadStatus(input.Status) {
		return input, ErrInvalidDemoLeadStatus
	}
	if !isValidDemoLeadSource(input.Source) {
		return input, ErrInvalidDemoLeadSource
	}
	return input, nil
}

func isValidDemoLeadInterest(value string) bool {
	switch value {
	case "government", "ngo", "investor", "clinic_operator", "other":
		return true
	default:
		return false
	}
}

func isValidDemoLeadStatus(value string) bool {
	switch value {
	case "new", "contacted", "scheduled", "completed":
		return true
	default:
		return false
	}
}

func isValidDemoLeadSource(value string) bool {
	switch value {
	case "public_booking", "manual_admin", "seed":
		return true
	default:
		return false
	}
}

func scanDemoLead(row pgx.Row) (DemoLead, error) {
	var lead DemoLead
	err := row.Scan(
		&lead.ID,
		&lead.Name,
		&lead.WorkEmail,
		&lead.Organization,
		&lead.Role,
		&lead.Interest,
		&lead.Note,
		&lead.Status,
		&lead.Source,
		&lead.CreatedByUserID,
		&lead.CreatedAt,
		&lead.UpdatedAt,
	)
	return lead, err
}

func (s *PostgresStore) CreateDemoLead(ctx context.Context, input CreateDemoLeadInput) (DemoLead, error) {
	normalized, err := normalizeDemoLeadInput(input)
	if err != nil {
		return DemoLead{}, err
	}
	return scanDemoLead(s.pool.QueryRow(ctx, insertDemoLeadSQL,
		normalized.Name,
		normalized.WorkEmail,
		normalized.Organization,
		normalized.Role,
		normalized.Interest,
		normalized.Note,
		normalized.Status,
		normalized.Source,
		normalized.CreatedByUserID,
		normalized.CreatedAt,
	))
}

func (s *PostgresStore) ListDemoLeads(ctx context.Context) ([]DemoLead, error) {
	rows, err := s.pool.Query(ctx, listDemoLeadsSQL)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	leads := []DemoLead{}
	for rows.Next() {
		lead, err := scanDemoLead(rows)
		if err != nil {
			return nil, err
		}
		leads = append(leads, lead)
	}
	return leads, rows.Err()
}

func (s *PostgresStore) UpdateDemoLeadStatus(ctx context.Context, input UpdateDemoLeadStatusInput) (DemoLead, error) {
	status := strings.TrimSpace(input.Status)
	if !isValidDemoLeadStatus(status) {
		return DemoLead{}, ErrInvalidDemoLeadStatus
	}
	updatedAt := input.UpdatedAt
	if updatedAt.IsZero() {
		updatedAt = time.Now().UTC()
	}
	return scanDemoLead(s.pool.QueryRow(ctx, updateDemoLeadStatusSQL, input.ID, status, updatedAt))
}
```

- [ ] **Step 6: Run store tests and commit**

Run:

```bash
make db-up-e2e db-reset-e2e
AUTH_STORE_TEST_DATABASE_URL="postgres://clinicpulse:clinicpulse@localhost:55432/clinicpulse_e2e?sslmode=disable" go test ./services/api/internal/store -run 'TestDemoLeadStoreIntegration|TestMigrationsApplyCleanly' -count=1
```

Expected: PASS.

Commit:

```bash
git add services/api/migrations/0009_demo_leads.sql services/api/internal/store/models.go services/api/internal/store/errors.go services/api/internal/store/queries.go services/api/internal/store/demo_leads_integration_test.go
git commit -m "feat: persist demo leads"
```

---

### Task 2: Backend Lead HTTP API

**Files:**
- Modify: `services/api/internal/http/handlers.go`
- Modify: `services/api/internal/http/public_handlers.go`
- Modify: `services/api/internal/http/router.go`
- Modify: `services/api/internal/http/handlers_test.go`

- [ ] **Step 1: Write failing handler tests**

Add tests to `services/api/internal/http/handlers_test.go`:

```go
func TestPublicDemoLeadCreate(t *testing.T) {
	router := apihttp.NewRouter(fakeStore{})
	body := strings.NewReader(`{"name":"Buyer","workEmail":"buyer@example.test","organization":"District","role":"Ops","interest":"government","note":"May 5"}`)
	req := httptest.NewRequest(http.MethodPost, "/v1/public/demo-leads", body)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d body %s", http.StatusCreated, rec.Code, rec.Body.String())
	}
	var got store.DemoLead
	decodeJSON(t, rec, &got)
	if got.ID == 0 || got.Status != "new" || got.Source != "public_booking" || got.WorkEmail != "buyer@example.test" {
		t.Fatalf("unexpected lead response: %+v", got)
	}
}

func TestAdminDemoLeadRoutesRequireOrgAdmin(t *testing.T) {
	router := newAuthenticatedTestRouterForRole(t, fakeStore{}, "district_manager")
	req := newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/demo-leads", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected forbidden, got %d body %s", rec.Code, rec.Body.String())
	}
}

func TestAdminDemoLeadManagement(t *testing.T) {
	router := newAuthenticatedTestRouter(t, fakeStore{})
	createBody := strings.NewReader(`{"name":"Admin Lead","workEmail":"admin@example.test","organization":"Admin Org","role":"Founder","interest":"investor","note":"Manual","status":"scheduled"}`)
	createReq := newAuthenticatedRequest(t, http.MethodPost, "/v1/admin/demo-leads", createBody)
	createRec := httptest.NewRecorder()
	router.ServeHTTP(createRec, createReq)
	if createRec.Code != http.StatusCreated {
		t.Fatalf("expected create status %d, got %d body %s", http.StatusCreated, createRec.Code, createRec.Body.String())
	}
	var created store.DemoLead
	decodeJSON(t, createRec, &created)
	if created.Source != "manual_admin" || created.Status != "scheduled" {
		t.Fatalf("unexpected created lead: %+v", created)
	}

	updateReq := newAuthenticatedRequest(t, http.MethodPatch, "/v1/admin/demo-leads/"+strconv.FormatInt(created.ID, 10), strings.NewReader(`{"status":"completed"}`))
	updateRec := httptest.NewRecorder()
	router.ServeHTTP(updateRec, updateReq)
	if updateRec.Code != http.StatusOK {
		t.Fatalf("expected update status %d, got %d body %s", http.StatusOK, updateRec.Code, updateRec.Body.String())
	}
	var updated store.DemoLead
	decodeJSON(t, updateRec, &updated)
	if updated.ID != created.ID || updated.Status != "completed" {
		t.Fatalf("unexpected updated lead: %+v", updated)
	}

	listReq := newAuthenticatedRequest(t, http.MethodGet, "/v1/admin/demo-leads", nil)
	listRec := httptest.NewRecorder()
	router.ServeHTTP(listRec, listReq)
	if listRec.Code != http.StatusOK {
		t.Fatalf("expected list status %d, got %d body %s", http.StatusOK, listRec.Code, listRec.Body.String())
	}
	var leads []store.DemoLead
	decodeJSON(t, listRec, &leads)
	if len(leads) == 0 || leads[0].Status != "completed" {
		t.Fatalf("unexpected lead list: %+v", leads)
	}
}
```

Also extend `fakeStore` with in-memory `demoLeads []store.DemoLead` and methods for `CreateDemoLead`, `ListDemoLeads`, and `UpdateDemoLeadStatus`.

- [ ] **Step 2: Run handler tests and verify RED**

Run:

```bash
cd services/api && go test ./internal/http -run 'TestPublicDemoLeadCreate|TestAdminDemoLeadRoutesRequireOrgAdmin|TestAdminDemoLeadManagement' -count=1
```

Expected: FAIL because routes and interface methods are missing.

- [ ] **Step 3: Extend ClinicStore and handlers**

In `services/api/internal/http/handlers.go`, add to `ClinicStore`:

```go
ListDemoLeads(ctx context.Context) ([]store.DemoLead, error)
CreateDemoLead(ctx context.Context, input store.CreateDemoLeadInput) (store.DemoLead, error)
UpdateDemoLeadStatus(ctx context.Context, input store.UpdateDemoLeadStatusInput) (store.DemoLead, error)
```

Add request structs and admin handlers:

```go
type createDemoLeadRequest struct {
	Name         string `json:"name"`
	WorkEmail    string `json:"workEmail"`
	Organization string `json:"organization"`
	Role         string `json:"role"`
	Interest     string `json:"interest"`
	Note         string `json:"note"`
	Status       string `json:"status"`
}

type updateDemoLeadStatusRequest struct {
	Status string `json:"status"`
}

func (h Handler) ListAdminDemoLeads(w nethttp.ResponseWriter, r *nethttp.Request) {
	leads, err := h.store.ListDemoLeads(r.Context())
	if err != nil {
		respondStoreError(w, err, "failed to list demo leads")
		return
	}
	RespondJSON(w, nethttp.StatusOK, leads)
}

func (h Handler) CreateAdminDemoLead(w nethttp.ResponseWriter, r *nethttp.Request) {
	principal, ok := PrincipalFromContext(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}
	var input createDemoLeadRequest
	if err := decodeJSONBody(r, &input); err != nil {
		RespondError(w, nethttp.StatusBadRequest, "validation_error", "validation failed", "body: invalid JSON")
		return
	}
	status := strings.TrimSpace(input.Status)
	if status == "" {
		status = "new"
	}
	lead, err := h.store.CreateDemoLead(r.Context(), store.CreateDemoLeadInput{
		Name:            input.Name,
		WorkEmail:       input.WorkEmail,
		Organization:    input.Organization,
		Role:            input.Role,
		Interest:        input.Interest,
		Note:            input.Note,
		Status:          status,
		Source:          "manual_admin",
		CreatedByUserID: &principal.UserID,
		CreatedAt:       time.Now().UTC(),
	})
	if err != nil {
		respondDemoLeadError(w, err)
		return
	}
	RespondJSON(w, nethttp.StatusCreated, lead)
}

func (h Handler) UpdateAdminDemoLeadStatus(w nethttp.ResponseWriter, r *nethttp.Request) {
	leadID, err := strconv.ParseInt(chi.URLParam(r, "leadId"), 10, 64)
	if err != nil {
		RespondError(w, nethttp.StatusBadRequest, "validation_error", "validation failed", "leadId: leadId must be numeric")
		return
	}
	var input updateDemoLeadStatusRequest
	if err := decodeJSONBody(r, &input); err != nil {
		RespondError(w, nethttp.StatusBadRequest, "validation_error", "validation failed", "body: invalid JSON")
		return
	}
	lead, err := h.store.UpdateDemoLeadStatus(r.Context(), store.UpdateDemoLeadStatusInput{
		ID:        leadID,
		Status:    input.Status,
		UpdatedAt: time.Now().UTC(),
	})
	if err != nil {
		respondDemoLeadError(w, err)
		return
	}
	RespondJSON(w, nethttp.StatusOK, lead)
}
```

Use the repo’s existing JSON decode helper if one exists; otherwise implement `decodeJSONBody` near other handlers with `json.NewDecoder(r.Body).Decode(target)`.

- [ ] **Step 4: Add public handler and route mapping**

In `services/api/internal/http/public_handlers.go`, add:

```go
func (h Handler) CreatePublicDemoLead(w nethttp.ResponseWriter, r *nethttp.Request) {
	var input createDemoLeadRequest
	if err := decodeJSONBody(r, &input); err != nil {
		RespondError(w, nethttp.StatusBadRequest, "validation_error", "validation failed", "body: invalid JSON")
		return
	}
	lead, err := h.store.CreateDemoLead(r.Context(), store.CreateDemoLeadInput{
		Name:         input.Name,
		WorkEmail:    input.WorkEmail,
		Organization: input.Organization,
		Role:         input.Role,
		Interest:     input.Interest,
		Note:         input.Note,
		Status:       "new",
		Source:       "public_booking",
		CreatedAt:    time.Now().UTC(),
	})
	if err != nil {
		respondDemoLeadError(w, err)
		return
	}
	RespondJSON(w, nethttp.StatusCreated, lead)
}
```

In `services/api/internal/http/router.go`, add:

```go
router.Post("/v1/public/demo-leads", handler.CreatePublicDemoLead)
router.With(requireAuth, orgAdminOrSystemAdmin).Get("/v1/admin/demo-leads", handler.ListAdminDemoLeads)
router.With(requireAuth, orgAdminOrSystemAdmin).Post("/v1/admin/demo-leads", handler.CreateAdminDemoLead)
router.With(requireAuth, orgAdminOrSystemAdmin).Patch("/v1/admin/demo-leads/{leadId}", handler.UpdateAdminDemoLeadStatus)
```

Add `respondDemoLeadError`:

```go
func respondDemoLeadError(w nethttp.ResponseWriter, err error) {
	switch {
	case errors.Is(err, pgx.ErrNoRows):
		RespondError(w, nethttp.StatusNotFound, "not_found", "demo lead not found")
	case errors.Is(err, store.ErrValidation),
		errors.Is(err, store.ErrInvalidDemoLeadInterest),
		errors.Is(err, store.ErrInvalidDemoLeadStatus),
		errors.Is(err, store.ErrInvalidDemoLeadSource):
		RespondError(w, nethttp.StatusBadRequest, "validation_error", "validation failed")
	default:
		respondStoreError(w, err, "demo lead operation failed")
	}
}
```

- [ ] **Step 5: Run handler tests and commit**

Run:

```bash
cd services/api && go test ./internal/http -run 'TestPublicDemoLeadCreate|TestAdminDemoLeadRoutesRequireOrgAdmin|TestAdminDemoLeadManagement' -count=1
cd services/api && go test ./...
```

Expected: PASS.

Commit:

```bash
git add services/api/internal/http/handlers.go services/api/internal/http/public_handlers.go services/api/internal/http/router.go services/api/internal/http/handlers_test.go
git commit -m "feat: add demo lead API routes"
```

---

### Task 3: Frontend API Client And Admin Actions

**Files:**
- Modify: `lib/demo/api-types.ts`
- Modify: `lib/demo/api-client.ts`
- Modify: `lib/demo/api-client.test.ts`
- Modify: `app/(demo)/admin/actions.ts`

- [ ] **Step 1: Write failing API client tests**

In `lib/demo/api-client.test.ts`, add:

```ts
it("creates public demo leads through the public endpoint", async () => {
  const fetchImpl = mockFetch({
    id: 42,
    name: "Buyer",
    workEmail: "buyer@example.test",
    organization: "District",
    role: "Ops",
    interest: "government",
    note: "Requested slot",
    status: "new",
    source: "public_booking",
    createdAt: "2026-05-05T08:00:00.000Z",
    updatedAt: "2026-05-05T08:00:00.000Z",
  });

  await createPublicDemoLead(
    {
      name: "Buyer",
      workEmail: "buyer@example.test",
      organization: "District",
      role: "Ops",
      interest: "government",
      note: "Requested slot",
    },
    { baseUrl: "https://api.example.test", fetch: fetchImpl },
  );

  expect(fetchImpl.mock.calls[0][0]).toBe("https://api.example.test/v1/public/demo-leads");
  expect(fetchImpl.mock.calls[0][1]).toEqual(
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        name: "Buyer",
        workEmail: "buyer@example.test",
        organization: "District",
        role: "Ops",
        interest: "government",
        note: "Requested slot",
      }),
    }),
  );
});

it("updates admin demo lead status", async () => {
  const fetchImpl = mockFetch({
    id: 42,
    name: "Buyer",
    workEmail: "buyer@example.test",
    organization: "District",
    role: "Ops",
    interest: "government",
    note: "",
    status: "completed",
    source: "manual_admin",
    createdAt: "2026-05-05T08:00:00.000Z",
    updatedAt: "2026-05-05T09:00:00.000Z",
  });

  await updateAdminDemoLeadStatus(
    42,
    { status: "completed" },
    { baseUrl: "https://api.example.test", fetch: fetchImpl },
  );

  expect(fetchImpl.mock.calls[0][0]).toBe("https://api.example.test/v1/admin/demo-leads/42");
  expect(fetchImpl.mock.calls[0][1]).toEqual(
    expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ status: "completed" }),
    }),
  );
});
```

- [ ] **Step 2: Run client tests and verify RED**

Run:

```bash
npm test -- lib/demo/api-client.test.ts
```

Expected: FAIL because lead API types/functions do not exist.

- [ ] **Step 3: Add frontend lead API types and client functions**

In `lib/demo/api-types.ts`, add:

```ts
import type { DemoLead } from "@/lib/demo/types";

export type DemoLeadApiResponse = DemoLead & {
  id: number | string;
  source: "public_booking" | "manual_admin" | "seed" | string;
  createdByUserId?: ApiNullable<number>;
  updatedAt: string;
};

export type CreateDemoLeadApiInput = {
  name: string;
  workEmail: string;
  organization: string;
  role: string;
  interest: DemoLead["interest"];
  note?: string;
  status?: DemoLead["status"];
};

export type UpdateDemoLeadStatusApiInput = {
  status: DemoLead["status"];
};
```

In `lib/demo/api-client.ts`, import those types and add:

```ts
export function createPublicDemoLead(
  input: CreateDemoLeadApiInput,
  options?: ClinicPulseApiClientOptions,
) {
  return requestClinicPulseApi<DemoLeadApiResponse>(
    ["v1", "public", "demo-leads"],
    options,
    {
      body: JSON.stringify(input),
      method: "POST",
    },
  );
}

export function fetchAdminDemoLeads(options?: ClinicPulseApiClientOptions) {
  return requestClinicPulseApi<DemoLeadApiResponse[]>(["v1", "admin", "demo-leads"], options);
}

export function createAdminDemoLead(
  input: CreateDemoLeadApiInput,
  options?: ClinicPulseApiClientOptions,
) {
  return requestClinicPulseApi<DemoLeadApiResponse>(
    ["v1", "admin", "demo-leads"],
    options,
    {
      body: JSON.stringify(input),
      method: "POST",
    },
  );
}

export function updateAdminDemoLeadStatus(
  leadId: number | string,
  input: UpdateDemoLeadStatusApiInput,
  options?: ClinicPulseApiClientOptions,
) {
  return requestClinicPulseApi<DemoLeadApiResponse>(
    ["v1", "admin", "demo-leads", String(leadId)],
    options,
    {
      body: JSON.stringify(input),
      method: "PATCH",
    },
  );
}
```

- [ ] **Step 4: Add admin server actions**

In `app/(demo)/admin/actions.ts`, import lead functions/types and add:

```ts
export async function createAdminDemoLeadAction(input: CreateDemoLeadApiInput) {
  return createAdminDemoLead(input, await getAdminApiOptions());
}

export async function updateAdminDemoLeadStatusAction(
  leadId: number | string,
  input: UpdateDemoLeadStatusApiInput,
) {
  return updateAdminDemoLeadStatus(leadId, input, await getAdminApiOptions());
}
```

- [ ] **Step 5: Run tests and commit**

Run:

```bash
npm test -- lib/demo/api-client.test.ts
npm run lint
```

Expected: PASS.

Commit:

```bash
git add lib/demo/api-types.ts lib/demo/api-client.ts lib/demo/api-client.test.ts app/'(demo)'/admin/actions.ts
git commit -m "feat: add demo lead frontend API client"
```

---

### Task 4: Frontend Booking And Admin Wiring

**Files:**
- Modify: `lib/demo/demo-store.tsx`
- Modify: `lib/demo/demo-store.test.ts`
- Modify: `components/landing/booking-demo-controller.tsx`
- Modify: `app/(demo)/admin/page.tsx`
- Modify: `app/(demo)/admin/page-client.tsx`
- Modify: `README.md`

- [ ] **Step 1: Write failing demo-store test**

In `lib/demo/demo-store.test.ts`, add a reducer-oriented test for upserting backend leads:

```ts
it("hydrates backend leads without duplicating existing lead ids", () => {
  const state = createDemoStoreInitialState({
    ...createInitialDemoState(),
    leads: [
      {
        id: "42",
        name: "Old Lead",
        workEmail: "old@example.test",
        organization: "Old Org",
        role: "Ops",
        interest: "government",
        note: "",
        createdAt: "2026-05-05T08:00:00.000Z",
        status: "new",
      },
    ],
  });

  const next = mergeDemoLeadHydrationState(state, [
    {
      id: "42",
      name: "Updated Lead",
      workEmail: "updated@example.test",
      organization: "Updated Org",
      role: "Ops",
      interest: "government",
      note: "",
      createdAt: "2026-05-05T08:00:00.000Z",
      status: "contacted",
    },
  ]);

  expect(next.leads).toHaveLength(1);
  expect(next.leads[0]).toEqual(expect.objectContaining({ name: "Updated Lead", status: "contacted" }));
});
```

- [ ] **Step 2: Run store test and verify RED**

Run:

```bash
npm test -- lib/demo/demo-store.test.ts
```

Expected: FAIL because `mergeDemoLeadHydrationState` does not exist.

- [ ] **Step 3: Add lead upsert support to demo store**

In `lib/demo/demo-store.tsx`, add:

```ts
function normalizeLeadId(lead: DemoLead) {
  return String(lead.id);
}

export function mergeDemoLeadHydrationState(
  currentState: DemoState,
  backendLeads: DemoLead[],
): DemoState {
  const backendIds = new Set(backendLeads.map(normalizeLeadId));
  return {
    ...currentState,
    leads: [
      ...backendLeads.map((lead) => ({ ...lead, id: normalizeLeadId(lead) })),
      ...currentState.leads.filter((lead) => !backendIds.has(normalizeLeadId(lead))),
    ],
  };
}
```

Update the reducer `hydrate` case to call `mergeDemoLeadHydrationState` for leads.

- [ ] **Step 4: Wire admin page server data and actions**

In `app/(demo)/admin/page.tsx`, import `fetchAdminDemoLeads`, include it in `Promise.all`, and pass `backendLeads` to the client:

```tsx
const [syncSummary, partnerReadiness, backendLeads] = await Promise.all([
  loadSyncSummaryForRole(session.role, apiOptions),
  loadPartnerReadiness(apiOptions),
  fetchAdminDemoLeads(apiOptions).catch(() => []),
]);

return (
  <AdminPageClient
    syncSummary={syncSummary}
    partnerReadiness={partnerReadiness}
    backendLeads={backendLeads.map((lead) => ({ ...lead, id: String(lead.id) }))}
  />
);
```

In `app/(demo)/admin/page-client.tsx`, add `backendLeads` prop, hydrate once, and replace lead handlers:

```ts
const [leadPersistenceError, setLeadPersistenceError] = useState<string | null>(null);

useEffect(() => {
  hydrateDemoLeads(backendLeads);
}, [backendLeads, hydrateDemoLeads]);

const handleLeadSubmit = async (lead: DemoLeadFormInput) => {
  setLeadPersistenceError(null);
  try {
    const created = await createAdminDemoLeadAction({ ...lead, status: "new" });
    addDemoLead({ ...created, id: String(created.id) });
  } catch (error) {
    setLeadPersistenceError(getPartnerActionErrorMessage(error));
    addDemoLead({ ...lead, createdAt: new Date().toISOString(), status: "new" });
  }
  setManualLeadOpen(false);
};
```

For `onLeadStatusChange`, call `updateAdminDemoLeadStatusAction`, and on failure set `leadPersistenceError` before applying the local status fallback.

Render near `DemoLeadTable`:

```tsx
{leadPersistenceError ? (
  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
    {leadPersistenceError}
  </div>
) : null}
```

- [ ] **Step 5: Wire public booking create with fallback**

In `components/landing/booking-demo-controller.tsx`, import `createPublicDemoLead`. Change `handleSubmit` to async:

```ts
const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  if (isSubmitDisabled) {
    return;
  }
  setIsSubmitting(true);
  const note = [
    lead.note.trim(),
    `Requested slot: ${selectedDateLabel}`,
    `Duration: ${duration} minutes`,
  ].filter(Boolean).join("\n");
  const leadInput = {
    ...lead,
    name: lead.name.trim(),
    workEmail: lead.workEmail.trim(),
    organization: lead.organization.trim(),
    role: lead.role.trim(),
    note,
  };
  try {
    const created = await createPublicDemoLead(leadInput);
    addDemoLead({ ...created, id: String(created.id), createdAt: created.createdAt, status: created.status });
  } catch {
    addDemoLead({
      ...leadInput,
      createdAt: new Date().toISOString(),
      status: "new",
    });
  }
  router.push(`/book-demo/thanks?name=${encodeURIComponent(lead.name)}&organization=${encodeURIComponent(lead.organization)}`);
};
```

- [ ] **Step 6: Update README wording**

In `README.md`, replace the local-storage-only lead note with:

```md
Bookings in `/book-demo` are persisted through the backend when available and fall back to browser-local demo state if the API is unavailable.
```

- [ ] **Step 7: Run frontend tests and commit**

Run:

```bash
npm test -- lib/demo/demo-store.test.ts lib/demo/api-client.test.ts
npm run lint
```

Expected: PASS.

Commit:

```bash
git add lib/demo/demo-store.tsx lib/demo/demo-store.test.ts components/landing/booking-demo-controller.tsx app/'(demo)'/admin/page.tsx app/'(demo)'/admin/page-client.tsx README.md
git commit -m "feat: persist demo leads from frontend"
```

---

### Task 5: E2E Coverage And Final Verification

**Files:**
- Modify: `tests/e2e/phase-one-smoke.spec.ts`

- [ ] **Step 1: Write failing E2E assertion**

In `tests/e2e/phase-one-smoke.spec.ts`, add a helper:

```ts
async function submitBooking(page: Page) {
  await page.goto("/?booking=1");
  await page.getByLabel("Name").fill("Smoke Lead");
  await page.getByLabel("Work email").fill("smoke.lead@example.test");
  await page.getByLabel("Organization").fill("Smoke District");
  await page.getByLabel("Role").fill("Operations lead");
  await page.getByRole("button", { name: "Submit request" }).click();
  await expect(page.getByRole("heading", { name: "Thanks, Smoke Lead" })).toBeVisible();
}
```

At the beginning of the protected-route test, before `signIn(page)`, call:

```ts
await submitBooking(page);
```

After navigating to `/admin`, assert:

```ts
await expect(page.getByText("Smoke Lead")).toBeVisible();
await expect(page.getByText("smoke.lead@example.test")).toBeVisible();
```

- [ ] **Step 2: Run E2E and verify RED if frontend/backend tasks are not complete**

Run:

```bash
make test-e2e
```

Expected before implementation: FAIL because the backend-persisted lead does not appear after login/admin reload. Expected after Tasks 1-4: PASS.

- [ ] **Step 3: Run full verification**

Run:

```bash
make verify
make test-e2e
git diff --check
```

Expected: all commands pass.

- [ ] **Step 4: Clean local artifacts and stop services**

Run:

```bash
rm -rf test-results playwright-report
docker compose stop postgres
```

- [ ] **Step 5: Commit E2E coverage**

Commit:

```bash
git add tests/e2e/phase-one-smoke.spec.ts
git commit -m "test: cover persisted booking leads"
```

---

## Self-Review

- Spec coverage: schema, seed data, public create, admin list/create/update, frontend fallback, error visibility, and E2E coverage are each mapped to a task.
- Specificity check: the plan gives exact files, commands, and code shapes for each step.
- Type consistency: frontend uses `DemoLead`, `DemoLeadApiResponse`, `CreateDemoLeadApiInput`, and `UpdateDemoLeadStatusApiInput`; backend uses `DemoLead`, `CreateDemoLeadInput`, and `UpdateDemoLeadStatusInput`.
