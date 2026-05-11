---
kind: postmortem
impact: none
start-time: 2026-05-11T05:56:00Z
end-time: 2026-05-11T06:32:00Z
error-rate: 0.00029
impacted-service: delivery
postmortem-completed: 2026-05-11T10:22:17Z
---

# Increased error rate due to increased origin latency

### Executive Summary

On May 11, 2026, starting at 05:29 UTC, elevated origin latency was observed on Cloudflare Workers serving AEM delivery traffic. The increased latency caused `first byte timeout` errors between 05:56 and 06:32 UTC, resulting in an error rate of 0.029%. The issue was detected via monitoring alert. No customers reported impact. Both error rate and origin latency recovered on their own — error rate by 06:32 UTC and origin latency fully by 07:10 UTC.

### Root Cause

Origin requests to Cloudflare Workers experienced elevated latency for approximately 100 minutes (05:29–07:10 UTC). No incident was posted on the Cloudflare status page and the root cause remains unknown. The latency spike caused `first byte timeout` errors on the AEM delivery stack for 36 minutes until traffic normalized.

### Resolution

The origin latency and resulting error rate recovered without intervention. The team was prepared to switch origins from Cloudflare to AWS if conditions worsened, but that action was not necessary. No customer action is required.

### Action Items

- None. Monitoring alerted as expected and the team was prepared to act.

## Updates

### Resolved
2026-05-11T06:32:00Z

Error rate returned to normal. Origin latency on Cloudflare Workers continued recovering and fully normalized by 07:10 UTC.

### Monitoring
2026-05-11T05:56:00Z

Monitoring alert fired. Team observed elevated `first byte timeout` errors and tracked origin latency. A switch from Cloudflare to AWS origins was prepared as a mitigation option.

### Identified
2026-05-11T05:29:00Z

Elevated origin latency detected on Cloudflare Workers. No corresponding incident on the Cloudflare status page.
