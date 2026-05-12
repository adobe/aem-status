---
kind: postmortem
impact: none
start-time: 2026-05-11T13:30:00Z
end-time: 2026-05-11T21:45:00Z
error-rate: 0
impacted-service: publishing
postmortem-completed: 2026-05-12T12:00:00Z
---

# Regression affecting Code Sync of new Branches

### Executive Summary

On May 11, 2026 at 13:30 UTC, customers began reporting that newly created branches were not being synced correctly by AEM Code Sync. The issue persisted for approximately 8 hours 15 minutes. Publishing operations were unaffected and the publishing error rate remained at 0. Development workflows were affected: 100% of new branch sync operations failed during the incident window, resulting in 320 failed branch syncs across roughly 50 customers.

### Root Cause

A regression was introduced in a deployment of the EDS Admin Service that broke the handling of new branch creation in Code Sync. The defect caused new branches to fail silently during the sync process without producing HTTP-level errors.

### Resolution

The offending deployment was identified and reverted. Normal branch sync behavior resumed immediately after the rollback. We attempted to re-sync all 320 affected branches; however, some may not have been recovered due to sanitized branch names in the logs making it difficult to identify every affected branch with certainty. Customers who notice branches still not syncing should re-trigger sync manually.

### Action Items

- Improve automated tests for new branch sync scenarios to the CI/CD pipeline to catch regressions before deployment
- Consider implement monitoring and alerting for elevated branch sync failure rates to enable faster detection

## Updates

### Resolved
2026-05-11T21:45:00Z

The offending EDS Admin Service deployment has been reverted and Code Sync is operating normally. We attempted to re-sync all affected branches; customers who still experience issues should re-trigger sync manually.

### Monitoring
2026-05-11T21:40:00Z

Rollback of the offending deployment initiated. Monitoring for recovery.

### Identified
2026-05-11T21:30:00Z

Root cause identified as a regression in the EDS Admin Service deployment from 13:30 UTC. Rollback planned.

### Investigating
2026-05-11T21:25:00Z

Investigation started following customer reports. First customer report received at 18:15 UTC. The EDS Admin Service had been deployed at 13:30 UTC.
