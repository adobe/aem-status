---
kind: legacy
title: RUM Script Delivery Delayed
impact: none
---

## Postmortem

*Posted Mar 18, 2025 - 12:07 UTC*

Executive Summary

On March 15, 2025, between 7:00 AM and 11:21 AM UTC, approximately 90% of customers experienced issues with the delivery of RUM (Real User Monitoring) scripts due to availability problems with the [unpkg.com](http://unpkg.com) backend. The incident was caused by [unpkg.com](http://unpkg.com) experiencing degraded performance, combined with our system's inability to properly handle first-byte timeout errors in the backend fallback mechanism. The issue was identified and resolved by adjusting timeout configurations and routing traffic through Fastly, which provided better control over backend timeouts.

It is important to note that while monitoring alerts were triggered, there was no impact on end users whatsoever. As the RUM script is loaded as a non-blocking module, a failure to load does not impact page rendering, resulting in zero percent of page views being affected. All pages continued to load normally for all visitors throughout the incident. Less than one percent of RUM script requests failed during this period, but these failures were completely transparent to end users.

## Incident Timeline

- **Mar 14, 2025 - 18:00 UTC**: Initial reports of [unpkg.com](http://unpkg.com) availability issues appear on GitHub issue #412.
- **Mar 15, 2025 - 07:00 UTC**: The [unpkg.com](http://unpkg.com) availability issue was first formally raised on their GitHub.
- **Mar 15, 2025 - 09:00 UTC**: Adobe Managed Services monitoring began detecting issues.
- **Mar 15, 2025 - 09:12 UTC**: The RUM team was alerted about the issue.
- **Mar 15, 2025 - 09:16 UTC**: A rapid response team was established.
- **Mar 15, 2025 - 09:35 UTC**: Incident status updated to "Investigating" as the team began working on the issue.
- **Mar 15, 2025 - 10:13 UTC**: The root cause was identified as an outage at [unpkg.com](http://unpkg.com), and initial fixes were implemented to reduce dependency.
- **Mar 15, 2025 - 10:55 UTC**: Team reported that issues were still being experienced in the Virginia, US region, as the 1500ms timeout for unpkg proved ineffective.
- **Mar 15, 2025 - 11:21 UTC**: A second fix was implemented with more encouraging results, effectively ending customer impact. The unpkg backend was completely removed from the request flow.
- **Mar 15, 2025 - 21:04 UTC**: After continued monitoring, the incident was officially marked as resolved, though there had been no more impact since 11:21 UTC.

## Impact Analysis

Approximately 90% of customers were affected by this incident, but there was no impact on end users whatsoever. Less than one percent of RUM script requests failed during this period. As the RUM script is loaded as a non-blocking module, these failures did not impact page rendering for any visitors, resulting in zero percent of page views being affected. End users experienced no degradation in service, performance, or functionality throughout the entire incident.

In week-to-week comparisons of collected RUM data, the incident is not visible and falls below the normal sampling error threshold. The monitoring alerts that were triggered can be considered false positives from a page delivery perspective, as they require full page delivery and cannot distinguish between blocking and optional resources.

## Root Cause Analysis

The root cause of this incident was the degraded performance of the [unpkg.com](http://unpkg.com) backend, combined with limitations in our fallback mechanism. Our system has built-in redundancy and is designed to switch backends automatically when one fails. However, this fallback mechanism did not properly account for first-byte timeout errors, which was the specific failure mode in this incident.

The [unpkg.com](http://unpkg.com) backend has shown intermittent reliability issues in the past, which compounds the problem. When [unpkg.com](http://unpkg.com) began experiencing degraded performance, our system continued to attempt to use it rather than switching to alternative backends in a timely manner.

## Resolution

Our team implemented a two-part solution to resolve the issue:

1. First, we adjusted our DNS round robin configuration to route 100% of traffic through Fastly instead of the previous split that included Cloudflare. This change was made because Fastly provides better control over the first-byte timeout for each backend.
2. We then adjusted the backend timeout settings:

* Initially, we set the timeout to 1500ms, which reduced the impact but did not fully resolve the issue.
* We subsequently reduced the timeout to 1ms, which effectively disabled the unpkg backend entirely and routed all traffic through our alternative backends.

These changes successfully resolved the issue, with all monitoring alerts returning to normal shortly after implementation. After confirming the stability of the system, we gradually reverted to the original traffic split and backend timeout configurations while maintaining a watchful eye on system performance.

## Incident Response Readiness

Our monitoring systems were effective in detecting the issue quickly, allowing for a rapid response. A war room was established within minutes of the initial alert, and the team was able to implement mitigating measures within approximately one hour of detection.

While the monitoring system successfully alerted us to the issue, it is worth noting that the alerts were overly cautious and notified customers of what was essentially a non-impacting issue from an end-user perspective. This created unnecessary concern among customers.

## What's Next?

We have identified the following key action items to prevent similar incidents and improve our response capabilities:

### Code and Architecture Improvements

- Update the fallback mechanism in our code to better handle first-byte timeout errors
- Consider using first-party delivery for the RUM script to reduce external dependencies
- Make first-party CDN usage the default configuration for RUM script delivery, as approximately 10% of customers using this approach were completely unaffected by the incident
- Improve the robustness of the backend switcher, possibly by racing backends against each other
- Evaluate using Edge Delivery Services as an additional backend option to improve resilience

### Monitoring and Alert Improvements

- Refine monitoring thresholds to better distinguish between critical and non-critical issues
- Improve the triage process for alerts to ensure appropriate notification levels
- Continue to monitor RUM script delivery while maintaining alerting for the RUM team, even if customer notifications are not needed

### Documentation and Process Improvements

- Update runbooks to include standard procedures for handling similar situations
- Document the proper configuration settings for timeouts and traffic routing during backend issues
- Establish clear escalation paths for CDN and script delivery issues

## Resolved

*Posted Mar 15, 2025 - 21:04 UTC*

This incident has been resolved.

## Monitoring

*Posted Mar 15, 2025 - 11:21 UTC*

A second fix has been implemented with even more encouraging results. We are still monitoring.

## Investigating

*Posted Mar 15, 2025 - 10:55 UTC*

We are still experiencing issues in the Virginia, US region.

## Identified

*Posted Mar 15, 2025 - 10:13 UTC*

We have identified an outage at unpkg.com as the source of the issue and implemented fixes to relieve us from that dependency.

## Investigating

*Posted Mar 15, 2025 - 09:35 UTC*

We are getting reports about delayed RUM script delivery for a small number of requests.

