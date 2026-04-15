---
kind: legacy
title: DNS Disruption for hlx.page and hlx.live
impact: minor
---

## Postmortem

*Posted Oct 02, 2023 - 16:41 UTC*

Please see [this postmortem for a complete update](/details.html?incident=pkq3983rfszz).

## Resolved

*Posted Sep 26, 2023 - 00:00 UTC*

Adobe has been experiencing issues with the Domain Name System (DNS) provider that serves hlx.page and hlx.live that caused these domains to be unresolvable from certain networks. Changing the DNS provider to 1.1.1.1 (Cloudflare) or 8.8.8.8 (Google) provided an effective workaround.

