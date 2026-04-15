---
kind: legacy
title: Page Delivery Issues Observed
impact: none
---

## Postmortem

*Posted Jan 16, 2024 - 13:30 UTC*

We observed increased errors on requests served from Cloudflare backends, most likely due to a [(partial) R2 outage](https://www.cloudflarestatus.com/incidents/cfrrm89ndghs). The errors started 1/15 22:34 UTC and stopped 1/15 23:07 UTC. During this period we served ~2k errors for a total of ~6k requests with Cloudflare backends, i.e. on projects with Cloudflare backends we had an error rate of ~33% while our aggregate error rate across all requests, covering all backends, stood at 0.41%.

## Resolved

*Posted Jan 15, 2024 - 23:07 UTC*

This incident has been resolved.

## Investigating

*Posted Jan 15, 2024 - 22:34 UTC*

We are observing issues that are affecting page delivery for AEM customers. The issue is under active investigation and we are working with full effort to reach a speedy resolution.

