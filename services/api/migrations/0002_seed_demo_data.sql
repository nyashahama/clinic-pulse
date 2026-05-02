INSERT INTO clinics (
    id,
    name,
    facility_code,
    province,
    district,
    latitude,
    longitude,
    operating_hours,
    facility_type,
    verification_status,
    last_verified_at,
    created_at,
    updated_at
)
VALUES
    ('clinic-mamelodi-east', 'Mamelodi East Community Clinic', 'GP-TND-001', 'Gauteng', 'Tshwane North Demo District', -25.709600, 28.367600, 'Mon-Sat 07:00-19:00', 'community_clinic', 'verified', '2026-05-01T06:40:00.000Z', '2026-05-01T06:40:00.000Z', '2026-05-01T06:40:00.000Z'),
    ('clinic-soshanguve-block-f', 'Soshanguve Block F Clinic', 'GP-TND-002', 'Gauteng', 'Tshwane North Demo District', -25.539300, 28.101200, 'Mon-Fri 07:00-18:00', 'community_clinic', 'verified', '2026-05-01T06:32:00.000Z', '2026-05-01T06:32:00.000Z', '2026-05-01T06:32:00.000Z'),
    ('clinic-ga-rankuwa-zone-1', 'Ga-Rankuwa Zone 1 Clinic', 'GP-TND-003', 'Gauteng', 'Tshwane North Demo District', -25.612200, 27.995400, 'Mon-Sat 07:00-17:00', 'community_clinic', 'verified', '2026-05-01T05:58:00.000Z', '2026-05-01T05:58:00.000Z', '2026-05-01T05:58:00.000Z'),
    ('clinic-hammanskraal-unit-d', 'Hammanskraal Unit D Clinic', 'GP-TND-004', 'Gauteng', 'Tshwane North Demo District', -25.404700, 28.279400, '24 hours', 'community_clinic', 'verified', '2026-04-30T18:15:00.000Z', '2026-04-30T18:15:00.000Z', '2026-04-30T18:15:00.000Z'),
    ('clinic-mabopane-station', 'Mabopane Station Clinic', 'GP-TND-005', 'Gauteng', 'Tshwane North Demo District', -25.498500, 28.014300, 'Mon-Fri 08:00-16:00', 'community_clinic', 'verified', '2026-05-01T06:12:00.000Z', '2026-05-01T06:12:00.000Z', '2026-05-01T06:12:00.000Z'),
    ('clinic-winterveldt-west', 'Winterveldt West Clinic', 'GP-TND-006', 'Gauteng', 'Tshwane North Demo District', -25.465800, 27.939200, 'Mon-Fri 07:30-17:00', 'community_clinic', 'verification_stale', '2026-04-29T15:45:00.000Z', '2026-04-29T15:45:00.000Z', '2026-04-29T15:45:00.000Z'),
    ('clinic-atteridgeville-extension', 'Atteridgeville Extension Clinic', 'GP-TND-007', 'Gauteng', 'Tshwane North Demo District', -25.774400, 27.936400, 'Mon-Sat 07:00-18:00', 'community_clinic', 'verification_stale', '2026-04-29T13:20:00.000Z', '2026-04-29T13:20:00.000Z', '2026-04-29T13:20:00.000Z'),
    ('clinic-akasia-hills', 'Akasia Hills Clinic', 'GP-TND-008', 'Gauteng', 'Tshwane North Demo District', -25.669400, 28.102700, 'Mon-Fri 07:00-18:00', 'community_clinic', 'verified', '2026-05-01T06:05:00.000Z', '2026-05-01T06:05:00.000Z', '2026-05-01T06:05:00.000Z')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    facility_code = EXCLUDED.facility_code,
    province = EXCLUDED.province,
    district = EXCLUDED.district,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    operating_hours = EXCLUDED.operating_hours,
    facility_type = EXCLUDED.facility_type,
    verification_status = EXCLUDED.verification_status,
    last_verified_at = EXCLUDED.last_verified_at,
    updated_at = EXCLUDED.updated_at;

INSERT INTO clinic_services (
    clinic_id,
    service_name,
    current_availability,
    confidence_score,
    last_verified_at
)
VALUES
    ('clinic-mamelodi-east', 'Primary care', 'available', 0.9500, '2026-05-01T06:40:00.000Z'),
    ('clinic-mamelodi-east', 'Maternal health', 'available', 0.9500, '2026-05-01T06:40:00.000Z'),
    ('clinic-mamelodi-east', 'HIV treatment', 'available', 0.9500, '2026-05-01T06:40:00.000Z'),
    ('clinic-mamelodi-east', 'Pharmacy', 'limited', 0.9000, '2026-05-01T06:40:00.000Z'),
    ('clinic-soshanguve-block-f', 'Primary care', 'available', 0.9000, '2026-05-01T06:32:00.000Z'),
    ('clinic-soshanguve-block-f', 'TB screening', 'available', 0.9000, '2026-05-01T06:32:00.000Z'),
    ('clinic-soshanguve-block-f', 'Immunization', 'available', 0.9000, '2026-05-01T06:32:00.000Z'),
    ('clinic-soshanguve-block-f', 'Pharmacy', 'available', 0.9000, '2026-05-01T06:32:00.000Z'),
    ('clinic-ga-rankuwa-zone-1', 'Primary care', 'available', 0.8500, '2026-05-01T05:58:00.000Z'),
    ('clinic-ga-rankuwa-zone-1', 'Lab collection', 'limited', 0.8500, '2026-05-01T05:58:00.000Z'),
    ('clinic-ga-rankuwa-zone-1', 'HIV treatment', 'available', 0.8500, '2026-05-01T05:58:00.000Z'),
    ('clinic-hammanskraal-unit-d', 'Primary care', 'available', 0.8000, '2026-04-30T18:15:00.000Z'),
    ('clinic-hammanskraal-unit-d', 'Maternal health', 'limited', 0.8000, '2026-04-30T18:15:00.000Z'),
    ('clinic-hammanskraal-unit-d', 'Emergency stabilization', 'available', 0.8000, '2026-04-30T18:15:00.000Z'),
    ('clinic-mabopane-station', 'Primary care', 'unavailable', 0.9500, '2026-05-01T06:12:00.000Z'),
    ('clinic-mabopane-station', 'Pharmacy', 'unavailable', 0.9500, '2026-05-01T06:12:00.000Z'),
    ('clinic-mabopane-station', 'Immunization', 'unavailable', 0.9500, '2026-05-01T06:12:00.000Z'),
    ('clinic-winterveldt-west', 'Primary care', 'unknown', 0.6000, '2026-04-29T15:45:00.000Z'),
    ('clinic-winterveldt-west', 'Chronic care', 'unknown', 0.6000, '2026-04-29T15:45:00.000Z'),
    ('clinic-winterveldt-west', 'Pharmacy', 'unknown', 0.6000, '2026-04-29T15:45:00.000Z'),
    ('clinic-atteridgeville-extension', 'Primary care', 'unknown', 0.6000, '2026-04-29T13:20:00.000Z'),
    ('clinic-atteridgeville-extension', 'Maternal health', 'unknown', 0.6000, '2026-04-29T13:20:00.000Z'),
    ('clinic-atteridgeville-extension', 'Pharmacy', 'unknown', 0.6000, '2026-04-29T13:20:00.000Z'),
    ('clinic-atteridgeville-extension', 'Lab collection', 'unknown', 0.6000, '2026-04-29T13:20:00.000Z'),
    ('clinic-akasia-hills', 'Primary care', 'available', 0.9000, '2026-05-01T06:05:00.000Z'),
    ('clinic-akasia-hills', 'Pharmacy', 'available', 0.9000, '2026-05-01T06:05:00.000Z'),
    ('clinic-akasia-hills', 'Immunization', 'available', 0.9000, '2026-05-01T06:05:00.000Z'),
    ('clinic-akasia-hills', 'HIV treatment', 'available', 0.9000, '2026-05-01T06:05:00.000Z')
ON CONFLICT (clinic_id, service_name) DO UPDATE SET
    current_availability = EXCLUDED.current_availability,
    confidence_score = EXCLUDED.confidence_score,
    last_verified_at = EXCLUDED.last_verified_at;

INSERT INTO current_status (
    clinic_id,
    status,
    reason,
    freshness,
    last_reported_at,
    reporter_name,
    source,
    staff_pressure,
    stock_pressure,
    queue_pressure,
    confidence_score,
    updated_at
)
VALUES
    ('clinic-mamelodi-east', 'operational', 'All essential services available after morning stock reconciliation.', 'fresh', '2026-05-01T06:40:00.000Z', 'Nomsa Dlamini', 'clinic_coordinator', 'normal', 'low', 'moderate', 0.9500, '2026-05-01T06:40:00.000Z'),
    ('clinic-soshanguve-block-f', 'operational', 'Facility open with one nurse absent but core service line still running.', 'fresh', '2026-05-01T06:32:00.000Z', 'Peter Mokoena', 'field_worker', 'strained', 'normal', 'moderate', 0.9000, '2026-05-01T06:32:00.000Z'),
    ('clinic-ga-rankuwa-zone-1', 'degraded', 'Lab courier delay is slowing same-day results and repeat visits are stacking.', 'fresh', '2026-05-01T05:58:00.000Z', 'Kagiso Tema', 'field_worker', 'strained', 'normal', 'high', 0.8500, '2026-05-01T05:58:00.000Z'),
    ('clinic-hammanskraal-unit-d', 'degraded', 'Antenatal services constrained after fridge maintenance paused vaccine storage.', 'needs_confirmation', '2026-04-30T18:15:00.000Z', 'Lerato Maseko', 'clinic_coordinator', 'normal', 'low', 'moderate', 0.8000, '2026-04-30T18:15:00.000Z'),
    ('clinic-mabopane-station', 'non_functional', 'Power outage and generator fault forced the clinic to suspend dispensing.', 'fresh', '2026-05-01T06:12:00.000Z', 'District Ops Desk', 'seed', 'critical', 'unknown', 'high', 0.9500, '2026-05-01T06:12:00.000Z'),
    ('clinic-winterveldt-west', 'unknown', 'No verified update since network blackout yesterday afternoon.', 'stale', '2026-04-29T15:45:00.000Z', 'District Ops Desk', 'seed', 'unknown', 'unknown', 'unknown', 0.6000, '2026-04-29T15:45:00.000Z'),
    ('clinic-atteridgeville-extension', 'unknown', 'Conflicting field notes need confirmation from the clinic coordinator.', 'stale', '2026-04-29T13:20:00.000Z', 'District Ops Desk', 'seed', 'unknown', 'unknown', 'unknown', 0.6000, '2026-04-29T13:20:00.000Z'),
    ('clinic-akasia-hills', 'operational', 'Facility open across all core services, with queue pressure elevated during the morning surge.', 'fresh', '2026-05-01T06:05:00.000Z', 'Mpho Ndlovu', 'clinic_coordinator', 'strained', 'normal', 'high', 0.9000, '2026-05-01T06:05:00.000Z')
ON CONFLICT (clinic_id) DO UPDATE SET
    status = EXCLUDED.status,
    reason = EXCLUDED.reason,
    freshness = EXCLUDED.freshness,
    last_reported_at = EXCLUDED.last_reported_at,
    reporter_name = EXCLUDED.reporter_name,
    source = EXCLUDED.source,
    staff_pressure = EXCLUDED.staff_pressure,
    stock_pressure = EXCLUDED.stock_pressure,
    queue_pressure = EXCLUDED.queue_pressure,
    confidence_score = EXCLUDED.confidence_score,
    updated_at = EXCLUDED.updated_at;

INSERT INTO reports (
    external_id,
    clinic_id,
    reporter_name,
    source,
    offline_created,
    submitted_at,
    received_at,
    status,
    reason,
    staff_pressure,
    stock_pressure,
    queue_pressure,
    notes,
    review_state,
    confidence_score
)
VALUES
    ('report-001', 'clinic-mamelodi-east', 'Nomsa Dlamini', 'clinic_coordinator', false, '2026-05-01T06:36:00.000Z', '2026-05-01T06:40:00.000Z', 'operational', 'All essential services available after morning stock reconciliation.', 'normal', 'low', 'moderate', 'Small queue at pharmacy but moving within target.', 'accepted', 0.9500),
    ('report-002', 'clinic-soshanguve-block-f', 'Peter Mokoena', 'field_worker', false, '2026-05-01T06:28:00.000Z', '2026-05-01T06:32:00.000Z', 'operational', 'Facility open with one nurse absent but core service line still running.', 'strained', 'normal', 'moderate', 'Recommend monitoring afternoon staffing handoff.', 'accepted', 0.9000),
    ('report-003', 'clinic-ga-rankuwa-zone-1', 'Kagiso Tema', 'field_worker', false, '2026-05-01T05:54:00.000Z', '2026-05-01T05:58:00.000Z', 'degraded', 'Lab courier delay is slowing same-day results and repeat visits are stacking.', 'strained', 'normal', 'high', 'Patients needing specimen confirmation are being asked to return after lunch.', 'accepted', 0.8500),
    ('report-004', 'clinic-hammanskraal-unit-d', 'Lerato Maseko', 'clinic_coordinator', false, '2026-04-30T18:06:00.000Z', '2026-04-30T18:15:00.000Z', 'degraded', 'Antenatal services constrained after fridge maintenance paused vaccine storage.', 'normal', 'low', 'moderate', 'Cold chain contractor expected on site by 09:00.', 'accepted', 0.8000),
    ('report-005', 'clinic-mabopane-station', 'District Ops Desk', 'seed', false, '2026-05-01T06:09:00.000Z', '2026-05-01T06:12:00.000Z', 'non_functional', 'Power outage and generator fault forced the clinic to suspend dispensing.', 'critical', 'unknown', 'high', 'Redirect chronic care pickups until generator vendor confirms ETA.', 'accepted', 0.9500),
    ('report-006', 'clinic-winterveldt-west', 'District Ops Desk', 'seed', false, '2026-04-29T15:40:00.000Z', '2026-04-29T15:45:00.000Z', 'unknown', 'No verified update since network blackout yesterday afternoon.', 'unknown', 'unknown', 'unknown', 'Field follow-up still pending after signal loss.', 'pending', 0.6000),
    ('report-007', 'clinic-atteridgeville-extension', 'District Ops Desk', 'seed', false, '2026-04-29T13:15:00.000Z', '2026-04-29T13:20:00.000Z', 'unknown', 'Conflicting field notes need confirmation from the clinic coordinator.', 'unknown', 'unknown', 'unknown', 'One note reports medicine pickup only; another reports full closure.', 'pending', 0.6000),
    ('report-008', 'clinic-akasia-hills', 'Mpho Ndlovu', 'clinic_coordinator', false, '2026-05-01T06:01:00.000Z', '2026-05-01T06:05:00.000Z', 'operational', 'Facility open across all core services, with queue pressure elevated during the morning surge.', 'strained', 'normal', 'high', 'One overflow tent staffed; queues are elevated but service lines remain open.', 'accepted', 0.9000),
    ('report-009', 'clinic-soshanguve-block-f', 'Peter Mokoena', 'field_worker', true, '2026-04-30T14:12:00.000Z', '2026-04-30T15:01:00.000Z', 'operational', 'Connectivity restored after short outage; service resumed throughout the afternoon.', 'normal', 'normal', 'low', 'Delayed upload from the previous round.', 'accepted', 0.9000)
ON CONFLICT (external_id) DO NOTHING;

INSERT INTO audit_events (
    external_id,
    clinic_id,
    actor_name,
    event_type,
    summary,
    created_at
)
VALUES
    ('audit-001', 'clinic-mabopane-station', 'District Ops Desk', 'alert.created', 'Critical downtime alert opened for power and generator failure.', '2026-05-01T06:13:00.000Z'),
    ('audit-002', 'clinic-winterveldt-west', 'District Ops Desk', 'clinic.status_marked_stale', 'Clinic status marked stale after 36 hours without a verified report.', '2026-04-30T04:00:00.000Z'),
    ('audit-003', 'clinic-atteridgeville-extension', 'District Ops Desk', 'clinic.status_marked_stale', 'Escalated conflicting status reports to the district manager queue.', '2026-04-30T04:12:00.000Z'),
    ('audit-004', 'clinic-ga-rankuwa-zone-1', 'Kagiso Tema', 'report.submitted', 'Field worker submitted a degraded-status report citing courier delays.', '2026-05-01T05:58:00.000Z'),
    ('audit-005', 'clinic-hammanskraal-unit-d', 'Lerato Maseko', 'report.submitted', 'Coordinator reported cold-chain disruption affecting antenatal services.', '2026-04-30T18:15:00.000Z'),
    ('audit-006', 'clinic-mamelodi-east', 'Nomsa Dlamini', 'report.submitted', 'Morning readiness report confirmed all core services live.', '2026-05-01T06:40:00.000Z')
ON CONFLICT (external_id) DO NOTHING;
