---
kind: postmortem
impact: minor
start-time: "2025-11-18T11:30:00.000Z"
end-time: "2025-11-18T11:43:00.000Z"
error-rate: 0.02794
impacted-service: publishing
postmortem-completed: "2025-11-18T20:52:26.239Z"
---

# Cloudflare Outage with Minor Impact on Authoring and Publishing

## Executive Summary

On November 18, 2025, between 11:30 UTC and 11:43 UTC, a global Cloudflare outage impacted our publishing services with a weighted average error rate of 2.794%. Our team detected the issue within minutes through automated monitoring and initiated failover to the alternate stack within 11 minutes. The publishing service was fully restored by 11:43 UTC. No data loss occurred, and the vast majority of customers experienced either no impact or brief interruptions.

The root cause was a [global outage at Cloudflare](https://blog.cloudflare.com/18-november-2025-outage/) lasting from 11:20 UTC to 17:06 UTC.

The Admin API was not impacted by the outage: Updating and publishing content remained available throughout the incident. Customers would run into occasional errors while previewing content on `aem.page` domains, especially during the first few minutes of the incident.

Outside of the Authoring and Publishing SLO, but related, `da.live` was impacted severely at a 4.1% error rate for a longer duration, between 11:30 UTC and 15:30 UTC. Viewing, updating and publishing remained challenging for most customers throughout the incident.

## What went well

- Automated monitoring detected the issue within minutes
- Failover to alternate stack was executed within 11 minutes
- Multi-cloud strategy limited customer impact

## Action items

1. In case of a future Cloudflare outage, for customer sites using Cloudflare, switch to the healthy stack at the DNS level         immediately upon detection (target: within 5 minutes of confirmed outage)
2. Improve runbook to provide clearer steps for managing a global Cloudflare outage, including decision tree for DNS-level failover
3. Clearly define all technical services that belong to the publishing business service SLO, including `*.aem.reviews` and `*.da.live`.
4. Consolidate logs from all relevant technical services to help the on-call engineer with an overview during an outage, as well as facilitate the RCA
5. Improve monitoring to alert on elevated error rates on `*.da.live` and `*.aem.reviews` services
6. Allow for DNS-level switch on `admin.hlx.page` and `da.live`.

## Updates

### investigating
2025-11-18T11:31:33.836Z

At 11:31 UTC, our monitors alerted us about errors from Cloudflare workers.

### monitoring
2025-11-18T11:42:43.461Z

At 11:42 UTC, we switched our backends to the alternate stack. In the 11 minutes that passed since our monitor alerted us,
        we observed elevated error rates on publishing (*.page).

### resolved
2025-11-18T11:43:00.000Z

At 11:48 UTC, Cloudflare confirmed a global networking issue on their infrastructure.

