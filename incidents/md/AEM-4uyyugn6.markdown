---
kind: postmortem
impact: none
start-time: "2025-12-05T08:56:00Z"
end-time: "2025-12-05T09:20:00Z"
error-rate: 0.0
impacted-service: delivery
postmortem-completed: "2025-12-11T21:55:30.000Z"
---

# 3rd party incident impacting selected customers

On December 5, 2025, at 08:56 UTC, we were alerted to a service disruption by one of our customer-specific site alerts. The incident lasted 24 minutes and affected a fraction of our customers who experienced delivery failures with 500 errors from Cloudflare's infrastructure. The incident was isolated to customer-selected Cloudflare services and did not impact our core delivery infrastructure. AEM infrastructure was not impacted by this incident and remained operational. Our internally facing 3rd party operations infrastructure (logging), was also temporarily inaccessible. Normal service resumed at 09:20 UTC following Cloudflare's resolution of the outage. Our operations team successfully switched to our backup log monitoring solution, maintaining operational visibility throughout the incident.

### Root Cause

The incident was caused by an outage in the [Cloudflare network](https://www.cloudflarestatus.com/incidents/lfrm31y6sw9q), a 3rd-party service chosen by the impacted customers. Cloudflare reported that a change made to how their Web Application Firewall parses requests caused their network to become temporarily unavailable. This was an internal change by the 3rd-party provider and not a security attack.

[Cloudflare Incident Post-Mortem](https://www.cloudflarestatus.com/incidents/lfrm31y6sw9q)

### Detection

The incident was detected at 08:56 UTC through customer-specific site alerts. No other alerts were triggered. AEM delivery infrastructure remained operational. The simultaneous loss of access to internally facing 3rd party operations infrastructure created a secondary operational challenge that was immediately apparent to the operations team.

### Resolution

The underlying network issue was resolved by the 3rd-party provider (Cloudflare) implementing a fix for the faulty WAF change. Upon discovering the inaccessibility of Coralogix, the operations team successfully switched all internal log monitoring and analysis to our designated backup logging solution. This ensured continuous operational visibility despite the primary tool failure. No action is required by customers as the external service is fully functional by 09:20 UTC.

### Action Items

The incident highlights dependencies on critical 3rd-party infrastructure for both customer delivery and internal operations.

- Dependency Mapping Review: Explicitly review critical internal operational tools (e.g.,       Coralogix, monitoring) to understand the full blast radius of external outages
- Document Log Monitoring Failover: Formalize the runbook for switching to the backup log       monitoring solution (used successfully in this incident)

## Updates

### Resolved
2025-12-05T09:20:00.000Z

This incident has been resolved. The 3rd-party service has restored their network
      availability, and both impacted customer sites and our internal Coralogix logging service
      are operating normally. Log analysis has been switched back to the primary Coralogix
      platform.

### Monitoring
2025-12-05T09:12:00.000Z

The 3rd-party provider has implemented a fix and is currently monitoring the results. Our
      customer sites are showing restored service delivery, and the Coralogix service is
      accessible again. We are continuing to monitor the incident.

### Identified
2025-12-05T08:56:00Z

We have identified that the issue is due to a major incident with a 3rd-party network
      provider (Cloudflare) impacting selected customers who use their WAF service. Furthermore,
      our internal logging tool, Coralogix, is also inaccessible due to this outage. Our core
      customer-facing services are unaffected, and the Operations Team has switched to the backup
      log monitoring solution.

