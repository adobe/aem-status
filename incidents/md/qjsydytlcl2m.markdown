---
kind: legacy
title: Slack Bot is unable to upload images or videos
impact: minor
---

## Postmortem

*Posted Feb 02, 2024 - 10:38 UTC*

On December 8, 2023 at around 09:40 UTC, we started getting error reports from users trying to upload files via Slack bot. After a brief investigation, we identified a change in Slack’s API as the root cause. Since it had been our goal for a while to deprecate the Slack bot’s upload skill in favor of uploads via Microsoft SharePoint or Google Drive using AEM Sidekick, we decided against fixing the issue and instead replaced the upload skill with instructions on how to upload files going forward.

By 12:25 UTC, the Slack bot’s upload skill was properly deprecated, and its invocation provided helpful instructions. The handful of authors who reached out on Slack in the meantime were being helped individually. Throughout the duration of this incident, it remained possible to upload files via Microsoft SharePoint or Google Drive using AEM Sidekick, so even though there was a minor disruption for authors who had been getting error messages when trying to upload files via Slack bot, no Publishing downtime was eventually recorded.

## Resolved

*Posted Dec 08, 2023 - 12:27 UTC*

The Slack bot now provides correct instructions on uploading files through Sharepoint, Google Drive and Sidekick. Direct uploads from Slack are no longer possible, due to changes in Slack's API and the deprecation of the bot skill.

## Investigating

*Posted Dec 08, 2023 - 09:57 UTC*

The FranklinBot Slack bot is currently unable to upload images or videos to content bus. We are investigating the issue. As a workaround, upload your content to Sharepoint or Google Drive first, then use the Sidekick to preview and publish the file.

