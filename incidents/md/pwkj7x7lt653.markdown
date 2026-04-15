---
kind: legacy
title: [Publishing Issues Observed] Sidekick Library
impact: minor
---

## Postmortem

*Posted Oct 19, 2023 - 14:01 UTC*

Between 9:18 UTC and 14:36 UTC on 18-oct-2023 due to a change in the domain of our externally facing documentation website [https://www.hlx.live](https://www.hlx.live) to [https://www.aem.live](https://www.aem.live) a small portion of [www.hlx.com/tools](http://www.hlx.com/tools) which hosts resources used by sidekick was redirected accidentally.

Our analysis shows that 0.6% of the traffic to [www.hlx.com/tools](http://www.hlx.com/tools) during that time window was wrongly redirected and was potentially leading to an issue where users were not able to open up the sidekick library under certain conditions.

Based on that incident we are reconsidering the hosting location of resources consumed by sidekick and other parts of the product and are considering hosting these resources on a separate domain from the documentation website.

## Resolved

*Posted Oct 18, 2023 - 09:18 UTC*

We are observing issues that are affecting site publishing for AEM customers. Page delivery is not affected, but updates to your sites may be delayed or prevented. The issue is under active investigation.A limited set of customers with certain configurations may have seen Sidekick Libraries be impacted by an unrelated change. We are actively working to determine the scope of the impact.The issue has been resolved in the meantime.

