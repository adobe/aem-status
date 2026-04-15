---
kind: legacy
title: Publishing Issues Observed
impact: none
---

## Postmortem

*Posted Oct 02, 2023 - 16:55 UTC*

At 6:55PM UTC an automated monitor identified an issue with previewing and publishing content.

The issue was determined to be caused by a brief degradation in an upstream dependency, which resulted in elevated 500 errors for the duration of the degradation, ultimately resulting in intermittent failures in Sidekick preview/publish actions.

The upstream service issues lasted until 7:12PM UTC, at which point the CSO was automatically closed by the monitor.

The issue only impacted authoring, no customer sites' delivery was affected.

## Resolved

*Posted Jun 07, 2023 - 19:12 UTC*

This incident has been resolved.

## Investigating

*Posted Jun 07, 2023 - 18:56 UTC*

We are observing issues that are affecting site publishing for Project Helix customers. Page delivery is not affected, but updates to your sites may be delayed or prevented. The issue is under active investigation.

