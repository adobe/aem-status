---
kind: legacy
title: Page Delivery And Publishing Issues Observed
impact: none
---

## Postmortem

*Posted Jun 14, 2023 - 21:48 UTC*

At 6:49 PM UTC we observed an issue that affected page delivery, authoring services and code deployments due to an outage with one of our cloud providers.

At 7:14 PM UTC, we switched delivery to another provider which resolved the delivery errors immediately. The franklin authoring services were still impacted at this time. Between 6:50pm UTC and 7:14pm UTC we experienced a slightly higher error rate (0.83%)

At 8:42 PM UTC, full service was recovered and publishing and code deployments could resume.

At 9:20 PM UTC the affected services from the provider experiencing the outage marked the incident as resolved.

At 9:34 PM UTC we switched the delivery stack back to the configuration before the incident occurred.

During the first 25 minutes of the outage, we experienced an elevated error rate of 0.83 percent, so no noticeable downtime was incurred on any customer site. The switch to another delivery infrastructure allowed AEM to remain fully operational, even while major parts of the internet were affected by the wider AWS outage.

To improve our quality of service in the future, following steps will be taken:

- Improve monitoring of primary and secondary delivery infrastructure
- Improve status messages and communication on status.hlx.page
- Establish procedures for faster switchover from primary to secondary infrastructure

## Resolved

*Posted Jun 13, 2023 - 20:53 UTC*

This incident has been resolved.

## Investigating

*Posted Jun 13, 2023 - 18:54 UTC*

We are observing issues that is affecting our delivery services for AEM customers. The issue is under active investigation and we are working with full effort to reach a speedy resolution.

