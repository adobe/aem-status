---
kind: postmortem
impact: none
start-time: "2026-02-11T00:00:00Z"
end-time: "2026-02-25T19:30:00Z"
error-rate: 0.0
impacted-service: publishing
postmortem-completed: "2026-02-26T12:00:00.000Z"
---

# Chrome 145 intermittently displays "425 Too Early" errors

### Executive Summary

From February 11 to February 25, 2026 (14 days), users on Google Chrome version 145 experienced intermittent "425 Too Early" errors when accessing AEM Edge Delivery Services pages on *.aem.live and *.aem.page domains. The error appeared as a blank page with "Too Early" text, requiring users to reload to access content. This particularly affected authoring workflows, including Sidekick functionality and content preview.

The incident was caused by a regression in Chrome 145 that prevented the browser from properly retrying requests after receiving HTTP 425 responses from Fastly's CDN during TLS 1.3 0-RTT (early data) connections over HTTP/3. AEM infrastructure was not impacted; the issue was entirely within the Chrome browser's handling of a standard CDN security response.

### Root Cause

Chrome 145 introduced a change ([CL 7157040](https://chromium-review.googlesource.com/c/chromium/src/+/7157040)) that tightened the retry condition for HTTP 425 "Too Early" responses. The change checked a cached SSLInfo value that was snapshotted before the QUIC handshake completed, causing `early_data_accepted` to always read as `false`. This prevented Chrome from retrying requests that Fastly correctly rejected with 425, as the CDN does not process potentially replay-vulnerable 0-RTT early data requests.

The HTTP 425 status code is a standard mechanism for servers to indicate that a request sent as TLS early data should be retried after the handshake completes. Previous Chrome versions and other browsers (Safari, Firefox) handle this correctly by automatically retrying.

[Chromium Issue 484218878](https://issues.chromium.org/issues/484218878) [Fastly Incident 378300](https://www.fastlystatus.com/incident/378300)

### Detection

The incident was first reported internally on February 12, 2026 when team members encountered 425 errors while browsing www.aem.live. Additional customer reports followed over subsequent days. The issue was correlated with the Chrome 145 stable release rollout beginning February 11. Fastly published their incident notice on February 13, 2026.

Automated monitoring did not detect this incident. The 425 errors occurred in Fastly's TLS stack before requests reached our logging infrastructure, and proactive detection would have required testing with pre-release Chrome versions—impractical given the number of browsers and versions in use.

### Impact

The incident lasted 14 days, from February 11 to February 25, 2026, affecting Chrome 145 users directly accessing AEM Edge Delivery Services publishing infrastructure:

- Preview pages on *.aem.page domains
- Live pages on *.aem.live domains
- www.aem.live documentation and resources
- Sidekick extension functionality (intermittent load failures)
- admin.hlx.page when fetched via Sidekick, or during the sign in flow

The errors were intermittent—a page reload was sufficient to recover in most cases. Production delivery through customer CDNs was unaffected, as customer CDNs do not use HTTP/3 for origin requests to *.aem.live. Precise error rate metrics are unavailable as the 425 errors occurred in Fastly's TLS stack before reaching our logging infrastructure.

### Resolution

The Chrome team identified and fixed the bug on February 16-17, 2026 ([CL 7581133](https://chromium-review.googlesource.com/c/chromium/src/+/7581133)). The fix was cherry-picked to Chrome 145 and 146 branches on February 19-20. On February 25, 2026 at 19:30 UTC, Fastly temporarily disabled 0-RTT for shared IP customers as an interim mitigation while the Chrome fix propagates through stable channel updates.

Users experiencing issues can work around the problem by:

- Reloading the page (content typically appears after refresh)
- Disabling QUIC in Chrome: navigate to `chrome://flags`, set "Experimental QUIC protocol" to Disabled, and restart Chrome
- Updating to the latest Chrome version once the fix is released to stable

### Action Items

- Request error visibility from Fastly: Get 425 error rates added to logging or dashboards       so future similar issues are measurable
- Document H3/0-RTT toggle runbook: Quick reference for disabling these features on Fastly       if needed in future browser regressions
- Subscribe to Chromium networking component: Early awareness of changes to QUIC/TLS       handling that could affect our users

## Updates

### Resolved
2026-02-25T19:30:00.000Z

Fastly has disabled 0-RTT on shared IPs serving *.aem.page and *.aem.live, resolving the
      issue. Chrome has separately released a fix (CL 7581133) that will ship in an upcoming
      stable update, after which Fastly's configuration change can be reverted.

### Monitoring
2026-02-17T05:00:00.000Z

The Chrome team has identified the root cause and deployed a fix to the main branch.
      Cherry-picks to Chrome 145 and 146 branches are in progress. Fastly is coordinating with
      Chrome on timeline and preparing server-side mitigations.

### Identified
2026-02-13T23:15:00.000Z

The issue has been identified as a Chrome 145 regression in handling HTTP 425 "Too Early"
      responses for HTTP/3 QUIC 0-RTT connections. Fastly's CDN correctly returns 425 for early
      data requests, but Chrome 145 fails to retry these requests. Workaround: disable QUIC in
      chrome://flags or reload affected pages.

### Investigating
2026-02-12T14:17:00.000Z

We are receiving reports of intermittent "Too Early" errors displayed to users on Chrome
      when accessing *.aem.live and *.aem.page domains. Initial investigation suggests this is
      related to TLS 1.3 early data handling and HTTP/3. We are coordinating with Fastly and
      monitoring the Chrome issue tracker.

