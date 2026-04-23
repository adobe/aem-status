---
kind: legacy
title: Page Delivery Issues Observed
impact: minor
---

## Postmortem

*Posted Mar 11, 2022 - 10:02 UTC*

Due to an unknown problem, the CDN serving content for DC and OH, accidentally cached an error response, serving static content on the [https://blog.adobe.com/](https://blog.adobe.com/) homepage. After clearing the CDN cache, the correct homepage was served again.

The impact of this incident was minimal, only affecting users from that region, and only on that page.

## Resolved

*Posted Mar 11, 2022 - 09:38 UTC*

This incident has been resolved.

## Investigating

*Posted Mar 11, 2022 - 09:30 UTC*

We are observing issues that are affecting page delivery for Project Helix customers. The issue is under active investigation and we are working with full effort to reach a speedy resolution.

