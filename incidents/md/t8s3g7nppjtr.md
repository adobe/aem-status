---
kind: legacy
title: Cloudflare Workers Issue
impact: minor
---

## Postmortem

*Posted Dec 13, 2023 - 09:12 UTC*

As the issue only affected a small number of internal customers that were assigned to the (secondary) Cloudflare stack, the slightly elevated error rate did not raise an alert, so no mitigating actions were taken.

As a consequence, we’ve lowered the alert thresholds, so that we can switch between primary and secondary stacks faster.

## Resolved

*Posted Dec 12, 2023 - 04:00 UTC*

A small number of customers running on the Cloudflare stack were affected by the Cloudflare Workers Issue https://www.cloudflarestatus.com/incidents/m6y3t8mxy1c7 that caused slow load times and elevated error rates on hlx.page. This lead to a minor disruption of authoring and preview, but no impact to delivery.

