---
kind: legacy
title: Publishing Issues Observed
impact: major
---

## Postmortem

*Posted Jul 24, 2024 - 17:31 UTC*

## What happened?

At 9:02AM PST on 07/17/24, a change to the publishing service caused content-encoding headers to be dropped during preview/publishing. This resulted in 502 errors for ~10.5% of requests between 9:02AM and 9:09AM, when the change was reverted and affected files began restoration.

## What are we doing now?

We have added additional post-deployment tests to ensure correct headers are present on preview/published files before changes go live in production.

## Resolved

*Posted Jul 17, 2024 - 16:00 UTC*

We are observing issues that are affecting site publishing for AEM customers.

