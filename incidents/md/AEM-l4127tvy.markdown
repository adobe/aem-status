---
kind: postmortem
impact: none
start-time: "2025-09-09T18:25:03.343Z"
end-time: "2025-09-09T19:26:17.694Z"
error-rate: 0.001
impacted-service: delivery
postmortem-completed: "2025-09-09T19:26:17.694Z"
---

# Increased error rate on delivery via workers

## Postmortem

On 09.09.2025 18:35 UTC we noticed a slight increase (<0.1%) in Edge Delivery Service errors. Upon investigation, we found that one of our suppliers had already opened a major incident related to worker delivery, confirmed status, and implemented a fix within 30 minutes. There were no reports of customer impact.

The vendor's fix was deployed by 09.09.2025 19:02 UTC.

## Updates

### investigating
2025-09-09T18:35:03.343Z

Increased error rate on delivery via workers due to supplier incident (https://www.cloudflarestatus.com/incidents/9pvscr0vmsy6)

### monitoring
2025-09-09T19:03:16.088Z

Error rate seems to have normalized again

### resolved
2025-09-09T19:26:17.694Z

Issue Resolved

