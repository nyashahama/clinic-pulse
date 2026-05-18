# Pilot SLOs

These are internal alpha/pilot service objectives for operating ClinicPulse responsibly. They are not a customer-facing SLA and should not be presented as contractual availability or support commitments.

| Objective | Pilot target | Measurement | Notes |
| --- | --- | --- | --- |
| API availability | 99.0% monthly during agreed pilot hours | Successful API health checks from the monitoring location | Excludes planned maintenance and provider outages outside operator control. |
| Frontend availability | 99.0% monthly during agreed pilot hours | Successful Vercel/frontend uptime checks | Measures page availability, not every downstream API workflow. |
| API p95 latency | p95 below 1.5s over rolling 30-minute windows | API request duration histogram | Applies to normal traffic volume; excludes cold starts, bulk exports, and provider incidents. |
| Authenticated workflow success | 97% successful completion for login and pilot-critical authenticated API requests | Non-5xx, non-auth-config-failure request outcomes | Invalid credentials and intentional rate limits are counted separately from system failures. |
| Data freshness | Pilot-critical clinic status refreshed within 24 hours, or clearly marked stale | Stale clinic count and source freshness fields | Alpha data may depend on manual or API-triggered workflows. |
| Incident acknowledgement time | Sev1 within 15 minutes during pilot support window; Sev2 within 1 business hour | Alert timestamp to operator acknowledgement | Outside the support window, acknowledge at the next agreed coverage period. |
| Incident communication time | Initial Sev1 stakeholder update within 30 minutes; Sev2 update when user-visible impact is confirmed | Incident timeline and stakeholder message log | Updates should state impact, current action, workaround, and next update time. |

## Error Budget Use

- Availability error budget is calculated only over the agreed pilot measurement window: `pilot minutes * (1 - target availability)`.
- For a 99.0% target, the unavailable budget is 1% of pilot minutes. Example: an 8x5 pilot week is 40 hours, or 2,400 minutes, so the weekly unavailable budget is 24 minutes.
- For a full 30-day always-on month, 99.0% allows 432 unavailable minutes, but use this only if the pilot explicitly measures 24x7 availability.
- Use SLO misses to decide whether to pause feature promotion and focus on reliability work.
- Do not use these targets as public commitments until monitoring coverage, traffic baseline, and support hours are agreed in writing.
- Review SLOs after each pilot milestone and after any Sev1 or Sev2 incident.
