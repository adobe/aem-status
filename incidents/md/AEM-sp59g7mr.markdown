---
kind: postmortem
impact: minor
start-time: "2025-11-18T11:30:00.000Z"
end-time: "2025-11-18T11:43:00.000Z"
error-rate: 0.00927
impacted-service: delivery
postmortem-completed: "2025-11-18T20:52:26.239Z"
---

# Cloudflare Outage with Minor Impact on Delivery

## Executive Summary

On November 18, 2025, between 11:30 UTC and 11:43 UTC, a global Cloudflare outage impacted our delivery services with an overall error rate of 0.927%. Our team detected the issue within minutes through automated monitoring and initiated failover to the alternate stack within 11 minutes. The delivery service experienced minimal impact and was fully restored by 11:43 UTC.

The root cause was a [global outage at Cloudflare](https://blog.cloudflare.com/18-november-2025-outage/), lasting from 11:20 UTC to 17:06 UTC.

The impact on the delivery service was noticeable at an overall error rate of 0.927%, from 11:30 UTC to 11:43 UTC. Customer sites were impacted with a slightly elevated error rate for 13 minutes. Customers who had project-specific Cloudflare dependencies were more severely impacted. This includes usage of Early Access features hosted by Adobe, or self-hosted Cloudflare Workers.

## What went well

- Automated monitoring detected the issue within minutes
- Failover to alternate stack was executed within 11 minutes
- Multi-cloud strategy limited customer impact

## Action items

1. In case of a future Cloudflare outage, for customer sites using Cloudflare, switch to the healthy stack at the DNS level immediately upon detection         (target: within 5 minutes of confirmed outage)
2. Improve runbook to provide clearer steps for managing a global Cloudflare outage, including decision tree for         DNS-level failover
3. Consolidate logs from all relevant technical services to help the on-call engineer with an overview during an         outage, as well as facilitate the RCA

## Updates

### investigating
2025-11-18T11:31:33.836Z

At 11:31 UTC, our monitors alerted us about errors from Cloudflare workers.

### monitoring
2025-11-18T11:42:43.461Z

At 11:42 UTC, we switched our backends to the alternate stack. In the 11 minutes that passed since our monitor alerted us,
        we observed elevated error rates on delivery (*.live).

### resolved
2025-11-18T11:43:09.377Z

At 11:48 UTC, Cloudflare confirmed a global networking issue on their infrastructure.

