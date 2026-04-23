---
kind: legacy
title: Traffic blocked by zScaler
impact: minor
---

## Postmortem

*Posted Dec 12, 2024 - 15:00 UTC*

## Executive Summary

On December 11, 2024, between 4:30 PM and 7:00 PM UTC, a single customer experienced a service disruption affecting their internal traffic routing to Adobe Experience Manager. The incident was caused by a configuration change in our content delivery infrastructure that interacted unexpectedly with the customer's network security setup (zScaler). The issue was identified and resolved, with no impact to other Adobe Experience Manager customers.

Other zScaler customers were not affected by the issue.

## Incident Timeline

The incident began at *4:29 PM UTC* when our team implemented a configuration change to enable optional mTLS on the Edge Delivery Services CDN. At *4:52 PM UTC*, Adobe observed a service disruption and informed the affected customer. An incident response team was formed from *5:40 PM UTC* and began a thorough investigation.

At *7:05 PM UTC* the customer disabled zScaler’s traffic inspection and while traffic resumed, no root cause has been identified yet. At *7:43 PM UTC* the initial configuration change on mTLS was rolled back, but root cause analysis was not yet completed.

After analysis, at *9:45 PM UTC*, the team identified the root cause as an unexpected interaction between our new mTLS configuration and the customer's zScaler security setup. We then worked with the customer to verify service restoration, confirmed at *9:50 PM UTC*.

## Impact Analysis

For 2.5 hours, Edge Delivery Services experienced a global traffic drop of about 1%. This was not due to service unavailability or degraded performance, but a single customer ceasing requests due to internal network configuration blocking.

## Root Cause Analysis

Enabling Mutual Transport Layer Security (mTLS) authentication on our Edge Delivery Services ([aem.live](http://aem.live/)) infrastructure triggered the incident.

Although the CDN didn’t enforce mutual TLS, only clients with a client certificate would interact with the new security layer. However, this created an unexpected interaction with zScaler’s traffic inspection that cannot inspect traffic using mTLS, even if unenforced. This limitation was not documented in [zScaler’s architecture guide to TLS inspection](https://help.zscaler.com/downloads/zia/reference-architecture/tlsssl-inspection-zscaler-internet-access/TLS-SSL-Inspection-with-Zscaler-Internet-Access.pdf) and unknown to the Adobe team.

An unconventional setup combined zScaler inspection and enforcement, an on-site HTTP server proxying Edge Delivery Services, and a little-known mTLS support limitation. This led to a severe impact for internal users of a single customer and localized sites using the same HTTP server as a translation service origin.

## Resolution

Our priority was establishing a joint incident response team with Adobe engineers and the customer's network operations staff. This collaboration was crucial for quick problem resolution.

We identified two potential paths to restore service. The customer's team temporarily disabled their TLS inspection - a security feature that checks data for threats as it passes through their network - as a workaround, while our infrastructure team prepared to roll back the mTLS configuration changes. To minimize downtime, we pursued both in parallel.

After implementing these changes, we conducted thorough verification testing with the customer's team. This included monitoring traffic patterns and confirming functionality across all affected services until we confirmed full service restoration.

## Incident Response Readiness

A simultaneous outage of our Single-Sign-On (SSO) infrastructure hindered our response and analysis of the incident.

## What’s next?

We have identified the following key action items to prevent similar incidents and improve our response capabilities:

**Monitoring and alerting improvements**

1. Implement alerts for significant traffic drops for single domains
2. Automatically tag CDN (Content Delivery Network)/TLS (Transport Layer Security)/DNS (Domain Name System) changes in our logging, in addition to release tagging

**Documentation and change management**

1. Document unsupported CDNs and other clients and possible adverse effects
2. Add Fastly and Cloudflare configuration changes to release history tracking
3. Update runbook with instructions on documenting significant CDN/TLS/DNS configuration changes

**Security and access management**

1. Establish backup authentication methods for critical systems independent of Single Sign-On (SSO)

**Technical remediation**

1. Remove mTLS configuration from all systems
2. Update configuration service to remove mTLS options
3. Revise technical documentation to reflect changes

**Communication and process improvements**

1. Review and enhance customer communication protocols
2. Establish clear escalation paths for similar incidents
3. Review and update support ticket escalation procedures

We’ve assigned owners and deadlines to each action item to ensure timely completion of these improvements.

## Resolved

*Posted Dec 11, 2024 - 15:30 UTC*

We are currently investigating this issue.

