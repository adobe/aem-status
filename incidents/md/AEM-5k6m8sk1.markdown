---
kind: postmortem
impact: minor
start-time: 2026-09-19T03:32:22Z
end-time: 2026-09-21T14:30:00Z
error-rate: 0.0000
impacted-service: delivery
postmortem-completed: 2026-09-21T17:26:00Z
---

# Additional metadata sheets not applied to delivered pages

### Executive Summary

On September 19, 2026 at 03:32 UTC, an automated dependency update rolled out an internal software release that had introduced a regression in how site configuration is resolved. Sites that split their metadata across several sheets had all but the first sheet silently ignored, so some metadata properties were missing from the pages we delivered. Only 1.7% of production sites were configured in a way that exposed them to this defect. 3 customers reported the problem over the course of September 21, 2026. There were no errors: pages continued to be delivered successfully, but some with partial metadata applied. The incident lasted 2 days, 10 hours and 57 minutes and was fully resolved by 14:30 UTC on September 21.

Because of our long CDN cache TTLs, a page only degraded once it dropped out of cache and had to be re-rendered. High-traffic pages stay cached the longest, so the defect surfaced gradually and unevenly rather than site-wide at the moment of deployment — which is also why it took until Monday morning for a customer to notice.

### Root Cause

A change intended to let callers load a single metadata partition moved an assignment so that the site's configured list of metadata sheets was overwritten before those sheets were fetched. The loader reads that list back out of the object it had just been assigned into, so by the time it ran, the configured sources were gone, and it fell back to its built-in default of a single sheet.

Two properties of the system turned a subtle ordering change into a silent, long-lived defect. The fallback treats "no sources configured" and "sources lost" identically, with no error, warning or log entry, so the failure looked entirely normal to every downstream consumer. And no metric tracks how many metadata sheets are fetched or applied per request, so every availability and error-rate signal stayed flat for the full duration. The change was reviewed, passed a green test suite with 100% code coverage, and shipped: test fixtures declared multi-sheet configurations but never supplied a second sheet or asserted that its contents reached the output, so the aggregation path was never exercised end to end.

### Resolution

A fix restoring the original evaluation order was released at 10:47 UTC on September 21 and deployed to the primarily affected cloud stack at 10:58 UTC. After validation, the fix was also deployed to the other cloud stack at 12:28 UTC — the point at which the defect left the delivery path entirely.

Deploying the corrected code did not by itself repair pages already rendered and cached with incomplete metadata, so caches were manually purged at all levels across all stacks. That work completed by 14:30 UTC, when all sites with reported issues were confirmed back to normal.

All remediation was carried out by Adobe. No customer action was required at any point, and affected sites recovered without their owners needing to republish, reconfigure or purge anything themselves.

### Action Items

- Add test coverage asserting that all configured metadata sheets are aggregated into the delivered metadata, with a fixture that actually serves a second sheet.

## Updates

### Resolved
2026-09-21T14:30:00Z

This incident has been resolved. The change that caused the regression has been reverted, caches have been purged across all stacks, and all sites with reported issues are delivering complete metadata again.

### Monitoring
2026-09-21T10:47:53Z

A fix has been released that restores aggregation of all configured metadata sources. We are monitoring delivered pages to confirm metadata is complete.

### Identified
2026-09-21T10:11:33Z

We have identified the root cause. A change deployed on September 19 caused metadata sheets beyond the first to be ignored when resolving site configuration. We are preparing a fix.
