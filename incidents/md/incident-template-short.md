---
kind: postmortem
impact: none
start-time: "[ISO 8601 timestamp - e.g., 2024-09-11T05:00:00.000Z]"
end-time: "[ISO 8601 timestamp - e.g., 2024-09-11T12:30:00.000Z]"
error-rate: [Error rate as decimal - e.g., 0.001]
impacted-service: [delivery|publishing]
postmortem-completed: "[ISO 8601 timestamp when postmortem was completed - e.g., 2024-09-11T14:00:00.000Z]"
---

# [Brief incident title - e.g., "Github notifications unavailable"]

### Executive Summary

[Describe when the incident was noticed, what the observable problem was, and what services or features were affected. Use UTC timestamps and be specific about the impact.]

Example: On September 11, 2024 at 12:30 UTC, we noticed that the AEM Code Sync Github application had stopped dispatching github events since 05:00 UTC. As a result, github actions triggered by repository_dispatch events were no longer invoked.

### Root Cause

[Explain the underlying technical reason for the incident. What failed or changed?]

Example: A content-write permission on the AEM Code Sync Github application was removed, which is required to dispatch events. This permission change prevented the application from notifying repositories of content updates.

### Resolution

[Describe how the issue was fixed and any actions customers need to take.]

Example: The missing permission was restored, and event dispatching resumed immediately. Customers using repository_dispatch events in their github actions need to approve the altered permissions. Organization admins should have received an email from GitHub.

### Action Items

[List 2-5 specific actions to prevent recurrence. Include monitoring, process, or technical improvements.]

- [Example: Add monitoring for GitHub App permission changes]
- [Example: Document required permissions in runbook]
- [Example: Implement alerts for event dispatch failures]

## Updates

### Resolved
[ISO 8601 timestamp - e.g., 2024-09-11T12:30:00.000Z]

[Description of final resolution - e.g., "This incident has been resolved."]

### Monitoring
[ISO 8601 timestamp - e.g., 2024-09-11T12:15:00.000Z]

[Description of monitoring phase and any customer actions needed - e.g., "The relevant permission has been updated and notifications are being dispatched again. Customers need to approve the altered permissions."]

### Identified
[ISO 8601 timestamp - e.g., 2024-09-11T07:00:00.000Z]

[Description of the problem and that root cause was found - e.g., "We have identified the root cause and are working on a solution."]

