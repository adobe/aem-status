---
kind: legacy
title: RUM JavaScript Delivery Partially Delayed
impact: minor
---

## Postmortem

*Posted Apr 12, 2024 - 14:31 UTC*

Between 7:00 am and 12:45 pm (UTC) today, the JavaScript delivery feature of the Helix RUM Collector Service experienced an outage that resulted in slow responses and responses with status code 520 for following request types:

1. `helix-rum-js`: this slowed down page rendering for customers of Adobe Experience Manager as a Cloud Service that are part of the VIP program for RUM collection in AEM CS. This affected a small double digit number of customers.
2. `helix-rum-enhancer`: all customers of AEM CS and Edge Delivery Services were affected, so that some checkpoints in RUM collection could no longer be observed.
3. `web-vitals`: all customers of AEM CS and Edge Delivery Services were affected, making it impossible to collect RUM values for Core Web Vitals

During the entire period, RUM data collection was unaffected and performed as expected, so that page view estimates during the outage will still be accurate.

The issue was caused by [an outage](https://github.com/mjackson/unpkg/issues/384) of the [unpkg.com](http://unpkg.com) CDN that is used as a backend to deliver JavaScript files required for RUM data collection. When unpkg service was resumed, the Helix RUM Collector Service regained full functionality.

In order to prevent similar issues from re-occurring and to improve service quality, following steps will be taken by our team:

- revisit error logging in the RUM Collector Service for GET requests
- revisit synthetic monitoring of the JavaScript delivery of the RUM Collector Service
- revisit timeouts, fallback resources, and fallback backends of the RUM Collector Service to ensure page rendering won’t be affected by backend outages
- revisit integration of `helix-rum-js` into Adobe Experience Manager Cloud Service, to reduce reliance on an external service

In addition, [in version 2.20.0, helix-rum-collector](https://github.com/adobe/helix-rum-collector/releases/tag/v2.20.0) delivery of JavaScript files was changed so that multiple CDNs are supported, providing a reliable fallback in case of outage of a single CDN.

## Resolved

*Posted Apr 12, 2024 - 14:05 UTC*

The incident has been resolved and RUM script delivery is working for all customers as expected.

## Monitoring

*Posted Apr 12, 2024 - 13:31 UTC*

The backend service has resumed operations, we are monitoring the situation.

## Identified

*Posted Apr 12, 2024 - 13:08 UTC*

We have identified an outage at unpkg.com as the root source of the issue and are looking for ways to address the issue.

## Investigating

*Posted Apr 12, 2024 - 12:38 UTC*

We are observing issues that are affecting page delivery for AEM customers. The issue is under active investigation and we are working with full effort to reach a speedy resolution.

