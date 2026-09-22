---
kind: postmortem
impact: minor
start-time: "2026-09-18T10:03:00.000Z"
end-time: "2026-09-18T11:42:00.000Z"
error-rate: 0.0000
impacted-service: publishing
postmortem-completed: "2026-09-21T11:11:10.000Z"
---

# IMS Auth Outage Impacting Content Publishing

### Executive Summary

On September 18, 2026 at 10:03 UTC, an issue affecting Adobe's Identity Management Service (IMS) began causing sign-in and authentication failures for a subset of Adobe Experience Cloud customers globally, across the Americas, APAC, and EMEA. For AEM Edge Delivery Services this surfaced on the publishing path (the Edge Delivery Services Author Tier / admin API): publish and preview requests that needed to obtain or refresh an IMS-backed authentication token were rejected while IMS was degraded.

Impact was limited. Users who already held a valid IMS or admin token were not affected and could continue working normally, and projects using non-Adobe content sources were not impacted at all.

The incident was detected through a combination of internal observation and monitoring. It was resolved at 11:42 UTC when the IMS dependency recovered — a total duration of 1 hour and 39 minutes, spanning the Americas, APAC, and EMEA regions.

### Root Cause

The root cause was a configuration issue within Adobe's Identity Management Service (IMS) authentication infrastructure — an upstream dependency AEM relies on for authentication. The issue prevented new sign-in, token issuance, and token validation from completing. Because publishing operations on Adobe-content-source projects depend on IMS-backed tokens obtained via the admin API, any request that needed to acquire or refresh a token during the window failed to authenticate. The fault originated in IMS, not in the AEM publishing service itself. Adobe tracked the incident on its status page: https://status.adobe.com/products/503489.

### Resolution

No action was required on the AEM side. Adobe engineering identified and corrected the configuration issue within the authentication infrastructure and refreshed the affected components, after which authentication services recovered and the impacted Adobe services — including the AEM publishing path — resumed normal operation. Availability was restored at 11:42 UTC. Customers who saw failures could retry sign-in and publishing once IMS recovered; customers with still-valid tokens experienced no interruption. No customer action is required.

### Action Items

- Provide an alternative login method so affected users can authenticate through a different identity provider (IdP) when IMS is disrupted.

## Updates

### Resolved
2026-09-18T11:42:00.000Z

This incident has been resolved. Adobe corrected a configuration issue within the IMS authentication infrastructure and refreshed the affected components; authentication recovered and publishing and preview operations returned to normal.

### Investigating
2026-09-18T10:03:00.000Z

We are investigating authentication failures affecting publish and preview operations, related to a degradation in Adobe's Identity Management Service (IMS).

