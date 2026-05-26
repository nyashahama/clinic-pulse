ALTER TABLE reports
    ADD COLUMN visit_verification JSONB CHECK (
        visit_verification IS NULL OR jsonb_typeof(visit_verification) = 'object'
    );
