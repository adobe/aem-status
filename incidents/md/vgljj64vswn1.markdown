---
kind: legacy
title: Page Delivery Issues Observed
impact: none
---

## Postmortem

*Posted May 13, 2024 - 17:39 UTC*

Between 17:05 and 17:25 UTC an update to our v5 config service has lead to a small fraction of projects sending 5xx responses. The overall error rate hasn’t exceeded a meaningful threshold, and the newly deployed change was reverted. We will make sure that these edge case errors are caught by the test harness in the future.

## Resolved

*Posted May 13, 2024 - 17:34 UTC*

This incident has been resolved.

## Investigating

*Posted May 13, 2024 - 17:14 UTC*

We are observing issues that are affecting page delivery for AEM customers. The issue is under active investigation and we are working with full effort to reach a speedy resolution.

