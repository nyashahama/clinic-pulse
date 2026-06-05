-- name: ListPilotIngestionRuns :many
SELECT
    id,
    organisation_id,
    source_name,
    source_reference,
    status,
    records_received,
    records_imported,
    records_rejected,
    validation_errors,
    actor_user_id,
    started_at,
    completed_at
FROM pilot_ingestion_runs
WHERE sqlc.narg('organisation_id') IS NULL OR organisation_id = sqlc.narg('organisation_id')
ORDER BY started_at DESC, id DESC
LIMIT sqlc.arg('limit');
