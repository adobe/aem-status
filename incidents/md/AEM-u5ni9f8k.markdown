---
kind: postmortem
impact: none
start-time: "2025-09-02T16:24:55.049Z"
end-time: "2025-09-02T20:26:04.212Z"
error-rate: 0.001
impacted-service: delivery
postmortem-completed: "2025-09-02T16:24:55.049Z"
---

# Increased error rate with images in delivery

## Postmortem

On 02.09.2025 16:24 UTC we noticed that there was a slight (<0.1%) increase in errors being served by Edge Delivery Services. Upon investigation, we found that the errors were limited to media requests and caused by a degradation of a service dependency.

The supplier acknowledged and fixed the issue within 4 hours.

## Updates

### investigating
2025-09-02T16:24:55.049Z

Investigating increased error rate with images in delivery

### monitoring
2025-09-02T22:58:14.041Z

Recovering from image delivery issue

### resolved
2025-09-03T01:36:01.654Z

Image delivery issue has been resolved

