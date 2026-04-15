---
kind: legacy
title: Elevated amount of publishing failures
impact: minor
---

## Postmortem

*Posted Apr 10, 2025 - 10:27 UTC*

## Executive Summary

On Tuesday, April 8, 2025, between 10:44:51 and 11:23:17 UTC (approximately 38 minutes), users of the admin API for Edge Delivery Services in Adobe Experience Manager Sites as a Cloud Service with document-based authoring experienced publishing failures. The incident was caused by a regression in webpack 5.99.0 that was introduced through a dependency update in helix-deploy. During this period, 277 errors were recorded out of 37,258 total requests (approximately 0.7% error rate). Affected customers were unable to publish content or experienced failures in code synchronization from GitHub. The issue was quickly identified and resolved by updating helix-deploy to use a fixed version of webpack.

## Incident Timeline

- **10:44:51 UTC:** Incident begins with first publishing failures detected
- **~10:45 UTC:** Monitoring alerts triggered
- **~10:55 UTC:** Initial investigation identified the issue as a webpack regression in helix-deploy
- **~11:00 UTC:** Team reverted the admin service to a working version
- **~11:05 UTC:** Root cause confirmed as webpack issue (reference: [webpack/webpack issue #19394](https://github.com/webpack/webpack/issues/19394))
- **~11:15 UTC:** Team updated helix-deploy to use a fixed version of webpack (5.99.2) and verified the fix
- **11:23:17 UTC:** Incident resolved after implementing the fix in the admin service
- **~13:45 UTC:** Affected package version (helix-deploy 12.4.29) was deprecated in npm to limit further impact

## Impact Analysis

The incident affected the admin API for Edge Delivery Services in Adobe Experience Manager Sites as a Cloud Service with document-based authoring. During the 38-minute incident period, 277 errors were recorded out of 37,258 total requests, resulting in an error rate of approximately 0.7%.

Affected customers experienced:

- Inability to publish content
- Failures in code synchronization from GitHub

It's important to note that the affected admin API is technically separate from the main product and not covered by the same customer-facing SLA.

## Root Cause Analysis

The root cause of this incident was a regression in webpack 5.99.0 that caused references to required functions (e.g., splitByExtension) to be dropped. This issue was introduced to our system through an update to the helix-deploy dependency, which included the affected webpack version. When the code was executed, it resulted in "not defined" reference errors that prevented the publishing service from functioning correctly.

The specific webpack regression is documented in [webpack/webpack issue #19394](https://github.com/webpack/webpack/issues/19394).

## Resolution

The team took the following steps to resolve the incident:

1. Initially reverted the admin service to a known working version to restore functionality
2. Identified that webpack 5.99.2 contained a fix for the regression
3. Updated helix-deploy to use the fixed webpack version (5.99.2)
4. Verified that the updated helix-deploy resolved the issue in a test environment
5. Deployed the updated helix-deploy with the admin service
6. Deprecated the affected helix-deploy package version (12.4.29) in npm to prevent further impact

These actions successfully resolved the incident, with publishing functionality fully restored by 11:23:17 UTC.

## Incident Response Readiness

The monitoring and response stance worked exemplarily during this incident. The issue was quickly detected through existing monitoring systems, and the team was able to identify, diagnose, and resolve the problem efficiently. There were no detection issues or response delays, which contributed to the relatively short duration of the incident.

## What's Next?

To prevent similar incidents in the future, the team has identified the following action items:

1. Improve post-deploy tests of the affected service to ensure a greater share of the service's functionality is tested within runtime. This will complement the existing 100% unit test coverage.
2. Evaluate switching from webpack to esbuild as the default bundler after thorough evaluation, which may reduce the risk of similar regressions occurring in the future.

Each action item will be assigned an owner and deadline to ensure timely completion and enhance service reliability.

## Resolved

*Posted Apr 08, 2025 - 14:36 UTC*

We experienced elevated error rates for publishing and code sync, leading to incomplete publishes and code synchronizations.

