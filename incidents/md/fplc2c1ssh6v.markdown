---
kind: legacy
title: Page Delivery Issues Observed
impact: none
---

## Postmortem

*Posted Jan 31, 2025 - 16:04 UTC*

## Actions taken

- redirected traffic to more resilient infrastructure
- identifying source of misguided traffic

## Resolved

*Posted Jan 22, 2025 - 08:00 UTC*

Beginning January 22, 09:17 UTC, we observed an elevated error rate of approximately 0.1% for less than 1 minute on aem.page and aem.live domains. This issue is attributed to very spiky traffic due to misguided load tests. Similar spikes occurred at 09:27 UTC as well as 15:17 UTC with much less impact.

