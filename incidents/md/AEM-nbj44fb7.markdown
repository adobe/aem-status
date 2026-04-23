---
kind: postmortem
impact: minor
start-time: "2026-04-15T12:15:00.000Z"
end-time: "2026-04-15T12:23:00.000Z"
error-rate: 0.000852
impacted-service: delivery
postmortem-completed: "2026-04-15T19:00:00.000Z"
---

# Increased 5xx errors on Delivery (content pipeline and media)

### Executive Summary

On April 15, 2026 at approximately **12:15 UTC**, monitoring showed a sharp spike in **5xx** responses on the Delivery service. Over the incident window we observed on the order of **403** HTTP 5xx errors, dominated by **502 Bad Gateway** (352) and **503 Service Unavailable** (41). The most common failure signature was **`Worker: x-error: failed to load … from content`** (341), with a secondary cluster tied to **`[media] R2: Service Unavailable`** (37). Traffic was concentrated on host **`main--da-cc--adobecom.aem.page`** (265 errors). Error volume by edge showed **Fastly** as the primary source label (385), with a smaller share attributed to **Cloudflare** (18). By request type, failures skewed heavily to **pipeline** (344) versus **media** (39); nearly all were **GET** requests (402). Geographic concentration was notable at the **DEL** datacenter (265). The event was **transient**: metrics returned toward baseline by **12:23 UTC** with no sustained elevation afterward. Customer impact was limited to failed page/asset requests during the spike; retries after recovery succeeded for typical workloads.

### Root Cause

The incident is **attributed to a short-lived degradation** in the path serving HTML pipeline and media: workers reported **failures loading content from origin/storage**, consistent with **502/503** at the edge and the **`x-error: failed to load … from content`** message. The **R2 “Service Unavailable”** errors indicate **object storage / media backend** stress or unavailability during the same interval. We did not identify a single configuration change or deployment tied to this window in this report; the pattern matches **upstream or regional capacity/transient faults** (edge ↔ origin ↔ storage) rather than a broad misconfiguration of the delivery stack.

### Resolution

Operations and automated monitoring confirmed **recovery without a customer-facing maintenance window**: error rates and status-code mix returned to normal after **12:23 UTC**. No durable workaround was required beyond **retry** for clients that received 5xx during the narrow spike. No customer data migration or manual content fix was required.

### Action Items

- Tune **5xx** dashboards and alerts so spikes of this shape (pipeline + media, by POP) page the right on-call path within minutes.
- Add a short **runbook** entry for “content load / R2 unavailable” symptom clusters (502/503 + `x-error` / R2) including checks for regional and storage health.
- Review **sampling and top-N dimensions** (host, `x-error`, pipeline vs media, POP) for faster triage in future events.
- Coordinate with **storage / media** owners on whether additional **hedging or backoff** in the worker path is appropriate for similar blips.

## Updates

### resolved
2026-04-15T12:23:00.000Z

Delivery error rates and 5xx counts returned to baseline. No further elevated 5xx observed for this event after 12:23 UTC.

### monitoring
2026-04-15T12:18:00.000Z

Elevated 502/503 and worker content-load errors were still visible; traffic remained concentrated on pipeline and `main--da-cc--adobecom.aem.page`, with DEL POP overrepresented. Continued monitoring until metrics normalized.

### investigating
2026-04-15T12:15:00.000Z

Automated Delivery monitoring detected a sharp spike in 5xx responses around 12:15 UTC (~403 events in the analyzed slice), primarily 502/503, with top messages for worker content load failures and R2 media unavailability. Investigation focused on edge vs origin vs storage signals.
