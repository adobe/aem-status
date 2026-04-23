---
kind: legacy
title: Publishing Issues Observed
impact: minor
---

## Postmortem

*Posted Dec 22, 2022 - 22:54 UTC*

An new version of the Franklin admin service conflicted with a behavior of the Franklin github bot which lead to a delay of synchronizations of code updates. The issue was not noticed for a few hours as the function that was affected was not heavily used at the time. The issue is fixed in a newly released version of the Franklin github bot, and all affected code synchronization will be synchronized.

## Resolved

*Posted Dec 22, 2022 - 22:20 UTC*

This incident has been resolved.

## Investigating

*Posted Dec 22, 2022 - 11:09 UTC*

We are observing issues that are affecting site publishing for Project Helix customers. Page delivery is not affected, but updates to your sites may be delayed or prevented. The issue is under active investigation.

