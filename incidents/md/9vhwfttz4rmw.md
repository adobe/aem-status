---
kind: legacy
title: Form Processing Issues Observed
impact: minor
---

## Postmortem

*Posted Mar 23, 2022 - 09:54 UTC*

On March 22nd, 2022, Helix Form processing was delayed for about 30 minutes. During this timeframe, new form submissions were still accepted, but would not show up in the target spreadsheets. After the issue has been resolved, normal processing resumed and all stalled form submissions were delivered.

The issue was caused by an automated rotation of a security credential.

We have identified an engineering solution to the problem of automated credential rotation that will be rolled out in the next weeks and prevent this issue from reoccurring.

## Resolved

*Posted Mar 22, 2022 - 13:12 UTC*

This incident has been resolved and normal form processing restored. No form data was lost.

## Identified

*Posted Mar 22, 2022 - 13:10 UTC*

We've identified the source of the issue and are rolling out a fix. Until then, form processing will be delayed, but no data will be lost.

## Investigating

*Posted Mar 22, 2022 - 13:01 UTC*

We are observing issues that are affecting form processing for Helix customers. The issue is under active investigation and we are working with full effort to reach a speedy resolution.

