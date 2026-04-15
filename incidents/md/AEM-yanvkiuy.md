---
kind: postmortem
impact: major
start-time: "2025-10-20T06:54:00.000Z"
end-time: "2025-10-20T08:44:00.000Z"
error-rate: 0.0833
impacted-service: publishing
---

# Major publishing disruption due to AWS US-EAST-1 outage

## Postmortem

### Executive Summary

On October 20, 2025, between 06:54 and 08:44 UTC, an AWS US-EAST-1 region outage affecting Lambda and SQS services caused publishing disruptions for all AEM customers and minimal delivery errors. Our team deployed a secondary publishing region within 110 minutes, restoring full functionality while the AWS incident was ongoing.

### Incident Overview

On October 20, 2025 at 06:54 UTC, we detected the first error messages in our monitoring system related to an underlying AWS outage in the US-EAST-1 region. The outage primarily affected AWS Lambda and SQS services, causing disruptions to dependent services including AEM.

At 07:05 UTC, we observed publishing disruptions caused by the AWS outage, affecting all customers' publishing workflows. At 07:20 UTC, we began observing a low level of delivery errors, totaling 200 requests with minimal customer impact. Our delivery infrastructure operates as a dual-stack system across multiple regions, which allowed our team to quickly switch to the secondary stack at 07:25 UTC, eliminating delivery disruptions while continuing to investigate the publishing impact.

At the time of the incident, publishing was operating on a single-stack, single-region configuration. Given the uncertain resolution timeline from AWS and the availability of our engineering team, we made the decision to bring up a secondary region rather than wait for the AWS recovery. At 09:03 UTC, approximately 1 hour and 45 minutes after identifying the publishing impact, our team successfully deployed a secondary publishing region, restoring full functionality for all customers even as the AWS incident continued.

During the 110-minute incident, the overall error rate across all publishing service requests was 8.33%. However, impact varied significantly by sub-service, with Admin API delivering errors for 72% of requests, while *.aem.page only delivered 0.025% errors.

Some customers contacted support regarding publishing disruptions, but by that time, the impact and status had already been communicated through our status page. At 12:06 UTC, we began restoring the original service configuration while closely monitoring the situation. Normal operations were fully restored at 12:14 UTC, with a total incident duration of 5 hours and 7 minutes.

The rapid mitigation demonstrated the effectiveness of our dual-stack delivery architecture for immediate failover, and our team's ability to rapidly provision and deploy additional infrastructure capacity during an active incident. This experience reinforces the value of multi-region architectures and having the right team available during critical incidents.

## Updates

### investigating
2025-10-20T07:07:48.558Z

First error messages relating to the incident appear in our monitoring system.

### investigating
2025-10-20T07:17:58.318Z

We are observing publishing disruptions caused by an underlying AWS outage. Our team investigates the solution and works on mitigation.

### investigating
2025-10-20T07:20:08.975Z

In addition to publishing disruptions, we now also observe a low level of delivery errors (200 errors in total). Mitigation is under way.

### investigating
2025-10-20T07:25:57.948Z

We have switched delivery to our secondary stack, so that the ongoing incident no longer has any delivery impact. Impact to publishing is still being investigated.

### investigating
2025-10-20T09:03:13.706Z

A secondary region for AEM publishing has been brought up, so that publishing functionality has been restored, even though the underlying AWS incident is still ongoing. We are watching the situation closely.

### monitoring
2025-10-20T12:06:02.967Z

The original service configuration is being restored, we continue to monitor the situation.

### resolved
2025-10-20T12:14:50.057Z

Normal operations have been restored.

