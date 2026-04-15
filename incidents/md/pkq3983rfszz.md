---
kind: legacy
title: Ongoing DNS Disruption for hlx.page and hlx.live
impact: major
---

## Postmortem

*Posted Oct 02, 2023 - 16:39 UTC*

Around midnight (UTC) of Tuesday, September 26th 2023 we received reports from users that their preview sites on *.hlx.page, *.hlx.live, or the Adobe Experience Manager homepage on [www.hlx.live](http://www.hlx.live) or even the status page on status.hlx.live were unavailable. These reports were scattered, inconsistent, and could not be reproduced by the on-call engineers. Over the next 24 hours it became clear that this was related to a wider Domain Name System (DNS) issue that affected the DNS provider for our services.

Our DNS provider declared the issue to be over and resolved, which led us to post a [status update declaring the issue to be resolved for our customers](https://status.hlx.live/incidents/lymy0j297t0j). Over the next few days, as reports about DNS resolution issues continued to trickle in, it became clear that this was not the case and a new incident was raised. In our monitoring we could observe raised DNS resolution times of about 600 milliseconds that while well below Tuesday’s peak of 2500 ms, were still significantly above the prior baseline of 200 ms.

This continuing incident was ultimately resolved on September 28th, around 6pm UTC when the entire DNS provider for our services was replaced with new globally distributed DNS infrastructure. As changes to the start of authority (SOA) record take a while to propagate, we resolved the issue a few hours later, after verifying that our services could be reached and resolved globally.

‌To deliver customer sites, we rely on a second layer of customer-managed content delivery network (CDN) infrastructure. These content delivery networks have more robust DNS resolvers that are capable of handling longer DNS resolution times than most DNS resolvers used by Internet Service Providers (ISPs). This, combined with the high cache efficiency of AEM resources led to a very limited impact in terms of availability of customer sites. Despite this limited impact, we treat this DNS disruption as a major incident and are taking a number of fundamental steps to prevent a re-occurrence:

- In addition to the already completed transition to new DNS infrastructure, we are looking to further increase the robustness of our DNS stack and evaluate a multi-provider DNS setup
- We will establish better DNS monitoring, so that issues like increased DNS resolution times will cause alerts, so that we can act faster
- In order to ensure availability of this status page even in light of a larger DNS outage, we are moving it to a completely independent DNS infrastructure, which also includes a new domain name of [aemstatus.net](http://aemstatus.net) (we will establish redirects from this page once the setup has been completed)
- The team has changed it’s escalation process to communicate issues more proactively, even in cases when reproducibility is not yet given

## Resolved

*Posted Sep 28, 2023 - 19:39 UTC*

We have received no more messages from users about DNS resolution errors and consider this closed. As always, a post-mortem will follow in a few days after we had a chance to regroup.

## Monitoring

*Posted Sep 28, 2023 - 17:55 UTC*

The move to new DNS infrastructure has been completed. We are now monitoring the situation worldwide and will resolve once we have certainty that all users can access our services as before.

## Update

*Posted Sep 28, 2023 - 16:52 UTC*

We are seeing DNS service recovering globally, although some locations and ISPs still fail to resolve. This is due to a switch in DNS providers at the registrar, which can require some time for caches to expire.

## Identified

*Posted Sep 28, 2023 - 15:36 UTC*

The DNS servers that are providing services for hlx.page and hlx.live are still experiencing issues. This can lead to slow or failing DNS resolution, with varying impact, depending on network provider. We are working with the Adobe DNS team to provide a resolution.

