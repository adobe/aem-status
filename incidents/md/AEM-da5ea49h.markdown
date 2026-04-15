---
kind: postmortem
impact: none
start-time: "2025-12-02T06:53:00.000Z"
end-time: "2025-12-02T07:24:00.000Z"
error-rate: 0.0022
impacted-service: publishing
postmortem-completed: "2025-12-02T08:23:51.269Z"
---

# Outage affecting publishing in Document Authoring (DA)

### Executive Summary

On December 2, 2025 at 6:53 UTC, an automatic dependency update was deployed to `admin.da.live` that caused the service to fail. Publishing content on `admin.da.live` was no longer possible, affecting all customers attempting to publish content from da.live. The overall da.live error rate reached 22.3% during the incident, with publishing requests being affected the most at 97%. The issue was detected through monitoring alerts after 24 minutes at 7:17 AM UTC. After a quick investigation and root cause identification, the service was rolled back at 7:23 AM UTC and fully restored at 07:24 UTC. The incident duration was 31 minutes.

### Root Cause

A dependency update of `@aws-sdk/client-s3` to version `3.933.0` was automatically deployed to the `admin.da.live` service as part of our dependency management service and continuous deployment pipeline. This dependency update was incompatible with existing worker deployment infrastructure and resulting in a broken deployment that was not caught by our automated testing suite. This caused the admin service to fail when attempting to process publishing requests, resulting in a complete inability for users to publish content.

### Resolution

At 7:17 UTC, the engineering team identified the faulty deployment and at 7:23 AM UTC initiated a rollback to the previous stable version of admin.da.live. The rollback completed successfully at 07:24 UTC, immediately restoring publishing functionality. Publishing operations that failed during the incident need to be retried manually.

### Action Items

- Implement pre-production testing environment for automatic dependency updates to catch breaking changes             before they reach production
- Add integration tests that specifically validate publishing workflows to prevent similar failures
- Establish dependency update review process requiring manual approval for critical changes
- Improve monitoring and alerting to detect publishing failures earlier than 20 minutes

## Updates

### investigating
2025-12-02T06:53:28.110Z

Starting 6:53 AM UTC, publishing content on da.live was no longer possible due to the deployment of a faulty
            version of admin.da.live.

### monitoring
2025-12-02T07:13:52.068Z

At 7:23 AM UTC, we rolled back admin.da.live to the previous version which fixed the issue.

### resolved
2025-12-02T07:24:00.000Z

At 7:24 AM UTC, the issue was resolved and admin.da.live was functional again.

