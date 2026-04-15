---
kind: legacy
title: Publishing Issues Observed
impact: major
---

## Postmortem

*Posted Mar 04, 2024 - 19:58 UTC*

**Increased Publishing Error Rate Due to Concurrency Limits being Exceeded** Between 01:07 UTC and 03:04 UTC, our monitoring systems detected an abnormal increase in publishing errors, with rates escalating to 36%. Our team traced the root cause to concurrency limits being exceeded in functions critical to our publishing workflow.

**Impact** A significant portion of publishing operations failed during the incident window, there was no significant impact on content delivery for traffic to `hlx.page`.

**Root Cause** The incident was triggered by a surge in demand from a single customer using our Bring Your Own Markup feature, leading to a rapid increase in and a concurrency resource contention in our publishing infrastructure. This surge exceeded our concurrency limits, resulting in throttling and subsequent failures of publishing requests.

## Resolved

*Posted Feb 21, 2024 - 02:22 UTC*

This incident has been resolved.

## Investigating

*Posted Feb 21, 2024 - 02:02 UTC*

We are observing issues that are affecting site publishing for AEM customers. Page delivery is not affected, but updates to your sites may be delayed or prevented. The issue is under active investigation.

