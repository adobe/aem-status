---
kind: postmortem
impact: minor
start-time: "2025-11-26T13:55:00Z"
end-time: "2025-11-26T14:20:00Z"
error-rate: 0.0001
impacted-service: publishing
postmortem-completed: "2025-11-26T14:15:00Z"
---

# Outage affecting Document Authoring (DA)

### Executive Summary

On November 26, 2025 at 13:55 UTC, authors began experiencing "not permitted" errors and observed that updates to da.live were not being saved. The issue was quickly escalated and identified as impacting Document Authoring functionality. The issue affected few Document Authoring users for 25 minutes. Only about 60 save operations failed during this period, though no data loss occurred due to client-side drafts. The issue was quickly escalated and resolved by 14:20 UTC.

### Root Cause

The outage was caused by the deployment of a buggy version of the DA backend service. The new deployment introduced a regression that led to failed requests and unexpected responses, resulting in client errors and data loss for authors.

### Resolution

At 14:15 UTC, the operations team rolled back to the last known good deployment. This action restored normal service and resolved the errors experienced by users.

### Action Items

- Implement automated post-deployment smoke tests to validate DA service functionality before activation.
- Enhance monitoring and alerting for DA services to ensure rapid detection and notification of failures.
- Review and improve deployment procedures to prevent regressions from reaching production.

## Updates

### Resolved
2025-11-26T14:20:00Z

This incident was resolved at 14:20 UTC on November 26, 2025, following a rollback to a stable deployment.

