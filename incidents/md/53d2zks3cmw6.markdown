---
kind: legacy
title: Publishing issues via AEM Sidekick observed
impact: none
---

## Postmortem

*Posted Nov 11, 2024 - 14:50 UTC*

On 11.11.2024 1:57 PM we noticed that the AEM Sidekick was no longer able to talk to the admin service. As a result, customers were no able to execute any publishing operations through the sidekick.

The reason was the removal of a CORS header which was believed to no longer be necessary. This caused the browser to block requests outgoing from the sidekick to the admin. After reverting the commit at 2:00 PM that caused the issue, the sidekick was again operable.

During that outage, the Admin HTTP API stayed functional.

## Resolved

*Posted Nov 11, 2024 - 14:02 UTC*

Between 1:15 PM and 2:04 PM UTC, AEM Sidekick could no longer be loaded and displayed an error message instead.

