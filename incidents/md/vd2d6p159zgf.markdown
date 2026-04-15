---
kind: legacy
title: Publishing Issues Observed
impact: none
---

## Postmortem

*Posted Apr 26, 2024 - 09:00 UTC*

Starting around 14:00 UTC, we noticed SharePoint related issues following a default user password rotation and accidental subsequent permission change. This resulted in delayed processing of the forms queue and a small amount of previewing/publishing errors (mostly affecting non-critical projects using the default user to connect to SharePoint). No form data got lost, all submissions were correctly delivered after the incident was resolved 2 hours later.

As a precaution, we have restricted password rotations to regular working hours with buffer to react.

This incident serves as a reminder for customers to use a dedicated SharePoint user: [https://www.aem.live/docs/setup-customer-sharepoint](https://www.aem.live/docs/setup-customer-sharepoint)

## Resolved

*Posted Apr 12, 2024 - 16:22 UTC*

This incident has been resolved.

## Update

*Posted Apr 12, 2024 - 16:16 UTC*

We are observing issues that are affecting site publishing for AEM customers. Page delivery is not affected, but updates to your sites may be delayed or prevented. The issue is under active investigation.

## Update

*Posted Apr 12, 2024 - 15:39 UTC*

We are observing issues that are affecting site publishing for AEM customers. Page delivery is not affected, but updates to your sites may be delayed or prevented. The issue is under active investigation.

## Update

*Posted Apr 12, 2024 - 15:38 UTC*

We are observing issues that are affecting site publishing for AEM customers. Page delivery is not affected, but updates to your sites may be delayed or prevented. The issue is under active investigation.

## Update

*Posted Apr 12, 2024 - 15:38 UTC*

We are observing issues that are affecting site publishing for AEM customers. Page delivery is not affected, but updates to your sites may be delayed or prevented. The issue is under active investigation.

## Update

*Posted Apr 12, 2024 - 14:47 UTC*

We are currently experiencing delays in processing form submissions. No data has been lost, we are collecting all form submissions in a queue and are working on the issue with high priority to make sure the form submissions will be processed as soon as possible.

## Investigating

*Posted Apr 12, 2024 - 14:06 UTC*

We are observing issues that are affecting site publishing for AEM customers. Page delivery is not affected, but updates to your sites may be delayed or prevented. The issue is under active investigation.

