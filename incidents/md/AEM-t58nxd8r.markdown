---
kind: postmortem
impact: none
start-time: 2026-05-07T23:45:00Z
end-time: 2026-05-08T05:30:00Z
error-rate: 0.0034
impacted-service: publishing
postmortem-completed: 2026-05-08T08:24:39Z
---

# Intermittent network errors affecting publishing globally

### Executive Summary

On May 7, 2026 at 23:45 UTC, customers globally began experiencing intermittent error messages while authoring and publishing content, both of which rely on the publishing back-end. The issue persisted for approximately 6 hours, resolving at 05:30 UTC on May 8, 2026. Approximately 0.34% of requests were affected during the incident window, impacting around a dozen customers across multiple regions including the United States, Australia, India, Japan, Ireland, the United Kingdom, and Singapore, among others. The error rate remained below our incident threshold of 0.5%. The incident was first reported to us by affected customers.

### Root Cause

Network connectivity problems between cloud providers caused intermittent failures globally, resulting in errors for customers during content authoring and publishing operations. The intermittent nature of the failures was due to partial packet loss rather than a complete outage, causing some requests to succeed while others timed out or returned errors.

### Resolution

The network connectivity issues between cloud providers were resolved by the respective infrastructure providers. No customer action is required.

### Action Items

- Continue monitoring publishing error rates

## Updates

### Investigating
2026-05-08T08:05:00.000Z

We are investigating customer reports of intermittent errors that occurred between 23:45 UTC on May 7 and 05:30 UTC on May 8.

### Resolved
2026-05-08T05:30:00.000Z

This incident has been resolved. Error rates have returned to normal levels.
