---
kind: legacy
title: Publishing Issues Observed
impact: minor
---

## Postmortem

*Posted Jun 07, 2022 - 11:18 UTC*

At 11:00 am UTC today, a DNS change was made that erased a CNAME record for admin.hlx.page, making the Helix Publishing API unavailable for all customers that have not been using the API in the previous ten minutes.

When the error was detected by our monitoring, we rolled back the DNS change, so that the API hostname could be resolved again.

The Helix team will establish procedures to double-check DNS changes that affect existing records going forward.

## Resolved

*Posted Jun 07, 2022 - 11:09 UTC*

This incident has been resolved.

## Investigating

*Posted Jun 07, 2022 - 11:08 UTC*

We are observing issues that are affecting site publishing for Project Helix customers. Page delivery is not affected, but updates to your sites may be delayed or prevented. The issue is under active investigation.

