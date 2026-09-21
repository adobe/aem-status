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

A degradation in Adobe's Identity Management Service (IMS) — an upstream dependency for authentication — prevented new sign-in, token issuance, and token validation from completing. Because publishing operations on Adobe-content-source projects depend on IMS-backed tokens via the admin API, any request that needed to acquire or refresh a token during the window failed to authenticate. This was a dependency failure: the fault originated in IMS, not in the AEM publishing service itself.

### Resolution

No action was required on the AEM side. The IMS dependency recovered and authentication resumed, at which point publishing requests succeeded again. Availability was restored at 11:42 UTC. Customers who saw failures could retry sign-in and publishing once IMS recovered; customers with still-valid tokens experienced no interruption. No customer action is required.

