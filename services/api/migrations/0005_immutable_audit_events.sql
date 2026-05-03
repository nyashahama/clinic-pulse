CREATE FUNCTION prevent_audit_events_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'audit_events rows are immutable after insertion'
        USING ERRCODE = 'integrity_constraint_violation';
END;
$$;

CREATE TRIGGER audit_events_immutable_after_insert_trg
    BEFORE UPDATE OR DELETE ON audit_events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_events_mutation();

CREATE TRIGGER audit_events_immutable_truncate_trg
    BEFORE TRUNCATE ON audit_events
    FOR EACH STATEMENT
    EXECUTE FUNCTION prevent_audit_events_mutation();
