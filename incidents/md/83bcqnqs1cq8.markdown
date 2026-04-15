---
kind: legacy
title: Fastly Image Optimizer issue
impact: minor
---

## Postmortem

*Posted Dec 15, 2023 - 15:11 UTC*

We discovered that the errors were caused by an issue with a specific IO region in Fastly. The impact of the incident lasted for approximately 22 minutes, from 11:42 to 12:04 UTC. During that period we saw an increase of the media delivery error rate from 0% to 4.8%. About 50% of the errored requests were initiated by Bots. Customer impact has been negligible. We will continue to closely monitor error rates of the the infrastructure we are using and take action if necessary.

## Resolved

*Posted Dec 15, 2023 - 15:09 UTC*

We discovered that the errors were caused by an issue with a specific IO region in Fastly. The impact of the incident lasted for approximately 22 minutes, from 11:42 to 12:04 UTC. During that period we saw an increase of the media delivery error rate from 0% to 4.8%. About 50% of the errored requests were initiated by Bots. Customer impact has been negligible.We will continue to closely monitor error rates of the the infrastructure we are using and take action if necessary.

## Investigating

*Posted Dec 15, 2023 - 12:12 UTC*

We are observing an increased error rate on media delivery.

