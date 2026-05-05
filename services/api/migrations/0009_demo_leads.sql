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
