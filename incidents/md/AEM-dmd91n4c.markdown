---
kind: postmortem
impact: minor
start-time: 2026-06-09T13:37:00Z
end-time: 2026-06-10T06:16:00Z
error-rate: 0.0204375
impacted-service: publishing
postmortem-completed: 2026-06-10T17:31:00Z
---

# SharePoint authoring auth regression affecting status and preview

### Executive Summary

On June 9, 2026, starting at 13:37 UTC, a subset of customers using SharePoint-based authoring began experiencing failures on `status` and `preview` operations, which effectively blocked publishing for those affected. Authors saw HTTP 404 responses rather than actionable auth errors. The incident persisted for approximately 16 hours and 39 minutes, ending at 06:16 UTC on June 10, 2026. The root cause was a code regression committed roughly 90 days earlier that silently corrupted authorization configurations; the defect only became active once those configurations reached their expiry window. Other publishing capabilities, including develop workflows, remained available throughout. Approximately 2.04% of requests failed during the incident window. Detection relied on customer reports rather than automated monitoring, and only a small subset of affected customers reported the issue.

### Incident Timeline

- **2026-06-09T13:37:00Z** — The latent authorization regression began affecting SharePoint-based authoring customers as expired configurations triggered auth failures on `status` and `preview` operations.
- **2026-06-09T22:10:00Z** — First customer report received (15:10 PDT). Authors described 404 errors when attempting to publish; investigation began.
- **2026-06-10T06:14:00Z** — Root cause identified (23:14 PDT on June 9). The team confirmed a code regression that had corrupted authorization configurations in a way that only surfaced 90 days after the original commit.
- **2026-06-10T06:16:00Z** — Fix deployed across all affected customers. `status` and `preview` operations restored; publishing workflows confirmed working.

### Impact Analysis

- **Affected customers:** A small subset of SharePoint-based authoring customers. Only a fraction of those affected reported the issue.
- **Duration:** 16 hours and 39 minutes (13:37 UTC June 9 through 06:16 UTC June 10).
- **Affected operations:** `status` and `preview` only. Publishing was effectively blocked for affected customers because these operations are required to complete a publish workflow.
- **Unaffected operations:** Develop and other publishing service capabilities continued to work normally throughout the incident.
- **Error rate:** 2.1% of requests failed during the incident window.
- **Customer experience:** Authors received HTTP 404 responses instead of clear authorization errors, making the issue difficult to diagnose without engineering investigation.

### Root Cause Analysis

- **Underlying technical cause:** A code regression introduced approximately 90 days before the incident corrupted authorization configurations for SharePoint-based authoring. The corruption was latent — configurations appeared valid until they reached their natural expiry, at which point re-authorization failed silently.
- **Why systems failed to handle the condition:** The publishing service returned HTTP 404 responses for failed auth on `status` and `preview` operations rather than explicit authorization errors, masking the true nature of the failure.
- **Contributing design decisions:** The regression's 90-day delay between introduction and manifestation meant no immediate testing or deployment feedback loop caught the defect. The time gap between commit and impact made correlation with recent changes extremely difficult.
- **Why monitoring did not catch it sooner:** Authorization failures of this type are indistinguishable from the auth errors that occur under normal operations when customers have outdated credentials. No dedicated monitoring existed to distinguish systemic auth regressions from per-customer credential issues.

### Trigger

The incident was triggered when authorization configurations — corrupted by the regression at the time they were originally written — reached their 90-day expiry window. The first affected configurations began expiring on June 9, 2026 at 13:37 UTC, causing `status` and `preview` operations to fail for SharePoint-based authoring customers whose configs had been written after the regression landed but before the fix.

### Resolution

**Immediate Mitigation:** Once the root cause was identified at 06:14 UTC on June 10, the team prepared and deployed a fix to restore valid authorization configurations for affected customers.

**Permanent Resolution:** At 06:16 UTC on June 10, the fix was rolled out across all customers experiencing the issue. Authorization configurations were corrected, and `status` and `preview` operations resumed normal function. Publishing workflows were verified end-to-end for affected customers.

### Detection

- **Detection method:** Customer-reported. No automated monitoring alert fired.
- **Time to detection:** Approximately 8 hours and 33 minutes from incident start (13:37 UTC) to first customer report (22:10 UTC).
- **Time to identification:** Approximately 16 hours and 37 minutes from incident start to root cause identification (06:14 UTC on June 10).
- **Time to resolution:** Approximately 2 minutes from root cause identification to fix deployment (06:16 UTC on June 10).
- **Why detection was delayed:** Auth failures on SharePoint integrations are a common operational occurrence caused by outdated customer credentials, so no alert threshold existed for this failure mode. The 404 response surface further obscured the auth nature of the failure, and the 90-day lag between the regression commit and its first manifestation made historical code analysis the only viable investigation path.

### What Went Well

- Affected customers were able to reach the team quickly through Microsoft Teams and Slack, enabling rapid information exchange during investigation.
- Once the root cause was identified, the team was able to deploy a fix across all affected customers in a single rollout.
- Communication channels remained open throughout the extended investigation period.

### What Could Have Gone Better

- No automated monitoring distinguished this systemic auth regression from routine per-customer credential expiry, leaving detection entirely dependent on customer reports.
- HTTP 404 responses masked the authorization nature of the failure, leading authors and support teams down the wrong diagnostic path.
- The 90-day delayed effect of the regression made root cause analysis significantly longer than a typical deployment-related incident.
- Only a small subset of affected customers reported the issue, suggesting others may have been blocked from publishing without raising it — indicating a potential visibility gap in customer-facing error signaling.

### Lessons Learned

- Code changes that write or modify time-bounded authorization configurations must be tested against expiry scenarios, not just immediate read/write behavior.
- Auth failures must return explicit, actionable error responses — never generic 404s — so authors and support teams can distinguish credential issues from platform regressions.
- Failure modes that resemble normal operational noise (such as expired customer credentials) require dedicated monitoring that can detect correlated failures across multiple customers.
- Latent regressions with long activation delays require tooling or audit processes that can correlate current failures with historical configuration writes.

### Action Items

We have identified the following action items to prevent similar incidents and improve our response capabilities:

#### Monitoring and Alerting Improvements

1. Implement monitoring that automatically triggers an incident when correlated SharePoint authorization failures occur across multiple customers, distinguishing systemic regressions from individual credential expiry.

#### Technical Improvements

1. Update error handling for `status` and `preview` operations to return explicit authorization error responses instead of HTTP 404, clearly identifying auth failures to authors and support teams.
2. Improve the testing setup for SharePoint authorization configuration writes, including scenarios that simulate configuration expiry and re-authorization flows.

#### Documentation and Process

1. Update the operations runbook with diagnostic steps specific to SharePoint authorization failures, including how to distinguish credential expiry from platform-side configuration corruption.
2. Conduct operations team training on SharePoint auth failure modes, escalation paths, and the 90-day configuration lifecycle.

## Updates

### Resolved
2026-06-10T06:16:00.000Z

This incident has been resolved. A fix has been deployed to all affected customers. SharePoint-based `status` and `preview` operations are functioning normally, and publishing workflows have been verified.

### Identified
2026-06-10T06:14:00.000Z

We have identified the root cause as a code regression that corrupted SharePoint authorization configurations. The defect was latent and only activated as configurations reached their 90-day expiry. A fix is being prepared for rollout to all affected customers.

### Investigating
2026-06-09T22:10:00.000Z

We are investigating customer reports of HTTP 404 errors affecting SharePoint-based authoring. Authors are unable to complete `status` and `preview` operations, which is blocking publishing for affected customers. Other publishing capabilities, including develop, remain available.
