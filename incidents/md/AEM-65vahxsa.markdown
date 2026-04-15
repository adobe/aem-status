---
kind: postmortem
impact: none
start-time: "2026-02-07T01:57:00.000Z"
end-time: "2026-02-09T16:30:00.000Z"
error-rate: 0.00035
impacted-service: delivery
postmortem-completed: "2026-02-12T11:44:49.510Z"
---

# Delivery service disrupted by Cloudflare R2 outage

### Executive Summary

On February 7, 2026 between 01:57 UTC and 02:34 UTC, delivery service requests experienced elevated error rates of approximately 0.035% due to an outage in Cloudflare's R2 storage service. Our automated monitoring detected the issue at 02:05 UTC (8 minutes after onset), and we initiated a manual failover to an alternate cloud provider, restoring the service at 02:34 UTC (37 minutes after onset).

However, the failover introduced a secondary issue: customers with very large content indexes encountered 413 (Request Entity Too Large) errors on the alternate provider. This continued until we migrated affected projects back to Cloudflare backends on February 9, 2026 at 16:30 UTC, after confirming the underlying R2 issue was resolved. The total incident duration was 62 hours and 38 minutes, though the primary outage lasted only 37 minutes.

### Root Cause

The immediate cause was an [underlying issue with Cloudflare's R2 service](https://www.cloudflarestatus.com/incidents/qy92kxdhg16t) that began at approximately 01:57 UTC on February 7, 2026.

However, the extended impact to customers (through February 9) revealed architectural limitations in our multi-cloud strategy. Our alternate cloud provider had lower payload size limits, resulting in 413 (Request Entity Too Large) errors for customers with large indexes. This indicates our failover strategy did not account for provider-specific constraints, and we lacked feature parity testing across backup infrastructure.

### Resolution

**Immediate Mitigation (February 7, 02:34 UTC):** We switched projects using Cloudflare backends to an alternate cloud provider, restoring delivery service functionality. However, this introduced a new issue where customers with very large indexes began experiencing 413 (Request Entity Too Large) responses due to lower payload limits on the alternate provider.

**Permanent Resolution (February 9, 16:30 UTC):** After Cloudflare resolved the underlying R2 issue at 04:43 UTC on February 7, we monitored the situation for stability. Once confirmed stable, we migrated affected projects back to Cloudflare backends on February 9 at 16:30 UTC, fully resolving the 413 errors for customers with large indexes.

### Action Items

- Evaluate options to improve index storage and processing format to reduce payload sizes and increase             resilience to provider constraints

## Updates

### Resolved
2026-02-09T16:35:00.000Z

This incident has been resolved.

### Monitoring
2026-02-09T16:30:00.000Z

We switched affected projects back to Cloudflare backends.

### Identified
2026-02-07T20:41:00.000Z

One customer experienced an increase of 413 responses for very large indexes after moving them off Cloudflare backends.

### Partially Resolved
2026-02-07T02:34:00.000Z

This incident has been resolved.

### Monitoring
2026-02-07T02:34:00.000Z

We identified the problem and switched projects using Cloudflare backends to another cloud provider.

### Identified
2026-02-07T02:05:00.000Z

We are observing an increase of errors on requests served from Cloudflare backends.

