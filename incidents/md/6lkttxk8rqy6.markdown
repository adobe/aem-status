---
kind: legacy
title: Page Delivery Issues Observed for a single customer
impact: minor
---

## Postmortem

*Posted Mar 14, 2025 - 14:25 UTC*

## Executive Summary

On March 13, 2025, between 2:25 PM and 3:03 PM UTC, a single customer experienced a service disruption due to oversized configuration files exceeding AWS Lambda's response size limit. The issue was identified and resolved, with no impact to other Adobe Experience Manager customers.

## Incident Timeline

On March 13, 2025, at 2:25 PM UTC, our monitoring systems detected 503 pipeline errors, leading to a service disruption for a single customer. The customer was informed immediately via Slack. At 2:48 PM UTC the issue was traced to oversized configuration files exceeding AWS Lambda's response size limit.

By 4:03 PM CET, we resolved the problem by moving the project to the Cloudflare stack, restoring full service. The total downtime was approximately 38 minutes.

## Impact Analysis

The service disruption affected the customer's website, rendering it inaccessible for approximately 38 minutes. No other customers were impacted during this period.

## Root Cause Analysis

Pipeline rendering errors (503 - first byte timeout) for one customer on our Edge Delivery Services ([aem.live](http://aem.live/)) infrastructure triggered the incident.

Initial analysis suggested potential CDN changes, but this was denied by the customer.

Further investigation revealed a 413 error (response size too large) from Lambda for an internal configuration service on the Fastly/AWS stack. The incident was triggered by the publication of large metadata sheets, including four newly added. The combined size of these metadata files, which grow up 4x with the newly added metadata exceeded AWS Lambda's 1MB response size limit, leading to 413 errors and service disruption.

## Resolution

Upon identifying the oversized configuration as the root cause, the team moved the project to the Cloudflare stack, which does not have a 1MB response limit. This action restored service to the affected customer within 38 minutes.

## Incident Response Readiness

The incident was promptly addressed; however, the following areas for improvement have been identified to enhance future response efforts.

## What’s next?

We have identified the following key action items to prevent similar incidents and improve our response capabilities:

**Safeguards for Configurations**

1. Develop safeguards to ensure configurations do not break or exceed limits when publishing metadata
2. Update Last Modified Date: ensure the last modified date of the configuration reflects metadata changes.

**Documentation and change management**

1. Update documentation regarding metadata file size limits
2. Update the internal runbook to include immediate migration to a secondary stack for cases where a single customer site is down

**Technical remediation**

1. Config Version Restoration: Investigate the possibility of restoring previous configuration versions, potentially using Helix Admin
2. Update the configuration service to enforce size limitations

**Communication and process improvements**

1. Review and enhance customer communication protocols
2. Establish clear escalation paths for similar incidents
3. Review and update support ticket escalation procedures

Each action item has been assigned an owner and a deadline to ensure timely completion and to enhance our service reliability.

## Resolved

*Posted Mar 12, 2025 - 02:30 UTC*

On March 13, 2025, between 2:25 PM and 3:03 PM UTC, a single customer experienced a service disruption due to oversized configuration files exceeding AWS Lambda's response size limit.

