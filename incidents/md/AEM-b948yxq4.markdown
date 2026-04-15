---
kind: postmortem
impact: none
start-time: "2026-02-11T14:30:00.000Z"
end-time: "2026-02-11T15:54:00.000Z"
error-rate: 0
impacted-service: publishing
postmortem-completed: "2026-02-11T17:30:00.000Z"
---

# AEM Sidekick sign in no longer working after upgrade to Google Chrome v145.0.*

### Executive Summary

Around 14:30 UTC, a user whose Google Chrome had just been upgraded to the new major version 145 started noticing problems on [https://tools.aem.live](https://tools.aem.live/). When trying to sign in to a project, they would see the following alert:

AEM Sidekick is required to sign in. Install now?

All users running Chrome version 145 were theoretically affected without a workaround, however it is impossible for us to determine how many users ran into this issue trying to sign in to a project during the incident. Sign in was obstructed but there was no data loss.

The problem was caused by a breaking change in the Chrome API that was incompatible with the sidekick. A sidekick fix was pushed out at 15:32 UTC and published on the Chrome Web Store at 15:54 UTC.

### Root Cause

Our immediate investigation revealed that Chrome version 145, which was released and auto-updated for users, introduced a breaking change to their extensions' external messaging API: external message listeners can no longer be `async` and use the `sendResponse` callback simultaneously. The change had been [already announced here](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/4txWvDW55hU) in November 2025.

This broke the sidekick's ability to properly respond to messages sent from `tools.aem.live`, or the admin API, blocking the ability to sign in to projects or tools that required authentication. Users trying to sign in would be left stranded.

### Detection

The incident was detected through a user report at 14:30 UTC, shortly after Chrome 145 began auto-updating for users. We do not have automated monitoring in place to detect Chrome version updates or extension communication failures, so we were relying on reactive rather than proactive detection.

This delayed our ability to prepare a fix in advance of the Chrome 145 rollout, despite the API change being announced 4 months prior.

### Resolution

Making the external message listener synchronous immediately resolved the issue. A fix was released for review at 15:32 UTC and published at 15:54 UTC.

Users still experiencing issues please make sure their extensions are up to date.

### What Went Well

- Fast incident response: fix developed, reviewed, and published within 84 minutes of detection
- Root cause identified quickly through systematic investigation
- Clear communication to users about the issue and resolution steps

### What Could Have Gone Better

- AEM Sidekick was using an anti-pattern that Chrome had flagged for deprecation
- The Chrome API change was announced 4 months in advance, but we did not have processes to track and act on it
- No automated testing against Chrome beta/canary versions to catch compatibility issues before production release

### Action Items

- Subscribe to the `chromium-extensions` Google Group to get notified early about upcoming breaking changes and anticipate crucial release dates
- Explore adding a CI test using Chrome beta/canary versions to detect incompatibilities before new sidekick versions get published.

## Updates

### Resolved
2026-02-11T15:54:00.000Z

The new AEM Sidekick v7.28.1 containing the fix has been published

### Monitoring
2026-02-11T15:32:00.000Z

We have identified the problem and released a fix to the Chrome Web Store (currently pending Google's review)

### Identified
2026-02-11T14:30:00.000Z

We are observing users having sign in issues with the AEM Sidekick extension

