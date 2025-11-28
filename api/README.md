# AEM Status API

Azure Functions backend that proxies and caches responses from Google Apps Script.

## Architecture

```
┌─────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Client    │────▶│  Azure Functions    │────▶│  Google Apps Script │
│             │◀────│  (2-min cache)      │◀────│                     │
└─────────────┘     └─────────────────────┘     └─────────────────────┘
```

### Endpoints

| Environment | URL |
|-------------|-----|
| Production | https://aem-status-api.azurewebsites.net/api/getCurrentIncident |
| Staging | https://aem-status-api-staging.azurewebsites.net/api/getCurrentIncident |

### Caching Behavior

- **Cache TTL**: 2 minutes
- **Cache HIT**: Returns cached data with `X-Cache: HIT` and `Age` header
- **Cache MISS**: Fetches from Google, returns with `X-Cache: MISS`
- **Cache STALE**: On Google failure, returns stale cache with `X-Cache: STALE`

### Response Headers

| Header | Values | Description |
|--------|--------|-------------|
| `X-Cache` | `HIT`, `MISS`, `STALE` | Cache status |
| `Age` | seconds | Time since response was cached |

## Local Development

```bash
cd api
npm install
npm start
```

Requires [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local).

## Deployment

Deployments are automated via GitHub Actions:

- **Push to `main`** → deploys to production
- **Push to other branches** → deploys to staging

## Rotating Secrets

### Regenerate Publish Profiles

When credentials need rotation, regenerate the publish profiles and update GitHub secrets.

**Production:**

```bash
# Regenerate credentials
az functionapp deployment list-publishing-credentials \
  --name aem-status-api \
  --resource-group helix-prod \
  --query "{user:publishingUserName}" -o table

# Get new publish profile
az functionapp deployment list-publishing-profiles \
  --name aem-status-api \
  --resource-group helix-prod \
  --xml
```

Update GitHub secret `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` with the XML output.

**Staging:**

```bash
az functionapp deployment list-publishing-profiles \
  --name aem-status-api-staging \
  --resource-group helix-prod \
  --xml
```

Update GitHub secret `AZURE_FUNCTIONAPP_PUBLISH_PROFILE_STAGING` with the XML output.

### Reset Publishing Credentials

To force credential rotation:

```bash
# Reset production credentials
az functionapp deployment user set \
  --user-name <new-username> \
  --password <new-password>

# Or reset via the function app
az webapp deployment list-publishing-credentials \
  --name aem-status-api \
  --resource-group helix-prod \
  --query "{user:publishingUserName}"
```

### Verify SCM Basic Auth is Enabled

GitHub Actions deployment requires SCM basic auth:

```bash
# Check status
az resource show \
  --resource-group helix-prod \
  --name scm \
  --namespace Microsoft.Web \
  --resource-type basicPublishingCredentialsPolicies \
  --parent sites/aem-status-api \
  --query properties.allow

# Enable if needed
az resource update \
  --resource-group helix-prod \
  --name scm \
  --namespace Microsoft.Web \
  --resource-type basicPublishingCredentialsPolicies \
  --parent sites/aem-status-api \
  --set properties.allow=true
```

## Azure Resources

| Resource | Name | Resource Group |
|----------|------|----------------|
| Function App (prod) | aem-status-api | helix-prod |
| Function App (staging) | aem-status-api-staging | helix-prod |
| App Service Plan | ASP-helixprod-9cfc | helix-prod |
| Storage Account | helixprod8557 | helix-prod |
