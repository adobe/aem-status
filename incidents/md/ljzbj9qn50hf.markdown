---
kind: legacy
title: Increased Delivery Error Rate
impact: minor
---

## Postmortem

*Posted Jun 12, 2025 - 20:52 UTC*

## Executive Summary

On Wednesday, June 12, 2025, between 18:02 and 20:04 UTC (approximately 2 hours), one of our external suppliers experienced a critical outage that impacted Adobe Experience Manager (AEM) Sites Edge Delivery Services.

As a result, the average error rate for origin traffic temporarily increased to approximately 0.75%. The issue was mitigated by rerouting all eligible traffic away from the affected supplier, significantly reducing end-user impact.

## Incident Timeline

- 18:02 UTC: Incident begins; first delivery failures observed
- 18:12 UTC: Investigation initiated
- 18:16 UTC: Initial investigation identifies external supplier as source of issue
- 18:24 UTC: All re-routable traffic redirected away from the affected supplier, AEM Services error rates returned to normal levels
- 20:04 UTC: Incident resolved; by supplier

## Impact Analysis

The incident caused an average 0.75% error rate for origin traffic during the affected period. However, due to the system’s resilient architecture—including caching layers and multi-origin fallback—the impact to end users was minimal.

Most end users continued to receive content without noticeable degradation in performance or availability.

## Root Cause Analysis

The root cause was a failure in a critical subsystem of an external supplier. Specifically, the incident stemmed from an outage reported by Cloudflare: [Cloudflare Status: Incident #25r9t0vz99rp](https://www.cloudflarestatus.com/incidents/25r9t0vz99rp)

The outage affected services dependent on the supplier’s infrastructure until rerouting mitigated the impact.

## Resolution

The team took the following mitigation actions:

1. Quickly identified the external supplier as the source of increased failures
2. Redirected all re-routable traffic away from the affected supplier
3. Monitored supplier service recovery and confirmed normalization by 20:04 UTC

## What's Next?

To reduce the risk and impact of similar incidents in the future, the following actions have been identified:

- Review and update dependency trees to clarify external service reliance
- Revisit incident response runbooks to identify potential improvements in failover speed and communication

Each action will be assigned ownership and reviewed as part of our ongoing reliability initiatives.

## Resolved

*Posted Jun 12, 2025 - 19:02 UTC*

See more details https://www.cloudflarestatus.com/incidents/25r9t0vz99rp

## Update

*Posted Jun 12, 2025 - 18:55 UTC*

Due to a broad outage of one of our supplier some customers may have seen an increased error rate.

## Investigating

*Posted Jun 12, 2025 - 18:03 UTC*

We are investigating an ongoing incident that has been raised by our monitoring.

