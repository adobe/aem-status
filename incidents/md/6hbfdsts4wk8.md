---
kind: legacy
title: Increased errors rate for delivery and publishing
impact: none
---

## Postmortem

*Posted Apr 04, 2025 - 16:35 UTC*

**Executive Summary** On March 21, 2025, starting at 21:36 UTC, a cloud provider outage impacted both our publishing and delivery systems. Monitoring revealed increased error rates during the event, with delivery on hlx.live and aem.live showing modest errors, while publishing operations on admin.hlx.page had a perceived higher impact due to misleading errors surfacing in the sidekick.

**Incident Timeline**

- **21:36 UTC:** Cloud provider outage begins; our monitoring systems detect rising errors.
- **21:36–22:02 UTC:** Delivery error rate increased to 1.02% on hlx.live Delivery error rate increased to 0.21% on aem.live
- **21:36–22:45 UTC:** Publishing on admin.hlx.page handled 151k requests (110k + 41k), with 32k errors resulting in a 22% error rate over 67 minutes, equivalent to about 14 minutes of full outage.

**Impact Analysis** While the incident led to increased error rates, overall system functionality remained intact. Delivery systems experienced minor outage with slight upticks (1.02% on hlx.live and 0.21% on aem.live), and admin.hlx.page recorded a higher error rate, which, when normalized, equates to roughly 14 minutes of full-outage impact over the 67-minute period. Importantly, these errors did not halt operations.Further breakdown of the error sources revealed that the vast majority were generated not by human actions but by largely unnecessary bulk/poller preview jobs. Excluding these automated jobs, the error count would have been around 5k, which gives a clearer picture of the user-facing impact.

**Root Cause Analysis** The incident was triggered by an outage with one of our cloud providers.

**Resolution** Our monitoring systems quickly detected the anomaly and flagged the delivery and publishing failures with the affected cloud provider. We promptly switched all delivery traffic to a different cloud provider, minimizing the overall impact. This swift action, combined with our detailed review of the sync process on admin.hlx.page, has led us to implement adjustments to improve error reporting and enhance resilience during future cloud provider issues.

**Incident Response Readiness** The incident was promptly addressed; however, the following areas for improvement have been identified to enhance future response efforts.

**What’s Next?**

- **Runbook improvements:** Updates to our internal documentation to clarify how to temporarily disable the store sync when a provider has an outage.
- **Review error handing:** Review our error handing to in such situations to minimize disruption to end users.

Each action item has been assigned an owner and a deadline to ensure timely completion and to enhance our service reliability.

## Resolved

*Posted Mar 21, 2025 - 23:07 UTC*

On March 21st, 2025, starting at 21:36 UTC, one of our cloud providers experienced an outage that had an impact on publishing and delivery. Between 21:36 - 22:02 UTC delivery had an increased error rate below 1%Between 21:36 - 22:45 UTC publishing operations resulted in errors in the sidekick but without impact to the performed operation.

