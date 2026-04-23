---
kind: postmortem
impact: none
start-time: "2026-04-23T03:24:00.000Z"
end-time: "2026-04-23T04:03:00.000Z"
error-rate: 0.00123
impacted-service: delivery
postmortem-completed: "2026-04-23T05:00:00.000Z"
---

# Elevated 5xx errors on delivery due to Cloudflare IAD connectivity issues

### Executive Summary

On April 23, 2026 between 03:24 and 04:03 UTC, AEM delivery experienced elevated 5xx errors driven by a Cloudflare network connectivity incident in the Ashburn, Virginia (IAD) region. A total of 3.46K requests returned 5xx status codes, dominated by HTTP 503 responses and `first byte timeout` errors in the HTML pipeline path. The overall delivery error rate during the window was 0.123%.

### Root Cause

The incident was caused by an upstream network connectivity issue in Cloudflare's Ashburn, Virginia (IAD) data center, tracked as [Cloudflare incident qzb6ncj7v2qc](https://www.cloudflarestatus.com/incidents/qzb6ncj7v2qc). AEM delivery runs on a dual-stack architecture, with roughly 50% of traffic served from Cloudflare backends. Because IAD is configured as the Fastly shield, all Fastly requests to the Cloudflare-backed stack transit through IAD regardless of the PoP that initially received them, so the full population of Cloudflare-stack requests was exposed to the IAD connectivity issue.

### Resolution

No action was required on the AEM side. Cloudflare deployed a fix at 04:03 UTC and marked the incident resolved at 04:36 UTC, at which point error rates returned to baseline. Customers whose content delivery requests failed during the window would have received transient 503 responses; most client and CDN retry behavior would have absorbed these, and no data loss or persistent degradation occurred.

### Action Items

- Continue closely monitoring error rates and traffic; if a similar upstream incident recurs,             temporarily fail-over to the non-affected stack.

## Updates

### Resolved
2026-04-23T04:36:00.000Z

Cloudflare has resolved the underlying IAD connectivity incident and AEM delivery error
            rates have returned to baseline. No further action is required.

### Monitoring
2026-04-23T04:03:00.000Z

Cloudflare has deployed a fix for the IAD connectivity issue. We are monitoring delivery
            error rates as they return to normal.

### Identified
2026-04-23T03:57:00.000Z

Elevated 5xx errors on AEM delivery have been correlated with a Cloudflare network
            connectivity incident in the Ashburn, Virginia (IAD) region
            (cloudflarestatus.com).
            Impact is limited to a small fraction of delivery requests.

### Investigating
2026-04-23T03:30:00.000Z

We are observing a spike in 5xx errors on AEM delivery, primarily affecting HTML pipeline
            requests with first byte timeouts. Our team is investigating.

