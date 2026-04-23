---
kind: legacy
title: Github notifications unavailable
impact: minor
---

## Postmortem

*Posted Sep 11, 2024 - 14:08 UTC*

On 11.09.2024 12:30 UTC we noticed that the AEM Code Sync Github application has stopped dispatching github events since 05:00 UTC. As a result, github actions that are triggered on a repository_dispatch event were not longer invoked.

The reason was a removed content-write permission of the AEM Code Sync Github application which is required to dispatch events. After restoring the permission, the notifications were dispatched again.

Customers that use repository_dispatch events in their github actions need to approve the altered permissions. The organization admins should have received an email from github.

## Resolved

*Posted Sep 11, 2024 - 13:35 UTC*

This incident has been resolved.

## Monitoring

*Posted Sep 11, 2024 - 13:18 UTC*

The relevant permission needed for the github events have been updated and the notifications are dispatched again. Customers that use repository_dispatch events in their github actions need to approve the altered permissions. The organization admins should have received an email from github.

## Identified

*Posted Sep 11, 2024 - 05:00 UTC*

On 11.09.2024 UTC 05:00, the AEM Code Sync Github application stopped dispatching github events. As a result, github actions that are triggered on a repository_dispatch event are not longer invoked.We have identified the root cause and are working on a solution.

