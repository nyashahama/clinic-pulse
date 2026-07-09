-- name: CreateWalkthroughRequest :one
INSERT INTO walkthrough_requests (
    name, work_email, organization, role, interest,
    note, requested_date, requested_time, duration_minutes
) VALUES (
    @name, @work_email, @organization, @role, @interest,
    @note, @requested_date, @requested_time, @duration_minutes
) RETURNING *;
