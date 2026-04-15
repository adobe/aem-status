---
kind: postmortem
impact: none
start-time: "2025-10-09T15:41:46.422Z"
end-time: "2025-10-09T17:43:54.488Z"
error-rate: 0.000
impacted-service: publishing
postmortem-completed: "2025-10-09T17:44:47.821Z"
---

# code deployment delayed because of Github API exhaustion for one customer

## Postmortem

On October 9, 2025 at 15:41 UTC, we noticed that the Github API limit was reached for one customer.

The reason was a Github API limit reached and reset and recovered automatically.

## Updates

### investigating
2025-10-09T15:41:46.422Z

code deployment delayed because of Github API exhaustion for one customer

### monitoring
2025-10-09T17:42:55.155Z

Github API limit reached and reset and recovered automatically

### resolved
2025-10-09T17:43:54.488Z

Discussion on how to reduce API usage with customer

