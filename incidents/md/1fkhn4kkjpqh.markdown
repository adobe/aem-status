---
kind: legacy
title: Slow Index Updates
impact: minor
---

## Postmortem

*Posted May 27, 2024 - 14:58 UTC*

On March 18 the system experienced a unexpected indexing load that overwhelmed the indexing queue. Due to a suboptimal configuration the system was not able to process the queue fast enough and clogged indexing processing for all customers.

Consequently, index updates might have been delayed by over 1 hour.

After identifying the problem we could reconfigure the queue to avoid similar problems in the future.

## Resolved

*Posted Mar 18, 2024 - 04:00 UTC*

Index updates are processed with significant delays.

