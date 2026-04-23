---
kind: legacy
title: Increased error rate with the Franklin Admin Service.
impact: minor
---

## Postmortem

*Posted Jan 24, 2023 - 20:59 UTC*

Between 18:21 and 19:10 UTC, one of our cloud providers experienced a momentary disruption in their storage service. This had an effect on the preview and publish operations performed by the Franklin Admin service. These operations perform actions in the primary Franklin stack and also in our redundant stack which was affected. Due to the failing operations in the redundant stack users were presented with error messages even though the underlying operations had succeeded in the primary stack.

[https://www.cloudflarestatus.com/incidents/hqm15hl7fgd1](https://www.cloudflarestatus.com/incidents/hqm15hl7fgd1)

## Resolved

*Posted Jan 24, 2023 - 18:21 UTC*

Franklin experienced a temporary increased error rate due to a problem with one of our cloud providers. The outage effected user of the Franklin Admin Service and the Sidekick.This incident has been resolved.

