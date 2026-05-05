# Demo Lead Persistence Design

Date: 2026-05-05

## Context

Booking leads currently live in the browser demo store and local storage. The public booking modal calls `addDemoLead`, the admin page reads `state.leads`, and status updates mutate local state only. This keeps demos resilient, but it means the founder pipeline is not durable across browsers, CI runs, or backend-backed admin workflows.

This spec is stored under `specs/` because this repository treats `docs/` and `docs/superpowers/` as local-only ignored paths.

## Goals

- Persist public booking submissions through the Go API.
- Let authenticated admins list, manually create, and update lead statuses from the backend.
- Preserve the current demo UX and local fallback behavior when the API is unavailable.
- Keep the backend contract small and aligned with the existing `DemoLead` shape.
- Extend automated coverage so the booking-to-admin path is verified.

## Non-Goals

- Full CRM functionality, assignments, reminders, or lead deletion.
- Email delivery, calendar integration, or duplicate lead resolution.
- Partner API exposure for leads.
- Replacing browser-local offline report behavior.

## Data Model

Add a `demo_leads` table:

- `id BIGSERIAL PRIMARY KEY`
- `name TEXT NOT NULL`
- `work_email TEXT NOT NULL`
- `organization TEXT NOT NULL`
- `role TEXT NOT NULL`
- `interest TEXT NOT NULL CHECK (interest IN ('government', 'ngo', 'investor', 'clinic_operator', 'other'))`
- `note TEXT NOT NULL DEFAULT ''`
- `status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled', 'completed'))`
- `source TEXT NOT NULL CHECK (source IN ('public_booking', 'manual_admin', 'seed'))`
- `created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

Indexes:

- `demo_leads_created_at_idx` on `created_at DESC, id DESC`
- `demo_leads_status_created_at_idx` on `status, created_at DESC`

Seed the existing four demo leads into this table with `source = 'seed'` so admin starts with the same baseline data.

## API Contract

Public booking capture:

- `POST /v1/public/demo-leads`
- Accepts `name`, `workEmail`, `organization`, `role`, `interest`, and optional `note`.
- Creates a lead with `status = 'new'` and `source = 'public_booking'`.
- Returns the created lead.

Admin lead management:

- `GET /v1/admin/demo-leads`
- Requires `org_admin` or `system_admin`.
- Returns leads newest-first.

- `POST /v1/admin/demo-leads`
- Requires `org_admin` or `system_admin`.
- Accepts the same fields as public creation plus optional `status`.
- Creates a lead with `source = 'manual_admin'` and `created_by_user_id` from the session.
- Returns the created lead.

- `PATCH /v1/admin/demo-leads/{leadId}`
- Requires `org_admin` or `system_admin`.
- Accepts `status`.
- Updates status and `updated_at`, then returns the updated lead.

Validation errors use the existing API error envelope. Required strings are trimmed and must remain non-empty. Invalid `interest` or `status` values return `400 validation_error`. Missing leads return `404 not_found`.

## Frontend Flow

Add `DemoLeadApiResponse`, `CreateDemoLeadApiInput`, and `UpdateDemoLeadStatusApiInput` types to the frontend API layer.

Add API client functions:

- `createPublicDemoLead`
- `fetchAdminDemoLeads`
- `createAdminDemoLead`
- `updateAdminDemoLeadStatus`

Booking modal behavior:

1. Trim and assemble the same note payload currently used for requested slot and duration.
2. Try `createPublicDemoLead`.
3. On success, mirror the returned lead into the demo store so the current session updates immediately.
4. On failure, fall back to existing local `addDemoLead` behavior and still route to the thank-you page.

Admin behavior:

1. Server page fetches admin leads through the authenticated API path and passes them to the client.
2. The demo store hydrates those backend leads without duplicating local fallback leads.
3. Manual lead submission calls an admin server action. On success, update local state with the returned lead and close the modal.
4. Status changes call an admin server action. On success, update local state with the returned lead status.
5. If an admin action fails, keep the current local mutation fallback but show a concise error state near the lead table.

## Error Handling

Public booking should be resilient: backend failure must not block the user from reaching `/book-demo/thanks`.

Admin management should surface backend failures because admins need to know whether the pipeline persisted. Local state may still update for demo continuity, but the page should show that the backend write failed.

## Testing

Backend:

- Migration test covers the new table.
- Store tests cover create, list newest-first, update status, invalid/missing lead behavior.
- Handler tests cover public create, admin list/create/update, auth enforcement, and validation errors.

Frontend:

- API client tests cover URL construction, payloads, and response mapping.
- Booking controller tests or extracted helper tests cover public API success and fallback behavior.
- Admin page action tests cover create/update calls and error propagation.

E2E:

- Extend the phase-one smoke path to submit a booking lead and verify it appears in admin after login.
- Keep the suite pointed at the isolated `clinicpulse_e2e` database.

## Rollout Notes

The existing local storage lead path stays as fallback during this phase. Once backend persistence is stable, a later cleanup can remove lead persistence from browser storage or narrow it to optimistic UI only.
