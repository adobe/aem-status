---
kind: postmortem
impact: minor
start-time: "2025-10-20T07:05:00.000Z"
end-time: "2025-10-24T18:00:00.000Z"
error-rate: 0.0
impacted-service: publishing
---

# Status page not updated for API for Edge Delivery Services and Integrations during AWS outage

## Postmortem

### Executive Summary

On October 20, 2025, during a broader AWS US-EAST-1 region outage that affected multiple Adobe Experience Manager services, the API for Edge Delivery Services and Integrations experienced a service disruption. While the underlying service issue was resolved within hours, the official status page at status.adobe.com was not updated to reflect the API for Edge Delivery Services and Integrations impact. The status site at [aemstatus.net](https://www.aemstatus.net/details.html?incident=AEM-yanvkiuy) correctly reflected the incident in real-time, demonstrating that our monitoring and automated incident reporting was functioning properly. However, customers relying on the official Adobe status page experienced a communication gap. This resulted in customer confusion and an escalation from a major customer who was unable to confirm service status through official channels. The official status page was corrected 4 days after the incident, on October 24, 2025.

### Impact Analysis

**Service Impact:** The API for Edge Delivery Services and Integrations experienced disruptions during the AWS outage window (07:05 - 08:44 UTC on October 20, 2025), consistent with the broader impact to AEM publishing services. While the underlying technical issue was resolved within the incident window, customers lacked visibility into the status through official channels.

**Communication Impact:** For 4 days (October 20-24, 2025), the official Adobe status page at status.adobe.com did not accurately reflect that API for Edge Delivery Services and Integrations had been impacted. Customers checking status.adobe.com would not have seen acknowledgment of the API for Edge Delivery Services and Integrations disruption during the October 20th incident. In contrast, [aemstatus.net](https://www.aemstatus.net/) correctly displayed the incident status throughout, highlighting that the failure was specific to the official status page communication pipeline rather than our monitoring capabilities. This communication gap on the official channel led to at least one customer escalation and undermined trust in our official status communication channels.

**Customer Impact:** Customers using API for Edge Delivery Services and Integrations experienced the same publishing disruptions as other AEM services during the AWS outage (8.33% overall error rate, with Admin API experiencing 72% errors). The lack of status page updates prevented customers from distinguishing between localized issues and platform-wide incidents, increasing support burden and customer frustration.

### Detection

The underlying service disruption was detected through our standard monitoring at 06:54 UTC on October 20, 2025, and was correctly published to [aemstatus.net](https://www.aemstatus.net/details.html?incident=AEM-yanvkiuy) in real-time. However, the failure to update the official status page at status.adobe.com went undetected by our systems. The issue was discovered 4 days later when the AEM Service Manager was notified by the engineering team that the API for Edge Delivery Services and Integrations impact had not been reflected on the official status page during the incident.

The delayed detection highlights a gap in our status communication verification processes—we had no automated checks to ensure all affected services were properly reflected on status.adobe.com, and no manual review process caught the omission during or immediately after the incident. The fact that aemstatus.net displayed correct information demonstrates that our automated monitoring and incident detection systems were functioning as designed, but the manual process for updating the official status page failed.

### Timeline

All times in UTC.

- **October 20, 06:54** - AWS US-EAST-1 outage begins, first errors detected in monitoring
- **October 20, 07:05** - Publishing disruptions observed, affecting all AEM services including API for Edge Delivery Services and Integrations
- **October 20, 07:17** - Incident response initiated, Customer Service Organization (CSO) created for broader AEM impact
- **October 20, 07:20-09:03** - Engineering team reports impact to multiple services in incident Slack channel, including API for Edge Delivery Services and Integrations. Due to high message volume (100+ messages), API for Edge Delivery Services and Integrations update is not processed by the status page team
- **October 20, 09:03** - Secondary publishing region deployed, restoring publishing functionality including API for Edge Delivery Services and Integrations
- **October 20, 12:14** - AWS incident resolved, all services restored
- **October 20-23** - Status page continues to show no API for Edge Delivery Services and Integrations impact; customer escalation received regarding lack of status visibility
- **October 24, ~18:00** - Service Manager notified by engineering team of missing status update; API for Edge Delivery Services and Integrations added to the CSO record and status page corrected
- **November 1** - Process improvements implemented to strengthen intake protocols

### Root Cause Analysis

#### Trigger

The immediate trigger was the high-volume, high-stress nature of the AWS US-EAST-1 outage on October 20, 2025. With more than 100 services reporting impact through a single Slack thread, the manual intake process for updating status.adobe.com became overwhelmed, and the API for Edge Delivery Services and Integrations impact report was not processed.

#### Root Cause

Using the "Five Whys" technique to dig deeper into the systematic failures:

1. **Why was the API for Edge Delivery Services and Integrations not added to status.adobe.com?**               The manual intake process that relies on monitoring Slack channels missed the API for Edge Delivery Services and Integrations             update among 100+ concurrent messages during the AWS outage.
2. **Why does status page updating rely on manual monitoring of Slack channels?**               Not all AEM services are configured with auto-launch capabilities to automatically create             and update Customer Service Organization (CSO) records when monitoring detects issues.             Services without auto-launch require manual intervention to be added to the status page.
3. **Why doesn't API for Edge Delivery Services and Integrations have auto-launch configured?**               The integration between the API for Edge Delivery Services and Integrations monitoring (which functions             reliably, as evidenced by aemstatus.net's accurate real-time reporting) and Adobe's corporate             status page infrastructure has been assessed as producing false positives. Rather than improving             the integration layer or the corporate status tooling, the decision was made to disable auto-launch             entirely, creating a dependency on manual processes.
4. **Why is there no fallback mechanism when manual intake fails?**               The status update process was designed with the assumption that manual intake would scale             adequately. There were no automated verification checks to ensure all reported impacts             were reflected on status.adobe.com, and no systematic post-incident review to validate             status page completeness.
5. **Why was there no detection that status.adobe.com was incomplete for 4 days?**               We lacked monitoring and alerting for status page accuracy. There was no system to verify             that services experiencing known impacts were properly reflected on the status page, and             no automated reconciliation between incident records and published status updates.

#### Systemic Issues Identified

- **Single point of failure:** Status updates depend entirely on a manual process with no automated failsafes
- **Design doesn't handle scale:** Manual intake works for small incidents but breaks down during platform-wide outages
- **False dichotomy in monitoring:** Treating auto-launch as binary (on/off) rather than exploring graduated responses or context-aware automation
- **Lack of verification loops:** No post-incident review process to ensure status page accuracy
- **Insufficient ownership clarity:** Service teams cannot directly update status, creating dependency on centralized team during high-stress incidents

### Resolution

**Immediate Fix:** On October 24, 2025, when notified of the missing status update, the Service Manager manually added the API for Edge Delivery Services and Integrations to the October 20th Customer Service Organization (CSO) record, correcting the historical status page to accurately reflect the impact.

**Short-term Improvements:** As of November 1, 2025, the Customer Response Center (CRC) implemented strengthened intake protocols and updated runbooks for handling high-volume incident scenarios. These improvements include better tagging of impacted services and structured checklists for large-scale outages.

**Long-term Prevention:** A meeting will be scheduled with relevant parties to re-assess the feasibility of implementing automated status updates for API for Edge Delivery Services and Integrations, exploring options to better integrate the service's existing reliable monitoring with Adobe's corporate status page infrastructure.

### Lessons Learned

#### What Went Well

- The underlying technical issue (API for Edge Delivery Services and Integrations service disruption) was resolved quickly as part of the broader AWS incident response
- Our automated monitoring and incident detection systems worked correctly, with [aemstatus.net](https://www.aemstatus.net/details.html?incident=AEM-yanvkiuy) displaying accurate real-time status throughout the incident
- The engineering team properly reported the impact through established channels (Slack)
- Once notified on October 24, the Service Manager acted quickly to correct the status page
- Process improvements were implemented within 2 weeks (by November 1)

#### What Went Wrong

- Manual status update process created a single point of failure that broke under load
- 4-day delay in detecting and correcting the status page damaged customer trust
- Lack of automated verification allowed the error to persist undetected
- The tradeoff between preventing false positives and ensuring incident coverage was not properly balanced
- Service teams lacked agency to correct status page issues they identified

#### Where We Got Lucky

- The customer escalation prompted discovery of the issue before it affected additional incidents
- The underlying service was restored quickly, so the status page gap didn't compound an ongoing outage
- The engineering team proactively notified the Service Manager on October 24, enabling correction

### Action Items

#### Committed Actions

1. **Strengthen intake protocols**               The Customer Response Center has implemented strengthened intake protocols and updated             the process for manually tagging impacted services during high-volume incidents. These             runbook additions include better procedures for handling large-scale outages.               *Status: Completed November 1, 2025*
2. **Re-assess auto-launch feasibility**               Schedule and conduct a meeting with relevant parties to re-assess the feasibility of             implementing automated status updates for API for Edge Delivery Services and Integrations.             This will explore options for automation that balance the need for accurate incident             reporting with the risk of false positives.               *Status: Meeting to be scheduled*

## Updates

### resolved
2025-10-24T18:00:00.000Z

Status page has been corrected to reflect that API for Edge Delivery Services and Integrations was impacted during the October 20th AWS outage. Process improvements have been implemented to prevent similar communication gaps.

### monitoring
2025-10-24T17:00:00.000Z

We are implementing process improvements to our status page update procedures and reviewing automation options for service status communication.

### identified
2025-10-24T16:00:00.000Z

We have identified that the API for Edge Delivery Services and Integrations was impacted during the October 20th AWS outage but was not reflected on status.adobe.com at the time. We are correcting the historical record and investigating the root cause of this communication gap.

