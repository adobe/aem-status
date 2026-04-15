---
kind: legacy
title: Page Delivery Issues Observed
impact: none
---

## Postmortem

*Posted Jan 19, 2024 - 16:09 UTC*

We observed increased errors on requests served from Cloudflare backends, most likely due to an [R2 outage](https://www.cloudflarestatus.com/incidents/t36xcbnxfnng). The errors started 1/19 15:17 (UTC) and at 15:37 (UTC) we switched projects using Cloudflare backends to another cloud provider. During this period we served 1.16k errors for a total of 12.37K requests with Cloudflare backends. This resulted in an error rate of ~9% for projects with Cloudflare backends and an aggregate error rate across all requests, covering all backends, stood at 0.14%.

## Resolved

*Posted Jan 19, 2024 - 15:54 UTC*

This incident has been resolved.

## Update

*Posted Jan 19, 2024 - 15:47 UTC*

Root cause seems to be https://www.cloudflarestatus.com/incidents/t36xcbnxfnng

## Monitoring

*Posted Jan 19, 2024 - 15:43 UTC*

A fix has been implemented and we are monitoring the results.

## Identified

*Posted Jan 19, 2024 - 15:38 UTC*

The issue has been identified and a fix is being implemented. One of our CDN provider is experiencing performance issues, we are switching away from Cloudflare to mitigate.

## Update

*Posted Jan 19, 2024 - 15:38 UTC*

We are continuing to investigate this issue.

## Investigating

*Posted Jan 19, 2024 - 15:29 UTC*

We are observing issues that are affecting page delivery for AEM customers. The issue is under active investigation and we are working with full effort to reach a speedy resolution.

