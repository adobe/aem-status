---
kind: legacy
title: Page Delivery Issues Observed
impact: minor
---

## Postmortem

*Posted Feb 01, 2022 - 22:44 UTC*

Github raw content API had intermittent slow response times starting at about 1PM PT, leading to 2 status checks failing at 1:18PM due to 504s in Paris, FR and Ohio, US. Two other regions also received 504s during the same period but were not marked as failures: Sydney, AU and London, UK. Two additional regions had increased latency with no timeouts: Mumbai, IN and Singapore, SG; both increasing by ~22s.

Github did not open any incident for the increased latency, and it was largely stable within 9 minutes. There remained some intermittent latency spikes that lasted until 2:18PM PT.

The impact of this incident was minimal, with 1 request (not including status checks) being served a 504.

## Resolved

*Posted Jan 17, 2022 - 21:27 UTC*

This incident has been resolved.

## Investigating

*Posted Jan 17, 2022 - 21:19 UTC*

We are observing issues that are affecting page delivery for Project Helix customers. The issue is under active investigation and we are working with full effort to reach a speedy resolution.

