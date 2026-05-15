# Postmortem Guidelines

## Session start

- Run `git status` and check for untracked files matching `incidents/md/AEM-*.markdown`. That file is the one to work with.
- If none found, check `~/Downloads/AEM-*.markdown` for a file that doesn't exist in `incidents/md/` and was downloaded today. If there are multiple matches, pick the one modified within the last 30 minutes. Move it to `incidents/md/` and use it.
- If a file was found, auto-start the process of writing the post mortem.
- If no file was found, ask the user if they want to start writing a fresh postmortem or do something else.
- If the user wishes to start a postmortem from scratch:
  - Let them choose between one of the following templates:
    - `incidents/md/incident-template-short.markdown` - recommended for `impact: none` or `minor`
    - `incidents/md/incident-template-long.markdown` - recommended for `impact: major` or `critical`
  - Create a new file using the following code to generate the incident ID:
    `(length) => Math.random().toString(36).substring(2, 2 + length)`
  - Ask for a title, e.g. "XYZ Outage affecting Page Delivery"

## Frontmatter

```yaml
kind: postmortem
impact: none|minor|major|critical
start-time: 2024-01-15T14:30:00Z
end-time: 2024-01-15T16:45:00Z
error-rate: 0.0000
impacted-service: delivery|publishing
postmortem-completed: 2024-01-16T10:00:00Z
```

- **error-rate**: always compute as `errors / total log entries` (decimal, e.g. 0.0034 = 0.34%)
- **impact**: derived from error-rate — `none` <0.5%, `minor` <5%, `major` <10%, `critical` ≥10%
- **impacted-service**: `delivery` or `publishing` only
- **duration**: compute carefully from start/end timestamps — do not eyeball it

In case of missing metadata, ask the user for a screenshot from Klickhaus or Coralogix and extract the data from it, or request specific missing data points.

## Gathering the details

Prompt the user for further details required to complete the the sections of the template, including:
- Number of affected customers
- Impact on customer experience
- Trigger or root cause that led to the incident (suspected or proven)
- Involved cloud providers (Fastly, AWS, Cloudflare, etc)
- Link(s) to any 3rd party incident
- How and when the incident was detected (monitoring vs. end user)
- Actions taken to resolve the incident

Then write the postmortem details by populating the predefined sections of the selected template.

## Updates / Timeline section

Based on the information gathered, adjust the timeline if needed:
- Reverse-chronological order
- Only include entries that actually happened — never fabricate timestamps
- Valid states: `Resolved`, `Monitoring`, `Identified`, `Investigating`
- Post-facto investigations are valid: `Investigating` may have a timestamp after `Resolved`

## PR review simulation

The workflow in `.github/workflows/post-mortem-unified.yml` runs a Claude review on every PR. Pre-empt its feedback by simulating a PR review and listing suggested changes, but allow the user to approve or reject each suggestion.

## Auto-classification (bot handles this automatically)

When the PR is opened, the bot classifies the incident in `incidents/index.json`. No action needed, but useful to know the valid values:

| Field | Valid values |
|---|---|
| `affectedComponents` | `delivery`, `publishing` (customer-facing only), or `null` |
| `internalServices` | `admin-api`, `forms`, `code-sync`, `rum`, `indexing`, `logging`, `dns`, `sidekick`, `media`, or `null` |
| `externalVendors` | `cloudflare`, `aws`, `fastly`, `github`, `microsoft`, `unpkg`, `zscaler`, `webpack`, or `null` |
| `rootCause` | `third-party-outage`, `configuration-change`, `deployment-issue`, `resource-limits`, `credential-issue`, `dns-issue`, `network-issue`, `dependency-issue`, `unknown` |

## Git workflow

- Branch name: the incident ID in all lower case (e.g. `aem-t58nxd8r`)
- Commit message / PR summary: `feat: <incident-summary>`
- PR description:
```
Postmortem for #<incident-id>

URL: https://<branch-name>--aem-status--adobe.aem.page/details.html?incident=<incident-id>
```
