---
kind: postmortem
impact: none
start-time: 2026-08-17T07:15:16Z
end-time: 2026-08-17T07:42:04Z
error-rate: 0.0038
impacted-service: publishing
postmortem-completed: 2026-08-17T08:20:56Z
---

# Issues with da.live editing observed

### Executive Summary

On August 17, 2026 at 07:15 UTC, we observed intermittent HTTP 500 errors on the da.live collaborative editing service (`collab.da.live`, served by the `da-collab` Cloudflare Worker). Authors working in da.live experienced sporadic failures when their editing sessions synced document state. The errors were concentrated in Asia-Pacific datacenters (Chennai, Delhi, Mumbai, Bangalore) and a smaller share in Chicago (ORD), and affected a subset of customers across multiple organizations. The incident was detected by an automated alert on the collaboration service's error rate. In total, 220 requests returned HTTP 500 across the incident window, an error rate of 0.382%. Error metrics recovered and the incident resolved at 07:42 UTC, for a total duration of approximately 27 minutes. The root cause was an upstream Cloudflare Durable Objects incident that degraded the backing store used by the collaboration service.

### Root Cause

The `da-collab` Worker relies on Cloudflare Durable Objects to coordinate real-time collaborative editing state. During the incident window, Cloudflare experienced an increase in errors for Durable Objects and downstream services (tracked publicly as [Increased Errors for Durable Objects](https://www.cloudflarestatus.com/incidents/w1d9976ls02m), affecting the Singapore/SIN region). Requests that depended on the degraded Durable Objects returned HTTP 500 to da.live authors. This was an upstream third-party outage; no change on the AEM side triggered it.

Cloudflare opened the public incident at 07:47 UTC and marked it resolved at 08:58 UTC, a total upstream window of roughly 1 hour and 11 minutes; no root cause was published on their status page. Author-visible errors on `da-collab` recovered well ahead of that, by 07:42 UTC — before Cloudflare's public incident was even posted — indicating our exposure to the degraded Durable Objects was limited to the early part of their incident.

### Resolution

No action was required on the AEM side. Our error monitoring showed the collaboration service returning to normal operation by 07:42 UTC — notably before Cloudflare had even posted their public incident (07:47 UTC), which then remained open, likely for their own monitoring, for roughly another hour until 08:58 UTC. The transient errors subsided without any AEM-side intervention and the incident auto-resolved. No customer action is required; any editing changes affected during the window could be retried by re-saving.

### Action Items

- Review whether the collaboration client can retry or gracefully degrade on transient Durable Objects errors to reduce author-visible failures.

## Updates

### Resolved
2026-08-17T07:42:04Z

Our error monitoring shows errors on the da.live collaboration service have subsided, with metrics recovering at 07:42 UTC and the service returning to normal operation. The incident has auto-resolved. The upstream Cloudflare Durable Objects incident was still open at this time and remained so for roughly another hour.

### Monitoring
2026-08-17T07:36:01Z

Increased errors in the collaboration service identified as related to a Cloudflare Durable Objects incident. We are monitoring recovery.

### Investigating
2026-08-17T07:15:16Z

Issues with da.live editing observed. We are investigating intermittent errors affecting collaborative editing.
